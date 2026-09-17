// ==========================================================
// MILO V2 — SCREEN 14: REMINDERS
// Clean iOS switch cards for departure nudges and arrival moments.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export function renderScreen14() {
  const state = getState();
  const reminders = state.reminders || { twoHours: true, thirtyMinutes: true, atVenue: true };

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen14Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Reminders</span>
          <div style="width: 32px;"></div>
        </div>

        <h1 class="milo-screen-h1" style="margin-top: 16px;">I'll remind you.<br/>You just enjoy the date.</h1>
        <p class="milo-screen-subhead">
          A couple of quiet nudges so you never have to worry about checking the clock.
        </p>

        <!-- Switch Rows Container -->
        <div class="milo-card" style="padding: 6px 18px; margin-bottom: 20px; box-shadow: var(--milo-shadow-sm);">
          <!-- 2 hours before -->
          <div class="milo-switch-row">
            <div style="padding-right:12px;">
              <strong style="font-size:0.92rem; color:var(--milo-text); display:block;">2 hours before</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Time to get ready & dress up</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchTwoHours" ${reminders.twoHours ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>

          <!-- 30 minutes before -->
          <div class="milo-switch-row">
            <div style="padding-right:12px;">
              <strong style="font-size:0.92rem; color:var(--milo-text); display:block;">30 minutes before</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Traffic check & time to head out</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchThirtyMins" ${reminders.thirtyMinutes ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>

          <!-- At the venue -->
          <div class="milo-switch-row" style="border-bottom:none;">
            <div style="padding-right:12px;">
              <strong style="font-size:0.92rem; color:var(--milo-text); display:block;">At the venue</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">You're here. Put the phone away ❤️</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchAtVenue" ${reminders.atVenue ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>
        </div>

        <div style="text-align: center; margin-top: 12px;">
          <div class="milo-handwritten" style="font-size: 1.3rem;">
            "Put your phone away once you get there." ♡ — Milo
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen14Continue">
          Continue to Feedback →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen14Listeners(container) {
  const backBtn = container.querySelector('#btnScreen14Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen14Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  // Switches
  const sw2 = container.querySelector('#switchTwoHours');
  const sw30 = container.querySelector('#switchThirtyMins');
  const swVenue = container.querySelector('#switchAtVenue');

  function saveReminders() {
    setState({
      reminders: {
        twoHours: !!sw2?.checked,
        thirtyMinutes: !!sw30?.checked,
        atVenue: !!swVenue?.checked
      }
    });
  }

  if (sw2) sw2.addEventListener('change', saveReminders);
  if (sw30) sw30.addEventListener('change', saveReminders);
  if (swVenue) swVenue.addEventListener('change', saveReminders);
}
