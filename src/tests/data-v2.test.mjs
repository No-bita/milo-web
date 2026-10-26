// Data model v2: migration keeps every row (old contacts are dropped without copying,
// notes merge into requests), cleanup is a no-op, rate-limit
// rows are kept, city is required and recorded, new CSV columns.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { EXPORT_COLUMNS } from '../../server/concierge.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const sql = file => readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8');
const OPS = 'ops-secret-for-tests-only-123', CRON = 'cron-secret-for-tests-only';
let db, api;

before(async () => {
  db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql', 'solo.sql']) await db.exec(await sql(file));
  // Rows written by the previous version, before data-v2a.sql and data-v2b.sql is applied.
  const plan = randomUUID(), a = randomUUID(), b = randomUUID();
  await db.query("INSERT INTO plans(id,invite_token,status,confirmed_night_id,created_at) VALUES($1,'legacytoken000000000000','confirmed','middle-ground',now()-interval '90 days')", [plan]);
  await db.query("INSERT INTO participants(id,plan_id,role,display_name,seat_key_hash) VALUES($1,$2,'initiator','Old A','h1'),($3,$2,'partner','Old B','h2')", [a, plan, b]);
  await db.query("INSERT INTO bookings(id,plan_id,requester_id,budget_band,window_hours,contact,notes,requests,status,created_at) VALUES($1,$2,$3,'2k_4k',3,'+910000000001','Old note',NULL,'booked',now()-interval '2 days')", [randomUUID(), plan, a]);
  await db.query("INSERT INTO gifts(id,plan_id,giver_id,kind,item_id,stop_index,venue,contact,status,created_at) VALUES($1,$2,$3,'moment_drop','bouquet',0,'Somewhere','+910000000002','requested',now()-interval '1 day')", [randomUUID(), plan, a]);
  await db.query("INSERT INTO gifts(id,plan_id,giver_id,kind,item_id,stop_index,venue,contact,status) VALUES($1,$2,$3,'moment_drop','bouquet',0,'Elsewhere','+910000000003','requested')", [randomUUID(), plan, b]);
  await db.query("INSERT INTO rate_limits(scope,ip_hash,window_start,hits) VALUES('create','old',now()-interval '3 days',5),('create','new',date_trunc('minute',now()),1)");
  await db.exec(await sql('data-v2a.sql'));
  await db.exec(await sql('data-v2b.sql'));
  let tail = Promise.resolve();
  const acquire = async () => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; return { query: (q, args) => db.query(q, args), release }; };
  api = createApi({ acquire, clientIp: () => '127.0.0.1',
    env: { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'x', OPS_SECRET: OPS, CRON_SECRET: CRON } });
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

test('migration drops old contacts without copying, merges notes into requests, keeps every row', async () => {
  const cols = async t => (await db.query('SELECT column_name FROM information_schema.columns WHERE table_name=$1', [t])).rows.map(r => r.column_name);
  assert.ok((await cols('participants')).includes('contact'));
  assert.ok(!(await cols('bookings')).includes('contact') && !(await cols('bookings')).includes('notes'));
  assert.ok(!(await cols('gifts')).includes('contact'));
  const { rows: people } = await db.query("SELECT display_name, contact FROM participants WHERE display_name LIKE 'Old %' ORDER BY display_name");
  assert.deepEqual(people, [{ display_name: 'Old A', contact: null }, { display_name: 'Old B', contact: null }], 'no backfill: old numbers are not copied');
  const { rows: [booking] } = await db.query("SELECT requests FROM bookings WHERE status='booked'");
  assert.equal(booking.requests, 'Old note');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM gifts')).rows[0].n, 2);
  assert.equal((await db.query("SELECT city FROM plans WHERE invite_token='legacytoken000000000000'")).rows[0].city, 'bengaluru');
});

test('cleanup deletes nothing: plans and rate-limit rows are all kept', async () => {
  assert.equal((await call('GET', '/api/cleanup')).status, 401);
  const res = await call('GET', '/api/cleanup', { key: CRON });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { deleted: 0 });
  assert.equal((await db.query("SELECT count(*)::int AS n FROM plans WHERE invite_token='legacytoken000000000000'")).rows[0].n, 1, 'a 90-day-old plan is kept');
  const { rows } = await db.query('SELECT ip_hash FROM rate_limits');
  assert.ok(rows.some(r => r.ip_hash === 'old'), 'old counters kept');
  assert.ok(rows.some(r => r.ip_hash === 'new'), 'current counters kept');
});

