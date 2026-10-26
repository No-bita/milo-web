// Gifting V1 (Phase 1: Together plans, and solo plans once handed to Milo). The
// server decides what each phone may see (giver-only details, timed reveals); this
// module only fetches that view and keeps it in shared state. Reads run on app open and
// on return to the tab, like the plan itself: no timers, no polling.
import { store } from './store.js';
import { api, readSeat, isPhase1Enabled } from './network-adapter.js';
import { soloSeatFor } from './solo.js';
import { hasServerSeat } from './plan-view.js';

function applyGiftsView(view, planId) {
  const current = store.getState().shared;
  if (current.giftsPlanId === planId && JSON.stringify(current.gifts) === JSON.stringify(view)) return;
  store.updateShared({ gifts: view, giftsPlanId: planId });
}

// Which plan gifts belong to on this phone. Together: the server seat (either role).
// Solo: the solo plan's own seat, once that night has been handed to Milo. The
// server already accepts gifts on a confirmed solo plan; only physical gifts are
// offered there, because the other person has no Milo screen to read notes on.
export function giftSeat(state = store.getState()) {
  const together = readSeat();
  if (hasServerSeat() && together && (together.role === 'partner' || state.sessionA.planningMode !== 'solo')) return { ...together, solo: false };
  if (!isPhase1Enabled()) return null;
  const solo = soloSeatFor(state.sessionA.savedSoloNightId);
  return solo ? { planId: solo.planId, seatKey: solo.seatKey, solo: true } : null;
}

// The gifts view belongs to the seat's plan; anything older is ignored.
export function currentGifts(state = store.getState()) {
  const seat = giftSeat(state);
  if (!seat || state.shared.giftsPlanId !== seat.planId) return null;
  return state.shared.gifts || null;
}

async function call(method, suffix = '', body) {
  const seat = giftSeat();
  if (!seat) return { ok: false, reason: 'no_seat' };
  const result = await api(method, `/api/plans/${seat.planId}/gifts${suffix}`, { body, seatKey: seat.seatKey });
  if (result.ok && giftSeat()?.planId === seat.planId) applyGiftsView(result.data, seat.planId);
  return result;
}

export function refreshGifts() {
  const seat = giftSeat();
  if (!seat) return Promise.resolve({ ok: false, reason: 'no_seat' });
  if (!seat.solo && !store.getState().shared.confirmedNightId) return Promise.resolve({ ok: false, reason: 'not_ready' });
  return call('GET');
}
// Failures carry `code` from the server: limit, too_soon, locked, not_ready.
export const addGift = (body) => call('POST', '', body);
export const removeGift = (id) => call('DELETE', `/${encodeURIComponent(id)}`);
