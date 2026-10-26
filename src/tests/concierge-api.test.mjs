// Concierge booking handover + PMF measurement: server contract.
// Real handler on in-memory PGlite (schema + gifts + concierge SQL), moved clock.
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
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
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
  const textBody = await res.text();
  let data; try { data = JSON.parse(textBody); } catch { data = textBody; }
  return { status: res.status, data, headers: res.headers };
}
const TIMING = { date: '2026-11-07', time: '19:30', time_zone: 'Asia/Kolkata' };
async function plan({ confirm = true, timing = TIMING, pickRank = 0 } = {}) {
  const created = await call('POST', '/api/plans', { body: { name: 'Asha', occasion: 'anniversary' } });
  const a = created.data.seat_key, id = created.data.plan_id;
  const token = new URL(created.data.invite_url).searchParams.get('invite');
  const b = (await call('POST', `/api/invites/${token}/join`, { body: { name: 'Ravi' } })).data.seat_key;
  const picks = from => ({ intents: ['intimate', 'fun'], reactions: EXPERIENCE_POOL.slice(from, from + 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true });
  await call('PUT', `/api/plans/${id}/me`, { key: a, body: picks(0) });
  await call('PUT', `/api/plans/${id}/me`, { key: b, body: picks(2) });
  const nights = (await call('GET', `/api/plans/${id}`, { key: a })).data.shared_result.selectedNights.map(n => n.night.id);
  if (confirm) {
    await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'suggest', night_id: nights[(pickRank + 1) % 3] } });
    await call('POST', `/api/plans/${id}/actions`, { key: b, body: { type: 'suggest', night_id: nights[pickRank] } });
    await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'confirm', night_id: nights[pickRank] } });
    if (timing) await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'set_time', timing } });
  }
  return { id, a, b, nights };
}
const view = (p, key) => call('GET', `/api/plans/${p.id}/booking`, { key });
const request = (p, key, body) => call('POST', `/api/plans/${p.id}/booking`, { key, body });
const REQ = { budget_band: '2k_4k', window_hours: 4, contact: '+91 98765 43210', notes: 'Indiranagar side, no alcohol for me' };
const CHECKIN = { differently: 'no', wouldnt_have: 'The walk between stops.', rating: 5, use_again: 'yes', recommend: 'yes', would_pay: '200_500' };

test('booking opens only for a confirmed night with a time', async () => {
  const unconfirmed = await plan({ confirm: false });
  assert.equal((await view(unconfirmed, unconfirmed.a)).data.can_request, false);
  assert.equal((await request(unconfirmed, unconfirmed.a, REQ)).status, 409);
  const untimed = await plan({ timing: null });
  assert.equal((await view(untimed, untimed.b)).data.can_request, false);
  const p = await plan();
  assert.deepEqual((await view(p, p.a)).data, { can_request: true, booking: null, checkin: { open: false, done: false } });
});

test('either person requests once; the other sees only the status; requester can cancel until booked', async () => {
  const p = await plan();
  const mine = await request(p, p.b, REQ);
  assert.equal(mine.status, 200);
  assert.deepEqual(mine.data.booking, { status: 'requested', requested_by_me: true, venues: [], budget_band: '2k_4k', window_hours: 4, notes: REQ.notes });
  const theirs = await view(p, p.a);
  assert.deepEqual(theirs.data.booking, { status: 'requested', requested_by_me: false, venues: [] });
  assert.equal(theirs.data.can_request, false);
  assert.ok(!JSON.stringify(theirs.data).includes('98765'));
  const again = await request(p, p.a, REQ);
  assert.equal(again.status, 409); assert.deepEqual(again.data, { error: 'exists' });
  assert.equal((await call('DELETE', `/api/plans/${p.id}/booking`, { key: p.a })).status, 404, 'only the requester cancels');
  assert.equal((await call('DELETE', `/api/plans/${p.id}/booking`, { key: p.b })).status, 200);
  assert.equal((await view(p, p.a)).data.can_request, true);
  assert.equal((await request(p, p.a, { ...REQ, window_hours: 3, notes: '' })).status, 200, 'a cancelled request can be made again');
});

