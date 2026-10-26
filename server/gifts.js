// Gifting V1 routes (Phase 1 server). Contract: docs/phase1-server.md, "Gifting".
//
// Privacy rule, same spirit as picks: gift DETAILS are only ever returned to
// the seat that gave them (and to the owner's ops list). The other seat gets:
//   - a teaser's text from 00:00 on the day before the night (plan time zone),
//   - a sealed note's text from the night's start time,
//   - a physical gift: nothing, or only `hint: true` when the giver allowed it.
//     Item, venue, address and card text are never sent to the recipient.
//   - memory lines: the other line only once both lines exist.
// Reveal times come from plans.timing at read time, so changing the time moves them.
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { fail, valid, keys } from './errors.js';
import { GIFT_KINDS, GIFT_ITEMS, GIFT_LIMITS, GIFT_STATUSES, DELIVERY_WINDOWS, giftItem } from '../src/data/gifts.js';
import { NIGHTS_POOL } from '../src/data/mockData.js';

const DAY = 86400000;
const giftIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Text fields: printable, no angle brackets (the app escapes anyway).
function text(value, min, max) {
  valid(typeof value === 'string');
  const result = value.trim();
  const length = [...result].length;
  valid(length >= min && length <= max && !/[\p{Cc}<>]/u.test(result.replace(/\n/g, '')));
  return result;
}

// WhatsApp number for the concierge: digits with optional +, spaces or dashes; 10-15 digits.
function phone(value) {
  valid(typeof value === 'string' && /^\+?[0-9 -]{10,20}$/.test(value.trim()));
  const digits = value.replace(/\D/g, '');
  valid(digits.length >= 10 && digits.length <= 15);
  return (value.trim().startsWith('+') ? '+' : '') + digits;
}

// Offset of an IANA zone at a UTC instant, in ms (local wall clock - UTC).
function zoneOffset(utcMs, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(utcMs)).map(p => [p.type, p.value]));
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - utcMs;
}
// Wall-clock date + time in a zone -> UTC ms (two passes settle DST edges).
export function zonedToUtc(date, time, timeZone) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  let utc = wall - zoneOffset(wall, timeZone);
  utc = wall - zoneOffset(utc, timeZone);
  return utc;
}

// When each digital gift opens for the recipient. null = no time set yet.
export function revealTimes(timing) {
  if (!timing?.date || !timing?.time || !timing?.time_zone) return null;
  const start = zonedToUtc(timing.date, timing.time, timing.time_zone);
  const dayBefore = zonedToUtc(timing.date, '00:00', timing.time_zone) - DAY;
  return { start, teaser: dayBefore };
}

// Whole calendar days from "today" (in the plan's zone) to the night's date.
function daysUntil(timing, now) {
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: timing.time_zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  return Math.round((Date.parse(`${timing.date}T00:00:00Z`) - Date.parse(`${todayParts}T00:00:00Z`)) / DAY);
}

