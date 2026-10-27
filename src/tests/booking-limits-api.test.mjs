// Booking limits (diet, alcohol, home-by) on the server: validated, stored, and shown to ops
// as plain-words lines, on solo and Together bookings. In-memory PGlite, real handler.
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
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql', 'data-v2a.sql', 'data-v2b.sql', 'intent-v31.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  api = createApi({ acquire, clientIp: () => '127.0.0.1',
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS } });
});
after(async () => db.close());

async function call(method, path, { body, key } = {}) {
  const res = await api(new Request(`http://127.0.0.1${path}`, { method,
    headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) }));
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

test('solo booking stores limits, refuses unlisted food choices, and ops sees them', async () => {
  const v3Half = { intents: ['intimate', 'fun', 'novelty'], reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })) };
  const base = { name: 'Asha', city: 'bengaluru', occasion: 'birthday', night_id: 'slow-one', night_rank: 1, timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' }, ...v3Half };
  const solo = await call('POST', '/api/plans/solo', { body: { ...base,
    booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210', surprise: true, constraints: { diet: ['jain'], alcohol: false, home_by: '22:00' } } } });
  assert.equal(solo.status, 201);
  const bad = await call('POST', '/api/plans/solo', { body: { ...base,
    booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210', constraints: { diet: ['peanut allergy'], alcohol: true } } } });
  assert.equal(bad.status, 400, 'only listed food choices');
  const ops = await call('GET', '/api/ops/bookings', { key: OPS });
  const row = ops.data.bookings.find(b => b.mode === 'solo' && b.occasion === 'birthday');
  assert.deepEqual(row.constraints, { diet: ['jain'], alcohol: false, home_by: '22:00' });
  assert.deepEqual(row.brief, ['Food: Jain.', 'No alcohol.', 'Home by 10 pm.']);
});


test('Together booking stores limits and ops gets a limits-only brief', async () => {
  const old = await call('POST', '/api/plans', { body: { name: 'Mira', city: 'bengaluru', occasion: 'date_night' } });
  const token = new URL(old.data.invite_url).searchParams.get('invite');
  const b = (await call('POST', `/api/invites/${token}/join`, { body: { name: 'Kabir' } })).data.seat_key;
  const v3Half = { intents: ['intimate', 'fun', 'novelty'], reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true };
  await call('PUT', `/api/plans/${old.data.plan_id}/me`, { key: old.data.seat_key, body: v3Half });
  await call('PUT', `/api/plans/${old.data.plan_id}/me`, { key: b, body: { ...v3Half, intents: ['fun', 'buzz', 'special'] } });
  const nights = (await call('GET', `/api/plans/${old.data.plan_id}`, { key: b })).data.shared_result.selectedNights.map(n => n.night.id);
  await call('POST', `/api/plans/${old.data.plan_id}/actions`, { key: old.data.seat_key, body: { type: 'suggest', night_id: nights[0] } });
  await call('POST', `/api/plans/${old.data.plan_id}/actions`, { key: b, body: { type: 'confirm', night_id: nights[0] } });
  await call('POST', `/api/plans/${old.data.plan_id}/actions`, { key: b, body: { type: 'set_time', timing: { date: '2030-11-08', time: '20:00', time_zone: 'Asia/Kolkata' } } });
  const booked = await call('POST', `/api/plans/${old.data.plan_id}/booking`, { key: b, body: { budget_band: '2k_4k', window_hours: 3, contact: '+91 91111 22222', constraints: { diet: ['vegan'], alcohol: true } } });
  assert.equal(booked.status, 200);
  const row = (await call('GET', '/api/ops/bookings', { key: OPS })).data.bookings.find(r => r.requester_name === 'Kabir');
  assert.deepEqual(row.brief, ['Food: Vegan.']);
});
