// ==========================================================
// MILO V2 — SCREEN 10: YOU'VE BOTH CHOSEN
// Visual couple alignment, subtle confetti accents,
// and booking transition.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen10() {
  const selectedOption = getSelectedDateOption();

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen10Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Mutual Match</span>
          <div style="width: 32px;"></div>
        </div>

        <!-- Overlapping Couple Avatars with Heart -->
        <div class="milo-connected-avatars" style="margin: 24px 0 16px;">
          <div class="milo-avatar-circle" style="width:68px; height:68px;">
            ${renderImageHtml('rohanAvatar')}
          </div>
          <div class="milo-avatar-connector" style="width:50px;">
            <div class="milo-avatar-heart" style="width:30px; height:30px; top:-15px; font-size:1rem;">❤️</div>
          </div>
          <div class="milo-avatar-circle" style="width:68px; height:68px;">
            ${renderImageHtml('priyaPortrait')}
          </div>
        </div>

        <h1 style="font-family:var(--milo-font-display); font-size: 1.85rem; font-weight:400; text-align:center; line-height:1.2; margin:0 0 8px; color:var(--milo-text);">
          You both picked the same one.
        </h1>

        <p style="font-size: 0.95rem; text-align:center; line-height: 1.4; color: var(--milo-text-secondary); margin: 0 0 20px;">
          <strong>${selectedOption.title}</strong> it is. Let me lock in your spot and confirm the details.
        </p>

        <!-- Booking Lifecycle Checklist -->
        <div class="milo-checklist" style="background:#FFFFFF; padding:18px; border-radius:var(--milo-radius-lg); border:1px solid var(--milo-border); box-shadow:var(--milo-shadow-sm);">
          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600;">Spot available at Clayful Studio</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600;">Evening table requested at Drift</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span style="font-weight:600;">Timing aligned with your selected window</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-active" style="color:var(--milo-accent);">⏳</div>
            <span style="color:var(--milo-text-secondary);">Ready to confirm reservation</span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer" style="margin-top: 20px;">
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
      setState({
        booking: {
          ...getState().booking,
          status: 'confirmed'
        }
      });
      nextScreen();
    });
  }
}
