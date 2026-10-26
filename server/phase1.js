import { isIP } from 'node:net';
import { randomBytes, randomUUID, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { INTENTS, EXPERIENCE_POOL, NIGHTS_POOL } from '../src/data/mockData.js';
import { computeSharedOutput } from '../src/logic/shared.js';
import { SafeError, fail, valid, object, keys } from './errors.js';
import { handleGifts, handleOps, checkOpsSecret } from './gifts.js';

const occasions = ['date_night','anniversary','proposal','birthday','quality_time','just_because'];
const moods = new Set(INTENTS.map(x => x.id));
const cards = new Set(EXPERIENCE_POOL.map(x => x.id));
const nights = new Set(NIGHTS_POOL.map(x => x.id));
const tokenPattern = /^[A-Za-z0-9_-]{22}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const secret = () => randomBytes(16).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
// Ingress trust is enforced by clientIp() at the host adapter. This function
// canonicalizes the trusted value, never reads arbitrary forwarded headers.
function normalizedIp(value) {
  if (typeof value !== 'string') return null;
  const ip = value.trim();
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6 || ip.includes('%')) return null;
  // URL's IPv6 parser canonicalizes compression and embedded IPv4 notation.
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const halves = canonical.split('::');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const words = halves.length === 2
    ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
    : left;
  if (words.length !== 8) return null;
  const n = words.map(word => parseInt(word, 16));
  if (n.slice(0,5).every(word => word === 0) && n[5] === 0xffff) {
    return [n[6] >> 8,n[6] & 255,n[7] >> 8,n[7] & 255].join('.');
  }
  return `${n.slice(0,4).map(word => word.toString(16)).join(':')}::/64`;
}
function name(value) {
  valid(typeof value === 'string'); const result = value.trim();
  valid([...result].length > 0 && [...result].length <= 40 && !/[\p{C}<>@]/u.test(result));
  return result;
}
function picks(body) {
  keys(body, ['intents','reactions','finished']);
  valid(Array.isArray(body.intents) && body.intents.length <= 3 && new Set(body.intents).size === body.intents.length && body.intents.every(x => moods.has(x)));
  valid(Array.isArray(body.reactions) && body.reactions.length <= 8);
  valid(new Set(body.reactions.map(x => x?.cardId)).size === body.reactions.length);
  for (const reaction of body.reactions) {
    keys(reaction, ['cardId','reaction']);
    valid(cards.has(reaction.cardId) && ['into_it','maybe','not_tonight'].includes(reaction.reaction));
  }
  valid(typeof body.finished === 'boolean' && (!body.finished || body.reactions.length === 8));
  return body;
}
function timing(value) {
  keys(value, ['date','time','time_zone']);
  valid(typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date));
  const parsed = new Date(`${value.date}T00:00:00Z`);
  valid(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value.date);
  valid(typeof value.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time));
  valid(typeof value.time_zone === 'string' && value.time_zone.length <= 80);
  try { new Intl.DateTimeFormat('en', { timeZone: value.time_zone }); } catch { fail(400, 'invalid_request'); }
  return value;
}
// Explicit allowlist, not a blacklist or a spread of computeSharedOutput.
// Static night records are public data, but omit profile/scoring fields anyway.
export function projectShared(output) {
  return {
    sharedRows: output.sharedRows.map(row => ({ text: row.text })),
    difference: output.difference ? { dim: output.difference.dim, copy: output.difference.copy } : null,
    bridgeSentence: output.bridgeSentence,
    selectedNights: output.selectedNights.map(item => ({
      num: item.num, fitLine: item.fitLine,
      whyItWorks: item.whyItWorks.replaceAll('Sneha', 'your person'),
      night: {
        id: item.night.id, name: item.night.name, reasonLine: item.night.reasonLine,
        leanLine: item.night.leanLine, skipIf: item.night.skipIf,
        beats: item.night.beats.map(beat => ({ name:beat.name, desc:beat.desc })),
        defaultImage: item.night.defaultImage
      }
    }))
  };
}
function planView(plan, people, me) {
  const other = people.find(x => x.id !== me.id);
  return {
    id: plan.id, occasion: plan.occasion, city: plan.city, status: plan.status,
    me: { role: me.role, display_name: me.display_name, intents: me.intents, reactions: me.reactions, finished: !!me.finished_at },
    partner: other ? { display_name: other.display_name, finished: !!other.finished_at } : null,
    shared_result: plan.shared_result, suggestion: plan.suggestion,
    confirmed_night_id: plan.confirmed_night_id, timing: plan.timing
  };
}
async function jsonBody(request) {
  valid((request.headers.get('content-type') || '').split(';')[0].trim() === 'application/json');
  const reader = request.body?.getReader(); valid(reader);
  let length = 0; const chunks = [];
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); fail(413, 'too_large'); }
    chunks.push(Buffer.from(value));
  }
  try { return object(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
  catch (error) { if (error instanceof SafeError) throw error; fail(400, 'invalid_request'); }
}
function response(status, body, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...extra } });
}

