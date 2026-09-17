// ==========================================================
// MILO V2 — SCREEN 6: PREFERENCES + LOCALITY (INVITEE)
// Unified visual flow: Taste → Place → Done
// Preserves selections and updates invitee.softPreferences & invitee.localities
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export const PREFERENCE_TILES = [
  { id: 'fun', label: 'Something fun', assetKey: 'prefFun' },
  { id: 'food', label: 'Artisanal food', assetKey: 'prefFood' },
  { id: 'romantic', label: 'Romantic vibe', assetKey: 'prefRomantic' },
  { id: 'drinks', label: 'Cocktails & drinks', assetKey: 'prefDrinks' },
  { id: 'low-key', label: 'Cosy & low-key', assetKey: 'prefLowKey' },
  { id: 'outdoors', label: 'Green outdoors', assetKey: 'prefOutdoors' },
  { id: 'culture', label: 'Art & culture', assetKey: 'prefCulture' },
  { id: 'stay-out-late', label: 'Stay out late', assetKey: 'prefStayOutLate' }
];

export const INVITEE_LOCALITIES = [
  { id: 'Indiranagar', name: 'Indiranagar', assetKey: 'localityIndiranagar' },
  { id: 'Koramangala', name: 'Koramangala', assetKey: 'localityKoramangala' },
  { id: 'HSR Layout', name: 'HSR Layout', assetKey: 'localityHSR' },
  { id: 'Anywhere in Bangalore', name: 'Anywhere in Bangalore', assetKey: 'localityAnywhere' }
];

export function renderScreen06() {
  const state = getState();
  const selectedPrefs = new Set(state.invitee?.softPreferences || state.invitee?.preferences || ['fun', 'romantic']);
  const selectedLocs = new Set(state.invitee?.localities || [state.invitee?.preferredArea || 'Indiranagar']);

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Top Nav & Progress -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen6Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Preferences</span>
          <div style="width: 32px;"></div>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 50%;"></div>
        </div>

        <!-- 1. TASTE SECTION -->
        <h1 class="milo-screen-h1" style="margin-top: 16px;">Tell me what you're into.</h1>
        <p class="milo-screen-subhead">
          Pick anything that sounds good for tonight.
        </p>

        <!-- 2-Column Photo Preference Grid -->
        <div class="milo-pref-grid" style="margin-bottom: 28px;">
          ${PREFERENCE_TILES.map(item => {
            const isSelected = selectedPrefs.has(item.id);
            return `
              <div class="milo-pref-card ${isSelected ? 'selected' : ''}" data-pref="${item.id}">
                ${renderImageHtml(item.assetKey)}
                <div class="milo-pref-scrim"></div>
                <div class="milo-pref-title">${item.label}</div>
                ${isSelected ? '<div class="milo-pref-badge">✓</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- 2. PLACE SECTION -->
        <h2 style="font-family: var(--milo-font-display); font-size: 1.5rem; font-weight:400; margin: 0 0 6px; color: var(--milo-text);">
          And where would you be happy going?
        </h2>
        <p class="milo-screen-subhead" style="margin-bottom: 14px;">
          Pick the areas you'd easily travel to.
        </p>

        <!-- 2-Column Photo Locality Grid for Invitee -->
        <div class="milo-locality-grid" style="margin-bottom: 20px;">
          ${INVITEE_LOCALITIES.map(loc => {
            const isSelected = selectedLocs.has(loc.id);
            const isBanner = loc.id === 'Anywhere in Bangalore';
            if (isBanner) {
              return `
                <div class="milo-locality-banner ${isSelected ? 'selected' : ''}" data-invitee-loc="${loc.id}">
                  ${renderImageHtml(loc.assetKey)}
                  <div class="milo-locality-scrim"></div>
                  <div class="milo-locality-label" style="display:flex; align-items:center; justify-content:space-between;">
                    <span>${loc.name}</span>
                    ${isSelected ? '<div class="milo-locality-check" style="position:static;">✓</div>' : ''}
                  </div>
                </div>
              `;
            }
            return `
              <div class="milo-locality-card ${isSelected ? 'selected' : ''}" data-invitee-loc="${loc.id}">
                ${renderImageHtml(loc.assetKey)}
                <div class="milo-locality-scrim"></div>
                <div class="milo-locality-label">${loc.name}</div>
                ${isSelected ? '<div class="milo-locality-check">✓</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. DONE CTA -->
      <div class="milo-action-footer" style="margin-top: 16px;">
        <button class="milo-btn-primary" id="btnScreen6Continue">
          Got it. Next: Practical stuff →
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

  // Preference selection toggle
  container.querySelectorAll('[data-pref]').forEach(tile => {
    tile.addEventListener('click', () => {
      const prefId = tile.getAttribute('data-pref');
      const state = getState();
      const current = new Set(state.invitee?.softPreferences || state.invitee?.preferences || []);
      if (current.has(prefId)) {
        current.delete(prefId);
      } else {
        current.add(prefId);
      }
      const updatedList = Array.from(current);
      setState({
        invitee: {
          ...state.invitee,
          softPreferences: updatedList,
          preferences: updatedList
        }
      });
    });
  });

  // Locality selection toggle
  container.querySelectorAll('[data-invitee-loc]').forEach(card => {
    card.addEventListener('click', () => {
      const locId = card.getAttribute('data-invitee-loc');
      let updatedLocalities;
      if (locId === 'Anywhere in Bangalore') {
        updatedLocalities = ['Anywhere in Bangalore'];
      } else {
        updatedLocalities = [locId];
      }
      setState({
        invitee: {
          ...getState().invitee,
          localities: updatedLocalities,
          preferredArea: updatedLocalities[0]
        }
      });
    });
  });
}
