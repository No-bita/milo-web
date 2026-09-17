// ==========================================================
// MILO V2 — SCREEN 10: YOU'VE BOTH CHOSEN
// "You're aligned!"
// Both people selected the same recommendation.
// Milo checks venue availability and holds the spot.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';

export function renderScreen10() {
  const selectedOption = getSelectedDateOption();

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen10Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:600; color:var(--milo-text-secondary);">Mutual Pick</span>
        </div>

        <!-- Heart inside warm pastel circular aura -->
        <div style="display:flex; justify-content:center; align-items:center; margin: 24px 0 20px;">
          <div style="width:110px; height:110px; border-radius:50%; background:radial-gradient(circle, #FDE6D2 0%, #FAF0EC 60%, transparent 100%); display:flex; align-items:center; justify-content:center; animation:pulse-ring 2.5s infinite ease-in-out;">
            <span style="font-size: 3rem;">❤️</span>
          </div>
        </div>

        <h1 style="font-family:var(--milo-font-display); font-size: 1.85rem; font-weight:400; text-align:center; line-height:1.2; margin:0 0 8px; color:var(--milo-text);">
          You both picked the same one. ❤️
        </h1>

        <p style="font-size: 0.95rem; text-align:center; line-height: 1.5; color: var(--milo-text-secondary); margin: 0 0 24px;">
          ${selectedOption.title} it is. Let me just make sure your spots are still there.
        </p>

        <!-- Booking Status Machine Checklist -->
        <div class="milo-checklist" style="background:#FFFFFF; padding:18px; border-radius:var(--milo-radius-lg); border:1px solid var(--milo-border); box-shadow:var(--milo-shadow-sm);">
          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600;">Checking availability</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600; color:var(--milo-text);">Holding your spots</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600; color:var(--milo-text);">Confirming the details</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-active" style="color:var(--milo-accent); font-size:0.65rem;">⏳</div>
            <span style="color:var(--milo-text-secondary);">Making it official</span>
          </div>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen10Confirm">
          Make it official →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen10Listeners(container) {
  const backBtn = container.querySelector('#btnScreen10Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const confirmBtn = container.querySelector('#btnScreen10Confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      setState({ booking: { ...getState().booking, status: 'confirmed' } });
      nextScreen();
    });
  }
}
