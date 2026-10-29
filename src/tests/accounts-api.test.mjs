// Accounts v1 on the server: email code and Google sign-in, the session cookie, claiming
// seats, the people/nights lists, and booking needing an account. In-memory PGlite,
// real handler, fake Resend and fake Google keys.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { googleVerifier, CODE_EMAIL } from '../../server/accounts.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const ORIGIN = 'http://127.0.0.1';
const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const MIGRATIONS = ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql', 'data-v2a.sql', 'data-v2b.sql', 'intent-v31.sql', 'accounts.sql', 'account-ownership.sql', 'email-links.sql'];
const env = { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_ACCOUNTS_ENABLED: 'true', MILO_PUBLIC_ORIGIN: ORIGIN, RATE_LIMIT_SECRET: 'x', AUTH_SECRET: 'auth-secret-for-tests', GOOGLE_CLIENT_ID: CLIENT_ID, OPS_SECRET: 'ops-secret-for-tests-only-123' };

let db, api, clock = Date.parse('2026-10-27T10:00:00Z');
const mail = [];
// null: a fresh IP per request, so per-IP limits only bite where a test fixes one.
let ip = null, ipN = 0;
const clientIp = () => ip ?? `10.1.${(ipN >> 8) & 255}.${ipN++ & 255}`;
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
let keyFetches = 0;
const fakeGoogleKeys = async (url) => { keyFetches++; assert.equal(url, 'https://www.googleapis.com/oauth2/v3/certs'); return { ok: true, json: async () => ({ keys: [jwk] }) }; };

before(async () => {
  db = new PGlite();
  for (const f of MIGRATIONS) await db.exec(await readFile(new URL(`../../server/${f}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  api = createApi({ acquire, env, clientIp, now: () => clock,
    mailer: async ({ to, code, link }) => { mail.push({ to, code, link }); },
    verifyGoogle: googleVerifier(env, fakeGoogleKeys) });
});
after(async () => db.close());

async function call(method, path, { body, key, jar, origin = ORIGIN } = {}) {
  const headers = { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}),
    ...(jar?.cookie ? { cookie: jar.cookie } : {}), ...(method !== 'GET' && origin ? { origin } : {}) };
  const res = await api(new Request(`${ORIGIN}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) }));
  const setCookie = res.headers.get('set-cookie');
  if (jar && setCookie) jar.cookie = setCookie.split(';')[0];
  if (jar) jar.setCookie = setCookie;
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, setCookie };
}
const lastCode = (to) => mail.filter(m => m.to === to).at(-1).code;
async function emailSignIn(email) {
  const jar = {};
  assert.equal((await call('POST', '/api/auth/email/start', { body: { email } })).status, 200);
  const r = await call('POST', '/api/auth/email/verify', { body: { email: email.toLowerCase().trim(), code: lastCode(email.toLowerCase().trim()) }, jar });
  assert.equal(r.status, 200);
  return { jar, account: r.data.account };
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function idToken(claims, { kid = 'k1', key = privateKey } = {}) {
  const head = b64({ alg: 'RS256', kid, typ: 'JWT' });
  const body = b64({ iss: 'https://accounts.google.com', aud: CLIENT_ID, exp: Math.floor(clock / 1000) + 600, email_verified: true, hd: 'example.com', ...claims });
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(key).toString('base64url');
  return `${head}.${body}.${sig}`;
}

test('email code: one code, ten minutes, five tries, one use; same answer for any email', async () => {
  const r = await call('POST', '/api/auth/email/start', { body: { email: '  Asha@Example.com ' } });
  assert.deepEqual([r.status, r.data], [200, { sent: true }]);
  assert.equal(mail.at(-1).to, 'asha@example.com');
  assert.match(mail.at(-1).code, /^\d{6}$/);
  assert.deepEqual(CODE_EMAIL('123456').subject, 'Your Milo code: 123456');
  const code = mail.at(-1).code;
  const wrong = code === '000000' ? '111111' : '000000';
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: 'asha@example.com', code: wrong } })).data.error, 'invalid_code');
  const jar = {};
  const ok = await call('POST', '/api/auth/email/verify', { body: { email: 'asha@example.com', code }, jar });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.account.email, 'asha@example.com');
  assert.match(ok.setCookie, /^milo_session=[A-Za-z0-9_-]{43}; Path=\/api; HttpOnly; SameSite=Lax; Max-Age=7776000$/, 'no Secure on the http test origin only');
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: 'asha@example.com', code } })).status, 400, 'used once');
  // Five tries, then the code is dead even if right.
  await call('POST', '/api/auth/email/start', { body: { email: 'try@example.com' } });
  const good = lastCode('try@example.com'); const bad = good === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) await call('POST', '/api/auth/email/verify', { body: { email: 'try@example.com', code: bad } });
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: 'try@example.com', code: good } })).status, 400);
  // Expired after ten minutes.
  await call('POST', '/api/auth/email/start', { body: { email: 'late@example.com' } });
  clock += 11 * 60_000;
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: 'late@example.com', code: lastCode('late@example.com') } })).status, 400);
  // Three codes per email per ten minutes; bad emails refused.
  for (let i = 0; i < 3; i++) assert.equal((await call('POST', '/api/auth/email/start', { body: { email: 'many@example.com' } })).status, 200);
  assert.equal((await call('POST', '/api/auth/email/start', { body: { email: 'many@example.com' } })).status, 429);
  for (const email of ['nope', 'a@b', '<x>@y.com', 42]) assert.equal((await call('POST', '/api/auth/email/start', { body: { email } })).status, 400);
  // Nothing in the database holds a raw code.
  const { rows } = await db.query('SELECT code_hash FROM login_codes');
  assert.ok(rows.every(r => /^[0-9a-f]{64}$/.test(r.code_hash)) && !rows.some(r => mail.some(m => r.code_hash.includes(m.code))));
});

