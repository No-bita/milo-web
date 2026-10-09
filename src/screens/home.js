import { store } from '../domain/store.js';
import { homeSummary } from '../logic/home.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function planCard(summary, state) {
  const timing = summary.nightId ? timingForNight(summary.nightId, { solo: summary.kind === 'draft' }) : null;
  const when = timing ? timingLabel(timing) : 'Time not set yet';
  const label = summary.kind === 'draft' ? 'YOUR DRAFT' : 'THIS WEEK';
  return `<section class="milo-home-card" aria-label="Your plan">
    <p class="milo-home-label">${label}</p>
    <h2 class="milo-home-plan">${escape(summary.planName)}</h2>
    <p class="milo-home-when">${escape(when)}</p>
    <div class="milo-home-card-foot">
      <span>${escape(summary.planStatus)}</span>
      <button class="milo-home-link" type="button" id="miloHomeOpen">${summary.action === 'open-waiting' ? 'See invite' : 'Open plan'} <span aria-hidden="true">›</span></button>
    </div>
  </section>`;
}

export function renderHome(sessionId = 'aarav') {
  const state = store.getState();
  const summary = homeSummary(state);
  const fresh = summary.kind === 'fresh';
  const partner = escape(summary.partner);
  const headline = fresh ? 'Nothing planned yet' : `Your night with ${partner}`;
  const lead = fresh ? '<p class="milo-home-lead">Pick a mood and Milo does the rest.</p>' : '';
  const body = fresh
    ? `<section class="milo-home-card milo-home-card-empty" aria-label="Your plan"><p>No night on the calendar this week.</p></section>
       <div class="milo-home-row"><span class="milo-home-avatar milo-home-avatar-plus" aria-hidden="true">+</span><div><b>Invite your person</b><span>Plan together. Both of you say yes.</span></div></div>`
    : `${planCard(summary, state)}
       <div class="milo-home-row"><span class="milo-home-avatar" aria-hidden="true">${escape(summary.partner.charAt(0).toUpperCase())}</span><div><b>${partner}</b><span>${escape(summary.partnerStatus)}</span></div></div>`;
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <p class="milo-home-greet">${greeting()}</p>
      <h1 class="milo-headline milo-home-headline">${headline}</h1>
      ${lead}
      ${body}
    </div>
    ${renderTabBar('home')}
  </div>`;
}

export function attachHomeListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  const summary = homeSummary(store.getState());
  container.querySelector('#miloHomeOpen')?.addEventListener('click', () => {
    if (summary.action === 'open-waiting') store.setSessionScreen(sessionId, 's4_waiting');
    else store.updateSession(sessionId, { screen: 's7', activeNightId: summary.nightId });
  });
}
