// ==========================================================
// MILO V2 — SCREEN 12: DATE DETAILS
// Dual photographic cards for booked venues with directions,
// dynamic date info, and cab assistance.
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';
import { getDemoDateInfo } from '../data/demo-date.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen12() {
  const state = getState();
  const selectedOption = getSelectedDateOption();
  const dateInfo = getDemoDateInfo(state.dateContext?.date, state.dateContext?.time);

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen12Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Details</span>
          <div style="width: 32px;"></div>
        </div>

        <div style="margin-bottom: 14px;">
          <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--milo-terracotta);">
            Your evening, sorted.
          </span>
          <h1 class="milo-screen-h1" style="margin-top:2px; font-size:1.6rem;">
            ${selectedOption.title}
          </h1>
          <p style="font-size:0.88rem; font-weight:600; color:var(--milo-text-secondary); margin:0;">
            ${dateInfo.weekdayFull} · ${dateInfo.formattedTime}
          </p>
        </div>

        <!-- Venue 1 Card: Clayful Studio -->
        <div class="milo-card" style="padding:0; overflow:hidden; border-radius:var(--milo-radius-lg); margin-bottom:14px; box-shadow:var(--milo-shadow-sm);">
          <div style="height: 110px; position: relative; overflow:hidden;">
            ${renderImageHtml('potteryWorkshop')}
            <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.6), transparent);"></div>
            <div style="position:absolute; bottom:10px; left:14px; color:#FFFFFF;">
              <strong style="font-size:1.05rem; display:block;">Clayful Studio</strong>
              <span style="font-size:0.75rem; opacity:0.9;">Pottery Session · 7:30 PM</span>
            </div>
          </div>
          <div style="padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.8rem; color:var(--milo-text-secondary);">
              12th Main, Indiranagar
            </div>
            <button class="milo-btn-secondary" id="btnNavClayful" style="width:auto; padding:6px 14px; font-size:0.8rem;">
              Directions 📍
            </button>
          </div>
        </div>

        <!-- Venue 2 Card: Drift -->
        <div class="milo-card" style="padding:0; overflow:hidden; border-radius:var(--milo-radius-lg); margin-bottom:14px; box-shadow:var(--milo-shadow-sm);">
          <div style="height: 110px; position: relative; overflow:hidden;">
            ${renderImageHtml('dessertDrift')}
            <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.6), transparent);"></div>
            <div style="position:absolute; bottom:10px; left:14px; color:#FFFFFF;">
              <strong style="font-size:1.05rem; display:block;">Drift</strong>
              <span style="font-size:0.75rem; opacity:0.9;">Artisanal Dessert · 8:45 PM</span>
            </div>
          </div>
          <div style="padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.8rem; color:var(--milo-text-secondary);">
              100 Feet Road, Indiranagar
            </div>
            <button class="milo-btn-secondary" id="btnMapsDrift" style="width:auto; padding:6px 14px; font-size:0.8rem;">
              Directions 📍
            </button>
          </div>
        </div>

        <!-- Need a ride? -->
        <div class="milo-card" style="background:#FDFBF7; border-color:#EFE9DF; display:flex; justify-content:space-between; align-items:center; padding:12px 14px; margin-bottom:12px;">
          <div>
            <strong style="font-size:0.85rem; color:var(--milo-text); display:block;">Need a ride?</strong>
            <span style="font-size:0.775rem; color:var(--milo-text-secondary);">${dateInfo.weekdayShort} evening traffic</span>
          </div>
          <button class="milo-btn-secondary" id="btnBookCab" style="width:auto; padding:6px 12px; font-size:0.775rem; background:#FFFFFF;">
            Get a cab 🚕
          </button>
        </div>

        <!-- Support note -->
        <div style="text-align:center; font-size:0.8rem; color:var(--milo-text-secondary); padding:4px 0;">
          Plans changed? <a href="#" id="linkSupport" style="color:var(--milo-text); font-weight:600; text-decoration:underline;">Talk to Milo.</a>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen12Continue">
          Preview Day-of-Date Mode →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen12Listeners(container) {
  const backBtn = container.querySelector('#btnScreen12Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen12Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  const navBtn = container.querySelector('#btnNavClayful');
  if (navBtn) navBtn.addEventListener('click', () => alert("Opening navigation to Clayful Studio (Indiranagar)... 🚗"));

  const mapsBtn = container.querySelector('#btnMapsDrift');
  if (mapsBtn) mapsBtn.addEventListener('click', () => alert("Opening navigation to Drift (Indiranagar)... 📍"));

  const cabBtn = container.querySelector('#btnBookCab');
  if (cabBtn) cabBtn.addEventListener('click', () => alert("Opening cab booking... 🚕"));

  const supportLink = container.querySelector('#linkSupport');
  if (supportLink) {
    supportLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Plans changed? No stress. Milo will help adjust your reservations.");
    });
  }
}
