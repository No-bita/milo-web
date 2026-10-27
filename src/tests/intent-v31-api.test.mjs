// Intent model v3.1 on the server: plans record their model, halves are validated
// against that model, the shared result comes from v3.1, booking limits are stored,
// and ops gets a plain-words brief. In-memory PGlite, real handler.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApi, projectShared } from '../../server/phase1.js';
import { EXPORT_COLUMNS } from '../../server/concierge.js';
import { buildDeckV31, v31Output } from '../logic/intent-quiz.js';
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

const A = { intents: ['romance', 'comfort', 'connection'], v31: { modes: ['talk', 'consume'], pairs: { P6: 'lean_left', P3: 'def_left', P2: 'lean_right' } } };
const B = { intents: ['fun', 'social', 'discovery'], v31: { modes: ['create_do'], pairs: { P6: 'def_right', P3: 'lean_right', P2: 'def_right' } } };
const half = (p, occasion, finished = true) => ({ ...p, reactions: buildDeckV31(p, occasion).map((c, i) => ({ cardId: c.id, reaction: i % 3 ? 'into_it' : 'maybe' })), finished });

async function v31Pair(occasion = 'anniversary') {
  const made = await call('POST', '/api/plans', { body: { name: 'Asha', city: 'bengaluru', occasion, intent_model: 'v3.1' } });
  assert.equal(made.status, 201);
  const token = new URL(made.data.invite_url).searchParams.get('invite');
  const preview = await call('GET', `/api/invites/${token}`);
  const joined = await call('POST', `/api/invites/${token}/join`, { body: { name: 'Ravi' } });
  return { id: made.data.plan_id, a: made.data.seat_key, b: joined.data.seat_key, preview: preview.data };
}

test('a v3.1 plan records its model, tells the partner, and computes the result with v3.1', async () => {
  const p = await v31Pair('anniversary');
  assert.equal(p.preview.intent_model, 'v3.1');
  const ha = half(A, 'anniversary'), hb = half(B, 'anniversary');
  assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.a, body: ha })).status, 200);
  const mine = await call('GET', `/api/plans/${p.id}`, { key: p.a });
  assert.equal(mine.data.intent_model, 'v3.1');
  assert.deepEqual(mine.data.me.v31, A.v31, 'extras come back for hydration');
  assert.equal(mine.data.shared_result, null);
  assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.b, body: hb })).status, 200);
  const view = await call('GET', `/api/plans/${p.id}`, { key: p.b });
  const expected = projectShared(v31Output([ha, hb], 'anniversary'));
  assert.deepEqual(view.data.shared_result, JSON.parse(JSON.stringify(expected)));
  assert.ok(!('v31' in (view.data.partner || {})), "the other half's answers are never returned");
});

test('halves must match the plan\'s model; finishing a v3.1 half needs all three pairs', async () => {
  const p = await v31Pair('date_night');
  const v3Half = { intents: ['intimate', 'fun', 'novelty'], reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true };
  assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.a, body: v3Half })).status, 400, 'v3 ids refused on a v3.1 plan');
  assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.a, body: { ...half(A, 'date_night'), v31: { modes: ['talk'], pairs: { P6: 'def_left' } } } })).status, 400, 'finished without all pairs');
  assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.a, body: { ...half(A, 'date_night', false), v31: { modes: ['talk'], pairs: { P6: 'def_left' } } } })).status, 200, 'unfinished half may be partial');
  for (const v31 of [{ modes: ['talk', 'move', 'rest'], pairs: {} }, { modes: ['dance'], pairs: {} }, { modes: [], pairs: { P9: 'def_left' } }, { modes: [], pairs: { P6: 'very' } }, { modes: [], pairs: {}, extra: 1 }]) {
    assert.equal((await call('PUT', `/api/plans/${p.id}/me`, { key: p.a, body: { ...half(A, 'date_night', false), v31 } })).status, 400, JSON.stringify(v31));
  }
  // A v3 plan keeps today's ids and refuses the v31 field.
  const old = await call('POST', '/api/plans', { body: { name: 'Mira', city: 'bengaluru' } });
  assert.equal((await call('PUT', `/api/plans/${old.data.plan_id}/me`, { key: old.data.seat_key, body: v3Half })).status, 200);
  assert.equal((await call('PUT', `/api/plans/${old.data.plan_id}/me`, { key: old.data.seat_key, body: half(A, 'date_night') })).status, 400);
  assert.equal((await call('GET', `/api/plans/${old.data.plan_id}`, { key: old.data.seat_key })).data.intent_model, 'v3');
  assert.equal((await call('POST', '/api/plans', { body: { name: 'Mira', city: 'bengaluru', intent_model: 'v4' } })).status, 400);
});

test('solo v3.1 booking stores the model and limits; ops sees a plain brief; CSV has intent_model', async () => {
  const h = half(A, 'birthday');
  const solo = await call('POST', '/api/plans/solo', { body: {
    name: 'Asha', city: 'bengaluru', occasion: 'birthday', night_id: 'slow-one', night_rank: 1, timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' },
    intents: h.intents, reactions: h.reactions, intent_model: 'v3.1', v31: h.v31,
    booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210', surprise: true, constraints: { diet: ['jain'], alcohol: false, home_by: '22:00' } }
  } });
  assert.equal(solo.status, 201);
  const bad = await call('POST', '/api/plans/solo', { body: {
    name: 'Asha', city: 'bengaluru', night_id: 'slow-one', timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' },
    intents: h.intents, reactions: h.reactions, intent_model: 'v3.1', v31: h.v31,
    booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210', constraints: { diet: ['peanut allergy'], alcohol: true } }
  } });
  assert.equal(bad.status, 400, 'only listed food choices');
  const ops = await call('GET', '/api/ops/bookings', { key: OPS });
  const row = ops.data.bookings.find(b => b.mode === 'solo' && b.occasion === 'birthday');
  assert.deepEqual(row.constraints, { diet: ['jain'], alcohol: false, home_by: '22:00' });
  assert.match(row.brief[0], /^Mood: /);
  assert.ok(row.brief.includes('Food: Jain.') && row.brief.includes('No alcohol.') && row.brief.includes('Home by 10 pm.'));
  const csv = (await call('GET', '/api/ops/export.csv', { key: OPS })).data;
  const [header, ...lines] = csv.trim().split('\r\n');
  assert.equal(header, EXPORT_COLUMNS.join(','));
  const col = EXPORT_COLUMNS.indexOf('intent_model');
  const mine = lines.map(l => l.split(',')).find(c => c[0] === solo.data.plan_id.slice(0, 8));
  assert.equal(mine[col], 'v3.1');
  assert.equal(mine[EXPORT_COLUMNS.indexOf('occasion')], 'birthday');
  assert.ok(!csv.includes('Jain') && !csv.includes('romance'), 'no answers or limits in the export');
});

test('Together booking takes limits too, and a v3 plan gets a limits-only brief', async () => {
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
