import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { store } from '../domain/store.js';
import { isInvited, partnerLabel } from '../logic/partner.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Minimal You view: partner and invite state from the app. Settings are not built yet.
export function renderYou(sessionId = 'aarav') {
  const state = store.getState();
  const invited = isInvited(state);
  const partner = invited ? partnerLabel(state) : 'Your person';
  const status = state.shared.confirmedNightId ? `${partner} is in` : state.shared.inviteSent ? `Invite sent to ${partner}` : invited ? 'Invite ready' : 'Not invited yet. Whenever you\'re ready.';
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">You</h1>
      <p class="milo-home-label milo-nights-heading">PARTNER</p>
      <div class="milo-home-row"><span class="milo-home-avatar" aria-hidden="true">${invited ? escape(partner.charAt(0).toUpperCase()) : '+'}</span><div><b>${escape(partner)}</b><span>${escape(status)}</span></div></div>
      <p class="milo-home-label milo-nights-heading">SETTINGS</p><p class="milo-nights-empty">Settings are on their way.</p>
    </div>
    ${renderTabBar('you')}
  </div>`;
}

export function attachYouListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
}
