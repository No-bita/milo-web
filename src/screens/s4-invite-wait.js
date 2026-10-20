// ==========================================================
// MILO — SCREEN 4: INVITE & WAIT (Aarav's Side)
// "Planning this together?" -> "Over to Sneha" -> "Sneha's done"
// Warm editorial celebratory layout with toasting illustration.
// ==========================================================

import { store } from '../domain/store.js';
import { partnerLabel, hasPartnerName, sentenceName, escapeHtml } from '../logic/partner.js';
import { copyInvite, inviteUrl, feedback } from '../components/invite-feedback.js';
import { isPhase1Enabled, ensureServerInvite } from '../domain/network-adapter.js';

// With Phase 1 on, the invite is a real server link. If we can't reach the server, say so and keep picks.
async function serverReady() {
  if (!isPhase1Enabled()) return true;
  const result = await ensureServerInvite(store);
  if (result.ok) return true;
  feedback("Couldn't reach Milo.", 'Your picks are saved on this phone; try again.');
  return false;
}

// Demo scaffolding (open the partner's side in a new tab) shows only with ?demo
const isDemo = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

export function renderScreen04(sessionId = 'aarav') {
  const state = store.getState();
  const sessionData = state.sessionA;
  const partner = partnerLabel(state, sessionId);
  const isWaiting = sessionData.screen === 's4_waiting';
  const isPartnerDone = state.sessionB && (state.sessionB.screen === 's5' || state.sessionB.screen === 's6' || state.sessionB.screen === 's7');
  const backLabel = 'Back to your reflection';

  if (isWaiting && isPartnerDone) {
    return `
      <div class="milo-s4-container partner-done-state" data-session-id="${sessionId}">
        <header class="milo-header">
          <button class="milo-header-back" id="miloS4WaitBack-${sessionId}" aria-label="${backLabel}">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="milo-wordmark">milo.</span>
          <div class="milo-header-space"></div>
        </header>

        <div class="milo-s4-content">
          <div class="milo-s4-illustration-wrap">
            <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
          </div>

          <div class="milo-s4-intro">
            <h1 class="milo-headline">${hasPartnerName(partner) ? `${sentenceName(partner)}'s done.` : 'Your person is done.'}</h1>
          </div>
        </div>

        <div class="milo-s4-actions">
          <button class="milo-pill-btn-primary" id="miloSeeSharedBtn">
            See what you're both looking for →
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="milo-s4-container invite-state invite-journey ${isWaiting ? 'is-waiting waiting-state' : ''}" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${sessionId}" aria-label="${backLabel}">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="milo-wordmark">milo.</span><div class="milo-header-space"></div>
      </header>
      <div class="milo-s4-content">
        <div class="milo-s4-illustration-wrap">
          <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
        </div>
        <div class="milo-invite-copy-stack">
          <div class="milo-s4-intro invite-copy" ${isWaiting ? 'aria-hidden="true"' : ''}>
            <h1 class="milo-headline">Planning this together?</h1>
            <p class="milo-body-text">Invite your date to help shape the night with you. They'll make their choices privately.</p>
          </div>
          <div class="milo-s4-intro wait-copy" ${isWaiting ? '' : 'aria-hidden="true"'}>
            <h1 class="milo-headline">A little room for two.</h1>
            <p class="milo-body-text">Send the link when you're ready. Your picks are here while they take their turn.</p>
          </div>
        </div>
        <p class="milo-invite-status" role="status" aria-live="polite">${isWaiting ? preparedCopy(state.shared.inviteMethod) : ''}</p>
      </div>
      <div class="milo-s4-actions">
        <div class="milo-invite-names" ${isWaiting ? 'hidden' : ''}>
          <label class="milo-name-field"><span>Your name</span>
            <input id="miloMyName" type="text" maxlength="40" autocomplete="given-name" value="${escapeHtml(sessionData.name || '')}" placeholder="First name"></label>
          <label class="milo-name-field"><span>Their name <em>(optional)</em></span>
            <input id="miloTheirName" type="text" maxlength="40" autocomplete="off" value="${escapeHtml(sessionData.partnerName || '')}" placeholder="Your person"></label>
        </div>
        <p class="milo-s4-reassure">No live delivery or notifications yet.</p>
        <button class="milo-pill-btn-primary" id="miloShareWhatsappBtn" ${sessionData.name ? '' : 'disabled'}>Share via WhatsApp</button>
        <button class="milo-pill-btn-secondary" id="miloCopyLinkBtn" ${sessionData.name ? '' : 'disabled'}>Copy invite link</button>
        ${isDemo() ? `<a href="?as=sneha" target="_blank" class="milo-pill-btn-ghost">Try your date's side ↗</a>` : ''}
      </div>
    </div>
  `;
}

function preparedCopy(method) {
  return method === 'copy' ? 'Link copied.' : 'Your link is ready.';
}

// Preserve the header, illustration and buttons across the seam. Only the copy settles.
export function patchScreen04(container) {
  const root = container.querySelector('.invite-journey');
  const state = store.getState();
  const partnerDone = ['s5', 's6', 's7'].includes(state.sessionB?.screen);
  if (!root || partnerDone) return false;
  const waiting = state.sessionA.screen === 's4_waiting';
  root.classList.toggle('is-waiting', waiting);
  root.classList.toggle('waiting-state', waiting);
  root.querySelector('.invite-copy').setAttribute('aria-hidden', String(waiting));
  root.querySelector('.wait-copy').setAttribute('aria-hidden', String(!waiting));
  root.querySelector('.milo-invite-names')?.toggleAttribute('hidden', waiting);
  root.querySelector('.milo-invite-status').textContent = waiting ? preparedCopy(state.shared.inviteMethod) : '';
  return true;
}

function settleInvite(method) {
  const state = store.getState();
  store.setState({ ...state,
    sessionA: { ...state.sessionA, screen: 's4_waiting' },
    shared: { ...state.shared, invitePrepared: true, inviteMethod: method }
  });
}

export function attachScreen04Listeners(container, sessionId = 'aarav') {
  const backBtn = container.querySelector(`#miloS4Back-${sessionId}`);
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's3');
    });
  }

  const waitBackBtn = container.querySelector(`#miloS4WaitBack-${sessionId}`);
  if (waitBackBtn) {
    waitBackBtn.addEventListener('click', () => {
      store.setSessionScreen(sessionId, 's3');
    });
  }

  // Names stay in state silently while typing, so the field keeps focus. The invite always says who is asking.
  const myName = container.querySelector('#miloMyName');
  const theirName = container.querySelector('#miloTheirName');
  if (myName && theirName) {
    const shareBtns = container.querySelectorAll('#miloShareWhatsappBtn, #miloCopyLinkBtn');
    const saveNames = () => {
      store.setNames(myName.value, theirName.value);
      shareBtns.forEach((btn) => { btn.disabled = !myName.value.trim(); });
    };
    myName.addEventListener('input', saveNames);
    theirName.addEventListener('input', saveNames);
  }

  const whatsappBtn = container.querySelector('#miloShareWhatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', async () => {
      if (!(await serverReady())) return;
      const url = inviteUrl();
      const asking = store.getState().sessionA.name;
      const text = `${asking ? `${asking} is planning` : 'Planning'} tonight with Milo. Add your picks, it takes about a minute. This link lasts ${isPhase1Enabled() ? 'about a month' : '48 hours'}: ${url}`;
      const popup = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      if (!popup) {
        feedback("WhatsApp couldn't open.", 'Copy the invite link below and send it however you like.', url, true);
        return;
      }
      popup.opener = null;
      container.inviteCleanup?.();
      const onReturn = () => {
        if (document.visibilityState === 'hidden') return;
        cleanup();
        if (container.isConnected) settleInvite('whatsapp');
      };
      const cleanup = () => {
        window.removeEventListener('focus', onReturn);
        document.removeEventListener('visibilitychange', onReturn);
        container.inviteCleanup = null;
      };
      container.inviteCleanup = cleanup;
      window.addEventListener('focus', onReturn);
      document.addEventListener('visibilitychange', onReturn);
    });
  }

  const copyBtn = container.querySelector('#miloCopyLinkBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (await serverReady()) copyInvite({ onPrepared: () => settleInvite('copy') });
    });
  }

  const seeSharedBtn = container.querySelector('#miloSeeSharedBtn');
  if (seeSharedBtn) {
    seeSharedBtn.addEventListener('click', () => {
      store.setSessionScreen('aarav', 's5');
    });
  }
}
