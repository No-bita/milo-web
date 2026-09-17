// ==========================================================
// MILO V2 — SCREEN 6: YOUR PREFERENCES (SOFT PREFERENCES)
// "A few things Milo should know"
// Invitee (Priya) selects soft preferences via 3x3 grid.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export const PREFERENCE_TILES = [
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'drinks', label: 'Drinks', icon: '🍸' },
  { id: 'fun', label: 'Something fun', icon: '🎳' },
  { id: 'outdoors', label: 'Outdoors', icon: '🌲' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'romantic', label: 'Romantic', icon: '❤️' },
  { id: 'low-key', label: 'Low-key', icon: '🛋️' },
  { id: 'stay-out-late', label: 'Stay out late', icon: '🌙' },
  { id: 'surprise', label: 'Surprise me', icon: '✨' }
];

export function renderScreen06() {
  const state = getState();
  const selectedPrefs = new Set(state.invitee?.preferences || ['fun', 'romantic']);

  const gridHtml = PREFERENCE_TILES.map(item => {
    const isSelected = selectedPrefs.has(item.id);
    return `
      <div 
        class="milo-pref-tile ${isSelected ? 'active' : ''}" 
        data-pref="${item.id}"
        style="
          background: ${isSelected ? '#FFFFFF' : '#FFFFFF'};
          border: 1.5px solid ${isSelected ? 'var(--milo-text)' : 'var(--milo-border)'};
          border-radius: var(--milo-radius-md);
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: ${isSelected ? '0 3px 8px rgba(0,0,0,0.08)' : 'var(--milo-shadow-sm)'};
        "
      >
        <span style="font-size: 1.5rem;">${item.icon}</span>
        <span style="font-size: 0.8rem; font-weight: ${isSelected ? '700' : '500'}; color: var(--milo-text); text-align: center;">
          ${item.label}
        </span>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen6Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:700; color:var(--milo-text-secondary); letter-spacing:-0.01em;">Preferences</span>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 50%;"></div>
        </div>

        <h1 class="milo-screen-h1">Tell me what you're into.</h1>
        <p class="milo-screen-subhead">
          Pick whatever sounds good tonight. And yes, “surprise me” is allowed.
        </p>

        <label style="font-size: 0.85rem; font-weight: 600; color: var(--milo-text); display: block; margin-bottom: 12px;">
          What's your kind of evening?
        </label>

        <!-- 3x3 Preferences Grid -->
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
          ${gridHtml}
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen6Continue">
          Continue →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen06Listeners(container) {
  const backBtn = container.querySelector('#btnScreen6Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen6Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  // Tile clicks
  container.querySelectorAll('[data-pref]').forEach(tile => {
    tile.addEventListener('click', (e) => {
      const prefId = e.currentTarget.getAttribute('data-pref');
      const state = getState();
      const current = new Set(state.invitee?.preferences || []);
      if (current.has(prefId)) {
        current.delete(prefId);
      } else {
        current.add(prefId);
      }
      setState({ invitee: { ...state.invitee, preferences: Array.from(current) } });
    });
  });
}
