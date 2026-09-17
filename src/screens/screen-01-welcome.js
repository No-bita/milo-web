// ==========================================================
// MILO V2 — SCREEN 1: WELCOME / LANDING
// Flawless vertical alignment:
// - Hero photo occupies top 58% of viewport
// - Dark charcoal bottom sheet occupies 42%
// - Content distributed: headline at top, CTA pinned at bottom
// - Zero empty black abyss or broken alignment
// ==========================================================

import { nextScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen01() {
  return `
    <div class="milo-screen-welcome">
      <!-- Hero Photography (56-58% of screen) -->
      <div class="milo-hero-welcome">
        <div class="milo-hero-brand">milo</div>
        ${renderImageHtml('heroWelcome', { className: 'milo-hero-img' })}
        <div class="milo-hero-scrim"></div>
      </div>

      <!-- Bottom Dark Charcoal Card (Pinned content, zero void) -->
      <div class="milo-hero-dark-card">
        <div class="milo-hero-copy">
          <h2 class="milo-hero-headline">
            You picked the person.<br/>
            <span>I'll handle the plans.</span>
          </h2>
          <p class="milo-hero-subhead">
            Tell me a little about the two of you. I'll find something you'll both genuinely enjoy.
          </p>
        </div>

        <div class="milo-hero-actions">
          <button class="milo-btn-primary" id="btnScreen1Continue" style="background: #FAF7F2; color: #1A1814; font-weight: 700; font-size: 1rem; min-height: 52px; border-radius: var(--milo-radius-full); box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
            Plan my date →
          </button>
          <div class="milo-hero-microcopy">
            Not a dating app. Just better dates.
          </div>
        </div>
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
