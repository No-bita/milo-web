// ==========================================================
// MILO — SCREEN 6: THREE NIGHTS (S6)
// "Three nights for the two of you"
// Editorial presentation of 3 curated options.
// ==========================================================

import { store } from '../domain/store.js';
import { partnerLabel, escapeHtml } from '../logic/partner.js';
import { computePlanningOutput, isSoloPlanning } from '../logic/planning.js';
import { renderNightAccordion, attachNightAccordion } from '../components/night-accordion.js';

// Solo only: an invitation to plan together, below the nights so it never competes with them.
function bringInCard(state, sessionId) {
  const label = partnerLabel(state);
  const name = label === 'your person' ? 'your person' : label;
  const cta = label === 'your person' ? 'Invite them' : `Invite ${label}`;
  return `<section class="milo-bring-card" aria-labelledby="miloBringTitle-${sessionId}">
    <h2 id="miloBringTitle-${sessionId}">Planning this with someone?</h2>
    <p>Bring ${escapeHtml(name)} in. They pick privately, Milo finds the overlap.</p>
    <button type="button" class="milo-pill-btn-secondary" id="miloBringIn-${sessionId}">${escapeHtml(cta)}</button>
  </section>`;
}

export function renderScreen06(sessionId = 'aarav') {
  const state = store.getState();
  const partnerName = partnerLabel(state, sessionId);
  const partnerPickLabel = `${escapeHtml(partnerName.toUpperCase())}'S PICK`;
  const solo = isSoloPlanning(state, sessionId);
  const sharedData = computePlanningOutput(state, sessionId);
  const suggestion = solo ? null : state.shared.suggestion;

  const rowsHtml = renderNightAccordion(sharedData.selectedNights, {
    sessionId, suggestion, partnerPickLabel, showWhy: !solo
  });

  return `
    <div class="milo-s6-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS6Back-${sessionId}" aria-label="${solo ? 'Back to your reflection' : 'Back to shared picture'}">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s6-intro">
        <h1 class="milo-headline">${solo ? 'Three nights, shaped by you' : 'Three nights for the two of you'}</h1>
        ${solo ? `<p class="milo-subline">Your picks are the starting point. No partner input yet.</p>` : ''}
      </div>

      <div class="milo-nights-list">
        ${rowsHtml}
      </div>
      ${solo ? bringInCard(state, sessionId) : ''}
    </div>
  `;
}

export function attachScreen06Listeners(container, sessionId = 'aarav') {
  const backBtn = container.querySelector(`#miloS6Back-${sessionId}`);
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, isSoloPlanning(store.getState(), sessionId) ? 's3' : 's5');
    });
  }

  container.querySelector(`#miloBringIn-${sessionId}`)?.addEventListener('click', () => {
    store.updateSession(sessionId, { planningMode: 'together', screen: 's4_invite' });
  });

  attachNightAccordion(container, sessionId, nightId => {
    store.updateSession(sessionId, {
      screen: 's7',
      activeNightId: nightId
    });
  });
}
