// ==========================================================
// MILO V2 — SCREEN 13: DAY OF DATE
// Atmospheric evening night photography, live countdown mood,
// directions, and "I'm running late" graceful assistance.
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';
import { getDemoDateInfo } from '../data/demo-date.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen13() {
  const state = getState();
  const selectedOption = getSelectedDateOption();
  const dateInfo = getDemoDateInfo(state.dateContext?.date, state.dateContext?.time);

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen13Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Tonight</span>
          <div style="width: 32px;"></div>
        </div>

        <!-- Atmospheric Night Hero Photo -->
        <div style="width:100%; height:200px; border-radius:var(--milo-radius-xl); overflow:hidden; position:relative; box-shadow:var(--milo-shadow-md); margin: 12px 0 16px;">
          ${renderImageHtml('dayOfDateNight')}
          <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(26,24,20,0.85) 100%);"></div>
          <div style="position:absolute; bottom:16px; left:16px; right:16px; color:#FFFFFF;">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#F5D0C5; margin-bottom:2px;">
              Good dates start soon
            </div>
            <h1 style="font-family:var(--milo-font-display); font-size:1.8rem; line-height:1.15; margin:0; color:#FFFFFF;">
              Tonight's the night. ✨
            </h1>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h2 style="font-family:var(--milo-font-display); font-size:1.3rem; margin:0 0 4px; color:var(--milo-text);">
            ${selectedOption.title}
          </h2>
          <p style="font-size:0.9rem; color:var(--milo-text-secondary); margin:0;">
            You've got about 2 hours. Plenty of time to head over and relax.
          </p>
        </div>

        <!-- Details Card -->
        <div class="milo-card" style="text-align:center; padding:16px; background:#FFFFFF; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-around; align-items:center; font-size:0.9rem; color:var(--milo-text);">
            <div>
              <span style="color:var(--milo-text-secondary); display:block; font-size:0.75rem; text-transform:uppercase;">Time</span>
              <strong>${dateInfo.formattedTime}</strong>
            </div>
            <div style="width:1px; height:28px; background:var(--milo-border);"></div>
            <div>
              <span style="color:var(--milo-text-secondary); display:block; font-size:0.75rem; text-transform:uppercase;">First Stop</span>
              <strong>Clayful Studio</strong>
            </div>
            <div style="width:1px; height:28px; background:var(--milo-border);"></div>
            <div>
              <span style="color:var(--milo-text-secondary); display:block; font-size:0.75rem; text-transform:uppercase;">Area</span>
              <strong>${selectedOption.area}</strong>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="milo-btn-primary" id="btnDayOfNavigate">
            Get directions →
          </button>
          <button class="milo-btn-secondary" id="btnRunningLate" style="padding:11px; font-size:0.85rem; color:var(--milo-terracotta);">
            I'm running a little late
          </button>
        </div>
        <div id="runningLateToast" style="min-height:20px; font-size:0.825rem; font-weight:600; color:var(--milo-terracotta); text-align:center; margin-top:8px;"></div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-text-link" id="btnScreen13Continue">
          Preview Reminders Mode →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen13Listeners(container) {
  const backBtn = container.querySelector('#btnScreen13Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen13Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  const navBtn = container.querySelector('#btnDayOfNavigate');
  if (navBtn) navBtn.addEventListener('click', () => alert("Opening navigation to Indiranagar... 🚗"));

  const lateBtn = container.querySelector('#btnRunningLate');
  const toast = container.querySelector('#runningLateToast');
  if (lateBtn) {
    lateBtn.addEventListener('click', () => {
      if (toast) {
        toast.textContent = "I'll let them know you're on your way. No stress.";
        setTimeout(() => { if (toast) toast.textContent = ''; }, 3500);
      }
    });
  }
}