test('writes from another origin are refused; per-IP limits on sending codes', async () => {
  assert.equal((await call('POST', '/api/auth/email/start', { body: { email: 'x@example.com' }, origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('POST', '/api/auth/email/start', { body: { email: 'x@example.com' }, origin: null })).status, 403);
  ip = '10.0.0.9';
  const statuses = [];
  for (let i = 0; i < 21; i++) statuses.push((await call('POST', '/api/auth/email/start', { body: { email: `ip${i}@example.com` } })).status);
  assert.deepEqual(statuses, [...Array(20).fill(200), 429]);
  ip = null;
});

test('session: /api/me, renewed after a day, signed out after logout or 90 idle days', async () => {
  const { jar } = await emailSignIn('ravi@example.com');
  const me = await call('GET', '/api/me', { jar });
  assert.deepEqual(me.data, { account: { id: me.data.account.id, email: 'ravi@example.com', name: null } });
  assert.equal(me.setCookie, null, 'no renewal within a day');
  clock += 2 * 86_400_000;
  const renewed = await call('GET', '/api/me', { jar });
  assert.match(renewed.setCookie, /Max-Age=7776000/);
  clock += 89 * 86_400_000;
  assert.equal((await call('GET', '/api/me', { jar })).status, 200, 'renewal moved the expiry');
  clock += 91 * 86_400_000;
  assert.equal((await call('GET', '/api/me', { jar })).status, 401, 'idle for 91 days');
  const again = await emailSignIn('ravi@example.com');
  assert.equal(again.account.id, me.data.account.id, 'same email, same account');
  const out = await call('POST', '/api/auth/logout', { jar: again.jar });
  assert.match(out.setCookie, /^milo_session=; .*Max-Age=0/);
  assert.equal((await call('GET', '/api/me', { jar: { cookie: again.jar.cookie } })).status, 401, 'old cookie revoked');
  assert.equal((await call('GET', '/api/me', { jar: { cookie: 'milo_session=junk' } })).status, 401);
  assert.equal((await call('GET', '/api/me')).status, 401);
  const named = await call('PATCH', '/api/me', { jar: (await emailSignIn('ravi@example.com')).jar, body: { name: 'Ravi' } });
  assert.equal(named.data.account.name, 'Ravi');
});

test('Google: checked signature, audience, expiry and email; same email joins the email account', async () => {
  const email = await emailSignIn('mira@example.com');
  const jar = {};
  const r = await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'g-mira', email: 'Mira@Example.com' }) }, jar });
  assert.equal(r.status, 200);
  assert.equal(r.data.account.id, email.account.id);
  assert.equal((await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'g-mira', email: 'mira@example.com' }) } })).data.account.id, email.account.id);
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  const bad = [
    idToken({ sub: 'g1', email: 'a@example.com' }, { key: other }),
    idToken({ sub: 'g1', email: 'a@example.com', aud: 'someone-else' }),
    idToken({ sub: 'g1', email: 'a@example.com', iss: 'https://evil.example' }),
    idToken({ sub: 'g1', email: 'a@example.com', exp: Math.floor(clock / 1000) - 1 }),
    idToken({ sub: 'g1', email: 'a@example.com', email_verified: false }),
    idToken({ sub: 'g1', email: 'a@example.com' }, { kid: 'unknown' })
  ];
  for (const credential of bad) assert.equal((await call('POST', '/api/auth/google', { body: { credential } })).status, 401);
  assert.equal((await call('POST', '/api/auth/google', { body: { credential: 'not.a.jwt' } })).status, 400);
  // A second Google identity can't take over an email already tied to another.
  assert.equal((await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'g-other', email: 'mira@example.com' }) } })).status, 409);
  assert.ok(keyFetches <= 3, 'keys are cached');
});