test('validation: bands, window, contact, notes', async () => {
  const p = await plan();
  for (const bad of [{ ...REQ, budget_band: 'cheap' }, { ...REQ, window_hours: 6 }, { ...REQ, contact: '12345' }, { ...REQ, notes: '<b>' }, { ...REQ, extra: 1 }, { budget_band: '2k_4k', window_hours: 4 }]) {
    assert.equal((await request(p, p.a, bad)).status, 400, JSON.stringify(bad));
  }
});

test('ops sees the request, books it with venues, and both phones see the venues', async () => {
  const p = await plan();
  await request(p, p.a, REQ);
  assert.equal((await call('GET', '/api/ops/bookings')).status, 401);
  const list = await call('GET', '/api/ops/bookings', { key: OPS });
  const row = list.data.bookings.find(x => x.notes === REQ.notes);
  assert.equal(row.contact, '+919876543210');
  assert.equal(row.requester_name, 'Asha'); assert.equal(row.partner_name, 'Ravi');
  assert.equal(row.timing.time, '19:30'); assert.ok(row.stops.length >= 2); assert.equal(row.budget_band, '2k_4k');
  assert.equal((await call('POST', `/api/ops/bookings/${row.id}`, { key: OPS, body: { status: 'booked' } })).status, 400, 'booked needs venues');
  assert.equal((await call('POST', `/api/ops/bookings/${row.id}`, { key: OPS, body: { venues: [{ stop_index: 9, venue: 'Nowhere' }] } })).status, 400);
  const venues = [{ stop_index: 0, venue: 'Toit', area: 'Indiranagar', time: '19:30' }, { stop_index: 1, venue: 'Cubbon Park walk' }];
  const booked = await call('POST', `/api/ops/bookings/${row.id}`, { key: OPS, body: { status: 'booked', venues, ops_minutes: 25 } });
  assert.equal(booked.status, 200);
  for (const key of [p.a, p.b]) {
    const v = (await view(p, key)).data.booking;
    assert.equal(v.status, 'booked'); assert.deepEqual(v.venues, venues);
  }
  assert.deepEqual((await call('DELETE', `/api/plans/${p.id}/booking`, { key: p.a })).data, { error: 'locked' });
});

test('check-in opens 09:00 the next morning, once per person, answers stay private', async () => {
  const p = await plan();
  assert.equal((await call('POST', `/api/plans/${p.id}/checkin`, { key: p.a, body: CHECKIN })).status, 409);
  clock = zonedToUtc('2026-11-08', '08:59', 'Asia/Kolkata');
  assert.equal((await view(p, p.a)).data.checkin.open, false);
  clock = zonedToUtc('2026-11-08', '09:00', 'Asia/Kolkata');
  assert.equal((await view(p, p.a)).data.checkin.open, true);
  for (const bad of [{ ...CHECKIN, rating: 6 }, { ...CHECKIN, would_pay: 'lots' }, { ...CHECKIN, wouldnt_have: '<x>' }, { ...CHECKIN, extra: 1 }]) {
    assert.equal((await call('POST', `/api/plans/${p.id}/checkin`, { key: p.a, body: bad })).status, 400);
  }
  const done = await call('POST', `/api/plans/${p.id}/checkin`, { key: p.a, body: CHECKIN });
  assert.deepEqual(done.data.checkin, { open: true, done: true });
  assert.equal((await call('POST', `/api/plans/${p.id}/checkin`, { key: p.a, body: CHECKIN })).status, 409);
  const partner = await view(p, p.b);
  assert.deepEqual(partner.data.checkin, { open: true, done: false });
  assert.ok(!JSON.stringify(partner.data).includes('walk between'));
  assert.ok(!JSON.stringify((await call('GET', `/api/plans/${p.id}`, { key: p.b })).data).includes('walk between'));
});