// acquire() returns a single connected SQL client plus release(). Every plan
// mutation locks the plan BEFORE its seats, serializing finish/join/actions.
// `now` is injectable so tests can move the clock for gift reveal times.
export function createApi({ acquire, env = process.env, clientIp, now = Date.now }) {
  return async request => {
    let db;
    try {
      const url = new URL(request.url);
      // Vercel's `/api/:path*` -> `/api` rewrite replaces the pathname with
      // the literal destination and merges the original subpath into the
      // `path` query param (routing-utils; platform values override any
      // client-supplied `path`). Reconstruct the route for dispatch. Off
      // Vercel, pathnames arrive intact and the param is absent: no-op.
      // The result still passes only the fixed allowlist below.
      const rewritten = url.pathname === '/api' && url.searchParams.has('path');
      const path = (rewritten ? `/api/${url.searchParams.get('path')}` : url.pathname).replace(/\/+$/, '');
      const method = request.method;
      const create = path === '/api/plans' && method === 'POST';
      const invite = path.match(/^\/api\/invites\/([A-Za-z0-9_-]+)(\/join)?$/);
      const planPath = path.match(/^\/api\/plans\/([^/]+)(\/(me|actions|gifts)(?:\/([^/]+))?)?$/);
      const opsPath = path.match(/^\/api\/ops\/gifts(?:\/([^/]+))?$/);
      const cleanup = path === '/api/cleanup' && method === 'GET';
      // Launch gate: product routes stay off until enabled. Authenticated
      // cleanup always runs so stored plans are still deleted while paused.
      if (env.MILO_PHASE1_ENABLED !== 'true' && !cleanup) return response(503, { error:'unavailable' });
      const publicScope = create ? 'create' : invite && !invite[2] && method === 'GET' ? 'preview' : invite?.[2] && method === 'POST' ? 'join' : null;
      if (!publicScope && !planPath && !cleanup && !opsPath) return response(404, { error:'not_found' });
      // No forwarded-host construction: only owner-configured canonical origin.
      valid(typeof env.MILO_PUBLIC_ORIGIN === 'string');
      const origin = new URL(env.MILO_PUBLIC_ORIGIN);
      valid(origin.protocol === 'https:' || (env.NODE_ENV === 'test' && origin.hostname === '127.0.0.1'));
      if (cleanup) {
        if (!env.CRON_SECRET) fail(503, 'unavailable');
        const actual = Buffer.from(request.headers.get('authorization') || '');
        const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) fail(401, 'unauthorized');
      }
      if (opsPath) {
        // Owner-only fulfilment list for physical gifts. Fails closed without OPS_SECRET.
        checkOpsSecret(request, env);
        db = await acquire();
        const result = await handleOps({ db, method, giftId: opsPath[1], readBody: () => jsonBody(request) });
        if (!result) return response(405, { error:'method_not_allowed' });
        return response(200, result);
      }
      if (publicScope && (!env.RATE_LIMIT_SECRET || !clientIp)) fail(503, 'unavailable');
      db = await acquire();
      if (publicScope) {
        const ip = normalizedIp(clientIp(request)); if (!ip) fail(503, 'unavailable');
        const ipHash = createHmac('sha256', env.RATE_LIMIT_SECRET).update(ip).digest('hex');
        const count = await db.query(`INSERT INTO rate_limits(scope,ip_hash,window_start,hits)
          VALUES($1,$2,date_trunc('minute',now()),1)
          ON CONFLICT(scope,ip_hash,window_start) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits`, [publicScope,ipHash]);
        if (count.rows[0].hits > (publicScope === 'preview' ? 60 : 20)) fail(429, 'rate_limited');
      }
      if (cleanup) {
        const removed = await db.query("DELETE FROM plans WHERE created_at < now()-interval '30 days' RETURNING id");
        return response(200, { deleted:removed.rows.length });
      }
      if (create) {
        const body = await jsonBody(request); keys(body, ['name','partnerName','occasion']);
        const displayName = name(body.name); if (body.partnerName !== undefined) name(body.partnerName);
        valid(body.occasion === undefined || occasions.includes(body.occasion));
        const id = randomUUID(), token = secret(), seatKey = secret();
        await db.query('BEGIN');
        await db.query('INSERT INTO plans(id,invite_token,occasion) VALUES($1,$2,$3)', [id,token,body.occasion || null]);
        await db.query("INSERT INTO participants(id,plan_id,role,display_name,seat_key_hash) VALUES($1,$2,'initiator',$3,$4)", [randomUUID(),id,displayName,hash(seatKey)]);
        await db.query('COMMIT');
        return response(201, { plan_id:id, invite_url:`${origin.origin}/app/?invite=${token}`, seat_key:seatKey });
      }
      if (publicScope === 'preview' || publicScope === 'join') {
        valid(tokenPattern.test(invite[1]));
        const body = publicScope === 'join' ? await jsonBody(request) : null;
        const displayName = body ? (keys(body, ['name']), name(body.name)) : null;
        await db.query('BEGIN');
        const { rows:[plan] } = await db.query('SELECT *, expires_at <= now() AS expired FROM plans WHERE invite_token=$1 FOR UPDATE', [invite[1]]);
        if (!plan) fail(404, 'not_found');
        const { rows:people } = await db.query('SELECT * FROM participants WHERE plan_id=$1', [plan.id]);
        const taken = people.some(x => x.role === 'partner');
        const status = plan.expired ? 'expired' : taken ? 'taken' : 'valid';
        if (publicScope === 'preview') {
          await db.query('COMMIT');
          // A consumed/expired bearer link should not keep disclosing names.
          return response(200, status === 'valid' ? { status, initiator_name:people.find(x => x.role === 'initiator').display_name, occasion:plan.occasion, ...(plan.timing?.date ? { day:plan.timing.date } : {}) } : { status });
        }
        if (plan.expired) fail(410, 'expired'); if (taken) fail(409, 'taken');
        const seatKey = secret();
        await db.query("INSERT INTO participants(id,plan_id,role,display_name,seat_key_hash) VALUES($1,$2,'partner',$3,$4)", [randomUUID(),plan.id,displayName,hash(seatKey)]);
        await db.query('COMMIT');
        return response(201, { plan_id:plan.id, seat_key:seatKey });
      }
      if (!planPath || !uuidPattern.test(planPath[1])) fail(404, 'not_found');
      const action = planPath[3];
      const giftId = planPath[4];
      if (giftId && action !== 'gifts') fail(404, 'not_found');
      const giftRoute = action === 'gifts' && ((!giftId && (method === 'GET' || method === 'POST')) || (giftId && method === 'DELETE'));
      if (!((!action && method === 'GET') || (action === 'me' && method === 'PUT') || (action === 'actions' && method === 'POST') || giftRoute)) return response(405, { error:'method_not_allowed' });
      const bearer = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{22})$/)?.[1];
      if (!bearer) fail(401, 'unauthorized');
      await db.query('BEGIN');
      // Authenticate before locking or reading a plan under an unrelated key.
      const { rows:[identity] } = await db.query('SELECT id FROM participants WHERE plan_id=$1 AND seat_key_hash=$2', [planPath[1],hash(bearer)]);
      if (!identity) fail(404, 'not_found');
      const { rows:[plan] } = await db.query('SELECT * FROM plans WHERE id=$1 FOR UPDATE', [planPath[1]]);
      if (!plan) fail(404, 'not_found');
      const { rows:people } = await db.query('SELECT * FROM participants WHERE plan_id=$1 ORDER BY role', [plan.id]);
      const me = people.find(x => x.id === identity.id);
      if (action === 'gifts') {
        const result = await handleGifts({ db, plan, people, me, method, giftId, readBody: () => jsonBody(request), now: now() });
        await db.query('COMMIT'); return response(200, result);
      }
      if (action === 'me') {
        const body = picks(await jsonBody(request));
        const { rows:[updated] } = await db.query(`UPDATE participants SET intents=$1::jsonb,reactions=$2::jsonb,
          finished_at=CASE WHEN $3 THEN coalesce(finished_at,now()) ELSE NULL END,updated_at=now() WHERE id=$4 RETURNING *`, [JSON.stringify(body.intents),JSON.stringify(body.reactions),body.finished,me.id]);
        people[people.findIndex(x => x.id === me.id)] = updated;
        // v2 computes once. Editing later can make the result stale: parked.
        if (!plan.shared_result && people.length === 2 && people.every(x => x.finished_at)) {
          const a = people.find(x => x.role === 'initiator'), b = people.find(x => x.role === 'partner');
          const shared = projectShared(computeSharedOutput(a,b));
          await db.query("UPDATE plans SET shared_result=$1::jsonb,status='both_done' WHERE id=$2", [JSON.stringify(shared),plan.id]);
        }
        await db.query('COMMIT'); return response(200, { ok:true });
      }
      if (action === 'actions') {
        const body = await jsonBody(request); keys(body, ['type','night_id','timing']);
        valid(['suggest','confirm','set_time'].includes(body.type));
        if (body.type === 'set_time') {
          valid(body.night_id === undefined); timing(body.timing);
          await db.query('UPDATE plans SET timing=$1::jsonb WHERE id=$2', [JSON.stringify(body.timing),plan.id]); plan.timing = body.timing;
        } else {
          valid(body.timing === undefined && nights.has(body.night_id));
          if (!plan.shared_result) fail(409, 'not_ready');
          valid(plan.shared_result.selectedNights.some(x => x.night.id === body.night_id));
          if (body.type === 'suggest') {
            if (plan.status === 'confirmed') fail(409, 'already_confirmed');
            plan.suggestion = { by:me.role, night_id:body.night_id }; plan.status = 'suggested';
            await db.query("UPDATE plans SET suggestion=$1::jsonb,status='suggested' WHERE id=$2", [JSON.stringify(plan.suggestion),plan.id]);
          } else {
            if (plan.suggestion?.night_id !== body.night_id) fail(409, 'not_suggested');
            plan.confirmed_night_id = body.night_id; plan.status = 'confirmed';
            await db.query("UPDATE plans SET confirmed_night_id=$1,status='confirmed' WHERE id=$2", [body.night_id,plan.id]);
          }
        }
      }
      const view = planView(plan,people,me);
      await db.query('COMMIT'); return response(200,view);
    } catch (error) {
      if (db) { try { await db.query('ROLLBACK'); } catch { /* safe error below */ } }
      const safe = error instanceof SafeError;
      return response(safe ? error.status : 503, { error:safe ? error.message : 'unavailable' }, error.status === 429 ? { 'Retry-After':'60' } : {});
    } finally { db?.release?.(); }
  };
}
