// ==========================================================
// MILO — SCREEN 0: INVITATION (Sneha's Entry Point)
// "Aarav wants to plan tonight with you."
// Handles idle state (before invite) and incoming invitation.
// ==========================================================

import { store } from '../domain/store.js';

export function renderScreen00(sessionId = 'sneha') {
  const state = store.getState();
  const inviteSent = state.shared && state.shared.inviteSent;

  if (!inviteSent) {
    // Prototype idle screen before invite lands (§3.10)
    return `
      <div class="milo-s0-container idle-state" data-session-id="${sessionId}">
        <header class="milo-header">
          <span class="milo-wordmark">milo.</span>
        </header>

        <div class="milo-s0-content">
          <div class="milo-monograms-row">
            <div class="milo-monogram mono-outline">S</div>
          </div>

          <div class="milo-s0-intro">
            <h1 class="milo-headline">Nothing planned yet.</h1>
            <p class="milo-subline">When Aarav invites you, it'll show up here.</p>
          </div>
        </div>

        <div class="milo-s0-footer-space"></div>
      </div>
    `;
  }

  // Invitation received (S0)
  return `
    <div class="milo-s0-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <span class="milo-wordmark">milo.</span>
      </header>

      <div class="milo-s0-content">
        <!-- Monograms -->
        <div class="milo-monograms-row">
          <div class="milo-monogram mono-solid">A</div>
          <div class="milo-monogram mono-outline">S</div>
        </div>

        <div class="milo-s0-intro">
          <div class="milo-context-line">From Aarav</div>
          <h1 class="milo-headline">Aarav wants to plan tonight with you.</h1>
          <p class="milo-body-text">Same questions. Different tastes. About a minute.</p>
          <p class="milo-privacy-line">Aarav won't see what you picked. We'll only share the big picture.</p>
        </div>
      </div>

      <button class="milo-cta-button" id="miloAcceptInviteBtn">
        Let's go
      </button>
    </div>
  `;
}

export function attachScreen00Listeners(container, sessionId = 'sneha') {
  const btn = container.querySelector('#miloAcceptInviteBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      // Advance Sneha to S1 with context line "Aarav's done. Your turn."
      store.setSessionScreen('sneha', 's1');
    });
  }
}