test('browsing events: allowlisted, never returned to a seat, capped', async () => {
  const p = await plan();
  assert.equal((await call('POST', `/api/plans/${p.id}/events`, { key: p.a, body: { type: 'see_other', night_id: p.nights[1] } })).status, 200);
  assert.equal((await call('POST', `/api/plans/${p.id}/events`, { key: p.a, body: { type: 'suggest' } })).status, 400, 'clients cannot fake decisions');
  assert.equal((await call('POST', `/api/plans/${p.id}/events`, { key: p.a, body: { type: 'see_other', night_id: 'not-a-night' } })).status, 400);
  for (let i = 0; i < 205; i++) await call('POST', `/api/plans/${p.id}/events`, { key: p.b, body: { type: 'see_other' } });
  const { rows: [{ n }] } = await db.query("SELECT count(*)::int AS n FROM plan_events WHERE plan_id=$1 AND type='see_other'", [p.id]);
  assert.equal(n, 201, 'one from A + 200 cap for B');
  assert.ok(!JSON.stringify((await call('GET', `/api/plans/${p.id}`, { key: p.a })).data).includes('see_other'));
});

test('CSV export: one row per plan with the PMF scorecard columns, spreadsheet-safe', async () => {
  const first = await plan({ pickRank: 0 });
  const second = await plan({ pickRank: 2 });
  await call('POST', `/api/plans/${first.id}/events`, { key: first.b, body: { type: 'see_other', night_id: first.nights[1] } });
  await call('POST', `/api/plans/${first.id}/events`, { key: first.b, body: { type: 'see_other', night_id: first.nights[2] } });
  await request(first, first.a, REQ);
  await call('POST', `/api/plans/${first.id}/gifts`, { key: first.a, body: { kind: 'teaser', note: 'Saturday.' } });
  clock = zonedToUtc('2026-11-08', '10:00', 'Asia/Kolkata');
  await call('POST', `/api/plans/${first.id}/checkin`, { key: first.a, body: { ...CHECKIN, wouldnt_have: '=HYPERLINK("x") and "quotes", commas' } });
  await call('POST', `/api/plans/${first.id}/checkin`, { key: first.b, body: { ...CHECKIN, rating: 3, differently: 'partly' } });
  assert.equal((await call('GET', '/api/ops/export.csv')).status, 401);
  const res = await call('GET', '/api/ops/export.csv', { key: OPS });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  const lines = res.data.trim().split('\r\n');
  assert.equal(lines[0], EXPORT_COLUMNS.join(','));
  const parse = line => { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const rows = lines.slice(1).map(l => Object.fromEntries(parse(l).map((v, i) => [EXPORT_COLUMNS[i], v])));
  const r1 = rows.find(r => r.plan_id === first.id.slice(0, 8));
  const r2 = rows.find(r => r.plan_id === second.id.slice(0, 8));
  assert.equal(r1.accepted_first_plan, 'true'); assert.equal(r1.confirmed_rank, '1');
  assert.equal(r2.accepted_first_plan, 'false'); assert.equal(r2.confirmed_rank, '3');
  assert.equal(r1.suggestions, '2'); assert.equal(r1.see_other_partner, '2'); assert.equal(r1.see_other_initiator, '0');
  assert.equal(r1.booking_status, 'requested'); assert.equal(r1.budget_band, '2k_4k'); assert.equal(r1.digital_gifts, '1');
  assert.equal(r1.checkins, '2'); assert.equal(r1.rating_initiator, '5'); assert.equal(r1.rating_partner, '3'); assert.equal(r1.differently_partner, 'partly');
  assert.equal(r1.wouldnt_have_initiator, `'=HYPERLINK("x") and "quotes", commas`, 'formula cells are neutralised');
  assert.ok(!res.data.includes('98765'), 'contacts stay out of the export');
});
