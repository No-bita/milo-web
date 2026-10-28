// Lighter forms on the server: booking length is optional (booking-length.sql), a gift
// reuses the number the person already gave or answers needs_contact, and a moment drop
// no longer needs a venue. In-memory PGlite, real handler.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const OPS = 'ops-secret-for-tests-only-123';
let db, api;
before(async () => {
  db = new PGlite();
  for (const f of ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql', 'data-v2a.sql', 'data-v2b.sql', 'intent-v31.sql', 'accounts.sql', 'booking-length.sql']) await db.exec(await readFile(new URL(`../../server/${f}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  let n = 0;
  api = createApi({ acquire, clientIp: () => `10.2.0.${n++ % 250}`, env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS } });
});
after(async () => db.close());

async function call(method, path, { body, key } = {}) {
  const res = await api(new Request(`http://127.0.0.1${path}`, { method, headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const half = (intents) => ({ intents, reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true });
async function agreed() {
  const made = await call('POST', '/api/plans', { body: { name: 'Asha', city: 'bengaluru', occasion: 'date_night' } });
  const token = new URL(made.data.invite_url).searchParams.get('invite');
  const b = (await call('POST', `/api/invites/${token}/join`, { body: { name: 'Ravi' } })).data.seat_key;
  const a = made.data.seat_key, id = made.data.plan_id;
  await call('PUT', `/api/plans/${id}/me`, { key: a, body: half(['intimate', 'fun', 'novelty']) });
  await call('PUT', `/api/plans/${id}/me`, { key: b, body: half(['fun', 'buzz', 'special']) });
  const night = (await call('GET', `/api/plans/${id}`, { key: a })).data.shared_result.selectedNights[0].night.id;
  await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'suggest', night_id: night } });
  await call('POST', `/api/plans/${id}/actions`, { key: b, body: { type: 'confirm', night_id: night } });
  await call('POST', `/api/plans/${id}/actions`, { key: b, body: { type: 'set_time', timing: { date: '2030-11-08', time: '20:00', time_zone: 'Asia/Kolkata' } } });
  return { id, a, b, night };
}

test('booking without a length is stored as no length; 3 or 4 still accepted, others refused', async () => {
  const p = await agreed();
  const r = await call('POST', `/api/plans/${p.id}/booking`, { key: p.a, body: { budget_band: '2k_4k', contact: '+91 91111 22222' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const { rows: [row] } = await db.query('SELECT window_hours FROM bookings WHERE plan_id=$1', [p.id]);
  assert.equal(row.window_hours, null);
  const ops = await call('GET', '/api/ops/bookings', { key: OPS });
  assert.equal(ops.data.bookings.find(x => x.requester_name === 'Asha' && x.window_hours === null)?.window_hours, null);
  const q = await agreed();
  assert.equal((await call('POST', `/api/plans/${q.id}/booking`, { key: q.a, body: { budget_band: '2k_4k', window_hours: 6, contact: '+91 91111 22222' } })).status, 400);
  assert.equal((await call('POST', `/api/plans/${q.id}/booking`, { key: q.a, body: { budget_band: '2k_4k', window_hours: 3, contact: '+91 91111 22222' } })).status, 200, 'older apps still work');
  const solo = await call('POST', '/api/plans/solo', { body: { name: 'Mira', city: 'bengaluru', night_id: p.night, timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' }, intents: [], reactions: [], booking: { budget_band: '4k_7k', contact: '+91 98765 43210' } } });
  assert.equal(solo.status, 201);
});

test('gift: no venue needed; number reused from the booking, else needs_contact', async () => {
  const p = await agreed();
  // Ravi has given no number yet: a physical gift without one is refused with needs_contact.
  const noNumber = await call('POST', `/api/plans/${p.id}/gifts`, { key: p.b, body: { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0 } });
  assert.deepEqual([noNumber.status, noNumber.data], [400, { error: 'needs_contact' }]);
  const withNumber = await call('POST', `/api/plans/${p.id}/gifts`, { key: p.b, body: { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, contact: '+91 93333 44444' } });
  assert.equal(withNumber.status, 200, JSON.stringify(withNumber.data));
  // Asha booked with a number, so her gift needs neither venue nor number.
  await call('POST', `/api/plans/${p.id}/booking`, { key: p.a, body: { budget_band: '2k_4k', contact: '+91 91111 22222' } });
  const reused = await call('POST', `/api/plans/${p.id}/gifts`, { key: p.a, body: { kind: 'moment_drop', item_id: 'bouquet', stop_index: 1 } });
  assert.equal(reused.status, 200, JSON.stringify(reused.data));
  assert.ok(!JSON.stringify(reused.data).includes('91111'), 'the saved number is never sent back to the phone');
  const ops = await call('GET', '/api/ops/gifts', { key: OPS });
  const mine = ops.data.gifts.filter(g => g.plan_id === p.id || g.giver_name === 'Asha');
  assert.ok(mine.some(g => g.contact === '+919111122222' && g.venue === null), 'ops sees her saved number and no venue');
  // A venue can still be given by older apps.
  assert.equal((await call('POST', `/api/plans/${p.id}/gifts`, { key: p.a, body: { kind: 'moment_drop', item_id: 'bouquet', stop_index: 2, venue: 'x' } })).status, 400, 'too short still refused');
  // Digital gifts never needed a number.
  assert.equal((await call('POST', `/api/plans/${p.id}/gifts`, { key: p.b, body: { kind: 'teaser', note: 'Saturday.' } })).status, 200);
});
