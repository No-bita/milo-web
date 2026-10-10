// ==========================================================
// MILO — THRESHOLD MOMENT
// Crossfade from reflection (ivory) to immersion (obsidian).
// Auto-advances after ~1.8s or skips on tap.
// ==========================================================

import { store } from '../domain/store.js';

export function renderThreshold(sessionId = 'aarav') {
  return `
    <div class="milo-threshold-container" data-session-id="${sessionId}">
      <div class="milo-threshold-content">
        <h1 class="milo-threshold-title">Got it. Let's find you something.</h1>
      </div>
    </div>
  `;
}

export function attachThresholdListeners(container, sessionId = 'aarav') {
  const el = container.querySelector(`.milo-threshold-container[data-session-id="${sessionId}"]`);
  if (!el) return;

  let timer = null;
  const advance = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    store.advanceToS2(sessionId);
  };

  container.thresholdCleanup = () => { if (timer) clearTimeout(timer); timer = null; };

  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Auto-advance after 900ms (or 100ms if reduced motion is preferred)
  timer = setTimeout(advance, reduced ? 100 : 900);

  // Tap anywhere to skip
  el.addEventListener('click', advance);

  // Keyboard accessibility to skip
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Continue to discovery deck');
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      advance();
    }
  });
}
