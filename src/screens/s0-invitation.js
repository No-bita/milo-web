// ==========================================================
// MILO — SCREEN 0: INVITATION (Sneha's Entry Point)
// "Aarav wants to plan tonight with you."
// Handles idle state (before invite) and incoming invitation.
// ==========================================================

import { store } from '../domain/store.js';
import '../styles/partner-welcome.css';

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

  // One brand moment, with the invitation context already present.
  return `
    <section class="milo-partner-welcome" data-session-id="${sessionId}" aria-labelledby="miloPartnerInviteTitle">
      <div class="milo-partner-welcome-body">
        <div class="milo-partner-brand" aria-label="Milo">milo.</div>
        <p class="milo-partner-promise">Good nights for two.<br><em>Less planning for you.</em></p>
        <div class="milo-partner-invitation">
          <h1 id="miloPartnerInviteTitle">Aarav wants to plan<br>tonight with you.</h1>
          <p class="milo-partner-task">Pick a mood. Tell us what feels like you.<br>Same questions. Your own tastes.<br>About a minute.</p>
          <p class="milo-partner-privacy">Your individual picks aren't shown to Aarav in the plan. Just the shared picture.</p>
          <p class="milo-partner-demo">Same-browser demo. Picks stay in this browser.</p>
        </div>
      </div>
      <button class="milo-cta-button milo-partner-cta" id="miloAcceptInviteBtn" type="button">
        Let's begin <span aria-hidden="true">→</span>
      </button>
    </section>
  `;
}

export function attachScreen00Listeners(container, sessionId = 'sneha') {
  const btn = container.querySelector('#miloAcceptInviteBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      // Advance Sneha to S1 with context line "Aarav's done. Your turn."
      store.setSessionScreen('sneha', 's1');
      const heading = document.querySelector('#viewport-sneha .milo-headline');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }
}
