// ==========================================================
// MILO V2 — SCREEN 5: INVITEE WELCOME
// "Rohan is planning a date with you!"
// The invitee accepts and prepares to enter their side
// of preferences and constraints.
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';

export function renderScreen05() {
  const state = getState();
  const plannerName = state.planner?.name || 'Rohan';

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header" style="justify-content:center;">
          <h1 class="milo-brand-title">milo</h1>
        </div>

        <!-- Avatars Container -->
        <div style="display:flex; justify-content:center; align-items:center; margin: 16px 0 18px; position:relative;">
          <div style="width:72px; height:72px; border-radius:50%; overflow:hidden; border:3px solid #FFFFFF; box-shadow:var(--milo-shadow-md); z-index:2;">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
              alt="${plannerName}"
              style="width:100%; height:100%; object-fit:cover;"
            />
          </div>
          <div style="width:68px; height:68px; border-radius:50%; overflow:hidden; border:3px solid #FFFFFF; box-shadow:var(--milo-shadow-md); margin-left:-18px; z-index:1;">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" 
              alt="You"
              style="width:100%; height:100%; object-fit:cover;"
            />
          </div>
          <div style="position:absolute; right:35%; top:-4px; font-size:1.2rem;">
            ✨
          </div>
        </div>

        <h2 style="font-family: var(--milo-font-display); font-size: 1.85rem; font-weight:400; text-align:center; line-height:1.2; margin: 0 0 16px; color:var(--milo-text);">
          ${plannerName}'s planning your date.<br>
          <span style="font-family: var(--milo-font-sans); font-size: 1.05rem; font-weight: 400; color: var(--milo-text-secondary); display:block; margin-top:6px;">
            You just tell me what sounds good.
          </span>
        </h2>

        <!-- 3 Reassurance Points -->
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
          <div class="milo-card" style="display:flex; align-items:flex-start; gap:14px; padding:12px 14px; margin:0;">
            <div style="width:36px; height:36px; border-radius:50%; background:#FAF0EC; display:flex; align-items:center; justify-content:center; font-size:1.05rem; flex-shrink:0;">
              🔒
            </div>
            <div>
              <div style="font-size:0.875rem; font-weight:600; color:var(--milo-text);">
                Your answers stay yours
              </div>
              <div style="font-size:0.775rem; color:var(--milo-text-secondary); margin-top:2px;">
                ${plannerName} won't see your individual answers.
              </div>
            </div>
          </div>

          <div class="milo-card" style="display:flex; align-items:flex-start; gap:14px; padding:12px 14px; margin:0;">
            <div style="width:36px; height:36px; border-radius:50%; background:#F3EDE4; display:flex; align-items:center; justify-content:center; font-size:1.05rem; flex-shrink:0;">
              🤝
            </div>
            <div>
              <div style="font-size:0.875rem; font-weight:600; color:var(--milo-text);">
                I'll find something for both of you
              </div>
              <div style="font-size:0.775rem; color:var(--milo-text-secondary); margin-top:2px;">
                Not just whatever one person happens to like.
              </div>
            </div>
          </div>

          <div class="milo-card" style="display:flex; align-items:flex-start; gap:14px; padding:12px 14px; margin:0;">
            <div style="width:36px; height:36px; border-radius:50%; background:#E8F5E9; display:flex; align-items:center; justify-content:center; font-size:1.05rem; flex-shrink:0;">
              ✨
            </div>
            <div>
              <div style="font-size:0.875rem; font-weight:600; color:var(--milo-text);">
                Nothing to download
              </div>
              <div style="font-size:0.775rem; color:var(--milo-text-secondary); margin-top:2px;">
                Just answer a few questions and you're done.
              </div>
            </div>
          </div>
        </div>

        <!-- Decorative Botanical Elements SVG -->
        <div style="display:flex; justify-content:center; margin-top:6px; opacity:0.85;">
          <svg width="220" height="42" viewBox="0 0 220 42" fill="none">
            <path d="M10 40C25 15 50 12 70 30" stroke="#C85A32" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M70 30C90 10 120 8 140 28" stroke="#4A7C59" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M140 28C160 12 185 15 210 40" stroke="#D97757" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="70" cy="30" r="4" fill="#C85A32"/>
            <circle cx="140" cy="28" r="4" fill="#4A7C59"/>
          </svg>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen5Accept">
          Let's do this
        </button>
        <button class="milo-text-link" id="btnScreen5Later">
          Maybe later
        </button>
      </div>
    </div>
  `;
}

export function attachScreen05Listeners(container) {
  const acceptBtn = container.querySelector('#btnScreen5Accept');
  if (acceptBtn) acceptBtn.addEventListener('click', () => nextScreen());

  const laterBtn = container.querySelector('#btnScreen5Later');
  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      alert("No pressure. I'll be here when you're ready.");
    });
  }
}
