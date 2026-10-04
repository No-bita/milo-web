// ==========================================================
// MILO — SCREEN 5: SHARED UNDERSTANDING (S5)
// "Here's what we think you're both looking for."
// Visualises couple alignment without gamification or pills.
// ==========================================================

import { store } from '../domain/store.js';
import { computeSharedOutput } from '../logic/shared.js';

export function renderScreen05(sessionId = 'aarav') {
  const state = store.getState();
  const partnerName = sessionId === 'sneha' ? 'Aarav' : 'Sneha';
  const sharedData = computeSharedOutput(state.sessionA, state.sessionB);

  // YOU BOTH WANT rows
  const rowsHtml = sharedData.sharedRows.map(row => {
    return `
      <div class="milo-shared-row">
        <div class="milo-shared-row-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 3"></path>
          </svg>
        </div>
        <div class="milo-shared-row-text">${row.text}</div>
      </div>
    `;
  }).join('');

  // Difference block (if valid difference exists)
  const differenceHtml = sharedData.difference ? `
    <div class="milo-section-label">A LITTLE DIFFERENCE</div>
    <div class="milo-difference-block">
      <p class="milo-difference-text">${sharedData.difference.copy}</p>
    </div>
  ` : '';

  return `
    <div class="milo-s5-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS5Back-${sessionId}" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s5-scroll-content">
        <!-- Overlapping Monograms -->
        <div class="milo-overlapping-monograms">
          <div class="milo-mono-circle mono-left">A</div>
          <div class="milo-mono-circle mono-right">S</div>
        </div>

        <div class="milo-s5-intro">
          <h1 class="milo-headline">Here's what we think you're <em>both</em> looking for.</h1>
        </div>

        <div class="milo-shared-section">
          <div class="milo-section-label">YOU BOTH WANT</div>
          <div class="milo-shared-list">
            ${rowsHtml}
          </div>
        </div>

        ${differenceHtml}

        <div class="milo-bridge-section">
          <div class="milo-section-label">SO WE'RE LOOKING FOR…</div>
          <div class="milo-bridge-block">
            <p class="milo-bridge-text">${sharedData.bridgeSentence}</p>
          </div>
        </div>
      </div>

      <div class="milo-s5-footer">
        <button class="milo-cta-button" id="miloS5Cta-${sessionId}">
          See your nights →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen05Listeners(container, sessionId = 'aarav') {
  const backBtn = container.querySelector(`#miloS5Back-${sessionId}`);
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (sessionId === 'aarav') {
        store.setSessionScreen('aarav', 's4_waiting');
      } else {
        store.setSessionScreen('sneha', 's3');
      }
    });
  }

  const cta = container.querySelector(`#miloS5Cta-${sessionId}`);
  if (cta) {
    cta.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's6');
    });
  }
}