function validateGift(body, plan, now) {
  keys(body, ['kind', 'item_id', 'stop_index', 'venue', 'address', 'deliver_window', 'note', 'show_hint', 'contact']);
  valid(typeof body.kind === 'string' && (GIFT_KINDS[body.kind] || body.kind === 'memory'));
  const kind = body.kind;
  const allowed = {
    moment_drop: ['kind', 'item_id', 'stop_index', 'venue', 'note', 'show_hint', 'contact'],
    home_delivery: ['kind', 'item_id', 'address', 'deliver_window', 'note', 'show_hint', 'contact'],
    sealed_note: ['kind', 'note', 'stop_index'],
    teaser: ['kind', 'note'],
    memory: ['kind', 'note']
  }[kind];
  keys(body, allowed);
  const gift = { kind, item_id: null, stop_index: null, venue: null, address: null, deliver_window: null, note: null, show_hint: false, contact: null };
  if (GIFT_KINDS[kind]?.physical) {
    const item = giftItem(body.item_id);
    valid(item && item.kinds.includes(kind));
    if (daysUntil(plan.timing, now) < item.leadDays) fail(409, 'too_soon');
    gift.item_id = item.id;
    gift.note = body.note === undefined || body.note === '' ? null : text(body.note, 1, 200);
    valid(body.show_hint === undefined || typeof body.show_hint === 'boolean');
    gift.show_hint = body.show_hint === true;
    gift.contact = phone(body.contact);
  }
  if (kind === 'moment_drop') {
    valid(Number.isInteger(body.stop_index) && body.stop_index >= 0 && body.stop_index <= 2);
    gift.stop_index = body.stop_index;
    gift.venue = text(body.venue, 2, 120);
  }
  if (kind === 'home_delivery') {
    gift.address = text(body.address, 10, 300);
    valid(Object.hasOwn(DELIVERY_WINDOWS, body.deliver_window));
    gift.deliver_window = body.deliver_window;
  }
  if (kind === 'sealed_note') {
    gift.note = text(body.note, 1, 500);
    valid(body.stop_index === undefined || body.stop_index === null || (Number.isInteger(body.stop_index) && body.stop_index >= 0 && body.stop_index <= 2));
    gift.stop_index = Number.isInteger(body.stop_index) ? body.stop_index : null;
  }
  if (kind === 'teaser') gift.note = text(body.note, 1, 140);
  if (kind === 'memory') gift.note = text(body.note, 1, 200);
  return gift;
}

const ownGift = g => ({
  id: g.id, kind: g.kind, item_id: g.item_id, stop_index: g.stop_index, venue: g.venue, address: g.address,
  deliver_window: g.deliver_window, note: g.note, show_hint: g.show_hint, status: g.status, created_at: g.created_at
});

// The ONLY projection of gifts sent to a seat. Explicit allowlists, no spreads.
export function giftsView(plan, people, me, gifts, now) {
  const other = people.find(p => p.id !== me.id);
  const times = revealTimes(plan.timing);
  const mine = gifts.filter(g => g.giver_id === me.id && g.kind !== 'memory').map(ownGift);
  const toMe = other ? gifts.filter(g => g.giver_id === other.id) : [];
  const forMe = [];
  for (const g of toMe) {
    if (!times) break;
    if (g.kind === 'teaser' && now >= times.teaser) forMe.push({ id: g.id, kind: 'teaser', note: g.note });
    if (g.kind === 'sealed_note' && now >= times.start) forMe.push({ id: g.id, kind: 'sealed_note', note: g.note, stop_index: g.stop_index });
  }
  // Locked digital gifts: the recipient may know a note exists, never its text.
  const sealedWaiting = times ? toMe.some(g => g.kind === 'sealed_note' && now < times.start) : false;
  const hint = toMe.some(g => GIFT_KINDS[g.kind]?.physical && g.show_hint && g.status !== 'cancelled');
  const myMemory = gifts.find(g => g.giver_id === me.id && g.kind === 'memory');
  const theirMemory = toMe.find(g => g.kind === 'memory');
  return {
    can_add: plan.status === 'confirmed' && Boolean(times),
    mine,
    for_me: forMe,
    sealed_waiting: sealedWaiting,
    hint,
    memory: {
      open: Boolean(times) && now >= times.start,
      mine: myMemory?.note ?? null,
      theirs: myMemory && theirMemory ? theirMemory.note : null
    },
    from: other?.display_name ?? null
  };
}