const v3Half = (intents) => ({ intents, reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true });
async function togetherPlan(a, b, { book = false, date = '2026-10-11' } = {}) {
  const made = await call('POST', '/api/plans', { body: { name: a.name, city: 'bengaluru', occasion: 'date_night' } });
  const token = new URL(made.data.invite_url).searchParams.get('invite');
  const joined = await call('POST', `/api/invites/${token}/join`, { body: { name: b.name } });
  const seatA = made.data.seat_key, seatB = joined.data.seat_key, id = made.data.plan_id;
  await call('PUT', `/api/plans/${id}/me`, { key: seatA, body: v3Half(['intimate', 'fun', 'novelty']) });
  await call('PUT', `/api/plans/${id}/me`, { key: seatB, body: v3Half(['fun', 'buzz', 'special']) });
  const night = (await call('GET', `/api/plans/${id}`, { key: seatA })).data.shared_result.selectedNights[0].night.id;
  await call('POST', `/api/plans/${id}/actions`, { key: seatA, body: { type: 'suggest', night_id: night } });
  await call('POST', `/api/plans/${id}/actions`, { key: seatB, body: { type: 'confirm', night_id: night } });
  await call('POST', `/api/plans/${id}/actions`, { key: seatB, body: { type: 'set_time', timing: { date, time: '19:30', time_zone: 'Asia/Kolkata' } } });
  for (const [seat, who] of [[seatA, a], [seatB, b]]) if (who.jar) await call('POST', '/api/me/claim', { jar: who.jar, body: { seats: [{ plan_id: id, seat_key: seat }] } });
  if (book) {
    const booked = await call('POST', `/api/plans/${id}/booking`, { key: seatA, jar: a.jar, body: { budget_band: '2k_4k', window_hours: 3, contact: '+91 91111 22222' } });
    assert.equal(booked.status, 200, JSON.stringify(booked.data));
  }
  return { id, seatA, seatB, night };
}

