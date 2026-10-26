// Concierge booking handover + PMF measurement V1 (Phase 1 server).
// Contract: docs/phase1-server.md, "Concierge and PMF".
//
// Seats see: whether a booking can be requested, the booking's status, the
// venues ops filled in, and whether THEY have done the check-in. The requester
// also sees their own budget/window/notes. Nobody sees the other person's
// check-in answers, contact number or browsing events.
import { randomUUID } from 'node:crypto';
import { fail, valid, keys } from './errors.js';
import { zonedToUtc } from './gifts.js';
import { NIGHTS_POOL } from '../src/data/mockData.js';

export const BUDGET_BANDS = ['under_2k', '2k_4k', '4k_7k', '7k_plus'];
export const CHECKIN = {
  differently: ['yes', 'partly', 'no'],
  use_again: ['yes', 'maybe', 'no'],
  recommend: ['yes', 'maybe', 'no'],
  would_pay: ['nothing', 'under_200', '200_500', '500_1000', '1000_plus']
};
const EVENT_TYPES = ['see_other'];          // suggest/confirm are recorded by the server itself
const EVENT_CAP = 200;                      // per seat per plan
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nightIds = new Set(NIGHTS_POOL.map(n => n.id));

function text(value, min, max) {
  valid(typeof value === 'string');
  const result = value.trim();
  const length = [...result].length;
  valid(length >= min && length <= max && !/[\p{Cc}<>]/u.test(result.replace(/\n/g, '')));
  return result;
}
function phone(value) {
  valid(typeof value === 'string' && /^\+?[0-9 -]{10,20}$/.test(value.trim()));
  const digits = value.replace(/\D/g, '');
  valid(digits.length >= 10 && digits.length <= 15);
  return (value.trim().startsWith('+') ? '+' : '') + digits;
}

