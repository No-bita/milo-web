import { homeSummary } from '../logic/home.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { store } from '../domain/store.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Minimal Nights view: the current plan under Upcoming. Past nights stay empty until history exists.
export function renderNights(sessionId = 'aarav') {
  const summary = homeSummary(store.getState());
  const upcoming = summary.kind === 'fresh'
    ? '<p class="milo-nights-empty">Nothing coming up yet.</p>'
    : (() => {
        const timing = summary.nightId ? timingForNight(summary.nightId, { solo: summary.kind === 'draft' }) : null;
        return `<button type="button" class="milo-nights-item" id="miloNightsOpen"><b>${escape(summary.planName)}</b><span>${escape(timing ? timingLabel(timing) : 'Time not set yet')}</span><span>${escape(summary.planStatus)}</span></button>`;
      })();
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">Nights</h1>
      <p class="milo-home-label milo-nights-heading">UPCOMING</p>${upcoming}
      <p class="milo-home-label milo-nights-heading">PAST</p><p class="milo-nights-empty">Nothing here yet. The good ones go here.</p>
    </div>
    ${renderTabBar('nights')}
  </div>`;
}

export function attachNightsListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  const summary = homeSummary(store.getState());
  container.querySelector('#miloNightsOpen')?.addEventListener('click', () => {
    if (summary.action === 'open-waiting') store.setSessionScreen(sessionId, 's4_waiting');
    else store.updateSession(sessionId, { screen: 's7', activeNightId: summary.nightId });
  });
}
