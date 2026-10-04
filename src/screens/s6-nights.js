// ==========================================================
// MILO — SCREEN 6: THREE NIGHTS (S6)
// "Three nights for the two of you"
// Editorial presentation of 3 curated options.
// ==========================================================

import { store } from '../domain/store.js';
import { computeSharedOutput } from '../logic/shared.js';

export function renderScreen06(sessionId = 'aarav') {
  const state = store.getState();
  const partnerName = sessionId === 'sneha' ? 'Aarav' : 'Sneha';
  const partnerPickLabel = `${partnerName.toUpperCase()}'S PICK`;
  const sharedData = computeSharedOutput(state.sessionA, state.sessionB);
  const suggestion = state.shared.suggestion;

  const rowsHtml = sharedData.selectedNights.map((item, idx) => {
    const night = item.night;
    const isPartnerPick = suggestion && suggestion.nightId === night.id && suggestion.by !== sessionId;
    const isMyPick = suggestion && suggestion.nightId === night.id && suggestion.by === sessionId;

    const pickBadge = isPartnerPick
      ? `<span class="milo-partner-pick-label">${partnerPickLabel}</span>`
      : (isMyPick ? `<span class="milo-my-pick-label">YOUR SUGGESTION</span>` : '');

    const beatsStr = night.beats.map(b => b.name).join(' → ');

    return `
      <div class="milo-night-row" data-night-id="${night.id}" id="nightRow-${night.id}">
        <div class="milo-night-thumb-wrap">
          <img src="${night.defaultImage}" alt="${night.name}" class="milo-night-thumb" />
        </div>
        <div class="milo-night-info">
          <div class="milo-night-meta-header">
            <span class="milo-night-num">${item.num}</span>
            ${pickBadge}
          </div>
          <h2 class="milo-night-name">${night.name}</h2>
          <p class="milo-night-fit">${item.fitLine}</p>
          <div class="milo-night-beats">${beatsStr}</div>
        </div>
        <div class="milo-night-chevron">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="milo-s6-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS6Back-${sessionId}" aria-label="Back to shared picture">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s6-intro">
        <h1 class="milo-headline">Three nights for the two of you</h1>
        <p class="milo-subline">Different vibes, all a good fit.</p>
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
      store.setSessionScreen(sessionId, 's5');
    });
  }

  const rows = container.querySelectorAll('.milo-night-row');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const nightId = row.getAttribute('data-night-id');
      store.updateSession(sessionId, {
        screen: 's7',
        activeNightId: nightId
      });
    });
  });
}
