// ==========================================================
// MILO V2 — SCREEN 7: PRACTICAL DETAILS (HARD CONSTRAINTS)
// "A few practical things"
// Collects budget, travel tolerance, and hard constraints
// (strictly enforced by the recommendation engine!).
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export function renderScreen07() {
  const state = getState();
  const hardNos = new Set(state.invitee?.hardNo || ['no-alcohol', 'no-outdoor']);

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen7Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:700; color:var(--milo-text-secondary); letter-spacing:-0.01em;">A few details</span>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 100%;"></div>
        </div>

        <h1 class="milo-screen-h1">A couple of things I should know.</h1>
        <p class="milo-screen-subhead">
          The little things matter. I'd rather know now than book you somewhere you'll regret.
        </p>

        <!-- Budget Question -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--milo-text); display: block; margin-bottom: 8px;">
            How much are we spending?
          </label>
          <div class="milo-segmented">
            <button class="milo-segmented-btn" data-budget="₹">₹ Keep it easy</button>
            <button class="milo-segmented-btn selected" data-budget="₹₹">₹₹ Comfortable</button>
            <button class="milo-segmented-btn" data-budget="₹₹₹">₹₹₹ Let's make a night of it</button>
          </div>
        </div>

        <!-- Preferred Area for Invitee -->
        <div style="margin-bottom: 22px;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--milo-text); display: block; margin-bottom: 8px;">
            Where would you like to go?
          </label>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="milo-pill ${state.invitee?.preferredArea === 'Indiranagar' ? 'selected' : ''}" data-invitee-area="Indiranagar" style="text-align:left; padding:11px 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>Indiranagar <span style="font-size:0.75rem; color:var(--milo-accent);">(Matches ${state.planner?.name || 'Rohan'})</span></span>
              <span>📍</span>
            </button>
            <button class="milo-pill ${state.invitee?.preferredArea === 'Koramangala' ? 'selected' : ''}" data-invitee-area="Koramangala" style="text-align:left; padding:11px 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>Koramangala</span>
              <span>📍</span>
            </button>
            <button class="milo-pill ${state.invitee?.preferredArea === 'Anywhere' ? 'selected' : ''}" data-invitee-area="Anywhere" style="text-align:left; padding:11px 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>Anywhere in Bangalore</span>
              <span>✨</span>
            </button>
          </div>
        </div>

        <!-- Hard No's Section -->
        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--milo-text); display: block; margin-bottom: 4px;">
            Anything you really don't want?
          </label>
          <span style="font-size: 0.775rem; color: var(--milo-text-secondary); display: block; margin-bottom: 10px;">
            No judgement. This is exactly the sort of thing I should know.
          </span>
          <div class="milo-chip-group" style="margin: 0; gap:8px;">
            <button class="milo-tag-dismiss ${hardNos.has('no-alcohol') ? 'active' : ''}" data-hardno="no-alcohol">
              No alcohol ${hardNos.has('no-alcohol') ? '×' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardNos.has('no-outdoor') ? 'active' : ''}" data-hardno="no-outdoor">
              No outdoor seating ${hardNos.has('no-outdoor') ? '×' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardNos.has('vegetarian') ? 'active' : ''}" data-hardno="vegetarian">
              Vegetarian only ${hardNos.has('vegetarian') ? '×' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardNos.has('no-loud-places') ? 'active' : ''}" data-hardno="no-loud-places">
              No loud places ${hardNos.has('no-loud-places') ? '×' : '+'}
            </button>
            <button class="milo-tag-dismiss ${hardNos.has('no-spicy') ? 'active' : ''}" data-hardno="no-spicy">
              No spicy food ${hardNos.has('no-spicy') ? '×' : '+'}
            </button>
            <button class="milo-tag-dismiss" id="btnAddAnotherHardNo" style="border-style:dashed;">
              Something else
            </button>
          </div>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen7Continue">
          Continue →
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

  // Budget
  container.querySelectorAll('[data-budget]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('[data-budget]').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
    });
  });

  // Invitee area selection
  container.querySelectorAll('[data-invitee-area]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const area = e.currentTarget.getAttribute('data-invitee-area');
      setState({ invitee: { ...getState().invitee, preferredArea: area } });
    });
  });

  // Hard No's toggles
  container.querySelectorAll('[data-hardno]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-hardno');
      const state = getState();
      const current = new Set(state.invitee?.hardNo || []);
      if (current.has(code)) {
        current.delete(code);
      } else {
        current.add(code);
      }
      setState({ invitee: { ...state.invitee, hardNo: Array.from(current) } });
    });
  });

  const addAnother = container.querySelector('#btnAddAnotherHardNo');
  if (addAnother) {
    addAnother.addEventListener('click', () => {
      const custom = prompt('Enter any other hard dealbreaker (e.g., No spicy food):');
      if (custom) {
        alert(`Milo will strictly avoid: "${custom}"`);
      }
    });
  }
}
