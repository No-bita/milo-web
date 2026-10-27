// Retention: nothing is deleted. Cleanup is an authenticated no-op, and removing a gift keeps its row.
// Runs the real handler on an in-memory PGlite (schema.sql + gifts.sql) with a
// controllable clock. No browser, no network.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { zonedToUtc } from '../../server/gifts.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const CRON = 'cron-secret-for-tests-only-1234';
const OPS = 'ops-secret-for-tests-only-123';
const BASE = Date.parse('2026-11-01T06:30:00Z'); // 12:00 IST, Sun 1 Nov
let db, api, clock = BASE;
const DAY = 86400000;

before(async () => {
  db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql', 'data-v2a.sql', 'data-v2b.sql', 'intent-v31.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  api = createApi({ acquire, clientIp: () => '127.0.0.1', now: () => clock,
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS, CRON_SECRET: CRON } });
});
after(async () => db.close());
beforeEach(() => { clock = BASE; });

async function call(method, path, { body, key } = {}) {
  const response = await api(new Request(`http://127.0.0.1${path}`, {
    method, headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  }));
  return { status: response.status, data: await response.json() };
}

// A confirmed plan with a time set: 7:30 PM IST on Sat 7 Nov 2026.
async function confirmedPlan({ timing = { date: '2026-11-07', time: '19:30', time_zone: 'Asia/Kolkata' } } = {}) {
  const created = await call('POST', '/api/plans', { body: { name: 'Asha', city: 'bengaluru' } });
  const a = created.data.seat_key, id = created.data.plan_id;
  const token = new URL(created.data.invite_url).searchParams.get('invite');
  const b = (await call('POST', `/api/invites/${token}/join`, { body: { name: 'Ravi' } })).data.seat_key;
  const picks = (from) => ({ intents: ['intimate', 'fun'], reactions: EXPERIENCE_POOL.slice(from, from + 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true });
  await call('PUT', `/api/plans/${id}/me`, { key: a, body: picks(0) });
  await call('PUT', `/api/plans/${id}/me`, { key: b, body: picks(2) });
  const night = (await call('GET', `/api/plans/${id}`, { key: a })).data.shared_result.selectedNights[0].night.id;
  const gifts0 = await call('GET', `/api/plans/${id}/gifts`, { key: a });
  await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'suggest', night_id: night } });
  await call('POST', `/api/plans/${id}/actions`, { key: b, body: { type: 'confirm', night_id: night } });
  if (timing) await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'set_time', timing } });
  return { id, a, b, gifts0 };
}
const gifts = (p, key) => call('GET', `/api/plans/${p.id}/gifts`, { key });
const add = (p, key, body) => call('POST', `/api/plans/${p.id}/gifts`, { key, body });


const count = async t => Number((await db.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n);

test('cleanup is authenticated and deletes nothing, even for very old plans', async () => {
  const p = await confirmedPlan();
  await add(p, p.a, { kind: 'sealed_note', note: 'keep me' });
  await db.query("UPDATE plans SET created_at = now() - interval '400 days'");
  const before = { plans: await count('plans'), people: await count('participants'), gifts: await count('gifts'), events: await count('plan_events') };
  assert.equal((await call('GET', '/api/cleanup')).status, 401);
  assert.equal((await call('GET', '/api/cleanup', { key: 'wrong-secret-wrong-secret-xx' })).status, 401);
  assert.deepEqual(await call('GET', '/api/cleanup', { key: CRON }), { status: 200, data: { deleted: 0 } });
  assert.deepEqual({ plans: await count('plans'), people: await count('participants'), gifts: await count('gifts'), events: await count('plan_events') }, before);
  assert.ok(before.plans > 0 && before.gifts > 0);
});

test('ops cannot restore a cancelled gift', async () => {
  const p = await confirmedPlan();
  await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice', contact: '+91 98765 43210' });
  const g = (await gifts(p, p.a)).data.mine[0];
  assert.equal((await call('DELETE', `/api/plans/${p.id}/gifts/${g.id}`, { key: p.a })).status, 200);
  assert.equal((await call('POST', `/api/ops/gifts/${g.id}`, { key: OPS, body: { status: 'requested' } })).status, 404);
  assert.equal((await db.query('SELECT status FROM gifts WHERE id=$1', [g.id])).rows[0].status, 'cancelled', 'row stays cancelled');
  assert.deepEqual((await gifts(p, p.a)).data.mine, [], 'still hidden');
});

test('removing a gift keeps the row as cancelled and hides it from both seats', async () => {
  const p = await confirmedPlan();
  await add(p, p.a, { kind: 'sealed_note', note: 'words for later' });
  await add(p, p.a, { kind: 'teaser', note: 'Saturday.' });
  await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice', contact: '+91 98765 43210' });
  const total = await count('gifts');
  const planGifts = Number((await db.query('SELECT count(*)::int AS n FROM gifts WHERE plan_id=$1',[p.id])).rows[0].n);
  const mine = (await gifts(p, p.a)).data.mine;
  for (const g of mine) assert.equal((await call('DELETE', `/api/plans/${p.id}/gifts/${g.id}`, { key: p.a })).status, 200);
  assert.equal(await count('gifts'), total, 'no row is deleted');
  const { rows } = await db.query('SELECT g.status, g.note, pa.contact FROM gifts g JOIN participants pa ON pa.id=g.giver_id WHERE g.plan_id=$1',[p.id]);
  assert.ok(rows.length === planGifts && rows.every(r => r.status === 'cancelled'));
  assert.ok(rows.some(r => r.contact) && rows.some(r => r.note), 'giver data is retained');
  assert.deepEqual((await gifts(p, p.a)).data.mine, []);
  const other = (await gifts(p, p.b)).data;
  assert.deepEqual(other.for_me, []);
  assert.equal(other.sealed_waiting, false);
  assert.equal(other.hint, false);
  assert.equal((await call('DELETE', `/api/plans/${p.id}/gifts/${mine[0].id}`, { key: p.a })).status, 404, 'removing twice is not found');
  // The slot is free again: a removed digital gift no longer counts toward its limit.
  assert.equal((await add(p, p.a, { kind: 'sealed_note', note: 'second try' })).status, 200);
  assert.equal((await gifts(p, p.a)).data.mine.length, 1);
});

test('cleanup answers without opening a database connection', async () => {
  let acquired = 0;
  const bare = createApi({ acquire: async () => { acquired += 1; throw new Error('database unreachable'); }, clientIp: () => '127.0.0.1', now: () => clock,
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS, CRON_SECRET: CRON } });
  const get = async key => { const r = await bare(new Request('http://127.0.0.1/api/cleanup', { method: 'GET', headers: key ? { authorization: `Bearer ${key}` } : {} })); return { status: r.status, data: await r.json() }; };
  assert.equal((await get()).status, 401);
  assert.equal((await get('wrong-secret-wrong-secret-xx')).status, 401);
  assert.deepEqual(await get(CRON), { status: 200, data: { deleted: 0 } });
  assert.equal(acquired, 0);
});
