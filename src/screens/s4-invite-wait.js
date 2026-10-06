// ==========================================================
// MILO — SCREEN 4: INVITE & WAIT (Aarav's Side)
// "Planning this together?" -> "Over to Sneha" -> "Sneha's done"
// Warm editorial celebratory layout with toasting illustration.
// ==========================================================

import { store } from '../domain/store.js';

// Demo scaffolding (open the partner's side in a new tab) shows only with ?demo
const isDemo = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

export function renderScreen04(sessionId = 'aarav') {
  const state = store.getState();
  const sessionData = state.sessionA;
  const isWaiting = sessionData.screen === 's4_waiting' || state.shared.inviteSent;
  const isPartnerDone = state.sessionB && (state.sessionB.screen === 's5' || state.sessionB.screen === 's6' || state.sessionB.screen === 's7');

  if (isWaiting) {
    if (isPartnerDone) {
      return `
        <div class="milo-s4-container partner-done-state" data-session-id="${sessionId}">
          <header class="milo-header">
            <button class="milo-header-back" id="miloS4WaitBack-${sessionId}" aria-label="Back to synthesis">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span class="milo-wordmark">milo.</span>
            <div class="milo-header-space"></div>
          </header>

          <div class="milo-s4-content">
            <div class="milo-s4-illustration-wrap">
              <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
            </div>

            <div class="milo-s4-intro">
              <h1 class="milo-headline">Sneha's done.</h1>
              <p class="milo-body-text">See what you're both looking for.</p>
            </div>
          </div>

          <div class="milo-s4-actions">
            <button class="milo-pill-btn-primary" id="miloSeeSharedBtn">
              See what you're both looking for →
            </button>
            <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="milo-s4-container waiting-state" data-session-id="${sessionId}">
        <header class="milo-header">
          <button class="milo-header-back" id="miloS4WaitBack-${sessionId}" aria-label="Back to synthesis">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="milo-wordmark">milo.</span>
          <div class="milo-header-space"></div>
        </header>

        <div class="milo-s4-content">
          <div class="milo-s4-illustration-wrap milo-waiting-glow">
            <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
          </div>

          <div class="milo-s4-intro">
            <h1 class="milo-headline">Over to Sneha.</h1>
            <p class="milo-body-text">We'll let you know when Sneha's done. They'll make their choices privately.</p>
          </div>
        </div>

        <div class="milo-s4-actions">
          ${isDemo() ? `<a href="?as=sneha" target="_blank" class="milo-pill-btn-secondary" id="miloOpenSnehaTab">
            Open Sneha's invitation in a new tab ↗
          </a>` : ''}
          <button class="milo-pill-btn-ghost" id="miloCopyLinkBtn">
            Copy invite link
          </button>
          <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
        </div>
      </div>
    `;
  }

  // Invite state
  return `
    <div class="milo-s4-container invite-state" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${sessionId}" aria-label="Back to synthesis">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s4-content">
        <div class="milo-s4-illustration-wrap">
          <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
        </div>

        <div class="milo-s4-intro">
          <h1 class="milo-headline">Planning this together?</h1>
          <p class="milo-body-text">Invite your date to help shape the night with you. They'll make their choices privately.</p>
        </div>
      </div>

      <div class="milo-s4-actions">
        <button class="milo-pill-btn-primary" id="miloSendInviteBtn">
          Send invite link
        </button>
        <button class="milo-pill-btn-secondary" id="miloShareWhatsappBtn">
          Share via WhatsApp
        </button>
        <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
      </div>
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

  const whatsappBtn = container.querySelector('#miloShareWhatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      store.updateShared({ inviteSent: true });
      store.setSessionScreen('aarav', 's4_waiting');
    });
  }

  const copyBtn = container.querySelector('#miloCopyLinkBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const url = window.location.origin + window.location.pathname + '?as=sneha';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          copyBtn.textContent = 'Link copied ✓';
          setTimeout(() => {
            copyBtn.textContent = 'Copy invite link';
          }, 2000);
        }).catch(() => {});
      }
    });
  }

  const seeSharedBtn = container.querySelector('#miloSeeSharedBtn');
  if (seeSharedBtn) {
    seeSharedBtn.addEventListener('click', () => {
      store.setSessionScreen('aarav', 's5');
    });
  }
}
