// Solo plans + partner share link: server contract on in-memory PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { zonedToUtc } from '../../server/gifts.js';
import { EXPORT_COLUMNS } from '../../server/concierge.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const OPS = 'ops-secret-for-tests-only-123';
const BASE = Date.parse('2026-11-01T06:30:00Z');
let db, api, clock = BASE;
before(async () => {
  db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql', 'data-v2a.sql', 'data-v2b.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, a) => db.query(q, a), release }; };
  api = createApi({ acquire, clientIp: () => '127.0.0.1', now: () => clock,
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS } });
});
after(async () => db.close());
beforeEach(() => { clock = BASE; });

async function call(method, path, { body, key } = {}) {
  const res = await api(new Request(`http://127.0.0.1${path}`, { method,
    headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) }));
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const TIMING = { date: '2026-11-07', time: '19:30', time_zone: 'Asia/Kolkata' };
const SOLO = (over = {}) => ({
  name: 'Asha', city: 'bengaluru', occasion: 'anniversary', night_id: 'little-adventure', night_rank: 2, timing: TIMING,
  stops: ['Pottery class', 'Dinner', 'Dessert'],
  intents: ['intimate', 'fun', 'novelty'], reactions: EXPERIENCE_POOL.slice(0, 8).map(c => ({ cardId: c.id, reaction: 'into_it' })),
  booking: { budget_band: '4k_7k', window_hours: 4, contact: '+91 98765 43210', requests: 'Flowers at the table: peonies', surprise: true },
  ...over
});
const create = body => call('POST', '/api/plans/solo', { body });
const tokenOf = url => new URL(url).searchParams.get('shared');

test('creating a solo plan books it in one step and returns a seat and share link', async () => {
  const res = await create(SOLO());
  assert.equal(res.status, 201);
  assert.deepEqual(Object.keys(res.data).sort(), ['plan_id', 'seat_key', 'share_url']);
  assert.match(res.data.share_url, /^http:\/\/127\.0\.0\.1\/app\/\?shared=[A-Za-z0-9_-]{22}$/);
  const view = await call('GET', `/api/plans/${res.data.plan_id}/booking`, { key: res.data.seat_key });
  assert.equal(view.data.can_request, false);
  assert.deepEqual(view.data.booking, { status: 'requested', requested_by_me: true, venues: [], budget_band: '4k_7k', window_hours: 4, requests: 'Flowers at the table: peonies', surprise: true });
  const plan = await call('GET', `/api/plans/${res.data.plan_id}`, { key: res.data.seat_key });
  assert.equal(plan.data.status, 'confirmed'); assert.equal(plan.data.confirmed_night_id, 'little-adventure'); assert.equal(plan.data.partner, null);
});

test('validation and limits', async () => {
  for (const bad of [SOLO({ night_id: 'nope' }), SOLO({ night_rank: 4 }), SOLO({ timing: { ...TIMING, time: '25:00' } }), SOLO({ stops: ['<b>'] }),
    SOLO({ booking: { ...SOLO().booking, contact: '123' } }), SOLO({ booking: { ...SOLO().booking, surprise: 'yes' } }),
    SOLO({ booking: { ...SOLO().booking, requests: 'x'.repeat(1001) } }), SOLO({ extra: 1 }), SOLO({ name: '' })]) {
    assert.equal((await create(bad)).status, 400, JSON.stringify(bad).slice(0, 80));
  }
  assert.equal((await call('GET', '/api/plans/solo')).status, 405);
});

test('a solo plan can never be joined through an invite', async () => {
  const res = await create(SOLO());
  const { rows: [{ invite_token }] } = await db.query('SELECT invite_token FROM plans WHERE id=$1', [res.data.plan_id]);
  assert.equal((await call('GET', `/api/invites/${invite_token}`)).status, 404);
  assert.equal((await call('POST', `/api/invites/${invite_token}/join`, { body: { name: 'Ravi' } })).status, 404);
});