// Check-in opens at 09:00 (plan time zone) on the day after the night.
export function checkinOpensAt(timing) {
  if (!timing?.date || !timing?.time_zone) return null;
  const next = new Date(Date.parse(`${timing.date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return zonedToUtc(next, '09:00', timing.time_zone);
}

const activeBooking = async (db, planId) =>
  (await db.query("SELECT * FROM bookings WHERE plan_id=$1 AND status<>'cancelled' ORDER BY created_at DESC LIMIT 1", [planId])).rows[0] || null;

// The ONLY projection sent to a seat. Explicit allowlist.
async function conciergeView(db, plan, me, now) {
  const booking = await activeBooking(db, plan.id);
  const mine = booking && booking.requester_id === me.id;
  const { rows: [done] } = await db.query('SELECT 1 FROM checkins WHERE plan_id=$1 AND participant_id=$2', [plan.id, me.id]);
  const opens = plan.status === 'confirmed' ? checkinOpensAt(plan.timing) : null;
  return {
    can_request: plan.status === 'confirmed' && Boolean(plan.timing) && !booking,
    booking: booking ? {
      status: booking.status,
      requested_by_me: mine,
      venues: booking.status === 'booked' ? booking.venues : [],
      ...(mine ? { budget_band: booking.budget_band, window_hours: booking.window_hours, notes: booking.notes } : {})
    } : null,
    checkin: { open: opens !== null && now >= opens, done: Boolean(done) }
  };
}

// Seat-authenticated, inside the handler's transaction with the plan row locked.
//   GET/POST/DELETE /api/plans/:id/booking · POST /api/plans/:id/checkin · POST /api/plans/:id/events
export async function handleConcierge({ db, plan, me, action, method, readBody, now }) {
  if (action === 'booking' && method === 'GET') return conciergeView(db, plan, me, now);
  if (action === 'booking' && method === 'POST') {
    const body = await readBody();
    keys(body, ['budget_band', 'window_hours', 'contact', 'notes']);
    if (plan.status !== 'confirmed' || !plan.timing) fail(409, 'not_ready');
    valid(BUDGET_BANDS.includes(body.budget_band) && [3, 4].includes(body.window_hours));
    const contact = phone(body.contact);
    const notes = body.notes === undefined || body.notes === '' ? null : text(body.notes, 1, 300);
    if (await activeBooking(db, plan.id)) fail(409, 'exists');
    await db.query(`INSERT INTO bookings(id,plan_id,requester_id,budget_band,window_hours,contact,notes,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,'requested')`, [randomUUID(), plan.id, me.id, body.budget_band, body.window_hours, contact, notes]);
    return conciergeView(db, plan, me, now);
  }
  if (action === 'booking' && method === 'DELETE') {
    const booking = await activeBooking(db, plan.id);
    if (!booking || booking.requester_id !== me.id) fail(404, 'not_found');
    if (booking.status !== 'requested') fail(409, 'locked');
    await db.query("UPDATE bookings SET status='cancelled', updated_at=now() WHERE id=$1", [booking.id]);
    return conciergeView(db, plan, me, now);
  }
  if (action === 'checkin' && method === 'POST') {
    const body = await readBody();
    keys(body, ['differently', 'wouldnt_have', 'rating', 'use_again', 'recommend', 'would_pay']);
    const opens = plan.status === 'confirmed' ? checkinOpensAt(plan.timing) : null;
    if (opens === null || now < opens) fail(409, 'not_ready');
    for (const [k, options] of Object.entries(CHECKIN)) valid(options.includes(body[k]));
    valid(Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5);
    const answers = {
      differently: body.differently, rating: body.rating, use_again: body.use_again, recommend: body.recommend, would_pay: body.would_pay,
      wouldnt_have: body.wouldnt_have === undefined || body.wouldnt_have === '' ? null : text(body.wouldnt_have, 1, 300)
    };
    const inserted = await db.query('INSERT INTO checkins(plan_id,participant_id,answers) VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING RETURNING 1', [plan.id, me.id, JSON.stringify(answers)]);
    if (!inserted.rows.length) fail(409, 'exists');
    return conciergeView(db, plan, me, now);
  }
  if (action === 'events' && method === 'POST') {
    const body = await readBody();
    keys(body, ['type', 'night_id']);
    valid(EVENT_TYPES.includes(body.type) && (body.night_id === undefined || nightIds.has(body.night_id)));
    const { rows: [{ count }] } = await db.query('SELECT count(*)::int AS count FROM plan_events WHERE plan_id=$1 AND participant_id=$2 AND type=$3', [plan.id, me.id, body.type]);
    if (count < EVENT_CAP) await recordEvent(db, plan.id, me.id, body.type, body.night_id);
    return { ok: true };
  }
  return null;
}

export const recordEvent = (db, planId, participantId, type, nightId = null) =>
  db.query('INSERT INTO plan_events(plan_id,participant_id,type,night_id) VALUES($1,$2,$3,$4)', [planId, participantId, type, nightId ?? null]);

// ---------- Owner-only (OPS_SECRET) ----------

function validVenues(list, plan) {
  valid(Array.isArray(list) && list.length <= 6);
  const night = NIGHTS_POOL.find(n => n.id === plan.confirmed_night_id);
  return list.map(v => {
    keys(v, ['stop_index', 'venue', 'area', 'time']);
    valid(Number.isInteger(v.stop_index) && v.stop_index >= 0 && v.stop_index < (night?.beats.length || 3));
    valid(v.time === undefined || v.time === '' || (typeof v.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)));
    return { stop_index: v.stop_index, venue: text(v.venue, 2, 120), ...(v.area ? { area: text(v.area, 2, 80) } : {}), ...(v.time ? { time: v.time } : {}) };
  });
}

export async function handleOpsBookings({ db, method, id, readBody }) {
  if (method === 'GET' && !id) {
    const { rows } = await db.query(`SELECT b.*, p.timing, p.confirmed_night_id, p.occasion, r.display_name AS requester_name,
        (SELECT o.display_name FROM participants o WHERE o.plan_id=b.plan_id AND o.id<>b.requester_id) AS partner_name,
        (SELECT count(*)::int FROM gifts g WHERE g.plan_id=b.plan_id AND g.kind IN ('moment_drop','home_delivery') AND g.status<>'cancelled') AS physical_gifts
      FROM bookings b JOIN plans p ON p.id=b.plan_id JOIN participants r ON r.id=b.requester_id
      ORDER BY b.created_at DESC LIMIT 200`);
    return {
      bookings: rows.map(b => {
        const night = NIGHTS_POOL.find(n => n.id === b.confirmed_night_id);
        return {
          id: b.id, status: b.status, budget_band: b.budget_band, window_hours: b.window_hours, contact: b.contact, notes: b.notes,
          venues: b.venues, ops_minutes: b.ops_minutes, requester_name: b.requester_name, partner_name: b.partner_name,
          occasion: b.occasion, night_name: night?.name ?? null, stops: night?.beats.map(x => x.name) ?? [], timing: b.timing,
          physical_gifts: b.physical_gifts, created_at: b.created_at
        };
      })
    };
  }
  if (method === 'POST' && id) {
    valid(idPattern.test(id));
    const body = await readBody(); keys(body, ['status', 'venues', 'ops_minutes']);
    const { rows: [booking] } = await db.query('SELECT b.*, p.confirmed_night_id FROM bookings b JOIN plans p ON p.id=b.plan_id WHERE b.id=$1', [id]);
    if (!booking) fail(404, 'not_found');
    const status = body.status ?? booking.status;
    valid(['requested', 'booked', 'failed', 'cancelled'].includes(status));
    const venues = body.venues === undefined ? booking.venues : validVenues(body.venues, booking);
    if (status === 'booked') valid(venues.length > 0);
    valid(body.ops_minutes === undefined || (Number.isInteger(body.ops_minutes) && body.ops_minutes >= 0 && body.ops_minutes <= 1440));
    const minutes = body.ops_minutes ?? booking.ops_minutes;
    await db.query('UPDATE bookings SET status=$1, venues=$2::jsonb, ops_minutes=$3, updated_at=now() WHERE id=$4', [status, JSON.stringify(venues), minutes, id]);
    return { id, status, venues, ops_minutes: minutes };
  }
  return null;
}

// One row per plan for the PMF scorecard (Master Doc, Part E). CSV-safe.
export const EXPORT_COLUMNS = [
  'plan_id', 'created_at', 'occasion', 'status', 'partner_joined', 'both_finished', 'confirmed_night', 'confirmed_rank',
  'accepted_first_plan', 'suggestions', 'see_other_initiator', 'see_other_partner', 'time_set', 'night_date',
  'booking_status', 'budget_band', 'window_hours', 'ops_minutes', 'physical_gifts', 'digital_gifts', 'gift_statuses',
  'checkins', 'rating_initiator', 'rating_partner', 'differently_initiator', 'differently_partner',
  'use_again_initiator', 'use_again_partner', 'recommend_initiator', 'recommend_partner',
  'would_pay_initiator', 'would_pay_partner', 'wouldnt_have_initiator', 'wouldnt_have_partner'
];

const cell = value => {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;            // spreadsheet formula injection guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCsv(db) {
  const { rows: plans } = await db.query('SELECT * FROM plans ORDER BY created_at');
  const { rows: people } = await db.query('SELECT id, plan_id, role, finished_at FROM participants');
  const { rows: events } = await db.query('SELECT plan_id, participant_id, type FROM plan_events');
  const { rows: gifts } = await db.query('SELECT plan_id, kind, status FROM gifts');
  const { rows: bookings } = await db.query("SELECT DISTINCT ON (plan_id) plan_id, status, budget_band, window_hours, ops_minutes FROM bookings ORDER BY plan_id, (status<>'cancelled') DESC, created_at DESC");
  const { rows: checkins } = await db.query('SELECT plan_id, participant_id, answers FROM checkins');
  const lines = [EXPORT_COLUMNS.join(',')];
  for (const plan of plans) {
    const seats = people.filter(p => p.plan_id === plan.id);
    const roleOf = id => seats.find(s => s.id === id)?.role;
    const ev = events.filter(e => e.plan_id === plan.id);
    const seeOther = role => ev.filter(e => e.type === 'see_other' && roleOf(e.participant_id) === role).length;
    const ranked = plan.shared_result?.selectedNights?.map(x => x.night.id) || [];
    const rank = plan.confirmed_night_id ? ranked.indexOf(plan.confirmed_night_id) + 1 || null : null;
    const pg = gifts.filter(g => g.plan_id === plan.id);
    const physical = pg.filter(g => ['moment_drop', 'home_delivery'].includes(g.kind) && g.status !== 'cancelled');
    const booking = bookings.find(b => b.plan_id === plan.id);
    const answers = role => checkins.find(c => c.plan_id === plan.id && roleOf(c.participant_id) === role)?.answers || {};
    const a = answers('initiator'), b = answers('partner');
    const row = {
      plan_id: plan.id.slice(0, 8), created_at: new Date(plan.created_at).toISOString(), occasion: plan.occasion, status: plan.status,
      partner_joined: seats.some(s => s.role === 'partner'), both_finished: seats.length === 2 && seats.every(s => s.finished_at),
      confirmed_night: plan.confirmed_night_id, confirmed_rank: rank, accepted_first_plan: plan.confirmed_night_id ? rank === 1 : null,
      suggestions: ev.filter(e => e.type === 'suggest').length,
      see_other_initiator: seeOther('initiator'), see_other_partner: seeOther('partner'),
      time_set: Boolean(plan.timing), night_date: plan.timing?.date,
      booking_status: booking?.status, budget_band: booking?.budget_band, window_hours: booking?.window_hours, ops_minutes: booking?.ops_minutes,
      physical_gifts: physical.length, digital_gifts: pg.filter(g => ['sealed_note', 'teaser'].includes(g.kind)).length,
      gift_statuses: physical.map(g => g.status).join('|'),
      checkins: checkins.filter(c => c.plan_id === plan.id).length,
      rating_initiator: a.rating, rating_partner: b.rating, differently_initiator: a.differently, differently_partner: b.differently,
      use_again_initiator: a.use_again, use_again_partner: b.use_again, recommend_initiator: a.recommend, recommend_partner: b.recommend,
      would_pay_initiator: a.would_pay, would_pay_partner: b.would_pay, wouldnt_have_initiator: a.wouldnt_have, wouldnt_have_partner: b.wouldnt_have
    };
    lines.push(EXPORT_COLUMNS.map(c => cell(row[c])).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
