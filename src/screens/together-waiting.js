// Together-mode waiting screen for the person who invited (Phase 1 only). It checks the plan while it
// is open: every 5s, then every 30s, stopping after ten minutes. Returning to the tab checks once.
import '../styles/together-waiting.css';
import { store } from '../domain/store.js';
import { partnerLabel, hasPartnerName, sentenceName } from '../logic/partner.js';
import { watchWaiting } from '../domain/waiting-updates.js';
import { api, readSeat, isPhase1Enabled } from '../domain/network-adapter.js';

// Only the phone that created the plan, with a real server seat, and only with the launch flag.
export const isTogetherInitiator = () => isPhase1Enabled() && readSeat()?.role === 'initiator';

const who = (state) => {
  const label = partnerLabel(state);
  return hasPartnerName(label) ? sentenceName(label) : 'your person';
};

export function renderTogetherWaiting(sessionId = 'aarav') {
  const name = who(store.getState());
  const possessive = name === 'your person' ? "your person's" : `${name}'s`;
  return `<div class="milo-booked milo-together-wait" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body milo-together-body">
      <div class="milo-together-seal" aria-hidden="true"><span>m.</span></div>
      <h1 class="milo-booked-title" id="miloTwTitle">Sealed.</h1>
      <p class="milo-booked-sub" id="miloTwSub">Your half is locked in. Waiting on ${name} to finish theirs.</p>
      <p class="milo-together-status" id="miloTwStatus" role="status" aria-live="polite"><i aria-hidden="true"></i><span>Keeping an eye out</span></p>
    </div>
    <div class="milo-booked-cta">
      <button class="milo-pill-btn-secondary" type="button" id="miloTwCheck">Check now</button>
      <p class="milo-together-note" id="miloTwNote">Leave this open and it updates on its own.</p>
    </div>
    <span hidden data-possessive="${possessive}"></span>
  </div>`;
}

let active = null;
const budgets = new Map(); // plan id -> ten-minute budget start, so a remount keeps the same plan's budget
const stop = () => { active?.dispose(); active = null; };

export function attachTogetherWaitingListeners(container) {
  stop();
  const root = container.querySelector('.milo-together-wait');
  const seat = readSeat();
  if (!root || !seat) return;
  if (!budgets.has(seat.planId)) budgets.set(seat.planId, Date.now());
  const budgetStart = budgets.get(seat.planId);
  const el = (id) => root.querySelector(`#${id}`);
  const possessive = root.querySelector('[data-possessive]').dataset.possessive;
  const name = possessive.replace(/'s$/, '');

  // One check: read the plan. A finished partner moves this phone on to the "done" screen.
  const check = async () => {
    const result = await api('GET', `/api/plans/${seat.planId}`, { seatKey: seat.seatKey, timeoutMs: 15000 });
    if (!root.isConnected) return; // the screen was replaced while the request was in flight
    if (!result.ok) throw new Error(result.reason);
    const partner = result.data?.partner;
    if (partner?.display_name && partner.display_name !== store.getState().sessionA.partnerName) {
      store.updateSession('aarav', { partnerName: partner.display_name });
    }
    if (partner?.finished) store.updateSession('sneha', { screen: 's5' });
  };

  let sawResult = false;
  const watcher = watchWaiting({
    startedAt: budgetStart,
    check: async () => { await check(); sawResult = true; },
    onState: ({ paused, checking, error }) => {
      if (!root.isConnected) { stop(); return; }
      root.classList.toggle('is-paused', paused);
      el('miloTwTitle').textContent = paused ? `Still quiet on ${possessive} side` : 'Sealed.';
      el('miloTwSub').textContent = paused
        ? 'We stopped checking so your battery gets a break. Nothing is lost.'
        : `Your half is locked in. Waiting on ${name} to finish theirs.`;
      el('miloTwCheck').textContent = paused ? 'Check again' : 'Check now';
      el('miloTwCheck').className = paused ? 'milo-pill-btn-primary' : 'milo-pill-btn-secondary';
      el('miloTwNote').textContent = paused ? 'Coming back from WhatsApp also checks once.' : 'Leave this open and it updates on its own.';
      el('miloTwStatus').querySelector('span').textContent = error ? "Couldn't reach Milo. Trying again."
        : paused ? (sawResult && !checking ? 'Nothing new yet.' : '')
        : 'Keeping an eye out';
    }
  });
  active = watcher;
  el('miloTwCheck').addEventListener('click', () => watcher.checkNow());
}
