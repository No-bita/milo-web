// ==========================================================
// MILO V2 — SCREEN 16: NEXT DATE
// "That looked fun. Shall we plan the next one?"
// Demonstrates the learned preference loop & repeat engagement.
// ==========================================================

import { setScreen, resetDemo } from '../state.js';

export function renderScreen16() {
  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header" style="justify-content:center;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <!-- Couple Looking at City Night Lights -->
        <div style="width:100%; height:200px; border-radius:var(--milo-radius-lg); overflow:hidden; position:relative; box-shadow:var(--milo-shadow-md); margin-bottom:18px;">
          <img 
            src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80" 
            alt="Couple enjoying night view of city"
            style="width:100%; height:100%; object-fit:cover;"
          />
          <div style="position:absolute; bottom:0; left:0; right:0; height:60px; background:linear-gradient(to top, rgba(26,24,20,0.6), transparent);"></div>
        </div>

        <h1 style="font-family:var(--milo-font-display); font-size:1.85rem; line-height:1.2; font-weight:400; color:var(--milo-text); margin:0 0 16px;">
          That looked fun.<br/>Shall we do this again?
        </h1>

        <!-- Learned Preferences -->
        <div style="margin-bottom: 8px;">
          <strong style="font-size: 0.95rem; color: var(--milo-text); display: block; margin-bottom: 12px;">
            I remember the good bits.
          </strong>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.875rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta);">✓</span>
            <span>You liked pottery and quieter places. I'll keep that in mind.</span>
          </div>

          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.875rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta);">✓</span>
            <span>Next time, we can skip the questions you've already answered.</span>
          </div>

          <div style="display:flex; align-items:flex-start; gap:10px; font-size:0.875rem; color:var(--milo-text); line-height: 1.4;">
            <span style="color:var(--milo-terracotta);">✓</span>
            <span>And I'll know a little more about what makes a good night for you two.</span>
          </div>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnPlanAnotherDate">
          Plan another date
        </button>
        <button class="milo-text-link" id="btnNextDateLater">
          Maybe later
        </button>

        <!-- Bottom Footer Branding -->
        <div style="text-align:center; padding-top:16px; border-top:1px solid var(--milo-border-light); width:100%; margin-top:8px;">
          <div style="font-weight:700; font-size:0.9rem; color:var(--milo-text); letter-spacing:-0.02em;">
            milo <span style="font-weight:400; font-size:0.8rem; color:var(--milo-text-secondary);">· Better dates. Less planning.</span>
          </div>
          <div style="font-size:0.75rem; color:var(--milo-text-muted); margin-top:4px;">
            Not a dating app. Just better dates.
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

  const laterBtn = container.querySelector('#btnNextDateLater');
  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      alert("I'll be here. No pressure.");
    });
  }
}
