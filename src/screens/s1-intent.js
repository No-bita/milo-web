// ==========================================================
// MILO — SCREEN 1: BROAD INTENT (S1)
// Captured low-effort mood signal.
// Pure component with attached interactive listeners.
// ==========================================================

import { INTENTS } from '../data/mockData.js';
import { store } from '../domain/store.js';

function counterText(count) {
  return count > 0 ? `${count} of 3` : 'Pick up to three.';
}

// Fade the old counter text out while the new text fades in.
function crossFadeText(wrapper, textEl, next) {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    const ghost = textEl.cloneNode(true);
    ghost.classList.add('milo-subline-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.addEventListener('animationend', () => ghost.remove());
    wrapper.appendChild(ghost);
    textEl.classList.remove('milo-subline-in');
    void textEl.offsetWidth;
    textEl.classList.add('milo-subline-in');
  }
  textEl.textContent = next;
}

export function renderScreen01(sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const selectedIntents = sessionData.intents || [];
  const partnerName = sessionData.partnerName;

  const isCtaDisabled = selectedIntents.length === 0;

  const contextLineHtml = sessionId === 'sneha' 
    ? `
      <div class="milo-context-line milo-context-line--lead">${partnerName}'s done. Your turn.</div>
      <p class="milo-partner-context">${partnerName || 'Your partner'} invited you to plan tonight. Your picks stay private. About a minute.</p>
    `
    : '';

  const tilesHtml = INTENTS.map((intent, index) => {
    const isSelected = selectedIntents.includes(intent.id);
    const safeFallback = intent.fallback || intent.image;
    return `
      <div 
        class="milo-tile milo-tile--enter ${isSelected ? 'selected' : ''}" 
        style="--tile-i:${index}"
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
            <polyline points="20 6 9 17 4 12" pathLength="24"></polyline>
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
        <h1 class="milo-headline">How do you want tonight to feel?</h1>
        <p class="milo-subline" id="miloSubline-${sessionId}"><span class="milo-subline-text">${counterText(selectedIntents.length)}</span></p>
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
      tile.addEventListener('animationend', (e) => {
        if (e.target !== tile) return;
        tile.classList.remove('milo-tile--enter', 'milo-tile-pulse', 'milo-tile-shake');
      });
      tile.addEventListener('click', (e) => {
        const intentId = tile.getAttribute('data-intent-id');
        const res = store.toggleIntent(sessionId, intentId);

        if (!res.success && res.action === 'cap_exceeded') {
          // 4th Tap Refusal: Shake tile & flash subline in oxblood
          tile.classList.remove('milo-tile-shake');
          void tile.offsetWidth; // Trigger reflow
          tile.classList.add('milo-tile-shake');

          // "These are your three": the selected tiles breathe once.
          tiles.forEach((other) => {
            if (!other.classList.contains('selected')) return;
            other.classList.remove('milo-tile-pulse');
            void other.offsetWidth;
            other.classList.add('milo-tile-pulse');
          });

          if (subline) {
            subline.classList.add('milo-subline-flash');
            setTimeout(() => {
              subline.classList.remove('milo-subline-flash');
            }, 1000);
          }
        }
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
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

// Update the mounted s1 DOM in place after a state change.
export function patchScreen01(container, sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const selected = state[sessionKey].intents || [];

  container.querySelectorAll('.milo-tile').forEach((tile) => {
    const isSelected = selected.includes(tile.getAttribute('data-intent-id'));
    if (tile.classList.contains('selected') !== isSelected) {
      tile.classList.toggle('selected', isSelected);
      tile.setAttribute('aria-pressed', String(isSelected));
    }
  });

  const subline = container.querySelector(`#miloSubline-${sessionId}`);
  const textEl = subline && subline.querySelector('.milo-subline-text');
  const next = counterText(selected.length);
  if (textEl && textEl.textContent !== next) {
    crossFadeText(subline, textEl, next);
  }

  const cta = container.querySelector(`#miloCta-${sessionId}`);
  if (cta) cta.disabled = selected.length === 0;
}
