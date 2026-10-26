// Gifting V1 (Phase 1 together mode). The server decides what each phone may
// see (giver-only details, timed reveals); this module only fetches that view
// and keeps it in shared state for the agreed screen. Reads run on app open and
// on return to the tab, like the plan itself: no timers, no polling.
import { store } from './store.js';
import { api, readSeat } from './network-adapter.js';
import { hasServerSeat } from './plan-view.js';

function applyGiftsView(view, planId) {
  const current = store.getState().shared;
  if (current.giftsPlanId === planId && JSON.stringify(current.gifts) === JSON.stringify(view)) return;
  store.updateShared({ gifts: view, giftsPlanId: planId });
}

// The gifts view belongs to the seat's plan; anything older is ignored.
export function currentGifts(state = store.getState()) {
  const seat = readSeat();
  if (!hasServerSeat() || !seat || state.shared.giftsPlanId !== seat.planId) return null;
  return state.shared.gifts || null;
}

async function call(method, suffix = '', body) {
  const seat = readSeat();
  if (!hasServerSeat() || !seat) return { ok: false, reason: 'no_seat' };
  const result = await api(method, `/api/plans/${seat.planId}/gifts${suffix}`, { body, seatKey: seat.seatKey });
  if (result.ok && readSeat()?.planId === seat.planId) applyGiftsView(result.data, seat.planId);
  return result;
}

export function refreshGifts() {
  if (!store.getState().shared.confirmedNightId) return Promise.resolve({ ok: false, reason: 'not_ready' });
  return call('GET');
}
// Failures carry `code` from the server: limit, too_soon, locked, not_ready.
export const addGift = (body) => call('POST', '', body);
export const removeGift = (id) => call('DELETE', `/${encodeURIComponent(id)}`);
