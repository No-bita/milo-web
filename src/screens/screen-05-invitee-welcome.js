// ==========================================================
// MILO V2 — SCREEN 5: INVITEE WELCOME
// Full portrait hero photography of Priya, overlapping welcome card,
// and reassurance points.
// ==========================================================

import { getState, nextScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen05() {
  const state = getState();
  const plannerName = state.planner?.name || 'Rohan';

  return `
    <div style="display:flex; flex-direction:column; min-height:100%;">
      <!-- Hero Portrait -->
      <div style="height: clamp(260px, 36svh, 380px); position: relative; overflow: hidden; width: 100%;">
        ${renderImageHtml('priyaPortrait')}
        <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(26,24,20,0.7) 100%);"></div>
        <div class="milo-hero-brand">milo</div>
      </div>

      <!-- Overlapping Floating Card -->
      <div class="milo-card" style="margin: -24px 16px 20px; border-radius: var(--milo-radius-xl); padding: 22px 20px; position: relative; z-index: 2; box-shadow: var(--milo-shadow-lg);">
        <!-- Avatars connected -->
        <div class="milo-connected-avatars" style="margin: 0 0 14px;">
          <div class="milo-avatar-circle">
            ${renderImageHtml('rohanAvatar')}
          </div>
          <div class="milo-avatar-connector">
            <div class="milo-avatar-heart">✨</div>
          </div>
          <div class="milo-avatar-circle">
            ${renderImageHtml('priyaPortrait')}
          </div>
        </div>

        <h2 style="font-family: var(--milo-font-display); font-size: 1.65rem; font-weight:400; text-align:center; line-height:1.2; margin: 0 0 6px; color:var(--milo-text);">
          ${plannerName}'s planning your date.
        </h2>
        <p style="text-align: center; font-size: 0.9rem; color: var(--milo-text-secondary); margin: 0 0 16px;">
          You just tell me what sounds good to you.
        </p>

        <!-- 3 Quick Reassurance Points -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; align-items:center; gap:12px; background:var(--milo-bg); border-radius:var(--milo-radius-md); padding:10px 12px;">
            <span style="font-size:1.1rem;">🔒</span>
            <span style="font-size:0.82rem; color:var(--milo-text); font-weight:500;">Your answers stay yours — no awkwardness</span>
          </div>

          <div style="display:flex; align-items:center; gap:12px; background:var(--milo-bg); border-radius:var(--milo-radius-md); padding:10px 12px;">
            <span style="font-size:1.1rem;">🤝</span>
            <span style="font-size:0.82rem; color:var(--milo-text); font-weight:500;">I'll find something you'll both genuinely like</span>
          </div>

          <div style="display:flex; align-items:center; gap:12px; background:var(--milo-bg); border-radius:var(--milo-radius-md); padding:10px 12px;">
            <span style="font-size:1.1rem;">⚡</span>
            <span style="font-size:0.82rem; color:var(--milo-text); font-weight:500;">Takes 30 seconds. Nothing to download</span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer" style="padding: 0 16px 24px;">
        <button class="milo-btn-primary" id="btnScreen5Accept">
          Let's do this →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen05Listeners(container) {
  const acceptBtn = container.querySelector('#btnScreen5Accept');
  if (acceptBtn) acceptBtn.addEventListener('click', () => nextScreen());
}
