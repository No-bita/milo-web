// ==========================================================
// MILO — SCREEN 1: BROAD INTENT (S1)
// Captured low-effort mood signal.
// Pure component with attached interactive listeners.
// ==========================================================

import { hasThreeMoods, moodCtaLabel } from '../logic/mood-selection.js';
import { INTENTS } from '../data/mockData.js';
import { isV31, moodTiles } from '../logic/intent-quiz.js';
import { store } from '../domain/store.js';
import { partnerLabel, hasPartnerName, sentenceName } from '../logic/partner.js';

export function renderScreen01(sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const selectedIntents = sessionData.intents || [];
  const partnerName = partnerLabel(state, sessionId);

  const isCtaDisabled = !hasThreeMoods(selectedIntents);

  const contextLineHtml = sessionId === 'sneha'
    ? `
      <div class="milo-context-line milo-context-line--lead">${hasPartnerName(partnerName) ? `${sentenceName(partnerName)}'s done.` : 'Your date is done.'} Your turn.</div>
      <p class="milo-partner-context">${sentenceName(partnerName)} invited you to plan tonight. Your picks stay private. About a minute.</p>
    `
    : '';

  // Intent model v3.1 plans show the model's own eight moods; others keep today's.
  const tiles = isV31(sessionData) ? moodTiles() : INTENTS;
  const tilesHtml = tiles.map((intent, index) => {
    const isSelected = selectedIntents.includes(intent.id);
    const safeFallback = intent.fallback || intent.image;
    return `
      <button type="button"
        class="milo-tile milo-tile--enter ${isSelected ? 'selected' : ''}"
        style="--tile-i:${index}"
        data-intent-id="${intent.id}"
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
      </button>
    `;
  }).join('');

  const backButtonHtml = `<button type="button" class="milo-header-back" id="miloS1Back-${sessionId}" aria-label="${sessionId === 'sneha' ? 'Back to invitation' : 'Back to Home'}"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button>`;
  const progressHtml = `<div class="milo-mood-progress" id="miloSubline-${sessionId}" role="status" aria-live="polite" aria-label="${selectedIntents.length} of 3 moods selected"><span class="milo-mood-dots" aria-hidden="true">${[1,2,3].map(n=>`<i class="${selectedIntents.length >= n ? 'is-filled' : ''}"></i>`).join('')}</span><span class="milo-subline-text">${selectedIntents.length}/3</span></div>`;
  return `
    <div class="milo-s1-container" data-session-id="${sessionId}">
      <header class="milo-header">
        ${backButtonHtml}
        <span class="milo-wordmark">milo.</span>

      </header>

      <div class="milo-s1-intro">
        ${contextLineHtml}
        <h1 class="milo-headline">How do you want tonight to feel?</h1>${progressHtml}
        <p class="milo-subline">Pick three moods. We'll bring them together.</p>
      </div>

      <div class="milo-tiles-grid" id="miloTilesGrid-${sessionId}">
        ${tilesHtml}
      </div>

      <button
        class="milo-cta-button"
        id="miloCta-${sessionId}"
        ${isCtaDisabled ? 'disabled' : ''}
      >
        ${moodCtaLabel(selectedIntents.length)}
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
      store.setSessionScreen(sessionId, sessionId === 'sneha' ? 's0' : 'home');
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

    });
  }

  if (cta) {
    cta.addEventListener('click', () => {
      const state = store.getState();
      const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
      if (hasThreeMoods(state[sessionKey].intents)) {
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
  if (textEl) textEl.textContent = `${selected.length}/3`;
  if (subline) {
    subline.setAttribute('aria-label', `${selected.length} of 3 moods selected`);
    subline.querySelectorAll('.milo-mood-dots i').forEach((dot, index) => dot.classList.toggle('is-filled', index < selected.length));
  }

  const cta = container.querySelector(`#miloCta-${sessionId}`);
  if (cta) {
    cta.disabled = !hasThreeMoods(selected);
    cta.textContent = moodCtaLabel(selected.length);
  }
}
