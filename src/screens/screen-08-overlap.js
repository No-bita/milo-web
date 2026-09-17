// ==========================================================
// MILO V2 — SCREEN 8: FINDING DATES (OVERLAP MATCHING)
// Deterministic matching checklist, physical polaroid overlap,
// and handwritten Milo commentary.
// ==========================================================

import { nextScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen08() {
  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header" style="justify-content:center;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <!-- Overlapping Physical Polaroids -->
        <div style="display:flex; justify-content:center; align-items:center; margin: 18px 0 24px; position:relative; height: 160px;">
          <!-- Rohan Polaroid -->
          <div class="milo-polaroid" style="width: 120px; position: absolute; left: calc(50% - 100px); transform: rotate(-5deg); z-index: 1;">
            <div class="milo-polaroid-img">
              ${renderImageHtml('rohanAvatar')}
            </div>
            <div class="milo-polaroid-caption">Rohan</div>
          </div>

          <!-- Priya Polaroid -->
          <div class="milo-polaroid" style="width: 120px; position: absolute; right: calc(50% - 100px); transform: rotate(4deg); z-index: 2;">
            <div class="milo-polaroid-img">
              ${renderImageHtml('priyaPortrait')}
            </div>
            <div class="milo-polaroid-caption">Priya</div>
          </div>
        </div>

        <h1 style="font-family: var(--milo-font-display); font-size: 1.65rem; font-weight:400; text-align:center; line-height:1.25; margin:0 0 16px; color:var(--milo-text);">
          Okay. I have a pretty good idea of you two.
        </h1>

        <!-- Step-by-step intelligence checklist -->
        <div class="milo-checklist" style="margin-bottom: 20px;">
          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Cross-referenced what you both like</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Filtered out dealbreakers & hard no's</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Confirmed mutual locality fit in Bangalore</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Verified atmosphere, seating & timing</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Handpicked options worth your evening</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 10px;">
          <div class="milo-handwritten" style="font-size: 1.35rem; transform: rotate(-2deg); display: inline-block;">
            "Give me a second. I'm being picky." ♡ — Milo
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen8Continue">
          Show me the dates →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen08Listeners(container) {
  const continueBtn = container.querySelector('#btnScreen8Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());
}
