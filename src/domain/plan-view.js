// Phase 1 together mode: once this phone holds a server seat, the server's plan
// view is the source of truth for the shared result, the suggestion, the
// confirmation and the partner's progress. Local synthesis stays the fallback
// without a seat (solo, flag off, demo links). Contract: docs/phase1-server.md (#67).
// Reads run on app open and on return to the tab only - no timers, no polling.
import { store } from './store.js';
import { api, readSeat, isPhase1Enabled } from './network-adapter.js';
import { NIGHTS_POOL } from '../data/mockData.js';

export const hasServerSeat = () => isPhase1Enabled() && !store.getState().sessionA.localOnlyPlan && Boolean(readSeat());

// Server roles map to the local session ids: the initiator's phone is session A,
// the invited partner's phone is session B.
export const roleSession = (role) => (role === 'partner' ? 'sneha' : 'aarav');
const mySession = (seat) => (seat?.role === 'partner' ? 'sneha' : 'aarav');

// A slow request must not hang the screen: race the call with a quiet timeout and
// treat an over-run as unreachable (the same handling as a network error).
const PLAN_TIMEOUT_MS = 15000;
const withTimeout = (promise) => Promise.race([
  promise,
  new Promise(resolve => setTimeout(() => resolve({ ok: false, reason: 'unreachable' }), PLAN_TIMEOUT_MS))
]);

// Completed actions bump the sequence so a slow GET that started earlier cannot
// overwrite their fresher view; a seat change mid-flight drops the response too.
let actionSeq = 0;
// Overlapping reads (visibilitychange and focus can fire together) resolve out
// of order: apply only the newest GET's response so an older snapshot cannot
// overwrite a newer one.
let getSeq = 0;

export async function refreshPlan() {
  if (store.getState().sessionA.localOnlyPlan) return { ok: false, reason: 'local_plan' };
  const seat = readSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const seqAtStart = actionSeq;
  const getAtStart = ++getSeq;
  const result = await withTimeout(api('GET', `/api/plans/${seat.planId}`, { seatKey: seat.seatKey }));
  if (!result.ok) return result;
  const seatNow = readSeat();
  if (store.getState().sessionA.localOnlyPlan) return { ok: false, reason: 'local_plan' };
  if (!seatNow || seatNow.planId !== seat.planId || seatNow.seatKey !== seat.seatKey) return { ok: false, reason: 'seat_changed' };
  if (actionSeq !== seqAtStart) return { ok: false, reason: 'stale_after_action' };
  if (getSeq !== getAtStart) return { ok: false, reason: 'superseded_get' };
  applyPlanView(result.data, seat);
  return result;
}

// Suggest and "This is our night" go through the server so both phones always
// see the same state. The actions response is the same plan view as a GET.
export async function postPlanAction(type, nightId) {
  const seat = readSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await withTimeout(api('POST', `/api/plans/${seat.planId}/actions`, { body: { type, night_id: nightId }, seatKey: seat.seatKey }));
  if (result.ok) {
    const seatNow = readSeat();
    if (!seatNow || seatNow.planId !== seat.planId) return { ok: false, reason: 'seat_changed' };
    applyPlanView(result.data, seat);
    actionSeq += 1;
  }
  return result;
}

// Setting the agreed time goes through the same actions route so the partner's
// phone picks it up on its next refresh. The server accepts date/time/time_zone
// only; the response is the same plan view as a GET.
export async function postPlanTiming(timing) {
  const seat = readSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await withTimeout(api('POST', `/api/plans/${seat.planId}/actions`, { body: { type: 'set_time', timing: { date: timing.date, time: timing.time, time_zone: timing.timeZone } }, seatKey: seat.seatKey }));
  if (result.ok) {
    const seatNow = readSeat();
    if (!seatNow || seatNow.planId !== seat.planId) return { ok: false, reason: 'seat_changed' };
    applyPlanView(result.data, seat);
    actionSeq += 1;
  }
  return result;
}

export function applyPlanView(view, seat = readSeat()) {
  // Write only real changes: every emit re-renders, so an unconditional write
  // would loop render -> check -> render.
  const current = store.getState().shared;
  const patch = {};
  const status = view.status ?? null;
  if (status !== (current.planStatus ?? null)) patch.planStatus = status;
  // The result computes once and is never recomputed (parked in the contract), so
  // the first arrival is the only write. It also belongs to its plan: a persisted
  // or late result from an older plan must not block this plan's own result.
  if (view.shared_result && (!current.serverResult || current.serverResultPlanId !== seat.planId)) {
    patch.serverResult = view.shared_result;
    patch.serverResultPlanId = seat.planId;
  }
  const suggestion = view.suggestion
    ? { by: roleSession(view.suggestion.by), nightId: view.suggestion.night_id }
    : null;
  if (JSON.stringify(suggestion) !== JSON.stringify(current.suggestion ?? null)) patch.suggestion = suggestion;
  const confirmed = view.confirmed_night_id || null;
  if (confirmed !== (current.confirmedNightId ?? null)) patch.confirmedNightId = confirmed;
  // The agreed time rides the same view so both phones display, share and attach
  // the same plan time. The server stores date/time/time_zone only; the night id
  // comes from the confirmation and startAt is recomputed on this device.
  const timing = view.timing && view.confirmed_night_id
    ? { version: 1, nightId: view.confirmed_night_id, date: view.timing.date, time: view.timing.time,
        timeZone: view.timing.time_zone, startAt: new Date(`${view.timing.date}T${view.timing.time}:00`).toISOString() }
    : null;
  if (JSON.stringify(timing) !== JSON.stringify(current.timing ?? null)) patch.timing = timing;
  // Partner progress powers the small status line on the creator's plan screen.
  const partnerJoined = Boolean(view.partner?.display_name);
  if (partnerJoined !== Boolean(current.partnerJoined)) patch.partnerJoined = partnerJoined;
  const partnerFinished = Boolean(view.partner?.finished);
  if (partnerFinished !== Boolean(current.partnerFinished)) patch.partnerFinished = partnerFinished;
  if (Object.keys(patch).length) store.updateShared(patch);
  // The other seat's typed name is the only name this phone can trust for them.
  const otherName = view.partner?.display_name;
  if (otherName) {
    const mine = mySession(seat);
    const live = store.getState();
    const myData = mine === 'sneha' ? live.sessionB : live.sessionA;
    if (myData.partnerName !== otherName) {
      store.updateSession(mine, { partnerName: otherName });
      store.updateSession(mine === 'sneha' ? 'aarav' : 'sneha', { name: otherName });
    }
  }
}

// The server's shared_result projection, shaped the way the screens already
// expect. Night records are public static data; the static list fills anything
// the projection leaves out, keyed by id, with the server's fields winning.
// The persisted result counts only for the seat this phone currently holds;
// anything older falls back to the local synthesis.
export function currentPlanResult(state) {
  const seat = readSeat();
  if (!hasServerSeat() || !seat) return null;
  const result = state.shared.serverResult;
  if (!result || state.shared.serverResultPlanId !== seat.planId) return null;
  return result;
}

export function togetherOutput(state) {
  const result = currentPlanResult(state);
  if (!result) return null;
  return {
    sharedRows: result.sharedRows || [],
    difference: result.difference || null,
    bridgeSentence: result.bridgeSentence || '',
    selectedNights: (result.selectedNights || []).map(item => ({
      num: item.num,
      fitLine: item.fitLine,
      whyItWorks: item.whyItWorks,
      night: { ...(NIGHTS_POOL.find(night => night.id === item.night?.id) || {}), ...(item.night || {}) }
    }))
  };
}
