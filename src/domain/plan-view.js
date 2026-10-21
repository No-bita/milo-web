// Phase 1 together mode: once this phone holds a server seat, the server's plan
// view is the source of truth for the shared result, the suggestion and the
// confirmation. Local synthesis stays as the fallback for everything without a
// seat (solo, flag off, demo links). Contract: docs/phase1-server.md (#67).
import { store } from './store.js';
import { api, readSeat, isPhase1Enabled } from './network-adapter.js';
import { watchWaiting } from './waiting-updates.js';
import { NIGHTS_POOL } from '../data/mockData.js';

export const hasServerSeat = () => isPhase1Enabled() && Boolean(readSeat());

// Server roles map to the local session ids: the initiator's phone is session A,
// the invited partner's phone is session B.
export const roleSession = (role) => (role === 'partner' ? 'sneha' : 'aarav');
const mySession = (seat) => (seat?.role === 'partner' ? 'sneha' : 'aarav');

// One read of the plan into the store. Never throws; callers poll on a timer.
// Completed actions bump the sequence so a slow GET that started earlier cannot
// overwrite their fresher view; a seat change mid-flight drops the response too.
let actionSeq = 0;

export async function refreshPlan() {
  const seat = readSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const seqAtStart = actionSeq;
  const result = await api('GET', `/api/plans/${seat.planId}`, { seatKey: seat.seatKey, timeoutMs: 15000 });
  if (!result.ok) return result;
  const seatNow = readSeat();
  if (!seatNow || seatNow.planId !== seat.planId || seatNow.seatKey !== seat.seatKey) return { ok: false, reason: 'seat_changed' };
  if (actionSeq !== seqAtStart) return { ok: false, reason: 'stale_after_action' };
  applyPlanView(result.data, seat);
  return result;
}

// Suggest and "This is our night" go through the server so both phones always
// see the same state. The actions response is the same plan view as a GET.
export async function postPlanAction(type, nightId) {
  const seat = readSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await api('POST', `/api/plans/${seat.planId}/actions`, { body: { type, night_id: nightId }, seatKey: seat.seatKey, timeoutMs: 15000 });
  if (result.ok) {
    const seatNow = readSeat();
    if (!seatNow || seatNow.planId !== seat.planId) return { ok: false, reason: 'seat_changed' };
    applyPlanView(result.data, seat);
    actionSeq += 1;
  }
  return result;
}

export function applyPlanView(view, seat = readSeat()) {
  // Write only real changes: every emit re-renders, and the pollers call this
  // on a timer, so an unconditional write would loop render -> check -> render.
  const current = store.getState().shared;
  const patch = {};
  const status = view.status ?? null;
  if (status !== (current.planStatus ?? null)) patch.planStatus = status;
  // The result computes once and is never recomputed (parked in the contract),
  // so the first arrival is the only write.
  // The result belongs to its plan: a persisted or late-arriving result from
  // an older plan must not block the current plan's own result from landing.
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
  if (Object.keys(patch).length) store.updateShared(patch);
  // The other seat's typed name is the only name this phone can trust for them.
  const otherName = view.partner?.display_name;
  if (otherName) {
    const mine = mySession(seat);
    const current = store.getState();
    const myData = mine === 'sneha' ? current.sessionB : current.sessionA;
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
  if (!isPhase1Enabled() || !seat) return null;
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

// Which together-mode waiting screen (if any) replaces this phone's current
// screen: no server result yet -> "sealed" for both seats; my suggestion is
// still unanswered -> "suggested" (mockup 07). Anything else renders normally.
export function togetherWaitMode(state, sessionId) {
  if (!hasServerSeat()) return null;
  const session = sessionId === 'sneha' ? state.sessionB : state.sessionA;
  if (!['s5', 's6', 's7'].includes(session?.screen)) return null;
  if (!currentPlanResult(state)) return 'sealed';
  if (session.screen === 's7' && state.shared.suggestion?.by === sessionId && !state.shared.confirmedNightId) return 'suggested';
  return null;
}

// Quiet plan polling for the content screens (s5/s6/s7 with a result): this is
// how one phone sees the other's suggestion or confirmation land. Same v2
// cadence as the waiting screens, same per-plan ten-minute budget, no UI here.
const quietBudgets = new Map(); // plan id -> budget start, shared with the waiting screens' map by key prefix
let quietWatch = null;

export function ensureQuietPlanWatch(screen) {
  const seat = readSeat();
  if (!isPhase1Enabled() || !seat) return;
  const key = `${seat.planId}:${screen}`;
  if (quietWatch?.key === key) return;
  quietWatch?.dispose();
  if (!quietBudgets.has(seat.planId)) quietBudgets.set(seat.planId, Date.now());
  const watcher = watchWaiting({
    startedAt: quietBudgets.get(seat.planId),
    check: async () => { await refreshPlan(); },
    onState: () => {}
  });
  quietWatch = { key, dispose: () => watcher.dispose() };
}

export function stopQuietPlanWatch() {
  quietWatch?.dispose();
  quietWatch = null;
}

// The waiting screens share the same per-plan budget through this map.
export const planBudgets = quietBudgets;
