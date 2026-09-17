// ==========================================================
// MILO V2 — SCREEN 3: WHERE DO YOU WANT TO GO?
// Locality selection as a human constraint, without false
// travel-time promises or routing algorithm overhead.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export const POPULAR_LOCALITIES = [
  { id: 'Indiranagar', name: 'Indiranagar', desc: 'Good food. Good energy.' },
  { id: 'Koramangala', name: 'Koramangala', desc: 'Lots to do. Plenty of places to disappear into.' },
  { id: 'HSR Layout', name: 'HSR Layout', desc: 'Chill, easy, neighbourhood-y.' },
  { id: 'Church Street', name: 'Church Street / CBD', desc: 'Books, art, comedy & city buzz.' },
  { id: 'JP Nagar', name: 'JP Nagar', desc: 'Green spaces & cosy spots.' },
  { id: 'Whitefield', name: 'Whitefield', desc: 'Dinner, drinks & a little breathing room.' },
  { id: 'Anywhere', name: 'Anywhere in Bangalore', desc: "I'm happy to do the hunting." }
];

export function renderScreen03() {
  const state = getState();
  const selectedArea = state.planner?.preferredArea || 'Indiranagar';

  const localitiesHtml = POPULAR_LOCALITIES.map(loc => {
    const isSelected = selectedArea === loc.id;
    return `
      <div 
        class="milo-card" 
        data-area="${loc.id}"
        style="
          padding: 12px 14px; 
          margin: 0; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          border: 1.5px solid ${isSelected ? 'var(--milo-text)' : 'var(--milo-border)'};
          background: #FFFFFF;
          border-radius: var(--milo-radius-md);
          transition: all 0.15s ease;
          box-shadow: ${isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'var(--milo-shadow-sm)'};
        "
      >
        <div>
          <strong style="font-size: 0.9rem; color: var(--milo-text); display: block;">
            ${loc.name}
          </strong>
          <span style="font-size: 0.775rem; color: var(--milo-text-secondary);">
            ${loc.desc}
          </span>
        </div>
        <div style="
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 2px solid ${isSelected ? 'var(--milo-text)' : '#D4CCC2'}; 
          background: ${isSelected ? 'var(--milo-text)' : 'transparent'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          ${isSelected ? '<span style="color:#FFF; font-size:0.65rem;">✓</span>' : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen3Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:700; color:var(--milo-text-secondary); letter-spacing:-0.01em;">Locality</span>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 66%;"></div>
        </div>

        <h1 class="milo-screen-h1">Where do you want to go?</h1>
        <p class="milo-screen-subhead">
          Pick an area you like. I'll find the good stuff nearby.
        </p>

        <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 8px;">
          Popular around Bangalore
        </label>

        <!-- Localities List -->
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${localitiesHtml}
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen3Continue">
          Tell me where to look →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen03Listeners(container) {
  const backBtn = container.querySelector('#btnScreen3Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen3Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  // Locality cards
  container.querySelectorAll('[data-area]').forEach(card => {
    card.addEventListener('click', (e) => {
      const area = e.currentTarget.getAttribute('data-area');
      setState({ planner: { ...getState().planner, preferredArea: area } });
    });
  });
}
