// Solo plans (one planner, no partner on Milo) + the partner share link.
// Contract: docs/phase1-server.md, "Solo plans and share link".
//
// POST /api/plans/solo creates a confirmed one-seat plan AND its booking request
// in one transaction, at the moment the planner taps "Book this night".
// GET /api/shared/:token is public and read-only: night, time, stops, venues once
// booked, the planner's first name, and requests ONLY when not marked a surprise.
// Never: contact number, budget, notes, picks, check-ins.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { fail, valid, keys } from './errors.js';
import { bookingExtras, validBooking, insertBooking, stopNames } from './concierge.js';
import { CITIES } from '../src/data/cities.js';
import { pairsDone } from '../src/logic/intent-quiz.js';
import { NIGHTS_POOL } from '../src/data/mockData.js';

const secret = () => randomBytes(16).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
export const shareTokenPattern = /^[A-Za-z0-9_-]{22}$/;
const occasions = ['date_night', 'anniversary', 'proposal', 'birthday', 'quality_time', 'just_because'];

function stopList(value) {
  if (value === undefined) return null;
  valid(Array.isArray(value) && value.length >= 1 && value.length <= 4);
  return value.map(s => {
    valid(typeof s === 'string');
    const t = s.trim();
    valid([...t].length >= 2 && [...t].length <= 60 && !/[\p{Cc}<>]/u.test(t));
    return t;
  });
}

// helpers: { name, timing, picks } are the handler's own validators, reused as-is.
export async function createSolo({ db, body, origin, helpers }) {
  keys(body, ['name', 'occasion', 'city', 'night_id', 'night_rank', 'timing', 'stops', 'intents', 'reactions', 'booking', 'intent_model', 'v31']);
  valid(body.intent_model === undefined || ['v3', 'v3.1'].includes(body.intent_model));
  const model = body.intent_model || 'v3';
  valid(Object.hasOwn(CITIES, body.city));
  const displayName = helpers.name(body.name);
  valid(body.occasion === undefined || occasions.includes(body.occasion));
  valid(NIGHTS_POOL.some(n => n.id === body.night_id));
  valid(body.night_rank === undefined || [1, 2, 3].includes(body.night_rank));
  helpers.timing(body.timing);
  const stops = stopList(body.stops);
  const raw = { intents: body.intents ?? [], reactions: body.reactions ?? [], ...(model === 'v3.1' ? { v31: body.v31 ?? { modes: [], pairs: {} } } : {}) };
  const done = raw.reactions.length === 8 && (model !== 'v3.1' || pairsDone(raw.v31));
  const picks = helpers.picks({ ...raw, finished: done }, model);
  keys(body.booking, ['budget_band', 'window_hours', 'contact', 'requests', 'surprise', 'constraints']);
  const contact = validBooking(body.booking);
  const { requests, surprise, constraints } = bookingExtras(body.booking);
  const id = randomUUID(), seatKey = secret(), shareToken = secret(), seatId = randomUUID();
  await db.query('BEGIN');
  // invite_token is required by the schema but never accepted for solo plans.
  await db.query(`INSERT INTO plans(id,invite_token,occasion,city,status,confirmed_night_id,timing,mode,share_token,stops,solo_rank,intent_model)
    VALUES($1,$2,$3,$4,'confirmed',$5,$6::jsonb,'solo',$7,$8::jsonb,$9,$10)`,
    [id, secret(), body.occasion || null, body.city, body.night_id, JSON.stringify(body.timing), shareToken, stops ? JSON.stringify(stops) : null, body.night_rank ?? null, model]);
  await db.query(`INSERT INTO participants(id,plan_id,role,display_name,seat_key_hash,intents,reactions,finished_at,contact,v31)
    VALUES($1,$2,'initiator',$3,$4,$5::jsonb,$6::jsonb,${picks.finished ? 'now()' : 'NULL'},$7,$8::jsonb)`,
    [seatId, id, displayName, hash(seatKey), JSON.stringify(picks.intents), JSON.stringify(picks.reactions), contact, picks.v31 ? JSON.stringify(picks.v31) : null]);
  await insertBooking(db, { planId: id, requesterId: seatId, budget: body.booking.budget_band, hours: body.booking.window_hours, requests, surprise, constraints });
  await db.query('COMMIT');
  return { plan_id: id, seat_key: seatKey, share_url: `${origin}/app/?shared=${shareToken}` };
}

export async function sharedView({ db, token }) {
  valid(shareTokenPattern.test(token));
  const { rows: [plan] } = await db.query("SELECT * FROM plans WHERE share_token=$1 AND mode='solo'", [token]);
  if (!plan) fail(404, 'not_found');
  const { rows: [planner] } = await db.query("SELECT display_name FROM participants WHERE plan_id=$1 AND role='initiator'", [plan.id]);
  const { rows: [booking] } = await db.query("SELECT status, venues, requests, surprise FROM bookings WHERE plan_id=$1 AND status<>'cancelled' ORDER BY created_at DESC LIMIT 1", [plan.id]);
  const night = NIGHTS_POOL.find(n => n.id === plan.confirmed_night_id);
  return {
    from: planner?.display_name ?? null,
    night: night ? { id: night.id, name: night.name, reasonLine: night.reasonLine, defaultImage: night.defaultImage } : null,
    stops: stopNames(plan.stops, night),
    timing: plan.timing,
    status: booking?.status === 'booked' ? 'booked' : booking ? 'booking' : 'planned',
    venues: booking?.status === 'booked' ? booking.venues : [],
    requests: booking && !booking.surprise && booking.requests ? booking.requests : null
  };
}
