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
    store.advanceToS2(sessionId);
  };

  container.thresholdCleanup = () => { if (timer) clearTimeout(timer); timer = null; };

  // Auto-advance after 1.8s
  timer = setTimeout(advance, 1800);

  // Tap anywhere to skip
  el.addEventListener('click', advance);
}
