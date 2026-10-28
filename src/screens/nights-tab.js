import { homeSummary } from '../logic/home.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { store } from '../domain/store.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { pastNights, localToday, accountData, personName } from '../domain/account-api.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Past nights come from the accounts API (domain/account-api.js); empty while it is off.
function renderPast(state) {
  const past = pastNights(state, localToday());
  if (!past.length) return '<p class="milo-nights-empty">Nothing here yet. The good ones go here.</p>';
  const people = accountData(state).people;
  return past.map((n) => {
    const name = NIGHTS_POOL.find((night) => night.id === n.night_id)?.name || 'Your night';
    const person = people.find((p) => p.id === n.person_id);
    const who = n.mode === 'solo' ? 'Just you' : person ? `With ${personName(state, person)}` : 'Together';
    return `<div class="milo-nights-past"><b>${escape(name)}</b><span>${escape(timingLabel({ date: n.date, time: n.time }))}</span><span>${escape(who)} · ${n.status === 'booked' ? 'Booked' : 'Planned'}</span></div>`;
  }).join('');
}

// Minimal Nights view: the current plan under Upcoming, past nights from the account.
export function renderNights(sessionId = 'aarav') {
  const summary = homeSummary(store.getState());
  const upcoming = summary.kind === 'fresh'
    ? '<p class="milo-nights-empty">Nothing coming up yet.</p>'
    : (() => {
        const timing = summary.nightId ? timingForNight(summary.nightId, { solo: summary.kind === 'draft' || summary.kind === 'booked' }) : null;
        return `<button type="button" class="milo-nights-item" id="miloNightsOpen"><b>${escape(summary.planName)}</b><span>${escape(timing ? timingLabel(timing) : 'Time not set yet')}</span><span>${escape(summary.planStatus)}</span></button>`;
      })();
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">Nights</h1>
      <p class="milo-home-label milo-nights-heading">UPCOMING</p>${upcoming}
      <p class="milo-home-label milo-nights-heading">PAST</p>${renderPast(store.getState())}
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
