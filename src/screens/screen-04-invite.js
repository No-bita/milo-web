// ==========================================================
// MILO V2 — SCREEN 4: INVITE YOUR DATE
// Postcard aesthetic, handwritten flourish, WhatsApp share,
// and simulation entry for Priya (invitee).
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen04() {
  const state = getState();
  const inviteUrl = `milo.date/${state.inviteId || 'abc123'}`;

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Top Nav & Progress Bar -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen4Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Invite</span>
          <div style="width: 32px;"></div>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 100%;"></div>
        </div>

        <h1 class="milo-screen-h1" style="margin-top: 16px;">Now, loop in your date.</h1>
        <p class="milo-screen-subhead">
          I'll ask them a few quick questions too. That way, I'm planning for two people — not just one.
        </p>

        <!-- Postcard Card -->
        <div style="background:#FFFFFF; border:1px solid var(--milo-border); border-radius:var(--milo-radius-lg); overflow:hidden; box-shadow:var(--milo-shadow-md); margin-bottom:20px;">
          <div style="height: 140px; position: relative; overflow: hidden;">
            ${renderImageHtml('invitePostcard')}
            <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.5), transparent);"></div>
            <div class="milo-handwritten" style="position:absolute; bottom:12px; left:16px; color:#FFFFFF; font-size:1.4rem; text-shadow:0 2px 4px rgba(0,0,0,0.5);">
              "Good dates are a team sport." ♡ — Milo
            </div>
          </div>

          <div style="padding: 16px 18px;">
            <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 6px;">
              Your private invite link
            </label>
            <div style="background:var(--milo-bg); border:1px solid var(--milo-border); border-radius:var(--milo-radius-md); padding:10px 14px; display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:0.95rem; font-weight:600; color:var(--milo-text);">
                ${inviteUrl}
              </span>
              <button id="btnCopyInviteLink" style="background:none; border:none; cursor:pointer; font-size:1.1rem; padding:4px; display:flex; align-items:center; color:var(--milo-text-secondary);" title="Copy link">
                📋
              </button>
            </div>
            <div id="copyFeedbackMsg" style="font-size:0.8rem; color:var(--milo-green); font-weight:600; text-align:center; min-height:16px; margin-top:6px;"></div>
          </div>
        </div>

        <!-- Share on WhatsApp CTA -->
        <div style="margin-bottom: 16px;">
          <button class="milo-btn-primary milo-btn-whatsapp" id="btnShareWhatsApp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 1.861.855 2.796.855 3.18 0 5.767-2.587 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm9.969 5.766c0 5.518-4.482 10-10 10-1.722 0-3.336-.441-4.747-1.213l-5.253 1.375 1.4-5.121c-.886-1.479-1.398-3.21-1.398-5.041 0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z"/>
            </svg>
            Send to Priya on WhatsApp
          </button>
        </div>
      </div>

      <!-- Demo Invitee Hand-off Action -->
      <div class="milo-action-footer">
        <button class="milo-btn-secondary" id="btnScreen4Continue" style="width: 100%;">
          Continue as Priya (Invitee perspective) →
        </button>
        <span style="font-size:0.75rem; color:var(--milo-text-muted); text-align:center;">
          Step into Priya's shoes to complete the mutual loop
        </span>
      </div>
    </div>
  `;
}

export function attachScreen04Listeners(container) {
  const backBtn = container.querySelector('#btnScreen4Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen4Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  const copyBtn = container.querySelector('#btnCopyInviteLink');
  const feedbackMsg = container.querySelector('#copyFeedbackMsg');

  function doCopy() {
    const state = getState();
    const url = `https://milo.date/${state.inviteId || 'abc123'}`;
    navigator.clipboard?.writeText(url);
    if (feedbackMsg) {
      feedbackMsg.textContent = 'Link copied! Send it over to Priya ✨';
      setTimeout(() => { feedbackMsg.textContent = ''; }, 2500);
    }
  }

  if (copyBtn) copyBtn.addEventListener('click', doCopy);

  const waBtn = container.querySelector('#btnShareWhatsApp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const state = getState();
      const text = encodeURIComponent(`Hey! I'm planning our date with Milo. Tell it what you're into here: https://milo.date/${state.inviteId || 'abc123'}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });
  }
}
