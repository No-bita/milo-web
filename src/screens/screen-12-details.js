// ==========================================================
// MILO V2 — SCREEN 12: YOUR DATE DETAILS
// "bookedExperience" (not an itinerary builder)
// Shows booked places, venue addresses, cab prep, and support.
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';
import { getSelectedDateOption } from '../state.js';

export function renderScreen12() {
  const selectedOption = getSelectedDateOption();

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen12Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:600; color:var(--milo-text-secondary);">Date Details</span>
        </div>

        <div style="margin-bottom: 14px;">
          <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--milo-accent);">
            Your evening, sorted.
          </span>
          <h1 class="milo-screen-h1" style="margin-top:2px;">
            ${selectedOption.title}
          </h1>
          <p style="font-size:0.9rem; color:var(--milo-text-secondary); margin:0;">
            Friday · 7:30 PM
          </p>
        </div>

        <!-- Venue 1 Card: Clayful Studio -->
        <div class="milo-card" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="font-size:1rem;">🎨</span>
                <strong style="font-size:0.95rem; color:var(--milo-text);">Clayful Studio</strong>
              </div>
              <div style="font-size:0.8rem; color:var(--milo-text-secondary);">12th Main, Indiranagar</div>
              <div style="font-size:0.8rem; color:var(--milo-text-secondary); margin-top:2px;">
                Pottery · 7:30 PM
              </div>
            </div>
            <button class="milo-btn-secondary" id="btnNavClayful" style="width:auto; padding:6px 14px; font-size:0.8rem;">
              Get directions
            </button>
          </div>
        </div>

        <!-- Venue 2 Card: Drift -->
        <div class="milo-card" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="font-size:1rem;">🍨</span>
                <strong style="font-size:0.95rem; color:var(--milo-text);">Drift</strong>
              </div>
              <div style="font-size:0.8rem; color:var(--milo-text-secondary);">100 Feet Road, Indiranagar</div>
              <div style="font-size:0.8rem; color:var(--milo-text-secondary); margin-top:2px;">
                Dessert · 8:45 PM
              </div>
            </div>
            <button class="milo-btn-secondary" id="btnMapsDrift" style="width:auto; padding:6px 14px; font-size:0.8rem;">
              Get directions
            </button>
          </div>
        </div>

        <!-- Need a ride? -->
        <div class="milo-card" style="background:#FDFBF7; border-color:#EFE9DF; display:flex; justify-content:space-between; align-items:center; padding:12px 14px; margin-bottom:12px;">
          <div>
            <strong style="font-size:0.85rem; color:var(--milo-text); display:block;">Need a little help getting there?</strong>
            <span style="font-size:0.775rem; color:var(--milo-text-secondary);">Indiranagar · Friday evening</span>
          </div>
          <button class="milo-btn-secondary" id="btnBookCab" style="width:auto; padding:6px 12px; font-size:0.775rem; background:#FFFFFF;">
            Get a cab
          </button>
        </div>

        <!-- Support note -->
        <div style="text-align:center; font-size:0.8rem; color:var(--milo-text-secondary); padding:4px 0;">
          Plans changed? No panic. <a href="#" id="linkSupport" style="color:var(--milo-text); font-weight:600; text-decoration:underline;">Need help? Talk to Milo.</a>
        </div>
      </div>

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
  if (navBtn) navBtn.addEventListener('click', () => alert("Getting directions to Clayful Studio (12th Main, Indiranagar)... 🚗"));

  const mapsBtn = container.querySelector('#btnMapsDrift');
  if (mapsBtn) mapsBtn.addEventListener('click', () => alert("Getting directions to Drift (100 Feet Road, Indiranagar)... 📍"));

  const cabBtn = container.querySelector('#btnBookCab');
  if (cabBtn) cabBtn.addEventListener('click', () => alert("Opening cab booking... 🚕"));

  const supportLink = container.querySelector('#linkSupport');
  if (supportLink) {
    supportLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Plans changed? No panic. I'm right here to help sort it out.");
    });
  }
}