test('claim, people and nights: your person needs both accounts; booked vs planned', async () => {
  const asha = { name: 'Asha', ...(await emailSignIn('asha2@example.com')) };
  const kabir = { name: 'Kabir', ...(await emailSignIn('kabir@example.com')) };
  const guest = { name: 'Guest' };
  const p1 = await togetherPlan(asha, kabir, { book: true, date: '2026-10-11' });
  await togetherPlan(asha, kabir, { date: '2026-10-20' });
  await togetherPlan(asha, guest, { date: '2026-10-22' });
  // Claim is idempotent; a wrong key or a seat someone else holds is skipped.
  const again = await call('POST', '/api/me/claim', { jar: kabir.jar, body: { seats: [{ plan_id: p1.id, seat_key: p1.seatA }, { plan_id: p1.id, seat_key: p1.seatB }, { plan_id: p1.id, seat_key: 'A'.repeat(22) }] } });
  assert.equal(again.data.claimed, 0);
  assert.equal((await call('POST', '/api/me/claim', { jar: kabir.jar, body: { seats: Array(6).fill({ plan_id: p1.id, seat_key: p1.seatB }) } })).status, 400);
  // Name typed in Milo becomes the account name when it has none.
  assert.equal((await call('GET', '/api/me', { jar: kabir.jar })).data.account.name, 'Kabir');

  const people = (await call('GET', '/api/me/people', { jar: asha.jar })).data.people;
  assert.equal(people.length, 1, 'the guest never signed in, so is not your person');
  assert.deepEqual(people[0], { id: people[0].id, display_name: 'Kabir', since: people[0].since, nights: { booked: 1, planned: 1 } });
  assert.match(people[0].since, /^\d{4}-\d{2}-\d{2}$/, 'first plan date, India time');
  const nights = (await call('GET', '/api/me/nights', { jar: asha.jar })).data.nights;
  assert.deepEqual(nights.map(n => [n.date, n.status, n.person_id === people[0].id, n.mode]), [
    ['2026-10-22', 'planned', false, 'together'], ['2026-10-20', 'planned', true, 'together'], ['2026-10-11', 'booked', true, 'together']]);
  assert.ok(nights.every(n => n.night_id && n.time === '19:30'));
  // Cancelled bookings don't count as booked.
  await call('DELETE', `/api/plans/${p1.id}/booking`, { key: p1.seatA });
  assert.deepEqual((await call('GET', '/api/me/people', { jar: kabir.jar })).data.people[0].nights, { booked: 0, planned: 2 });
  // Lists never carry emails, seat keys, picks or contacts.
  const raw = JSON.stringify([people, nights]);
  for (const secret of ['example.com', p1.seatA, p1.seatB, 'intimate', '91111']) assert.ok(!raw.includes(secret), secret);
  assert.equal((await call('GET', '/api/me/people')).status, 401);
});

