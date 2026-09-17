// ==========================================================
// MILO V2 — SCREEN 1: WELCOME / LANDING
// "You picked the person. I'll plan the evening."
// ==========================================================

import { nextScreen } from '../state.js';

export function renderScreen01() {
  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div style="margin-top: 12px; margin-bottom: 24px;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <h2 style="font-family: var(--milo-font-display); font-size: 2.2rem; font-weight: 400; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; color: var(--milo-text);">
          You picked the person.<br/>I'll handle the plans.
        </h2>

        <p style="font-size: 0.95rem; line-height: 1.5; color: var(--milo-text-secondary); margin: 0 0 20px;">
          Tell me a little about the two of you. I'll find something you'll both like.
        </p>

        <!-- Hero Couple Photo -->
        <div style="width: 100%; height: 260px; border-radius: var(--milo-radius-lg); overflow: hidden; position: relative; box-shadow: var(--milo-shadow-md); margin-bottom: 16px;">
          <img 
            src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80" 
            alt="Couple enjoying evening sunset overlooking Bangalore skyline"
            style="width:100%; height:100%; object-fit:cover;"
          />
          <div style="position:absolute; bottom:0; left:0; right:0; height:70px; background:linear-gradient(to top, rgba(26,24,20,0.5), transparent);"></div>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen1Continue">
          Plan my date →
        </button>
        <span style="font-size: 0.75rem; color: var(--milo-text-muted); margin-top: 4px;">
          Not a dating app. Just better dates.
        </span>
      </div>
    </div>
  `;
}

export function attachScreen01Listeners(container) {
  const btn = container.querySelector('#btnScreen1Continue');
  if (btn) {
    btn.addEventListener('click', () => nextScreen());
  }
}
