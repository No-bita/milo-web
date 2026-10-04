// ==========================================================
// MILO — SCREEN 1: BROAD INTENT (S1)
// Captured low-effort mood signal.
// Pure component with attached interactive listeners.
// ==========================================================

import { INTENTS } from '../data/mockData.js';
import { store } from '../domain/store.js';

export function renderScreen01(sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const selectedIntents = sessionData.intents || [];
  const partnerName = sessionData.partnerName;

  const isCtaDisabled = selectedIntents.length === 0;

  const contextLineHtml = sessionId === 'sneha' 
    ? `<div class="milo-context-line">${partnerName}'s done. Your turn.</div>`
    : '';

  const tilesHtml = INTENTS.map((intent) => {
    const isSelected = selectedIntents.includes(intent.id);
    const safeFallback = intent.fallback || intent.image;
    return `
      <div 
        class="milo-tile ${isSelected ? 'selected' : ''}" 
        data-intent-id="${intent.id}"
        role="button"
        tabindex="0"
        aria-pressed="${isSelected}"
        aria-label="${intent.label}"
      >
        <img 
          src="${intent.image}" 
          alt="${intent.alt}" 
          class="milo-tile-img" 
          loading="eager"
          onerror="if(this.src!=='${safeFallback}'){this.src='${safeFallback}'}"
        />
        <div class="milo-tile-scrim"></div>
        <div class="milo-tile-check">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="milo-tile-label">${intent.label}</span>
      </div>
    `;
  }).join('');

  const backButtonHtml = sessionId === 'sneha' ? `
    <button class="milo-header-back" id="miloS1Back-${sessionId}" aria-label="Back to invitation">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  ` : '<div class="milo-header-space"></div>';

  return `
    <div class="milo-s1-container" data-session-id="${sessionId}">
      <header class="milo-header">
        ${backButtonHtml}
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s1-intro">
        ${contextLineHtml}
        <h1 class="milo-headline">What do you want tonight to feel like?</h1>
        <p class="milo-subline" id="miloSubline-${sessionId}">Pick up to three.</p>
      </div>

      <div class="milo-tiles-grid" id="miloTilesGrid-${sessionId}">
        ${tilesHtml}
      </div>

      <button 
        class="milo-cta-button" 
        id="miloCta-${sessionId}" 
        ${isCtaDisabled ? 'disabled' : ''}
      >
        Continue →
      </button>
    </div>
  `;
}

export function attachScreen01Listeners(container, sessionId = 'aarav') {
  const grid = container.querySelector(`#miloTilesGrid-${sessionId}`);
  const subline = container.querySelector(`#miloSubline-${sessionId}`);
  const cta = container.querySelector(`#miloCta-${sessionId}`);
  const backBtn = container.querySelector(`#miloS1Back-${sessionId}`);

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's0');
    });
  }

  if (grid) {
    const tiles = grid.querySelectorAll('.milo-tile');
    tiles.forEach((tile) => {
      tile.addEventListener('click', (e) => {
        const intentId = tile.getAttribute('data-intent-id');
        const res = store.toggleIntent(sessionId, intentId);

        if (!res.success && res.action === 'cap_exceeded') {
          // 4th Tap Refusal: Shake tile & flash subline in oxblood
          tile.classList.remove('milo-tile-shake');
          void tile.offsetWidth; // Trigger reflow
          tile.classList.add('milo-tile-shake');

          if (subline) {
            subline.classList.add('milo-subline-flash');
            setTimeout(() => {
              subline.classList.remove('milo-subline-flash');
            }, 1000);
          }
        }
      });
    });
  }

  if (cta) {
    cta.addEventListener('click', () => {
      const state = store.getState();
      const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
      if (state[sessionKey].intents && state[sessionKey].intents.length > 0) {
        store.advanceFromS1(sessionId);
      }
    });
  }
}
