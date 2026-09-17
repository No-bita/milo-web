// ==========================================================
// MILO V2 — SCREEN 14: REMINDERS
// "Milo's got you covered"
// Helpful reminder toggle switches and traffic alerts.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export function renderScreen14() {
  const state = getState();
  const reminders = state.reminders || { twoHours: true, thirtyMinutes: true, atVenue: true };

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen14Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:600; color:var(--milo-text-secondary);">Reminders</span>
        </div>

        <h1 class="milo-screen-h1">I'll remind you. You enjoy the date.</h1>
        <p class="milo-screen-subhead">
          A couple of nudges so you don't have to keep checking the clock.
        </p>

        <!-- Switch Rows Container -->
        <div class="milo-card" style="padding:4px 16px; margin-bottom:18px;">
          <!-- 2 hours before -->
          <div class="milo-switch-row">
            <div style="padding-right:12px;">
              <strong style="font-size:0.9rem; color:var(--milo-text); display:block;">2 hours before</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Time to get ready</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchTwoHours" ${reminders.twoHours ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>

          <!-- 30 minutes before -->
          <div class="milo-switch-row">
            <div style="padding-right:12px;">
              <strong style="font-size:0.9rem; color:var(--milo-text); display:block;">30 minutes before</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Time to head out</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchThirtyMins" ${reminders.thirtyMinutes ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>

          <!-- At the venue -->
          <div class="milo-switch-row" style="border-bottom:none;">
            <div style="padding-right:12px;">
              <strong style="font-size:0.9rem; color:var(--milo-text); display:block;">At the venue</strong>
              <span style="font-size:0.8rem; color:var(--milo-text-secondary);">You're here. Have fun. ❤️</span>
            </div>
            <label class="milo-switch">
              <input type="checkbox" id="switchAtVenue" ${reminders.atVenue ? 'checked' : ''} />
              <span class="milo-slider"></span>
            </label>
          </div>
        </div>
      </div>

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
