// ==========================================================
// MILO V2 — SCREEN 13: DAY OF DATE
// "Tonight's the night ✨"
// Live countdown, departure advisory, live location sharing,
// and "I'm running late" quick assistance.
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';

export function renderScreen13() {
  const selectedOption = getSelectedDateOption();

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen13Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:600; color:var(--milo-text-secondary);">Day of Date</span>
        </div>

        <div style="margin-bottom: 14px;">
          <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--milo-accent);">
            Good dates start soon.
          </span>
          <h1 class="milo-screen-h1" style="font-size:1.8rem; margin:2px 0 4px;">
            Tonight's the night. ✨
          </h1>
          <p style="font-size:1rem; font-weight:600; color:var(--milo-text); margin:0 0 4px;">
            ${selectedOption.title}
          </p>
          <p style="font-size:0.85rem; color:var(--milo-text-secondary); margin:0;">
            You've got 2h 15m. Go make yourself look effortlessly good.
          </p>
        </div>

        <!-- Polaroid Style Banner -->
        <div style="background:#FFFFFF; padding:10px 10px 18px; border-radius:var(--milo-radius-md); box-shadow:var(--milo-shadow-md); margin-bottom:16px; border:1px solid var(--milo-border);">
          <div style="width:100%; height:130px; border-radius:var(--milo-radius-sm); overflow:hidden; margin-bottom:10px;">
            <img 
              src="${selectedOption.image}" 
              alt="${selectedOption.title}"
              style="width:100%; height:100%; object-fit:cover;"
            />
          </div>
          <div style="text-align:right; padding-right:8px;">
            <span style="font-family:var(--milo-font-handwriting); font-size:1.3rem; color:#5B4F43;">
              Good dates make better days
            </span>
          </div>
        </div>

        <!-- Details Card -->
        <div class="milo-card" style="text-align:center; padding:16px; background:linear-gradient(180deg, #FFFFFF 0%, #FAF5EE 100%); margin-bottom:14px;">
          <div style="display:flex; justify-content:center; gap:24px; font-size:0.9rem; color:var(--milo-text);">
            <div>
              <span style="color:var(--milo-text-secondary); display:block; font-size:0.75rem;">Time</span>
              <strong>7:30 PM</strong>
            </div>
            <div style="border-left:1px solid #EAE3D9;"></div>
            <div>
              <span style="color:var(--milo-text-secondary); display:block; font-size:0.75rem;">Locality</span>
              <strong>Indiranagar</strong>
            </div>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button class="milo-btn-primary" id="btnDayOfNavigate">
            Get directions
          </button>
          <button class="milo-btn-secondary" id="btnRunningLate" style="padding:10px; font-size:0.85rem; color:#C85A32;">
            I'm running late
          </button>
        </div>
        <div id="runningLateToast" style="min-height:20px; font-size:0.825rem; font-weight:600; color:var(--milo-terracotta); text-align:center; margin-top:8px;"></div>
      </div>

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
  if (navBtn) navBtn.addEventListener('click', () => alert("Getting directions to Indiranagar... 🚗"));

  const lateBtn = container.querySelector('#btnRunningLate');
  const toast = container.querySelector('#runningLateToast');
  if (lateBtn) {
    lateBtn.addEventListener('click', () => {
      if (toast) {
        toast.textContent = "I'll let them know you're on your way.";
        setTimeout(() => { if (toast) toast.textContent = ''; }, 3500);
      } else {
        alert("I'll let them know you're on your way.");
      }
    });
  }
}
