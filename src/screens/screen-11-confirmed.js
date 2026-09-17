// ==========================================================
// MILO V2 — SCREEN 11: BOOKED DATE SUMMARY
// Venue photography header, green checkmark badge,
// dynamic date info, and calendar / date details actions.
// ==========================================================

import { getState, nextScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';
import { getDemoDateInfo } from '../data/demo-date.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen11() {
  const state = getState();
  const selectedOption = getSelectedDateOption();
  const dateInfo = getDemoDateInfo(state.dateContext?.date, state.dateContext?.time);

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Confetti & Celebration Header -->
        <div style="display:flex; flex-direction:column; align-items:center; margin: 16px 0 16px; position:relative;">
          <!-- Green Success Badge -->
          <div style="width:64px; height:64px; border-radius:50%; background:var(--milo-green); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:1.8rem; box-shadow:0 8px 24px rgba(46, 125, 50, 0.25); margin-bottom:12px;">
            ✓
          </div>

          <h1 style="font-family:var(--milo-font-display); font-size: 2.1rem; font-weight:400; line-height:1.1; margin:0 0 4px; color:var(--milo-text);">
            It's booked. ❤️
          </h1>
          <p style="font-size: 0.95rem; color: var(--milo-text-secondary); margin:0;">
            ${dateInfo.weekdayFull} evening is officially spoken for.
          </p>
        </div>

        <!-- Confirmed Experience Summary Card -->
        <div class="milo-card" style="padding:0; overflow:hidden; border-radius:var(--milo-radius-xl); box-shadow:var(--milo-shadow-md); margin-bottom:16px;">
          <div style="width:100%; height:150px; position:relative; overflow:hidden;">
            ${renderImageHtml(selectedOption.imageKey || 'potteryWorkshop')}
            <div style="position:absolute; bottom:10px; left:12px; background:rgba(255,255,255,0.94); backdrop-filter:blur(6px); border-radius:var(--milo-radius-full); padding:4px 12px; font-size:0.75rem; font-weight:700; color:var(--milo-green); display:flex; align-items:center; gap:4px;">
              <span>✓</span> Confirmed with venue
            </div>
          </div>

          <div style="padding:16px;">
            <h2 style="font-family:var(--milo-font-display); font-size:1.4rem; margin:0 0 4px; color:var(--milo-text);">
              ${selectedOption.title}
            </h2>
            <div style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary); margin-bottom:14px;">
              ${dateInfo.formattedFull} · ${dateInfo.formattedTime}
            </div>

            <!-- Venues Breakdown -->
            <div style="display:flex; flex-direction:column; gap:10px; padding:12px; background:var(--milo-card-subtle); border-radius:var(--milo-radius-md); margin-bottom:14px;">
              <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.85rem;">
                <span style="font-size:1.1rem;">🎨</span>
                <div>
                  <strong>Clayful Studio</strong>
                  <div style="font-size:0.75rem; color:var(--milo-text-secondary);">Hands-on Pottery · 7:30 PM</div>
                </div>
              </div>

              <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.85rem;">
                <span style="font-size:1.1rem;">🍨</span>
                <div>
                  <strong>Drift</strong>
                  <div style="font-size:0.75rem; color:var(--milo-text-secondary);">Artisanal Dessert · 8:45 PM</div>
                </div>
              </div>
            </div>

            <!-- Pricing Summary -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--milo-border-light); padding-top:12px;">
              <div>
                <strong style="font-size:0.95rem; color:var(--milo-text);">${selectedOption.confirmedTotal}</strong>
                <div style="font-size:0.75rem; color:var(--milo-text-secondary);">${selectedOption.confirmedPerPerson}</div>
              </div>
              <button class="milo-text-link" id="btnViewPaymentDetails" style="font-size:0.8rem; padding:0;">
                Details
              </button>
            </div>
          </div>
        </div>

        <div id="confirmedToast" style="min-height:22px; font-size:0.85rem; font-weight:600; color:var(--milo-green); text-align:center; margin-bottom:8px;"></div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnAddToCalendar">
          Add to calendar
        </button>
        <button class="milo-btn-secondary" id="btnShareConfirmed">
          View date details & directions →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen11Listeners(container) {
  const addCalBtn = container.querySelector('#btnAddToCalendar');
  const toast = container.querySelector('#confirmedToast');

  if (addCalBtn) {
    addCalBtn.addEventListener('click', () => {
      if (toast) toast.textContent = 'Done. Added to your calendar! ✨';
      setTimeout(() => { if (toast) toast.textContent = ''; }, 3500);
    });
  }

  const shareBtn = container.querySelector('#btnShareConfirmed');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => nextScreen());
  }

  const payBtn = container.querySelector('#btnViewPaymentDetails');
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      alert("Clayful Studio: ₹1,500 + Drift reserve: ₹800 = ₹2,300 total.");
    });
  }
}
