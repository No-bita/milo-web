// ==========================================================
// MILO — SCREEN 3: PERSONAL SYNTHESIS (S3)
// "A little picture of your night"
// Exactly 3 derived observations in Milo's voice.
// ==========================================================

import { computePersonalSynthesis } from '../logic/synthesis.js';
import { store } from '../domain/store.js';

export function renderScreen03(sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const observations = computePersonalSynthesis(sessionData.intents || [], sessionData.reactions || []);

  const rowsHtml = observations.map((obs, i) => {
    return `
      <div class="milo-obs-row" style="animation-delay: ${i * 120}ms">
        <div class="milo-obs-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4l3 3"></path>
          </svg>
        </div>
        <p class="milo-obs-text">${obs}</p>
      </div>
    `;
  }).join('');

  const ctaText = sessionId === 'sneha'
    ? 'See what you both want →'
    : 'Looks good →';

  return `
    <div class="milo-s3-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS3Back-${sessionId}" aria-label="Back to deck">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s3-intro">
        <h1 class="milo-headline">A little picture of your night</h1>
        <p class="milo-subline">Here's what we're picking up.</p>
      </div>

      <div class="milo-observations-list">
        ${rowsHtml}
      </div>

      <button class="milo-cta-button" id="miloS3Cta-${sessionId}">
        ${ctaText}
      </button>
    </div>
  `;
}

export function attachScreen03Listeners(container, sessionId = 'aarav') {
  const backBtn = container.querySelector(`#miloS3Back-${sessionId}`);
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.updateSession(sessionId, {
        screen: 's2',
        currentCardIndex: 7
      });
    });
  }

  const cta = container.querySelector(`#miloS3Cta-${sessionId}`);
  if (cta) {
    cta.addEventListener('click', () => {
      if (sessionId === 'aarav') {
        store.setSessionScreen('aarav', 's4_invite');
      } else {
        // Sneha advances to shared result
        store.setSessionScreen('sneha', 's5');
      }
    });
  }
}