test('city must be given and served', async () => {
  assert.equal((await call('POST', '/api/plans', { body: { name: 'Asha' } })).status, 400);
  assert.equal((await call('POST', '/api/plans', { body: { name: 'Asha', city: 'mumbai' } })).status, 400);
  assert.equal((await call('POST', '/api/plans', { body: { name: 'Asha', city: 'bengaluru' } })).status, 201);
});

test('contact lives on the person; ops reads it there; CSV has city, time to agree and nights browsed', async () => {
  const created = await call('POST', '/api/plans', { body: { name: 'Asha', city: 'bengaluru', occasion: 'date_night' } });
  const a = created.data.seat_key, id = created.data.plan_id;
  const token = new URL(created.data.invite_url).searchParams.get('invite');
  const b = (await call('POST', `/api/invites/${token}/join`, { body: { name: 'Ravi' } })).data.seat_key;
  const picks = from => ({ intents: ['intimate', 'fun'], reactions: EXPERIENCE_POOL.slice(from, from + 8).map(c => ({ cardId: c.id, reaction: 'into_it' })), finished: true });
  await call('PUT', `/api/plans/${id}/me`, { key: a, body: picks(0) });
  await call('PUT', `/api/plans/${id}/me`, { key: b, body: picks(2) });
  const nights = (await call('GET', `/api/plans/${id}`, { key: a })).data.shared_result.selectedNights.map(n => n.night.id);
  for (const n of [nights[1], nights[2], nights[2], nights[0]]) await call('POST', `/api/plans/${id}/events`, { key: b, body: { type: 'see_other', night_id: n } });
  await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'suggest', night_id: nights[0] } });
  await call('POST', `/api/plans/${id}/actions`, { key: b, body: { type: 'confirm', night_id: nights[0] } });
  await call('POST', `/api/plans/${id}/actions`, { key: a, body: { type: 'set_time', timing: { date: '2030-11-07', time: '19:30', time_zone: 'Asia/Kolkata' } } });
  await call('POST', `/api/plans/${id}/booking`, { key: a, body: { budget_band: '2k_4k', window_hours: 4, contact: '+91 98765 43210', requests: 'Quiet table' } });
  await call('POST', `/api/plans/${id}/gifts`, { key: a, body: { kind: 'moment_drop', item_id: 'bouquet', stop_index: 0, venue: 'Toit', contact: '+91 91111 22222' } });
  const { rows: [asha] } = await db.query("SELECT contact FROM participants WHERE plan_id=$1 AND role='initiator'", [id]);
  assert.equal(asha.contact, '+919111122222', 'one number per person, latest wins');
  const ops = await call('GET', '/api/ops/bookings', { key: OPS });
  const row = ops.data.bookings.find(r => r.requests === 'Quiet table');
  assert.equal(row.contact, '+919111122222'); assert.equal(row.city, 'bengaluru'); assert.ok(!('notes' in row));
  const gifts = await call('GET', '/api/ops/gifts', { key: OPS });
  assert.equal(gifts.data.gifts.find(g => g.venue === 'Toit').contact, '+919111122222');
  const csv = (await call('GET', '/api/ops/export.csv', { key: OPS })).data;
  const [header, ...lines] = csv.trim().split('\r\n');
  assert.equal(header, EXPORT_COLUMNS.join(','));
  const r = lines.map(l => Object.fromEntries(l.split(',').map((v, i) => [EXPORT_COLUMNS[i], v]))).find(x => x.plan_id === id.slice(0, 8));
  assert.equal(r.city, 'bengaluru');
  assert.ok(Number(r.minutes_to_agree) >= 0);
  assert.equal(r.nights_browsed_partner, '3'); assert.equal(r.see_other_partner, '4'); assert.equal(r.nights_browsed_initiator, '0');
});