test('booking needs an account when accounts are on; solo too, linked to the account', async () => {
  const mira = { name: 'Mira', ...(await emailSignIn('mira2@example.com')) };
  const plan = await togetherPlan({ name: 'Mira' }, { name: 'Dev' });
  const body = { budget_band: '2k_4k', window_hours: 3, contact: '+91 93333 44444' };
  assert.deepEqual((await call('POST', `/api/plans/${plan.id}/booking`, { key: plan.seatA, body })).data, { error: 'sign_in_required' });
  assert.equal((await call('POST', `/api/plans/${plan.id}/booking`, { key: plan.seatA, jar: mira.jar, body })).status, 200);
  const { rows: [seat] } = await db.query("SELECT account_id FROM participants WHERE plan_id=$1 AND role='initiator'", [plan.id]);
  assert.equal(seat.account_id, mira.account.id, 'booking links the seat');
  // Someone else's account can't book from this seat.
  const zed = await emailSignIn('zed@example.com');
  await call('DELETE', `/api/plans/${plan.id}/booking`, { key: plan.seatA });
  assert.equal((await call('POST', `/api/plans/${plan.id}/booking`, { key: plan.seatA, jar: zed.jar, body })).status, 403);

  const solo = { name: 'Mira', city: 'bengaluru', night_id: plan.night, timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' },
    intents: [], reactions: [], booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210' } };
  assert.equal((await call('POST', '/api/plans/solo', { body: solo })).status, 401);
  const made = await call('POST', '/api/plans/solo', { body: solo, jar: mira.jar });
  assert.equal(made.status, 201);
  const { rows: [soloSeat] } = await db.query('SELECT account_id FROM participants WHERE plan_id=$1', [made.data.plan_id]);
  assert.equal(soloSeat.account_id, mira.account.id);
});

test('accounts off: the routes are not there and booking works as before', async () => {
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  const off = createApi({ acquire, env: { ...env, MILO_ACCOUNTS_ENABLED: 'false' }, clientIp, now: () => clock, mailer: async () => assert.fail('no mail'), verifyGoogle: async () => assert.fail('no google') });
  for (const [method, path] of [['GET', '/api/me'], ['POST', '/api/auth/email/start'], ['GET', '/api/me/people']]) {
    const res = await off(new Request(`${ORIGIN}${path}`, { method, headers: { origin: ORIGIN, 'content-type': 'application/json' }, ...(method === 'POST' ? { body: '{"email":"a@example.com"}' } : {}) }));
    assert.equal(res.status, 404, path);
  }
});

test('email link: no GET consumption, one use shared with code, expiry, raw token not stored', async () => {
  await call('POST', '/api/auth/email/start', { body: { email: 'link@example.com' } });
  const sent = mail.at(-1), token = new URLSearchParams(new URL(sent.link).hash.slice(1)).get('milo-sign-in');
  assert.equal(new URL(sent.link).origin, ORIGIN);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal((await call('GET', '/api/auth/email/link')).status, 405);
  const jar = {};
  const r = await call('POST', '/api/auth/email/link', { body: { token }, jar });
  assert.equal(r.status, 200);
  assert.equal(r.data.account.email, 'link@example.com');
  assert.equal((await call('GET', '/api/me', { jar })).status, 200);
  assert.equal((await call('POST', '/api/auth/email/link', { body: { token } })).status, 400);
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: sent.to, code: sent.code } })).status, 400);
  await call('POST', '/api/auth/email/start', { body: { email: 'code-first@example.com' } });
  const codeFirst = mail.at(-1);
  const t2 = new URLSearchParams(new URL(codeFirst.link).hash.slice(1)).get('milo-sign-in');
  assert.equal((await call('POST', '/api/auth/email/verify', { body: { email: codeFirst.to, code: codeFirst.code } })).status, 200);
  assert.equal((await call('POST', '/api/auth/email/link', { body: { token: t2 } })).status, 400);
  await call('POST', '/api/auth/email/start', { body: { email: 'expired-link@example.com' } });
  const t3 = new URLSearchParams(new URL(mail.at(-1).link).hash.slice(1)).get('milo-sign-in');
  clock += 11 * 60_000;
  assert.equal((await call('POST', '/api/auth/email/link', { body: { token: t3 } })).status, 400);
  const raw = JSON.stringify((await db.query('SELECT * FROM login_codes')).rows);
  assert.ok(!raw.includes(token));
});

 test('Google non-authoritative mailbox never links an email account; established sub still works', async () => {
  const owner = await emailSignIn('protected@example.com');
  const r = await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'stale-mailbox', email: owner.account.email, hd: undefined }) } });
  assert.equal(r.status, 403);
  assert.equal(r.data.error, 'email_verification_required');
  assert.equal((await db.query('SELECT google_sub FROM accounts WHERE id=$1', [owner.account.id])).rows[0].google_sub, null);
  assert.equal((await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'gmail-user', email: 'safe.user@gmail.com', hd: undefined }) } })).status, 200);
  assert.equal((await call('POST', '/api/auth/google', { body: { credential: idToken({ sub: 'gmail-user', email: 'new@example.com', hd: undefined }) } })).status, 200);
 });
 test('one account cannot book with the other seat or claim both halves', async () => {
  const who = await emailSignIn('one-half@example.com');
  const p = await togetherPlan({ name: 'One' }, { name: 'Two' });
  const claim = seat_key => call('POST', '/api/me/claim', { jar: who.jar, body: { seats: [{ plan_id: p.id, seat_key }] } });
  assert.equal((await claim(p.seatA)).data.claimed, 1);
  assert.equal((await claim(p.seatB)).data.claimed, 0);
  assert.equal((await call('POST', `/api/plans/${p.id}/booking`, { jar: who.jar, key: p.seatB, body: { budget_band: '2k_4k', window_hours: 3, contact: '+91 93333 44444' } })).status, 403);
  const seats = (await db.query('SELECT id FROM participants WHERE plan_id=$1 AND account_id IS NULL', [p.id])).rows;
  await assert.rejects(db.query('UPDATE participants SET account_id=$1 WHERE id=$2', [who.account.id, seats[0].id]), e => e.code === '23505');
 });
