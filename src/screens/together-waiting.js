// Together-mode waiting screens (Phase 1 only, this phone holds a server seat).
// "sealed": the shared result isn't computed yet - either seat can finish first.
// "suggested" (mockup 07): my suggestion is with the other phone, unanswered.
// Both poll the plan every 5s, then every 30s, stopping after ten minutes.
// A manual check or returning from another app still performs one check.
import '../styles/together-waiting.css';
import { store } from '../domain/store.js';
import { partnerLabel, hasPartnerName, sentenceName } from '../logic/partner.js';
import { watchWaiting } from '../domain/waiting-updates.js';
import { isPhase1Enabled, readSeat } from '../domain/network-adapter.js';
import { refreshPlan, planBudgets } from '../domain/plan-view.js';

// Only the phone that created the plan, with a real server seat, and only with the launch flag.
export const isTogetherInitiator = () => isPhase1Enabled() && readSeat()?.role === 'initiator';

// The other person's name as this seat should see it (partnerLabel is per-seat).
const otherName = (state, sessionId) => {
  const label = partnerLabel(state, sessionId);
  return hasPartnerName(label) ? sentenceName(label) : 'your person';
};

const COPY = {
  sealed: {
    title: () => 'Sealed.',
    sub: (name) => `Your half is locked in. Waiting on ${name} to finish theirs.`
  },
  suggested: {
    title: (name) => `Your pick is with ${name}`,
    sub: (name) => (name === 'your person' ? 'Their' : `${name}'s`) + ' answer shows up here.'
  }
};

export function renderTogetherWaiting(sessionId = 'aarav', mode = 'sealed') {
  const name = otherName(store.getState(), sessionId);
  const possessive = name === 'your person' ? "your person's" : `${name}'s`;
  const copy = COPY[mode] || COPY.sealed;
  return `<div class="milo-booked milo-together-wait" data-session-id="${sessionId}" data-mode="${mode}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body milo-together-body">
      <div class="milo-together-seal" aria-hidden="true"><span>m.</span></div>
      <h1 class="milo-booked-title" id="miloTwTitle">${copy.title(name)}</h1>
      <p class="milo-booked-sub" id="miloTwSub">${copy.sub(name)}</p>
      <p class="milo-together-status" id="miloTwStatus" role="status" aria-live="polite"><i aria-hidden="true"></i><span>Keeping an eye out</span></p>
    </div>
    <div class="milo-booked-cta">
      <button class="milo-pill-btn-secondary" type="button" id="miloTwCheck">Check now</button>
      <p class="milo-together-note" id="miloTwNote">It updates on its own.</p>
    </div>
    <span hidden data-possessive="${possessive}"></span>
    <span hidden data-name="${name}"></span>
  </div>`;
}

let active = null;
const stop = () => { active?.dispose(); active = null; };

export function attachTogetherWaitingListeners(container, sessionId = 'aarav', mode = 'sealed') {
  stop();
  const root = container.querySelector('.milo-together-wait');
  const seat = readSeat();
  if (!root || !seat) return;
  if (!planBudgets.has(seat.planId)) planBudgets.set(seat.planId, Date.now());
  const budgetStart = planBudgets.get(seat.planId);
  const el = (id) => root.querySelector(`#${id}`);
  const possessive = root.querySelector('[data-possessive]').dataset.possessive;
  const name = root.querySelector('[data-name]').dataset.name;
  const copy = COPY[mode] || COPY.sealed;

  // One check: read the plan into the store. A phone still on the invite wait
  // moves on to the shared picture by itself once the result exists; on later
  // screens the store update alone re-renders this phone out of waiting.
  const check = async () => {
    const result = await refreshPlan();
    if (!root.isConnected) return; // the screen was replaced while the request was in flight
    if (!result.ok) throw new Error(result.reason);
    const state = store.getState();
    const session = sessionId === 'sneha' ? state.sessionB : state.sessionA;
    if (state.shared.serverResult && session.screen === 's4_waiting') {
      store.setSessionScreen(sessionId, 's5');
    }
  };

  let sawResult = false;
  const watcher = watchWaiting({
    startedAt: budgetStart,
    check: async () => { await check(); sawResult = true; },
    onState: ({ paused, checking, error }) => {
      if (!root.isConnected) { stop(); return; }
      root.classList.toggle('is-paused', paused);
      el('miloTwTitle').textContent = paused ? `Still quiet on ${possessive} side` : copy.title(name);
      el('miloTwSub').textContent = paused
        ? 'We stopped checking so your battery gets a break. Nothing is lost.'
        : copy.sub(name);
      el('miloTwCheck').textContent = paused ? 'Check again' : 'Check now';
      el('miloTwCheck').className = paused ? 'milo-pill-btn-primary' : 'milo-pill-btn-secondary';
      el('miloTwNote').textContent = paused ? 'Coming back from WhatsApp also checks once.' : 'It updates on its own.';
      el('miloTwStatus').querySelector('span').textContent = error ? "Couldn't reach Milo. Trying again."
        : paused ? (sawResult && !checking ? 'Nothing new yet.' : '')
        : 'Keeping an eye out';
    }
  });
  active = watcher;
  el('miloTwCheck').addEventListener('click', () => watcher.checkNow());
}
