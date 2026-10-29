// Milo accounts v1: email code and Google sign-in, a 90-day session cookie renewed on use,
// seats claimed by accounts, and the people/nights lists the You and Nights tabs read.
// Off unless MILO_ACCOUNTS_ENABLED=true. Contract: docs/accounts-api.md.
// Never log emails, codes, tokens or Google credentials.
import { randomBytes, randomUUID, randomInt, createHash, createHmac, timingSafeEqual, createPublicKey, verify as verifySignature } from 'node:crypto';
import { fail, valid, keys } from './errors.js';

const COOKIE = 'milo_session';
const SESSION_DAYS = 90;
const DAY_MS = 86_400_000;
const CODE_MINUTES = 10;
const CODE_TRIES = 5;
const CODES_PER_EMAIL = 3;          // per 10 minutes
// Per IP per minute. Generous because Indian mobile carriers put many people behind one IP;
// the per-email and per-code limits below are the real guard against guessing.
const LIMITS = { code_send: 20, code_verify: 30, google: 30 };
const EMAIL = /^[^\s@<>()[\]\\,;:"']{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const SEAT = /^[A-Za-z0-9_-]{22}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const sha = (v) => createHash('sha256').update(v).digest('hex');

export const accountsOn = (env) => env.MILO_ACCOUNTS_ENABLED === 'true';
export const isAccountsPath = (path) => /^\/api\/(auth\/(email\/start|email\/verify|google|logout)|me(\/(claim|people|nights))?)$/.test(path);

export function cleanEmail(value) {
  valid(typeof value === 'string');
  const email = value.trim().toLowerCase();
  valid(email.length >= 3 && email.length <= 254 && EMAIL.test(email));
  return email;
}

// ---------- cookie and session ----------
function readCookie(request) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0 && part.slice(0, at).trim() === COOKIE) return part.slice(at + 1).trim();
  }
  return null;
}
// Secure everywhere except a plain-http test origin.
function cookie(value, maxAge, origin) {
  return `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${origin.protocol === 'https:' ? '; Secure' : ''}`;
}

async function startSession(db, accountId, now, origin) {
  const token = randomBytes(32).toString('base64url');
  await db.query('INSERT INTO account_sessions(id,account_id,token_hash,created_at,renewed_at,expires_at) VALUES($1,$2,$3,$4,$4,$5)',
    [randomUUID(), accountId, sha(token), new Date(now), new Date(now + SESSION_DAYS * DAY_MS)]);
  return cookie(token, SESSION_DAYS * 86400, origin);
}

// The signed-in account for this request, or null. Renews the session at most once a day.
export async function currentAccount(db, request, now, origin) {
  const token = readCookie(request);
  if (!token || !TOKEN.test(token)) return null;
  const { rows: [row] } = await db.query(`SELECT s.id AS session_id, s.renewed_at, a.id, a.email, a.name FROM account_sessions s
    JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > $2`, [sha(token), new Date(now)]);
  if (!row) return null;
  let setCookie = null;
  if (now - new Date(row.renewed_at).getTime() > DAY_MS) {
    await db.query('UPDATE account_sessions SET renewed_at=$2, expires_at=$3 WHERE id=$1', [row.session_id, new Date(now), new Date(now + SESSION_DAYS * DAY_MS)]);
    await db.query('UPDATE accounts SET last_seen_at=$2 WHERE id=$1', [row.id, new Date(now)]);
    setCookie = cookie(token, SESSION_DAYS * 86400, origin);
  }
  return { id: row.id, email: row.email, name: row.name, sessionId: row.session_id, setCookie };
}

// ---------- email codes ----------
const codeHash = (secret, email, code) => createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');

export const CODE_EMAIL = (code) => ({
  subject: `Your Milo code: ${code}`,
  text: `${code}\n\nEnter this code to sign in to Milo. It works for 10 minutes. If you didn't ask for it, ignore this email.\n`
});

// Sends through Resend (https://resend.com/docs/api-reference/emails/send-email).
export function resendMailer(env, fetchImpl = globalThis.fetch) {
  return async ({ to, code }) => {
    if (!env.RESEND_API_KEY) fail(503, 'unavailable');
    const { subject, text } = CODE_EMAIL(code);
    let res;
    try {
      res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: env.MILO_AUTH_FROM || 'Milo <hello@aaryanshah.co.in>', to: [to], subject, text })
      });
    } catch { fail(503, 'unavailable'); }
    if (!res.ok) fail(503, 'unavailable');
  };
}

