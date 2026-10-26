// Gifting V1 server contract: secrecy, reveal times, limits, ops access.
// Runs the real handler on an in-memory PGlite (schema.sql + gifts.sql) with a
// controllable clock. No browser, no network.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { zonedToUtc } from '../../server/gifts.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const OPS = 'ops-secret-for-tests-only-123';
const BASE = Date.parse('2026-11-01T06:30:00Z'); // 12:00 IST, Sun 1 Nov
let db, api, clock = BASE;
const DAY = 86400000;

before(async () => {
  db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  api = createApi({ acquire, clientIp: () => '127.0.0.1', now: () => clock,
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS } });
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
  const created = await call('POST', '/api/plans', { body: { name: 'Asha' } });
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

test('gifts wait for a confirmed night with a time', async () => {
  const p = await confirmedPlan({ timing: null });
  assert.equal(p.gifts0.status, 200);
  assert.equal(p.gifts0.data.can_add, false);
  assert.equal((await add(p, p.a, { kind: 'teaser', note: 'Saturday.' })).status, 409);
  await call('POST', `/api/plans/${p.id}/actions`, { key: p.a, body: { type: 'set_time', timing: { date: '2026-11-07', time: '19:30', time_zone: 'Asia/Kolkata' } } });
  assert.equal((await gifts(p, p.a)).data.can_add, true);
});

test('a physical gift is never revealed to the recipient; the hint is the giver\'s choice', async () => {
  const p = await confirmedPlan();
  const added = await add(p, p.a, { kind: 'home_delivery', item_id: 'bouquet', address: '12 Lavelle Road, Bengaluru 560001', deliver_window: 'afternoon', note: 'For tonight', show_hint: false, contact: '+91 98765 43210' });
  assert.equal(added.status, 200);
  assert.equal(added.data.mine.length, 1);
  assert.equal(added.data.mine[0].status, 'requested');
  assert.equal(added.data.mine[0].address, '12 Lavelle Road, Bengaluru 560001');
  assert.ok(!JSON.stringify(added.data).includes('98765'), 'the contact number stays on the ops side');
  clock = Date.parse('2026-11-08T00:00:00Z'); // after the night
  const theirs = await gifts(p, p.b);
  assert.equal(theirs.data.hint, false);
  assert.deepEqual(theirs.data.for_me, []);
  const raw = JSON.stringify(theirs.data);
  for (const secret of ['Lavelle', 'bouquet', 'For tonight', 'afternoon', '98765']) assert.ok(!raw.includes(secret), `recipient view leaks ${secret}`);
  clock = BASE;
  await add(p, p.a, { kind: 'moment_drop', item_id: 'single-stem', stop_index: 2, venue: 'Courtyard cafe, Indiranagar', show_hint: true, contact: '+91 98765 43210' });
  const hinted = await gifts(p, p.b);
  assert.equal(hinted.data.hint, true);
  assert.ok(!JSON.stringify(hinted.data).includes('Courtyard'));
});

test('teaser opens the day before, sealed note at the start time, then both are readable', async () => {
  const p = await confirmedPlan();
  assert.equal((await add(p, p.b, { kind: 'teaser', note: 'Wear something comfy.' })).status, 200);
  assert.equal((await add(p, p.b, { kind: 'sealed_note', note: 'Open me at dessert.', stop_index: 2 })).status, 200);
  const early = await gifts(p, p.a);
  assert.deepEqual(early.data.for_me, []);
  assert.equal(early.data.sealed_waiting, true);
  assert.ok(!JSON.stringify(early.data).includes('comfy'));
  clock = zonedToUtc('2026-11-06', '00:00', 'Asia/Kolkata'); // 00:00 IST the day before
  const dayBefore = await gifts(p, p.a);
  assert.deepEqual(dayBefore.data.for_me.map(g => g.kind), ['teaser']);
  assert.equal(dayBefore.data.for_me[0].note, 'Wear something comfy.');
  clock = zonedToUtc('2026-11-07', '19:29', 'Asia/Kolkata');
  assert.equal((await gifts(p, p.a)).data.for_me.length, 1);
  clock = zonedToUtc('2026-11-07', '19:30', 'Asia/Kolkata');
  const open = await gifts(p, p.a);
  assert.deepEqual(open.data.for_me.map(g => g.kind).sort(), ['sealed_note', 'teaser']);
  assert.equal(open.data.for_me.find(g => g.kind === 'sealed_note').stop_index, 2);
  assert.equal(open.data.from, 'Ravi');
  // Moving the night later re-locks the note: reveal follows the plan's time.
  await call('POST', `/api/plans/${p.id}/actions`, { key: p.a, body: { type: 'set_time', timing: { date: '2026-11-07', time: '21:00', time_zone: 'Asia/Kolkata' } } });
  assert.deepEqual((await gifts(p, p.a)).data.for_me.map(g => g.kind), ['teaser']);
});

test('memory lines open at the start time and show the other line only once both exist', async () => {
  const p = await confirmedPlan();
  assert.equal((await add(p, p.a, { kind: 'memory', note: 'Best dessert ever.' })).status, 409);
  clock = zonedToUtc('2026-11-07', '23:00', 'Asia/Kolkata');
  assert.equal((await add(p, p.a, { kind: 'memory', note: 'Best dessert ever.' })).status, 200);
  let b = await gifts(p, p.b);
  assert.equal(b.data.memory.open, true);
  assert.equal(b.data.memory.theirs, null, 'one line alone stays hidden');
  assert.equal((await add(p, p.b, { kind: 'memory', note: 'The walk back.' })).status, 200);
  b = await gifts(p, p.b);
  assert.equal(b.data.memory.mine, 'The walk back.');
  assert.equal(b.data.memory.theirs, 'Best dessert ever.');
  assert.equal((await add(p, p.b, { kind: 'memory', note: 'again' })).status, 409);
});

test('limits, lead time, validation and delete rules', async () => {
  const p = await confirmedPlan({ timing: { date: '2026-11-03', time: '20:00', time_zone: 'Asia/Kolkata' } });
  // Night is 2 days away: the stitched keepsake needs 5.
  assert.deepEqual(await add(p, p.a, { kind: 'home_delivery', item_id: 'name-keepsake', address: '12 Lavelle Road, Bengaluru', deliver_window: 'morning', contact: '+91 98765 43210' }), { status: 409, data: { error: 'too_soon' } });
  // Item not offered for this kind, unknown fields, script-ish text.
  assert.equal((await add(p, p.a, { kind: 'home_delivery', item_id: 'dessert-to-table', address: '12 Lavelle Road, Bengaluru', deliver_window: 'morning', contact: '+91 98765 43210' })).status, 400);
  assert.equal((await add(p, p.a, { kind: 'teaser', note: 'hi', extra: 1 })).status, 400);
  assert.equal((await add(p, p.a, { kind: 'teaser', note: '<script>' })).status, 400);
  assert.equal((await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice' })).status, 400, 'physical gifts need a contact number');
  assert.equal((await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice', contact: '12345' })).status, 400);
  for (let i = 0; i < 3; i++) assert.equal((await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice', contact: '+91 98765 43210' })).status, 200);
  assert.deepEqual(await add(p, p.a, { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Somewhere nice', contact: '+91 98765 43210' }), { status: 409, data: { error: 'limit' } });
  const first = (await gifts(p, p.a)).data.mine[0];
  // The other seat cannot delete it; the giver can while it's only requested.
  assert.equal((await call('DELETE', `/api/plans/${p.id}/gifts/${first.id}`, { key: p.b })).status, 404);
  assert.equal((await call('DELETE', `/api/plans/${p.id}/gifts/${first.id}`, { key: p.a })).status, 200);
  const second = (await gifts(p, p.a)).data.mine[0];
  await call('POST', `/api/ops/gifts/${second.id}`, { key: OPS, body: { status: 'confirmed' } });
  assert.deepEqual(await call('DELETE', `/api/plans/${p.id}/gifts/${second.id}`, { key: p.a }), { status: 409, data: { error: 'locked' } });
});

test('ops list needs OPS_SECRET, carries fulfilment details, and its status reaches the giver only', async () => {
  const p = await confirmedPlan();
  await add(p, p.a, { kind: 'moment_drop', item_id: 'mini-cake', stop_index: 1, venue: 'Toit, Indiranagar', note: 'Happy 1 year', show_hint: true, contact: '+91 98765 43210' });
  await add(p, p.a, { kind: 'sealed_note', note: 'private words' });
  assert.equal((await call('GET', '/api/ops/gifts')).status, 401);
  assert.equal((await call('GET', '/api/ops/gifts', { key: 'wrong-secret-wrong-secret-xx' })).status, 401);
  assert.equal((await call('GET', '/api/ops/gifts', { key: p.a })).status, 401, 'a seat key is not an ops key');
  const list = await call('GET', '/api/ops/gifts', { key: OPS });
  assert.equal(list.status, 200);
  const row = list.data.gifts.find(g => g.venue === 'Toit, Indiranagar');
  assert.equal(row.item_name, 'Small celebration cake');
  assert.equal(row.giver_name, 'Asha');
  assert.equal(row.recipient_name, 'Ravi');
  assert.equal(row.timing.time, '19:30');
  assert.ok(row.stop);
  assert.equal(row.contact, '+919876543210');
  assert.ok(!JSON.stringify(list.data).includes('private words'), 'digital notes are not in the ops list');
  assert.equal((await call('POST', `/api/ops/gifts/${row.id}`, { key: OPS, body: { status: 'shipped' } })).status, 400);
  assert.equal((await call('POST', `/api/ops/gifts/${row.id}`, { key: OPS, body: { status: 'dispatched' } })).status, 200);
  assert.equal((await gifts(p, p.a)).data.mine.find(g => g.id === row.id).status, 'dispatched');
  assert.ok(!JSON.stringify((await gifts(p, p.b)).data).includes('dispatched'));
});

test('ops fails closed without a configured secret', async () => {
  const bare = createApi({ acquire: async () => { throw new Error('no db'); }, clientIp: () => '127.0.0.1',
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1' } });
  const res = await bare(new Request('http://127.0.0.1/api/ops/gifts', { headers: { authorization: 'Bearer anything-anything-anything' } }));
  assert.equal(res.status, 503);
});

test('a seat from another plan cannot read or add gifts', async () => {
  const p = await confirmedPlan();
  const q = await confirmedPlan();
  assert.equal((await gifts(p, q.a)).status, 404);
  assert.equal((await add(p, q.a, { kind: 'teaser', note: 'hi' })).status, 404);
});

test('reveal times convert the plan time zone correctly', () => {
  assert.equal(new Date(zonedToUtc('2026-11-07', '19:30', 'Asia/Kolkata')).toISOString(), '2026-11-07T14:00:00.000Z');
  assert.equal(new Date(zonedToUtc('2026-11-01', '01:30', 'America/New_York')).toISOString(), '2026-11-01T05:30:00.000Z');
});
