// ==========================================================
// MILO — SCREEN 4: INVITE & WAIT (Aarav's Side)
// "Now it's Sneha's turn" -> "Over to Sneha"
// Monograms offset, privacy reassurance, mocked send, partner banner.
// ==========================================================

import { store } from '../domain/store.js';

export function renderScreen04(sessionId = 'aarav') {
  const state = store.getState();
  const sessionData = state.sessionA;
  const isWaiting = sessionData.screen === 's4_waiting' || state.shared.inviteSent;
  const isPartnerDone = state.sessionB && (state.sessionB.screen === 's5' || state.sessionB.screen === 's6' || state.sessionB.screen === 's7');

  if (isWaiting) {
    return `
      <div class="milo-s4-container waiting-state" data-session-id="${sessionId}">
        ${isPartnerDone ? `
          <!-- In-App Partner Banner (§2.6) -->
          <div class="milo-partner-banner" id="miloPartnerBanner">
            <span>Sneha's done. See what you're both looking for.</span>
            <span class="milo-banner-arrow">→</span>
          </div>
        ` : ''}

        <header class="milo-header">
          <button class="milo-header-back" id="miloS4WaitBack-${sessionId}" aria-label="Back to synthesis">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span class="milo-wordmark">milo.</span>
          <div class="milo-header-space"></div>
        </header>

        <div class="milo-s4-content">
          <!-- Monograms -->
          <div class="milo-monograms-row">
            <div class="milo-monogram mono-solid">A</div>
            <div class="milo-monogram mono-outline pulse-once">S</div>
          </div>

          <div class="milo-s4-intro">
            <h1 class="milo-headline">Over to Sneha.</h1>
            <p class="milo-subline">We'll let you know when Sneha's done.</p>
          </div>

          <div class="milo-s4-invite-link-wrap">
            <a href="?as=sneha" target="_blank" class="milo-secondary-link" id="miloOpenSnehaTab">
              Open Sneha's invitation in a new tab ↗
            </a>
          </div>
        </div>

        <div class="milo-s4-footer-space"></div>
      </div>
    `;
  }

  // Invite state
  return `
    <div class="milo-s4-container invite-state" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${sessionId}" aria-label="Back to synthesis">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s4-content">
        <!-- Monograms (offset, no overlap yet) -->
        <div class="milo-monograms-row">
          <div class="milo-monogram mono-solid">A</div>
          <div class="milo-monogram mono-outline">S</div>
        </div>

        <div class="milo-s4-intro">
          <h1 class="milo-headline">Now it's Sneha's turn.</h1>
          <p class="milo-body-text">Same questions. Different tastes. We'll bring it together once you've both finished.</p>
          <p class="milo-privacy-line">Sneha won't see what you picked. We'll only share the big picture.</p>
        </div>
      </div>

      <button class="milo-cta-button" id="miloSendInviteBtn">
        Send to Sneha
      </button>
    </div>
  `;
}

export function attachScreen04Listeners(container, sessionId = 'aarav') {
  const backBtn = container.querySelector(`#miloS4Back-${sessionId}`);
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's3');
    });
  }

  const waitBackBtn = container.querySelector(`#miloS4WaitBack-${sessionId}`);
  if (waitBackBtn) {
    waitBackBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's3');
    });
  }

  const sendBtn = container.querySelector('#miloSendInviteBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      // Send invite: update shared state and switch Aarav to waiting state
      store.updateShared({ inviteSent: true });
      store.setSessionScreen('aarav', 's4_waiting');
    });
  }

  const banner = container.querySelector('#miloPartnerBanner');
  if (banner) {
    banner.addEventListener('click', () => {
      // Advance to S5
      store.setSessionScreen('aarav', 's5');
    });
  }
}