// ---------- Google ----------
const b64json = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

// Checks a Sign in with Google ID token: RS256 signature against Google's published
// keys, issuer, audience (our client id), expiry and a verified email.
export function googleVerifier(env, fetchImpl = globalThis.fetch) {
  let cache = { keys: [], at: 0 };
  const loadKeys = async (now, force) => {
    if (!force && cache.keys.length && now - cache.at < 3_600_000) return cache.keys;
    let body;
    try {
      const res = await fetchImpl(GOOGLE_KEYS_URL);
      if (!res.ok) fail(503, 'unavailable');
      body = await res.json();
    } catch (error) { if (error?.status) throw error; fail(503, 'unavailable'); }
    valid(Array.isArray(body?.keys));
    cache = { keys: body.keys, at: now };
    return cache.keys;
  };
  return async (credential, now) => {
    if (!env.GOOGLE_CLIENT_ID) fail(503, 'unavailable');
    valid(typeof credential === 'string' && credential.length < 4096);
    const parts = credential.split('.');
    valid(parts.length === 3);
    let header, claims;
    try { header = b64json(parts[0]); claims = b64json(parts[1]); } catch { fail(400, 'invalid_request'); }
    valid(header?.alg === 'RS256' && typeof header.kid === 'string');
    let jwk = (await loadKeys(now, false)).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await loadKeys(now, true)).find((k) => k.kid === header.kid);
    if (!jwk) fail(401, 'unauthorized');
    let ok = false;
    try { ok = verifySignature('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url')); } catch { ok = false; }
    if (!ok) fail(401, 'unauthorized');
    if (!GOOGLE_ISSUERS.includes(claims.iss) || claims.aud !== env.GOOGLE_CLIENT_ID) fail(401, 'unauthorized');
    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now) fail(401, 'unauthorized');
    if (claims.email_verified !== true || typeof claims.sub !== 'string' || !claims.sub.length || claims.sub.length > 255) fail(401, 'unauthorized');
    const email = cleanEmail(claims.email);
    const authoritative = email.endsWith('@gmail.com') || (typeof claims.hd === 'string' && claims.hd.length > 0);
    return { sub: claims.sub, email, authoritative };
  };
}

// ---------- seats ----------
// Gives the account this seat if nobody has it yet, unless the account already holds
// the plan's other seat (one person can't be both halves).
export async function claimSeat(db, accountId, participantId, planId) {
  let rows;
  try {
    ({ rows } = await db.query(`UPDATE participants SET account_id=$1 WHERE id=$2 AND account_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM participants o WHERE o.plan_id=$3 AND o.account_id=$1) RETURNING id`, [accountId, participantId, planId]));
  } catch (error) {
    // The unique plan/account index is the final guard against concurrent claims.
    if (error.code === '23505') return false;
    throw error;
  }
  return rows.length > 0;
}

// "Name typed in Milo": the name from the latest plan, only while the account has none.
async function nameFromPlans(db, accountId) {
  await db.query(`UPDATE accounts SET name=(SELECT pa.display_name FROM participants pa JOIN plans p ON p.id=pa.plan_id
      WHERE pa.account_id=$1 ORDER BY p.created_at DESC LIMIT 1) WHERE id=$1 AND name IS NULL`, [accountId]);
}

const accountView = (a) => ({ id: a.id, email: a.email, name: a.name || null });

// ---------- lists ----------
const ACTIVE = "EXISTS (SELECT 1 FROM bookings b WHERE b.plan_id=p.id AND b.status IN ('requested','booked'))";

async function people(db, accountId) {
  const { rows } = await db.query(`
    SELECT o.account_id AS id, coalesce(a.name, (array_agg(o.display_name ORDER BY p.created_at DESC))[1]) AS display_name,
      to_char(min(p.created_at) AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS since,
      count(*) FILTER (WHERE ${ACTIVE})::int AS booked,
      count(*) FILTER (WHERE NOT ${ACTIVE} AND me.finished_at IS NOT NULL AND o.finished_at IS NOT NULL)::int AS planned,
      max(p.created_at) AS last_at
    FROM participants me
    JOIN plans p ON p.id=me.plan_id AND p.mode='together'
    JOIN participants o ON o.plan_id=p.id AND o.id<>me.id AND o.account_id IS NOT NULL AND o.account_id<>$1
    JOIN accounts a ON a.id=o.account_id
    WHERE me.account_id=$1
    GROUP BY o.account_id, a.name ORDER BY last_at DESC LIMIT 20`, [accountId]);
  return rows.map((r) => ({ id: r.id, display_name: r.display_name, since: r.since, nights: { booked: r.booked, planned: r.planned } }));
}