// Seat-authenticated: GET / POST /api/plans/:id/gifts, DELETE /api/plans/:id/gifts/:giftId.
// Called inside the handler's transaction with the plan row already locked.
export async function handleGifts({ db, plan, people, me, method, giftId, readBody, now }) {
  const load = async () => (await db.query('SELECT * FROM gifts WHERE plan_id=$1 ORDER BY created_at, id', [plan.id])).rows;
  if (method === 'GET' && !giftId) return giftsView(plan, people, me, await load(), now);
  if (method === 'POST' && !giftId) {
    const body = await readBody();
    if (plan.status !== 'confirmed' || !revealTimes(plan.timing)) fail(409, 'not_ready');
    const gift = validateGift(body, plan, now);
    if (gift.kind === 'memory' && now < revealTimes(plan.timing).start) fail(409, 'not_ready');
    const existing = (await load()).filter(g => g.giver_id === me.id);
    const physical = GIFT_KINDS[gift.kind]?.physical;
    const count = existing.filter(g => physical ? GIFT_KINDS[g.kind]?.physical && g.status !== 'cancelled' : g.kind === gift.kind).length;
    if (count >= (physical ? GIFT_LIMITS.physical : GIFT_LIMITS[gift.kind])) fail(409, 'limit');
    await db.query(`INSERT INTO gifts(id,plan_id,giver_id,kind,item_id,stop_index,venue,address,deliver_window,note,contact,show_hint,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [randomUUID(), plan.id, me.id, gift.kind, gift.item_id, gift.stop_index, gift.venue, gift.address, gift.deliver_window, gift.note, gift.contact, gift.show_hint, physical ? 'requested' : 'sent']);
    return giftsView(plan, people, me, await load(), now);
  }
  if (method === 'DELETE' && giftId) {
    valid(giftIdPattern.test(giftId));
    const { rows: [gift] } = await db.query('SELECT * FROM gifts WHERE id=$1 AND plan_id=$2 AND giver_id=$3', [giftId, plan.id, me.id]);
    if (!gift || gift.kind === 'memory') fail(404, 'not_found');
    const times = revealTimes(plan.timing);
    const locked = GIFT_KINDS[gift.kind].physical ? gift.status !== 'requested'
      : !times || now >= (gift.kind === 'teaser' ? times.teaser : times.start);
    if (locked) fail(409, 'locked');
    await db.query('DELETE FROM gifts WHERE id=$1', [gift.id]);
    return giftsView(plan, people, me, await load(), now);
  }
  return null;
}

// Owner-only fulfilment list. Authorization: Bearer OPS_SECRET (server env).
export function checkOpsSecret(request, env) {
  if (typeof env.OPS_SECRET !== 'string' || env.OPS_SECRET.length < 16) fail(503, 'unavailable');
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${env.OPS_SECRET}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) fail(401, 'unauthorized');
}

export async function handleOps({ db, method, giftId, readBody }) {
  if (method === 'GET' && !giftId) {
    const { rows } = await db.query(`SELECT g.*, p.timing, p.confirmed_night_id, giver.display_name AS giver_name,
        (SELECT r.display_name FROM participants r WHERE r.plan_id=g.plan_id AND r.id<>g.giver_id) AS recipient_name
      FROM gifts g JOIN plans p ON p.id=g.plan_id JOIN participants giver ON giver.id=g.giver_id
      WHERE g.kind IN ('moment_drop','home_delivery') ORDER BY g.created_at DESC LIMIT 200`);
    return {
      gifts: rows.map(g => {
        const night = NIGHTS_POOL.find(n => n.id === g.confirmed_night_id);
        return {
          id: g.id, kind: g.kind, item_id: g.item_id, item_name: GIFT_ITEMS.find(i => i.id === g.item_id)?.name ?? g.item_id,
          stop: g.stop_index === null ? null : night?.beats?.[g.stop_index]?.name ?? null,
          venue: g.venue, address: g.address, deliver_window: g.deliver_window, note: g.note, show_hint: g.show_hint,
          contact: g.contact, status: g.status, giver_name: g.giver_name, recipient_name: g.recipient_name, night_name: night?.name ?? null,
          timing: g.timing, created_at: g.created_at
        };
      })
    };
  }
  if (method === 'POST' && giftId) {
    valid(giftIdPattern.test(giftId));
    const body = await readBody(); keys(body, ['status']);
    valid(GIFT_STATUSES.includes(body.status));
    const { rows } = await db.query("UPDATE gifts SET status=$1, updated_at=now() WHERE id=$2 AND kind IN ('moment_drop','home_delivery') RETURNING id,status", [body.status, giftId]);
    if (!rows.length) fail(404, 'not_found');
    return { id: rows[0].id, status: rows[0].status };
  }
  return null;
}
