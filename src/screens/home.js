import { store } from '../domain/store.js';
import { homeSummary } from '../logic/home.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { renderOccasionGrid, attachOccasionGrid } from '../components/occasion-grid.js';
import { currentGifts } from '../domain/gifts.js';
import { NIGHTS_POOL } from '../data/mockData.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function resumeCard(summary) {
  return `<section class="milo-home-card" aria-label="Your plan in progress">
    <p class="milo-home-label">IN PROGRESS</p>
    <h2 class="milo-home-plan">Your night</h2>
    ${summary.ratedCount > 0 ? `<p class="milo-home-when">${summary.ratedCount} of 8 ideas rated</p>` : ''}
    <div class="milo-home-card-foot">
      <span>Picks saved on this phone</span>
      <button class="milo-home-link" type="button" id="miloHomeResume">Resume <span aria-hidden="true">&#8250;</span></button>
    </div>
  </section>`;
}

function planCard(summary, state) {
  const timing = summary.nightId ? timingForNight(summary.nightId, { solo: summary.kind === 'draft' || summary.kind === 'booked' }) : null;
  const when = timing ? timingLabel(timing) : 'Time not set yet';
  const label = summary.kind === 'draft' ? 'YOUR DRAFT' : summary.kind === 'booked' ? 'YOUR NIGHT' : 'THIS WEEK';
  return `<section class="milo-home-card" aria-label="Your plan">
    <p class="milo-home-label">${label}</p>
    <h2 class="milo-home-plan">${escape(summary.planName)}</h2>
    <p class="milo-home-when">${escape(when)}</p>
    <div class="milo-home-card-foot">
      <span>${escape(summary.planStatus)}</span>
      <button class="milo-home-link" type="button" id="miloHomeOpen">${summary.action === 'open-waiting' ? 'See invite' : 'Open plan'} <span aria-hidden="true">›</span></button>
    </div>
    ${surpriseOpen(summary) ? `<button class="milo-home-link milo-home-surprise" type="button" id="miloHomeSurprise">Add a surprise <span aria-hidden="true">›</span></button>` : ''}
  </section>`;
}

// "Add a surprise" on the plan card: only for an agreed Together night or a booked
// solo night, and only once the server says gifts can be added (time set).
function surpriseOpen(summary) {
  return ['confirmed', 'booked'].includes(summary.kind) && Boolean(summary.nightId) && Boolean(currentGifts()?.can_add);
}

function surpriseNight(summary, state) {
  const solo = summary.kind === 'booked';
  const night = NIGHTS_POOL.find(n => n.id === summary.nightId);
  if (!night) return null;
  const overrides = solo ? state.sessionA.soloItineraryOverrides?.[night.id] || {} : {};
  return { solo, night: { ...night, beats: night.beats.map((beat, i) => overrides[i] || beat) }, timing: timingForNight(night.id, { solo }) };
}

export function renderHome(sessionId = 'aarav') {
  const state = store.getState();
  const summary = homeSummary(state);
  const fresh = summary.kind === 'fresh';
  const resuming = summary.kind === 'in-progress';

  const planSection = resuming
    ? resumeCard(summary)
    : fresh
    ? `<section class="milo-home-card milo-home-card-empty" aria-label="Your plan"><p>Nothing on yet. Want to plan something?</p></section>`
    : planCard(summary, state);

  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header milo-home-header">
      <div class="milo-home-place">
        <button class="milo-home-place-btn" type="button" id="miloHomePlace" aria-label="Change place: Home">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          <span>Home</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
      <span class="milo-wordmark">milo.</span>
    </header>
    <div class="milo-home-body">
      ${planSection}
      ${renderOccasionGrid()}
    </div>
    ${renderTabBar('home', { group: true })}
  </div>`;
}

export function attachHomeListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  attachOccasionGrid(container, sessionId);
  const summary = homeSummary(store.getState());
  container.querySelector('#miloHomeResume')?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, summary.resumeStep || 's2');
  });
  container.querySelector('#miloHomeSurprise')?.addEventListener('click', () => {
    const pick = surpriseNight(summary, store.getState());
    if (pick) import('../components/gifts-panel.js').then(m => m.openGiftSheet(pick.night, pick.timing, { solo: pick.solo }));
  });
  container.querySelector('#miloHomeOpen')?.addEventListener('click', () => {
    if (summary.action === 'open-waiting') store.setSessionScreen(sessionId, 's4_waiting');
    else if (summary.action === 'open-booked') store.setSessionScreen(sessionId, 'booked');
    else if (summary.action === 'open-together') store.setSessionScreen(sessionId, 's5');
    // Their picks are in for a solo plan with an invite out: open the shared plan.
    else if (summary.kind === 'together' && store.getState().sessionA.planningMode === 'solo') store.updateSession(sessionId, { planningMode: 'together', screen: 's7', activeNightId: summary.nightId });
    else store.updateSession(sessionId, { screen: 's7', activeNightId: summary.nightId });
  });
}
