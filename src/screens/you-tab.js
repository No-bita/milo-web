import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { store } from '../domain/store.js';
import { isInvited, partnerLabel } from '../logic/partner.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Minimal You view: account, partner and invite state from the app.
export function renderYou(sessionId = 'aarav') {
  const state = store.getState();
  const session = state[sessionId === 'sneha' ? 'sessionB' : 'sessionA'] || {};
  const user = session.user;
  const invited = isInvited(state);
  const partner = invited ? partnerLabel(state) : 'Your person';
  const status = state.shared.confirmedNightId ? `${partner} is in` : state.shared.inviteSent ? `Invite sent to ${partner}` : invited ? 'Invite ready' : 'Not invited yet. Whenever you\'re ready.';

  const accountBody = user?.email
    ? `<div class="milo-home-row"><span class="milo-home-avatar" aria-hidden="true">${escape(user.email.charAt(0).toUpperCase())}</span><div><b>${escape(user.email)}</b><span>Signed in</span></div><button type="button" class="milo-home-link" id="miloYouLoginBtn">Manage</button></div>`
    : `<div class="milo-home-row"><span class="milo-home-avatar milo-home-avatar-plus" aria-hidden="true">✉</span><div><b>Sign in to Milo</b><span>Save dates, sync with your person</span></div><button type="button" class="milo-home-link" id="miloYouLoginBtn">Sign in <span aria-hidden="true">›</span></button></div>`;

  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">You</h1>
      <p class="milo-home-label milo-nights-heading">ACCOUNT</p>
      ${accountBody}
      <p class="milo-home-label milo-nights-heading">PARTNER</p>
      <div class="milo-home-row"><span class="milo-home-avatar" aria-hidden="true">${invited ? escape(partner.charAt(0).toUpperCase()) : '+'}</span><div><b>${escape(partner)}</b><span>${escape(status)}</span></div></div>
      <p class="milo-home-label milo-nights-heading">SETTINGS</p><p class="milo-nights-empty">Settings are on their way.</p>
    </div>
    ${renderTabBar('you')}
  </div>`;
}

export function attachYouListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  container.querySelector('#miloYouLoginBtn')?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, 'login');
  });
}
