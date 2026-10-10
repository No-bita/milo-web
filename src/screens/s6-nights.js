// ==========================================================
// MILO — SCREEN 6: THREE NIGHTS (S6)
// "Three nights for the two of you"
// Editorial presentation of 3 curated options.
// ==========================================================

import { store } from '../domain/store.js';
import { partnerLabel } from '../logic/partner.js';
import { computePlanningOutput, isSoloPlanning } from '../logic/planning.js';
import { renderNightAccordion, attachNightAccordion } from '../components/night-accordion.js';

export function renderScreen06(sessionId = 'aarav') {
  const state = store.getState();
  const partnerName = sessionId === 'sneha' ? 'Aarav' : 'Sneha';
  const partnerPickLabel = `${partnerName.toUpperCase()}'S PICK`;
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
        ${solo ? `<p class="milo-subline">Your picks are the starting point. No partner input yet.</p><button type="button" class="milo-text-button milo-bring-in" id="miloBringIn-${sessionId}">Bring ${solo ? partnerLabel(state) : partnerName} in</button>` : ''}
      </div>

      <div class="milo-nights-list">
        ${rowsHtml}
      </div>
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