test('share link: read-only, surprise requests hidden, venues after booking, no private fields', async () => {
  const secretPlan = await create(SOLO());
  const open = await create(SOLO({ booking: { ...SOLO().booking, requests: 'Window seat if possible.', surprise: false } }));
  const s1 = await call('GET', `/api/shared/${tokenOf(secretPlan.data.share_url)}`);
  assert.equal(s1.status, 200);
  assert.deepEqual(Object.keys(s1.data).sort(), ['from', 'night', 'requests', 'status', 'stops', 'timing', 'venues']);
  assert.equal(s1.data.from, 'Asha'); assert.equal(s1.data.night.name, 'The Little Adventure');
  assert.deepEqual(s1.data.stops, ['Pottery class', 'Dinner', 'Dessert']); assert.equal(s1.data.status, 'booking');
  assert.equal(s1.data.requests, null, 'surprise requests stay hidden');
  for (const leak of ['peonies', '98765', '4k_7k', 'seat', 'contact']) assert.ok(!JSON.stringify(s1.data).includes(leak), leak);
  const s2 = await call('GET', `/api/shared/${tokenOf(open.data.share_url)}`);
  assert.equal(s2.data.requests, 'Window seat if possible.');
  assert.equal((await call('GET', '/api/shared/AAAAAAAAAAAAAAAAAAAAAA')).status, 404);
  assert.equal((await call('GET', '/api/shared/bad')).status, 400);
  // Ops books it: the link shows the venues.
  const list = await call('GET', '/api/ops/bookings', { key: OPS });
  const row = list.data.bookings.find(b => b.requests === 'Window seat if possible.');
  assert.equal(row.mode, 'solo'); assert.equal(row.surprise, false); assert.equal(row.partner_name, null);
  assert.deepEqual(row.stops, ['Pottery class', 'Dinner', 'Dessert']);
  const venues = [{ stop_index: 0, venue: 'Clay Station', area: 'Indiranagar', time: '19:30' }];
  assert.equal((await call('POST', `/api/ops/bookings/${row.id}`, { key: OPS, body: { status: 'booked', venues, ops_minutes: 15 } })).status, 200);
  const s3 = await call('GET', `/api/shared/${tokenOf(open.data.share_url)}`);
  assert.equal(s3.data.status, 'booked'); assert.deepEqual(s3.data.venues, venues);
  const mine = await call('GET', `/api/plans/${open.data.plan_id}/booking`, { key: open.data.seat_key });
  assert.deepEqual(mine.data.booking.venues, venues);
});

test('solo check-in next morning, cancel and re-book, and the CSV marks solo with its rank', async () => {
  const res = await create(SOLO());
  const key = res.data.seat_key, id = res.data.plan_id;
  assert.equal((await call('DELETE', `/api/plans/${id}/booking`, { key })).status, 200);
  assert.equal((await call('GET', `/api/plans/${id}/booking`, { key })).data.can_request, true);
  assert.equal((await call('POST', `/api/plans/${id}/booking`, { key, body: { budget_band: '2k_4k', window_hours: 3, contact: '+91 98765 43210', requests: 'Quiet table', surprise: false } })).status, 200);
  clock = zonedToUtc('2026-11-08', '09:30', 'Asia/Kolkata');
  const ci = await call('POST', `/api/plans/${id}/checkin`, { key, body: { differently: 'partly', rating: 4, use_again: 'yes', recommend: 'yes', would_pay: '500_1000' } });
  assert.equal(ci.status, 200);
  const csv = (await call('GET', '/api/ops/export.csv', { key: OPS })).data;
  const [header, ...rows] = csv.trim().split('\r\n');
  assert.equal(header, EXPORT_COLUMNS.join(','));
  const r = rows.map(l => Object.fromEntries(l.split(',').map((v, i) => [EXPORT_COLUMNS[i], v]))).find(x => x.plan_id === id.slice(0, 8));
  assert.equal(r.mode, 'solo'); assert.equal(r.confirmed_rank, '2'); assert.equal(r.accepted_first_plan, 'false');
  assert.equal(r.booking_status, 'requested'); assert.equal(r.budget_band, '2k_4k'); assert.equal(r.requests_given, 'true'); assert.equal(r.surprise, 'false');
  assert.equal(r.checkins, '1'); assert.equal(r.rating_initiator, '4'); assert.equal(r.partner_joined, 'false');
  assert.ok(!csv.includes('Quiet table'), 'request text stays out of the export');
});
