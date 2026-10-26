// Solo plans on the server (Phase 1 flag on). Kept apart from the Together seat
// (milo_phase1_seat_v1) on purpose: holding a solo seat must never switch the
// app into Together screens. Contract: docs/phase1-server.md "Solo plans".
import { store } from './store.js';
import { api, isPhase1Enabled, cleanName, serverOccasion } from './network-adapter.js';
import { computePlanningOutput } from '../logic/planning.js';

const SOLO_SEAT = 'milo_solo_seat_v1';

export function readSoloSeat() {
  try {
    const seat = JSON.parse(localStorage.getItem(SOLO_SEAT));
    return seat && seat.planId && seat.seatKey ? seat : null;
  } catch { return null; }
}
const saveSoloSeat = (seat) => { try { localStorage.setItem(SOLO_SEAT, JSON.stringify(seat)); } catch { /* offline cache */ } };
export const clearSoloSeat = () => { try { localStorage.removeItem(SOLO_SEAT); } catch { /* ignore */ } };

// The seat belongs to the saved night it booked; a new draft starts clean.
export function soloSeatFor(nightId) {
  const seat = readSoloSeat();
  return seat && seat.nightId === nightId ? seat : null;
}

// Kept on the planner's session with the night it belongs to, so a later draft
// of a different night never shows an old booking.
function applyView(view) {
  const a = store.getState().sessionA;
  const next = { ...view, nightId: a.savedSoloNightId };
  if (JSON.stringify(a.soloBooking) === JSON.stringify(next)) return;
  store.updateSession('aarav', { soloBooking: next });
}
export const currentSoloBooking = (state = store.getState()) =>
  state.sessionA.soloBooking?.nightId === state.sessionA.savedSoloNightId ? state.sessionA.soloBooking : null;

// Everything the server needs to book a solo night, from the planner's own state.
export function soloPayload(state, booking) {
  const a = state.sessionA;
  const nightId = a.savedSoloNightId;
  const nights = computePlanningOutput(state, 'aarav').selectedNights;
  const rank = nights.findIndex(item => item.night.id === nightId) + 1;
  const item = nights.find(i => i.night.id === nightId);
  const overrides = a.soloItineraryOverrides?.[nightId] || {};
  const stops = item ? item.night.beats.map((beat, i) => (overrides[i] || beat).name).filter(Boolean) : undefined;
  const timing = a.soloTimings?.[nightId];
  return {
    name: cleanName(a.name) || cleanName(String(a.user?.email || '').split('@')[0]) || 'Your date',
    ...(state.shared.occasion ? { occasion: serverOccasion(state.shared.occasion) } : {}),
    night_id: nightId,
    ...(rank ? { night_rank: rank } : {}),
    timing: { date: timing.date, time: timing.time, time_zone: timing.timeZone },
    ...(stops?.length ? { stops } : {}),
    intents: a.intents || [],
    reactions: (a.reactions || []).map(({ cardId, reaction }) => ({ cardId, reaction })),
    booking
  };
}

// Book: one call creates the solo plan and its booking request.
export async function bookSolo(booking) {
  const state = store.getState();
  const result = await api('POST', '/api/plans/solo', { body: soloPayload(state, booking) });
  if (!result.ok) return result;
  saveSoloSeat({ planId: result.data.plan_id, seatKey: result.data.seat_key, shareUrl: result.data.share_url, nightId: state.sessionA.savedSoloNightId });
  await refreshSolo();
  return result;
}

export async function refreshSolo() {
  if (!isPhase1Enabled()) return { ok: false, reason: 'off' };
  const seat = soloSeatFor(store.getState().sessionA.savedSoloNightId);
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await api('GET', `/api/plans/${seat.planId}/booking`, { seatKey: seat.seatKey });
  if (result.ok && soloSeatFor(store.getState().sessionA.savedSoloNightId)?.planId === seat.planId) applyView(result.data);
  return result;
}

async function call(method, path, body) {
  const seat = soloSeatFor(store.getState().sessionA.savedSoloNightId);
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await api(method, `/api/plans/${seat.planId}/${path}`, { body, seatKey: seat.seatKey });
  if (result.ok) applyView(result.data);
  return result;
}
export const sendSoloCheckin = (body) => call('POST', 'checkin', body);

export const fetchSharedPlan = (token) => api('GET', `/api/shared/${encodeURIComponent(token)}`);
