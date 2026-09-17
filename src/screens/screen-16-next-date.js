// ==========================================================
// MILO V2 — SCREEN 16: NEXT DATE
// 3 overlapping polaroids recalling date memories,
// dynamic learnedProfile bullets, and handwritten sign-off.
// ==========================================================

import { getState, setScreen, resetDemo } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen16() {
  const state = getState();
  const learned = state.learnedProfile || {
    likedActivities: ['Pottery', 'Dessert'],
    preferredVibe: 'Playful & tactile',
    notes: 'Responds best to active hands-on early evening plans.'
  };

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header" style="justify-content:center;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <!-- 3 Overlapping Polaroids Stack -->
        <div style="display:flex; justify-content:center; align-items:center; margin: 20px 0 30px; position:relative; height: 160px;">
          <div class="milo-polaroid" style="width: 110px; position: absolute; left: calc(50% - 110px); transform: rotate(-7deg); z-index: 1;">
            <div class="milo-polaroid-img">
              ${renderImageHtml('polaroid1')}
            </div>
            <div class="milo-polaroid-caption">Rooftop</div>
          </div>

          <div class="milo-polaroid" style="width: 115px; position: absolute; left: calc(50% - 40px); transform: rotate(2deg); z-index: 2;">
            <div class="milo-polaroid-img">
              ${renderImageHtml('polaroid2')}
            </div>
            <div class="milo-polaroid-caption">Pottery</div>
          </div>

          <div class="milo-polaroid" style="width: 110px; position: absolute; right: calc(50% - 110px); transform: rotate(8deg); z-index: 3;">
            <div class="milo-polaroid-img">
              ${renderImageHtml('polaroid3')}
            </div>
            <div class="milo-polaroid-caption">Drift</div>
          </div>
        </div>

        <h1 style="font-family:var(--milo-font-display); font-size:1.85rem; line-height:1.2; font-weight:400; color:var(--milo-text); margin:0 0 16px;">
          That looked fun.<br/>Shall we do this again?
        </h1>

        <!-- Learned Preferences -->
        <div style="margin-bottom: 8px;">
          <strong style="font-size: 0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color: var(--milo-terracotta); display: block; margin-bottom: 12px;">
            I remember the good bits:
          </strong>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px; background:#FFFFFF; padding:16px; border-radius:var(--milo-radius-lg); border:1px solid var(--milo-border);">
          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.88rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta); font-weight:700;">✓</span>
            <span>You both love <strong>${(learned.likedActivities || ['Pottery']).join(' & ')}</strong>. I've saved that.</span>
          </div>

          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.88rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta); font-weight:700;">✓</span>
            <span>Vibe tuned to: <em>${learned.preferredVibe || 'Playful & tactile'}</em></span>
          </div>

          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.88rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta); font-weight:700;">✓</span>
            <span>Next time, we can skip questions you've already answered.</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 10px;">
          <div class="milo-handwritten" style="font-size: 1.4rem;">
            "More good dates ahead." ♡ — Milo
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer" style="margin-top: 20px;">
        <button class="milo-btn-primary" id="btnPlanAnotherDate">
          Plan another date →
        </button>

        <div style="text-align:center; padding-top:14px; border-top:1px solid var(--milo-border-light); width:100%; margin-top:8px;">
          <div style="font-weight:700; font-size:0.9rem; color:var(--milo-text); letter-spacing:-0.02em;">
            milo <span style="font-weight:400; font-size:0.8rem; color:var(--milo-text-secondary);">· Better dates. Less planning.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachScreen16Listeners(container) {
  const planBtn = container.querySelector('#btnPlanAnotherDate');
  if (planBtn) {
    planBtn.addEventListener('click', () => {
      resetDemo();
      setScreen(1);
    });
  }
}