async function nights(db, accountId) {
  const { rows } = await db.query(`
    SELECT p.id AS plan_id, p.mode, p.confirmed_night_id AS night_id, p.timing->>'date' AS date, p.timing->>'time' AS time,
      CASE WHEN o.account_id IS NOT NULL AND o.account_id<>$1 THEN o.account_id END AS person_id,
      ${ACTIVE} AS booked,
      (me.finished_at IS NOT NULL AND (p.mode='solo' OR o.finished_at IS NOT NULL)) AS done
    FROM participants me
    JOIN plans p ON p.id=me.plan_id
    LEFT JOIN participants o ON o.plan_id=p.id AND o.id<>me.id
    WHERE me.account_id=$1 AND p.confirmed_night_id IS NOT NULL AND p.timing ? 'date'
    ORDER BY p.timing->>'date' DESC, p.timing->>'time' DESC LIMIT 100`, [accountId]);
  return rows.filter((r) => r.booked || r.done).map((r) => ({
    plan_id: r.plan_id, mode: r.mode, night_id: r.night_id, date: r.date, time: r.time,
    person_id: r.mode === 'solo' ? null : r.person_id, status: r.booked ? 'booked' : 'planned'
  }));
}

// ---------- routes ----------
// Returns { status, body, headers }. db is a connected client; limit(scope, max) counts
// this IP's hits per minute; readBody() parses the JSON body; mailer and verifyGoogle are
// injectable so tests never reach Resend or Google.
export async function handleAccounts({ db, request, path, method, env, origin, now, limit, readBody, mailer, verifyGoogle, helpers }) {
  const writes = method !== 'GET';
  // Cookie-authenticated writes must come from our own page (SameSite=Lax plus this).
  if (writes && request.headers.get('origin') !== origin.origin) fail(403, 'forbidden');
  if (!env.AUTH_SECRET) fail(503, 'unavailable');
  const ok = (body, extra = {}) => ({ status: 200, body, headers: extra });

  if (path === '/api/auth/email/start') {
    if (method !== 'POST') fail(405, 'method_not_allowed');
    await limit('code_send', LIMITS.code_send);
    const body = await readBody(); keys(body, ['email']);
    const email = cleanEmail(body.email);
    const { rows: [recent] } = await db.query('SELECT count(*)::int AS n FROM login_codes WHERE email=$1 AND created_at > $2', [email, new Date(now - 600_000)]);
    if (recent.n >= CODES_PER_EMAIL) fail(429, 'rate_limited');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await db.query('INSERT INTO login_codes(id,email,code_hash,created_at,expires_at) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), email, codeHash(env.AUTH_SECRET, email, code), new Date(now), new Date(now + CODE_MINUTES * 60_000)]);
    await mailer({ to: email, code });
    // Same answer whether or not an account exists for this email.
    return ok({ sent: true });
  }

  if (path === '/api/auth/email/verify') {
    if (method !== 'POST') fail(405, 'method_not_allowed');
    await limit('code_verify', LIMITS.code_verify);
    const body = await readBody(); keys(body, ['email', 'code']);
    const email = cleanEmail(body.email);
    valid(typeof body.code === 'string' && /^\d{6}$/.test(body.code));
    // Count the try first, atomically, so parallel guesses can't skip the limit.
    const { rows: [c] } = await db.query(`UPDATE login_codes SET attempts=attempts+1 WHERE id=(SELECT id FROM login_codes
      WHERE email=$1 AND used_at IS NULL AND expires_at > $2 ORDER BY created_at DESC LIMIT 1) AND attempts < $3 RETURNING id, code_hash`, [email, new Date(now), CODE_TRIES]);
    const expected = c ? Buffer.from(c.code_hash, 'hex') : Buffer.alloc(32);
    const actual = Buffer.from(codeHash(env.AUTH_SECRET, email, body.code), 'hex');
    if (!c || !timingSafeEqual(expected, actual)) fail(400, 'invalid_code');
    const { rows: used } = await db.query('UPDATE login_codes SET used_at=$2 WHERE id=$1 AND used_at IS NULL RETURNING id', [c.id, new Date(now)]);
    if (!used.length) fail(400, 'invalid_code');
    const { rows: [account] } = await db.query(`INSERT INTO accounts(id,email,created_at,last_seen_at) VALUES($1,$2,$3,$3)
      ON CONFLICT(email) DO UPDATE SET last_seen_at=$3 RETURNING *`, [randomUUID(), email, new Date(now)]);
    return ok({ account: accountView(account) }, { 'Set-Cookie': await startSession(db, account.id, now, origin) });
  }

  if (path === '/api/auth/google') {
    if (method !== 'POST') fail(405, 'method_not_allowed');
    await limit('google', LIMITS.google);
    const body = await readBody(); keys(body, ['credential']);
    const { sub, email, authoritative } = await verifyGoogle(body.credential, now);
    let { rows: [account] } = await db.query('SELECT * FROM accounts WHERE google_sub=$1', [sub]);
    if (!account) {
      // Google cannot prove current ownership of non-Gmail/non-Workspace mailboxes.
      // Use the email challenge instead; never attach by an old verified-email claim.
      if (!authoritative) fail(403, 'email_verification_required');
      // Same email, same account, whichever way they first signed in.
      ({ rows: [account] } = await db.query(`INSERT INTO accounts(id,email,google_sub,created_at,last_seen_at) VALUES($1,$2,$3,$4,$4)
        ON CONFLICT(email) DO UPDATE SET google_sub=coalesce(accounts.google_sub, EXCLUDED.google_sub), last_seen_at=$4 RETURNING *`, [randomUUID(), email, sub, new Date(now)]));
      if (account.google_sub !== sub) fail(409, 'account_conflict');
    } else {
      await db.query('UPDATE accounts SET last_seen_at=$2 WHERE id=$1', [account.id, new Date(now)]);
    }
    return ok({ account: accountView(account) }, { 'Set-Cookie': await startSession(db, account.id, now, origin) });
  }

  const me = await currentAccount(db, request, now, origin);
  const renew = me?.setCookie ? { 'Set-Cookie': me.setCookie } : {};

  if (path === '/api/auth/logout') {
    if (method !== 'POST') fail(405, 'method_not_allowed');
    if (me) await db.query('UPDATE account_sessions SET revoked_at=$2 WHERE id=$1', [me.sessionId, new Date(now)]);
    return ok({ ok: true }, { 'Set-Cookie': cookie('', 0, origin) });
  }
  if (!me) fail(401, 'unauthorized');

  if (path === '/api/me') {
    if (method === 'GET') return ok({ account: accountView(me) }, renew);
    if (method !== 'PATCH') fail(405, 'method_not_allowed');
    const body = await readBody(); keys(body, ['name']);
    const name = helpers.name(body.name);
    const { rows: [account] } = await db.query('UPDATE accounts SET name=$2 WHERE id=$1 RETURNING *', [me.id, name]);
    return ok({ account: accountView(account) }, renew);
  }
  if (path === '/api/me/claim') {
    if (method !== 'POST') fail(405, 'method_not_allowed');
    const body = await readBody(); keys(body, ['seats']);
    valid(Array.isArray(body.seats) && body.seats.length <= 5);
    let claimed = 0;
    for (const seat of body.seats) {
      keys(seat, ['plan_id', 'seat_key']);
      valid(typeof seat.plan_id === 'string' && UUID.test(seat.plan_id) && typeof seat.seat_key === 'string' && SEAT.test(seat.seat_key));
      // The seat key proves the seat is this phone's. A wrong key is skipped, not reported.
      const { rows: [p] } = await db.query('SELECT id FROM participants WHERE plan_id=$1 AND seat_key_hash=$2', [seat.plan_id, sha(seat.seat_key)]);
      if (p && await claimSeat(db, me.id, p.id, seat.plan_id)) claimed++;
    }
    await nameFromPlans(db, me.id);
    const { rows: [account] } = await db.query('SELECT * FROM accounts WHERE id=$1', [me.id]);
    return ok({ claimed, account: accountView(account) }, renew);
  }
  if (method !== 'GET') fail(405, 'method_not_allowed');
  if (path === '/api/me/people') return ok({ people: await people(db, me.id) }, renew);
  if (path === '/api/me/nights') return ok({ nights: await nights(db, me.id) }, renew);
  fail(404, 'not_found');
    }
