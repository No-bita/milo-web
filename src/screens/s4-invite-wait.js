// ==========================================================
// MILO — SCREEN 4: INVITE & WAIT (Aarav's Side)
// "Planning this together?" -> "Over to Sneha" -> "Sneha's done"
// Warm editorial celebratory layout with toasting illustration.
// ==========================================================

import { store } from '../domain/store.js';
import { partnerLabel, hasPartnerName, sentenceName, escapeHtml } from '../logic/partner.js';
import { cleanName } from '../domain/network-adapter.js';
import { renderSender, attachSender, renderInvitePreview, preparedUrl, handoff, NO_DELIVERY, PREPARED_COPY } from '../components/invite-handoff.js';

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

  if (!isWaiting) return renderHandoff(state, sessionId, backLabel);

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
          <div class="milo-s4-intro wait-copy">
            <h1 class="milo-headline">A little room for two.</h1>
            <p class="milo-body-text">Send the link when you're ready. Your picks are here while they take their turn.</p>
          </div>
        </div>
        <p class="milo-invite-status" role="status" aria-live="polite">${preparedCopy(state.shared.inviteMethod)}</p>
      </div>
      <div class="milo-s4-actions">
        <p class="milo-s4-reassure">${NO_DELIVERY}</p>
        <button class="milo-pill-btn-primary" id="miloShareWhatsappBtn">Share via WhatsApp</button>
        <button class="milo-pill-btn-secondary" id="miloCopyLinkBtn">Copy invite link</button>
        ${isDemo() ? `<a href="?as=sneha" target="_blank" class="milo-pill-btn-ghost">Try your date's side ↗</a>` : ''}
      </div>
    </div>
  `;
}

// Their contribution, derived from existing state only. No invented milestones.
function theirStatus(state) {
  const finished = state.shared.partnerFinished || ['s5', 's6', 's7'].includes(state.sessionB?.screen);
  if (finished) return { text: 'Added', added: true };
  if (state.shared.partnerJoined) return { text: 'Joined. Not added yet', added: false };
  return { text: 'Not added yet', added: false };
}

// A: Together from the start. The invitation message is the main artifact.
function renderHandoff(state, sessionId, backLabel) {
  const theirs = theirStatus(state);
  return `
    <div class="milo-s4-container milo-handoff-screen" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${sessionId}" aria-label="${backLabel}">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="milo-wordmark">milo.</span><div class="milo-header-space"></div>
      </header>
      <div class="milo-handoff-body">
        <h1 class="milo-headline">A night shaped by both of you</h1>
        <p class="milo-body-text">You've added your taste. Invite theirs, without showing your picks.</p>
        <ul class="milo-handoff-inputs" aria-label="Picks so far">
          <li><span>Your picks</span><b class="is-added">Added</b></li>
          <li><span>Their picks</span><b class="${theirs.added ? 'is-added' : ''}">${theirs.text}</b></li>
        </ul>
        ${renderSender({ label: "Who's asking", name: state.sessionA.name, inputId: 'miloMyName', editId: 'miloMyNameEdit' })}
        ${renderInvitePreview('together', preparedUrl(state), 'miloHandoffPreview')}
        <p class="milo-handoff-privacy">They make their own choices privately. Nothing is booked.</p>
      </div>
      <div class="milo-handoff-actions">
        <p class="milo-invite-status" role="status" aria-live="polite"></p>
        <p class="milo-s4-reassure">${NO_DELIVERY}</p>
        <button class="milo-pill-btn-primary" id="miloShareWhatsappBtn" ${cleanName(state.sessionA.name) ? '' : 'disabled'}>Share via WhatsApp</button>
        <button class="milo-pill-btn-secondary" id="miloCopyLinkBtn" ${cleanName(state.sessionA.name) ? '' : 'disabled'}>Copy invite link</button>
        ${isDemo() ? `<a href="?as=sneha" target="_blank" class="milo-pill-btn-ghost">Try your date's side ↗</a>` : ''}
      </div>
    </div>
  `;
}

function preparedCopy(method) {
  return PREPARED_COPY[method === 'copy' ? 'copy' : 'whatsapp'];
}

// Local (no-server) waiting state only: the copy settles in place. The A handoff
// screen always re-renders in full.
export function patchScreen04(container) {
  const state = store.getState();
  // A: keep the mounted screen (and any in-flight handoff) while state settles;
  // refresh only the derived status and the link once it exists.
  const handoffRoot = container.querySelector('.milo-handoff-screen');
  if (handoffRoot) {
    // Local (no-server) mode only: after a share the screen stays put and says what is true.
    if (state.sessionA.screen === 's4_waiting' && !['s5', 's6', 's7'].includes(state.sessionB?.screen)) {
      handoffRoot.querySelector('.milo-invite-status').textContent = preparedCopy(state.shared.inviteMethod);
      return true;
    }
    if (state.sessionA.screen !== 's4_invite') return false;
    const theirs = theirStatus(state);
    const badge = handoffRoot.querySelector('.milo-handoff-inputs li:last-child b');
    badge.textContent = theirs.text;
    badge.classList.toggle('is-added', theirs.added);
    const url = preparedUrl(state);
    const link = handoffRoot.querySelector('.milo-handoff-link');
    if (url && link.classList.contains('is-placeholder')) { link.textContent = url; link.classList.remove('is-placeholder'); }
    return true;
  }
  const root = container.querySelector('.invite-journey');
  const partnerDone = ['s5', 's6', 's7'].includes(state.sessionB?.screen);
  if (!root || partnerDone || state.sessionA.screen !== 's4_waiting') return false;
  root.querySelector('.milo-invite-status').textContent = preparedCopy(state.shared.inviteMethod);
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
  container.querySelector(`#miloS4Back-${sessionId}`)?.addEventListener('click', () => store.setSessionScreen(sessionId, 's3'));
  container.querySelector(`#miloS4WaitBack-${sessionId}`)?.addEventListener('click', () => store.setSessionScreen(sessionId, 's3'));

  const buttons = () => [...container.querySelectorAll('#miloShareWhatsappBtn, #miloCopyLinkBtn')];
  const nameInput = container.querySelector('#miloMyName')
    ? attachSender(container, { inputId: 'miloMyName', editId: 'miloMyNameEdit', buttons })
    : null;
  const currentName = () => (nameInput ? nameInput.value : store.getState().sessionA.name);
  const run = (method) => handoff({
    method, context: 'together', name: currentName(), buttons,
    onSettled: (how) => { if (container.isConnected) settleInvite(how); },
    registerCleanup: (cleanup) => { container.inviteCleanup?.(); container.inviteCleanup = () => { cleanup(); container.inviteCleanup = null; }; }
  });
  container.querySelector('#miloShareWhatsappBtn')?.addEventListener('click', () => run('whatsapp'));
  container.querySelector('#miloCopyLinkBtn')?.addEventListener('click', () => run('copy'));

  container.querySelector('#miloSeeSharedBtn')?.addEventListener('click', () => store.setSessionScreen('aarav', 's5'));
}
