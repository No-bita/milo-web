// ==========================================================
// MILO V2 — SCREEN 8: FINDING SOMETHING YOU'LL BOTH LOVE
// "Pulling it all together..."
// Rewritten per product brief:
// Matches two-sided preferences + hard no's + travel balance
// + venue availability (NO calendar matching).
// ==========================================================

import { nextScreen } from '../state.js';

export function renderScreen08() {
  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header" style="justify-content:center;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <!-- Two silhouettes connected by warm flowing line -->
        <div style="display:flex; justify-content:center; align-items:center; margin: 20px 0 24px; position:relative; height:90px;">
          <!-- Rohan Avatar -->
          <div style="width:64px; height:64px; border-radius:50%; overflow:hidden; border:2.5px solid var(--milo-text); box-shadow:var(--milo-shadow-md); z-index:2; background:#FAF0EC;">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
              alt="Rohan"
              style="width:100%; height:100%; object-fit:cover;"
            />
          </div>

          <!-- Flowing Connecting Ribbon SVG -->
          <div style="width:120px; height:60px; margin:0 -10px; z-index:1;">
            <svg width="100%" height="100%" viewBox="0 0 120 60" fill="none">
              <path d="M5 30 C 35 5, 85 55, 115 30" stroke="#D97757" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
              </path>
              <circle cx="60" cy="30" r="6" fill="#D97757">
                <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <!-- Priya Avatar -->
          <div style="width:64px; height:64px; border-radius:50%; overflow:hidden; border:2.5px solid var(--milo-text); box-shadow:var(--milo-shadow-md); z-index:2; background:#FAF0EC;">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" 
              alt="Priya"
              style="width:100%; height:100%; object-fit:cover;"
            />
          </div>
        </div>

        <h1 style="font-family: var(--milo-font-display); font-size: 1.65rem; font-weight:400; text-align:center; line-height:1.25; margin:0 0 20px; color:var(--milo-text);">
          Okay. I have a pretty good idea of you two.
        </h1>

        <!-- Step-by-step intelligence checklist -->
        <div class="milo-checklist">
          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Getting a feel for what you both like</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Leaving out the absolute no-go's</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Finding places in your preferred areas</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Checking what's actually available</span>
          </div>

          <div class="milo-check-item">
            <div class="milo-check-icon milo-check-done">✓</div>
            <span>Picking a few worth showing you</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="font-size: 0.9rem; font-weight: 500; color: var(--milo-text-secondary); font-style: italic; margin: 0;">
            Give me a second. I'm being picky.
          </p>
        </div>
      </div>

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
