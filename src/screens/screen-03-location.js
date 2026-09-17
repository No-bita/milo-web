// ==========================================================
// MILO V2 — SCREEN 3: WHERE DO YOU WANT TO GO?
// Visual 2-column photo grid + full-width "Anywhere" banner
// Updates planner.localities in state.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export const POPULAR_LOCALITIES = [
  { id: 'Indiranagar', name: 'Indiranagar', assetKey: 'localityIndiranagar' },
  { id: 'Koramangala', name: 'Koramangala', assetKey: 'localityKoramangala' },
  { id: 'HSR Layout', name: 'HSR Layout', assetKey: 'localityHSR' },
  { id: 'Church Street', name: 'Church Street', assetKey: 'localityChurchStreet' },
  { id: 'JP Nagar', name: 'JP Nagar', assetKey: 'localityJPNagar' },
  { id: 'Whitefield', name: 'Whitefield', assetKey: 'localityWhitefield' }
];

export function renderScreen03() {
  const state = getState();
  const selectedLocalities = state.planner?.localities || [state.planner?.preferredArea || 'Indiranagar'];
  const isAnywhere = selectedLocalities.includes('Anywhere') || selectedLocalities.includes('Anywhere in Bangalore');

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Nav Header & Progress -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen3Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Locality</span>
          <div style="width: 32px;"></div>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 66%;"></div>
        </div>

        <h1 class="milo-screen-h1" style="margin-top: 16px;">Where feels good?</h1>
        <p class="milo-screen-subhead">
          Pick the neighborhood you'd love to spend the evening in.
        </p>

        <!-- 2-Column Locality Photo Grid -->
        <div class="milo-locality-grid" id="localityGrid">
          ${POPULAR_LOCALITIES.map(loc => {
            const isSelected = !isAnywhere && selectedLocalities.includes(loc.id);
            return `
              <div class="milo-locality-card ${isSelected ? 'selected' : ''}" data-loc="${loc.id}">
                ${renderImageHtml(loc.assetKey)}
                <div class="milo-locality-scrim"></div>
                <div class="milo-locality-label">${loc.name}</div>
                ${isSelected ? '<div class="milo-locality-check">✓</div>' : ''}
              </div>
            `;
          }).join('')}

          <!-- Full-Width Panoramic Banner: Anywhere -->
          <div class="milo-locality-banner ${isAnywhere ? 'selected' : ''}" data-loc="Anywhere in Bangalore">
            ${renderImageHtml('localityAnywhere')}
            <div class="milo-locality-scrim"></div>
            <div class="milo-locality-label" style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div>Anywhere in Bangalore</div>
                <span style="font-size: 0.75rem; font-weight: 400; opacity: 0.9;">Milo will pick the best spot across the city</span>
              </div>
              ${isAnywhere ? '<div class="milo-locality-check" style="position:static;">✓</div>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer" style="margin-top: 20px;">
        <button class="milo-btn-primary" id="btnScreen3Continue">
          Next: Invite your date →
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

  // Locality cards selection
  container.querySelectorAll('[data-loc]').forEach(card => {
    card.addEventListener('click', () => {
      const locId = card.getAttribute('data-loc');
      let updatedLocalities;
      if (locId === 'Anywhere in Bangalore' || locId === 'Anywhere') {
        updatedLocalities = ['Anywhere in Bangalore'];
      } else {
        updatedLocalities = [locId];
      }
      setState({
        planner: {
          ...getState().planner,
          localities: updatedLocalities,
          preferredArea: updatedLocalities[0]
        }
      });
    });
  });
}
