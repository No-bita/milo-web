// ==========================================================
// MILO V2 — SCREEN 4: INVITE YOUR DATE
// "Invite your date"
// Real date entity link with copy feedback, WhatsApp share,
// and simulation step to Invitee (Priya).
// ==========================================================

import { getState, nextScreen, prevScreen } from '../state.js';

export function renderScreen04() {
  const state = getState();
  const inviteUrl = `milo.date/${state.inviteId || 'abc123'}`;

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen4Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:700; color:var(--milo-text-secondary); letter-spacing:-0.01em;">Invite</span>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 100%;"></div>
        </div>

        <h1 class="milo-screen-h1">Now let's ask your date.</h1>
        <p class="milo-screen-subhead">
          I'll ask them a few quick questions too. That way, I'm planning for two people — not just one.
        </p>

        <!-- Shareable Link Box -->
        <div style="background:#FFFFFF; border:1px solid var(--milo-border); border-radius:var(--milo-radius-md); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--milo-shadow-sm); margin-bottom:16px;">
          <span style="font-family:var(--milo-font-sans); font-size:0.95rem; font-weight:600; color:var(--milo-text);">
            ${inviteUrl}
          </span>
          <button id="btnCopyInviteLink" style="background:none; border:none; cursor:pointer; font-size:1.1rem; padding:4px; display:flex; align-items:center; color:var(--milo-text-secondary);" title="Copy link">
            📋
          </button>
        </div>
        <div id="copyFeedbackMsg" style="font-size:0.8rem; color:var(--milo-green); font-weight:600; text-align:center; min-height:18px; margin-bottom:12px;"></div>

        <!-- Share on WhatsApp CTA -->
        <div style="margin-bottom: 24px;">
          <button class="milo-btn-primary milo-btn-whatsapp" id="btnShareWhatsApp">
            <!-- WhatsApp Icon -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 1.861.855 2.796.855 3.18 0 5.767-2.587 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm9.969 5.766c0 5.518-4.482 10-10 10-1.722 0-3.336-.441-4.747-1.213l-5.253 1.375 1.4-5.121c-.886-1.479-1.398-3.21-1.398-5.041 0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z"/>
            </svg>
            Share on WhatsApp
          </button>
        </div>

        <!-- Secondary Share Actions -->
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
          <button class="milo-card" id="btnShareVia" style="padding:12px 16px; margin:0; border:none; background:#FFFFFF; cursor:pointer; display:flex; align-items:center; gap:12px; font-size:0.9rem; font-weight:500;">
            <span>📤</span> Share via...
          </button>
          <button class="milo-card" id="btnCopyLinkList" style="padding:12px 16px; margin:0; border:none; background:#FFFFFF; cursor:pointer; display:flex; align-items:center; gap:12px; font-size:0.9rem; font-weight:500;">
            <span>📋</span> Copy link
          </button>
          <button class="milo-card" id="btnMoreOptions" style="padding:12px 16px; margin:0; border:none; background:#FFFFFF; cursor:pointer; display:flex; align-items:center; gap:12px; font-size:0.9rem; font-weight:500;">
            <span>•••</span> More options
          </button>
        </div>

        <!-- Handwritten Flourish -->
        <div style="text-align:right; padding-right:16px; margin-top:8px;">
          <span style="font-family: var(--milo-font-handwriting); font-size: 1.45rem; color: #5B4F43; display:inline-block; transform: rotate(-4deg);">
            Good dates are a team sport. ↘
          </span>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen4Continue">
          Continue as Priya (Invitee) →
        </button>
        <span style="font-size:0.75rem; color:var(--milo-text-muted);">
          Step into the invitee's shoes for this demo
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
  const copyListBtn = container.querySelector('#btnCopyLinkList');
  const feedbackMsg = container.querySelector('#copyFeedbackMsg');

  function doCopy() {
    const state = getState();
    const url = `https://milo.date/${state.inviteId || 'abc123'}`;
    navigator.clipboard?.writeText(url);
    if (feedbackMsg) {
      feedbackMsg.textContent = 'Link copied to clipboard! ✨';
      setTimeout(() => { feedbackMsg.textContent = ''; }, 2500);
    }
  }

  if (copyBtn) copyBtn.addEventListener('click', doCopy);
  if (copyListBtn) copyListBtn.addEventListener('click', doCopy);

  const waBtn = container.querySelector('#btnShareWhatsApp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const state = getState();
      const text = encodeURIComponent(`Hey! I'm planning our date with Milo. Tell it what you're into here: https://milo.date/${state.inviteId || 'abc123'}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });
  }

  const shareVia = container.querySelector('#btnShareVia');
  if (shareVia) {
    shareVia.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'Milo Date Invitation',
          text: 'Rohan is planning Friday night with Milo!',
          url: window.location.href
        }).catch(() => {});
      } else {
        doCopy();
      }
    });
  }
}
