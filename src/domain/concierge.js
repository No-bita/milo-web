// Concierge booking handover + post-date check-in (Phase 1 together mode).
// The server decides what each phone sees; this keeps that view in shared
// state for the agreed screen. Reads run on app open / return to the tab.
import { store } from './store.js';
import { api, readSeat } from './network-adapter.js';
import { hasServerSeat } from './plan-view.js';

function apply(view, planId) {
  const current = store.getState().shared;
  if (current.conciergePlanId === planId && JSON.stringify(current.concierge) === JSON.stringify(view)) return;
  store.updateShared({ concierge: view, conciergePlanId: planId });
}

export function currentConcierge(state = store.getState()) {
  const seat = readSeat();
  if (!hasServerSeat() || !seat || state.shared.conciergePlanId !== seat.planId) return null;
  return state.shared.concierge || null;
}

async function call(method, path, body) {
  const seat = readSeat();
  if (!hasServerSeat() || !seat) return { ok: false, reason: 'no_seat' };
  const result = await api(method, `/api/plans/${seat.planId}/${path}`, { body, seatKey: seat.seatKey });
  if (result.ok && path !== 'events' && readSeat()?.planId === seat.planId) apply(result.data, seat.planId);
  return result;
}

export function refreshConcierge() {
  if (!store.getState().shared.confirmedNightId) return Promise.resolve({ ok: false, reason: 'not_ready' });
  return call('GET', 'booking');
}
// Failures carry `code`: exists, locked, not_ready.
export const requestBooking = (body) => call('POST', 'booking', body);
export const cancelBooking = () => call('DELETE', 'booking');
export const sendCheckin = (body) => call('POST', 'checkin', body);
// PMF: a tap on "See the other two" while choosing between Milo's nights. Fire and forget.
export function trackSeeOther(nightId) {
  if (!hasServerSeat()) return;
  call('POST', 'events', { type: 'see_other', ...(nightId ? { night_id: nightId } : {}) }).catch(() => {});
}
