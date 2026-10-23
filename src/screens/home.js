import { store } from '../domain/store.js';
import { homeSummary } from '../logic/home.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { OCCASIONS } from '../data/occasions.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

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

// Compact occasion grid: the six occasions start directly on Home.
function occasionGrid() {
  return `<ul class="milo-home-occ-grid" aria-label="Occasions">${OCCASIONS.map((occasion, index) => `<li><button type="button" class="milo-home-occ milo-home-occ-${index + 1}"><svg class="milo-home-occ-art" viewBox="0 0 80 64" aria-hidden="true">${occasion.art}</svg><span class="milo-home-occ-name">${occasion.name}</span><span class="milo-home-occ-sub">${occasion.compactSub}</span></button></li>`).join('')}</ul>`;
}

export function renderHome(sessionId = 'aarav') {
  const state = store.getState();
  const summary = homeSummary(state);
  const fresh = summary.kind === 'fresh';
  const resuming = summary.kind === 'in-progress';
  const partner = escape(summary.partner);
  const alone = !fresh && !resuming && summary.invited === false;
  const headline = fresh ? 'What are you planning?' : resuming ? 'A quiet week' : alone ? 'Your night' : `Your night with ${partner}`;
  const lead = resuming ? '<p class="milo-home-lead">Pick a mood and Milo does the rest.</p>' : '';
  const body = resuming
    ? `${resumeCard(summary)}
       ${occasionGrid()}
       <div class="milo-home-row"><span class="milo-home-avatar milo-home-avatar-plus" aria-hidden="true">+</span><div><b>Invite your person</b><span>Plan together. Both of you say yes.</span></div></div>`
    : fresh
    ? `${occasionGrid()}
       <div class="milo-home-row"><span class="milo-home-avatar milo-home-avatar-plus" aria-hidden="true">+</span><div><b>Invite your person</b><span>Plan together. Both of you say yes.</span></div></div>`
    : alone
    ? `${planCard(summary, state)}
       ${occasionGrid()}
       <div class="milo-home-row"><span class="milo-home-avatar milo-home-avatar-plus" aria-hidden="true">+</span><div><b>Bring your person in</b><span>Whenever you're ready.</span></div></div>`
    : `${planCard(summary, state)}
       ${occasionGrid()}
       <div class="milo-home-row"><span class="milo-home-avatar" aria-hidden="true">${escape(summary.partner.charAt(0).toUpperCase())}</span><div><b>${partner}</b><span>${escape(summary.partnerStatus)}</span></div></div>`;
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header milo-home-header">
      <div class="milo-home-place">
        <button class="milo-home-place-btn" type="button" id="miloHomePlace" aria-label="Change place: Home">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          <span>Home</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <p class="milo-home-address">HSR Layout, Bengaluru</p>
      </div>
      <span class="milo-wordmark">milo.</span>
    </header>
    <div class="milo-home-body">
      <p class="milo-home-greet">${greeting()}</p>
      <h1 class="milo-headline milo-home-headline">${headline}</h1>
      ${lead}
      ${body}
    </div>
    ${renderTabBar('home', { group: true })}
  </div>`;
}

export function attachHomeListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  const summary = homeSummary(store.getState());
  container.querySelectorAll('.milo-home-occ').forEach((tile) => {
    tile.addEventListener('click', () => store.setSessionScreen(sessionId, 's1'));
  });
  container.querySelector('#miloHomeResume')?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, summary.resumeStep || 's2');
  });
  container.querySelector('#miloHomeOpen')?.addEventListener('click', () => {
    if (summary.action === 'open-waiting') store.setSessionScreen(sessionId, 's4_waiting');
    else if (summary.action === 'open-together') store.setSessionScreen(sessionId, 's5');
    else store.updateSession(sessionId, { screen: 's7', activeNightId: summary.nightId });
  });
}
