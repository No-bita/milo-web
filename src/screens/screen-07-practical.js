// ==========================================================
// MILO V2 — SCREEN 7: PRACTICAL DETAILS & CONSTRAINTS
// Connected avatars, budget selector, and hard constraint chips.
// Updates invitee.hardConstraints in state.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen07() {
  const state = getState();
  const hardConstraints = new Set(state.invitee?.hardConstraints || state.invitee?.hardNo || ['no-alcohol', 'no-outdoor']);

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Top Nav & Progress Bar -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen7Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Practical</span>
          <div style="width: 32px;"></div>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 100%;"></div>
        </div>

        <!-- Connected Avatars -->
        <div class="milo-connected-avatars">
          <div class="milo-avatar-circle">
            ${renderImageHtml('rohanAvatar')}
          </div>
          <div class="milo-avatar-connector">
            <div class="milo-avatar-heart">❤️</div>
          </div>
          <div class="milo-avatar-circle">
            ${renderImageHtml('priyaPortrait')}
          </div>
        </div>

        <h1 class="milo-screen-h1" style="text-align: center; margin-top: 8px;">A few practical things.</h1>
        <p class="milo-screen-subhead" style="text-align: center; margin-bottom: 24px;">
          I'd rather know your dealbreakers now than book somewhere either of you won't enjoy.
        </p>

        <!-- Budget Question -->
        <div style="margin-bottom: 24px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 10px;">
            How much are we spending?
          </label>
          <div class="milo-segmented">
            <button class="milo-segmented-btn" data-budget="₹">₹ Easy</button>
            <button class="milo-segmented-btn selected" data-budget="₹₹">₹₹ Comfortable</button>
            <button class="milo-segmented-btn" data-budget="₹₹₹">₹₹₹ Big night</button>
          </div>
        </div>

        <!-- Hard Constraints / Dealbreakers -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 4px;">
            Anything you strictly want to avoid?
          </label>
          <span style="font-size: 0.8rem; color: var(--milo-text-secondary); display: block; margin-bottom: 12px;">
            No judgment. Milo will filter these out with 100% certainty.
          </span>
          <div class="milo-chip-group" style="margin: 0; gap:8px;">
            <button class="milo-tag-dismiss ${hardConstraints.has('no-alcohol') ? 'active' : ''}" data-hardno="no-alcohol">
              No alcohol ${hardConstraints.has('no-alcohol') ? '✓' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardConstraints.has('no-outdoor') ? 'active' : ''}" data-hardno="no-outdoor">
              No outdoor seating ${hardConstraints.has('no-outdoor') ? '✓' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardConstraints.has('no-loud-places') ? 'active' : ''}" data-hardno="no-loud-places">
              No loud places ${hardConstraints.has('no-loud-places') ? '✓' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardConstraints.has('vegetarian') ? 'active' : ''}" data-hardno="vegetarian">
              Vegetarian only ${hardConstraints.has('vegetarian') ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen7Continue">
          Find our date →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen07Listeners(container) {
  const backBtn = container.querySelector('#btnScreen7Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen7Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  // Budget selector
  container.querySelectorAll('[data-budget]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('[data-budget]').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
    });
  });

  // Hard constraints toggle
  container.querySelectorAll('[data-hardno]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-hardno');
      const state = getState();
      const current = new Set(state.invitee?.hardConstraints || state.invitee?.hardNo || []);
      if (current.has(code)) {
        current.delete(code);
      } else {
        current.add(code);
      }
      const updated = Array.from(current);
      setState({
        invitee: {
          ...state.invitee,
          hardConstraints: updated,
          hardNo: updated
        }
      });
    });
  });
}
