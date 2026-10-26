// Contribution handoff: the shared pieces of the two invitation experiences.
//   A - Together from the start: the dedicated handoff screen (s4_invite).
//   B - Bring someone into a solo plan: the in-context sheet over the three nights.
// Both ask for the other person's own input. Neither sends the creator's picks or
// itinerary: the outgoing message is fixed copy plus the existing invite URL.
import { store } from '../domain/store.js';
import { escapeHtml } from '../logic/partner.js';
import { cleanName, isPhase1Enabled, ensureServerInvite } from '../domain/network-adapter.js';
import { copyInvite, inviteUrl, feedback } from './invite-feedback.js';

export const INVITE_MESSAGES = {
  together: "I've started a night for us on Milo. Add what feels like you, and we'll find something that fits us both.",
  solo: "I've found a starting point for us. Add your picks on Milo so the night feels like both of us."
};

export const PREPARED_COPY = { copy: 'Link copied.', whatsapp: 'Your link is ready.' };
export const NO_DELIVERY = 'No live delivery or notifications yet.';
const LINK_PLACEHOLDER = 'Your invite link is added when you share.';

// The outgoing WhatsApp text: the message, then the real URL on its own line.
export const inviteText = (context, url) => `${INVITE_MESSAGES[context]}\n${url}`;

// Only a link that already exists is shown. Rendering never creates an invite.
export function preparedUrl(state = store.getState()) {
  return state.shared.serverInviteUrl || null;
}

export function renderInvitePreview(context, url, id) {
  const link = url
    ? `<span class="milo-handoff-link">${escapeHtml(url)}</span>`
    : `<span class="milo-handoff-link is-placeholder">${LINK_PLACEHOLDER}</span>`;
  return `<section class="milo-handoff-preview" aria-labelledby="${id}">
    <h2 class="milo-handoff-label" id="${id}">Your invitation</h2>
    <p class="milo-handoff-message">${escapeHtml(INVITE_MESSAGES[context])}<br>${link}</p>
  </section>`;
}

// Sender identity. With a saved name: the name and an Edit action. Without one: the field.
export function renderSender({ label, name, inputId, editId, editing = false }) {
  const has = Boolean(cleanName(name)) && !editing;
  return `<div class="milo-handoff-sender">
    <p class="milo-handoff-label" id="${inputId}-label">${label}</p>
    <div class="milo-handoff-sender-row" ${has ? '' : 'hidden'}>
      <span class="milo-handoff-sender-name">${escapeHtml(cleanName(name))}</span>
      <button type="button" class="milo-handoff-edit" id="${editId}" aria-label="Edit your name">Edit</button>
    </div>
    <label class="milo-name-field" ${has ? 'hidden' : ''}><span>Your name</span>
      <input id="${inputId}" type="text" maxlength="40" autocomplete="given-name" value="${escapeHtml(name || '')}" placeholder="First name" aria-describedby="${inputId}-label"></label>
  </div>`;
}

// Wires the Edit action and keeps both handoff buttons disabled while the name is blank.
// Typing never writes the store; the name is committed only on a real share or copy.
export function attachSender(root, { inputId, editId, buttons, onInput }) {
  const input = root.querySelector(`#${inputId}`);
  const sync = () => {
    const ok = Boolean(cleanName(input.value));
    buttons().forEach(button => { if (!button.dataset.busy) button.disabled = !ok; });
    onInput?.(input.value);
  };
  input.addEventListener('input', sync);
  root.querySelector(`#${editId}`)?.addEventListener('click', () => {
    root.querySelector('.milo-handoff-sender-row').hidden = true;
    input.closest('label').hidden = false;
    input.focus();
    input.select();
  });
  sync();
  return input;
}

// The last preparation on this page (not persisted): the creator's next screen
// can say "Link copied." once, without claiming delivery later.
let lastPrepared = null;
export const takePrepared = () => { const value = lastPrepared; lastPrepared = null; return value; };
// Read without clearing. After a reload this is null, and screens fall back to 'Your link is ready.'
export const peekPrepared = () => lastPrepared;

// One handoff at a time per page: repeated taps never prepare two invitations.
let inFlight = false;

async function serverReady() {
  if (!isPhase1Enabled()) return true;
  const result = await ensureServerInvite(store);
  if (result.ok) return true;
  feedback("Couldn't reach Milo.", 'Your picks are saved on this phone; try again.');
  return false;
}

// method: 'whatsapp' | 'copy'. onSettled(method) runs only after a real preparation:
// the link was copied, or WhatsApp opened and the planner came back to Milo.
export async function handoff({ method, context, name, buttons, onSettled, registerCleanup }) {
  const me = cleanName(name);
  if (!me || inFlight) return false;
  inFlight = true;
  const list = buttons();
  list.forEach(button => { button.disabled = true; button.dataset.busy = 'true'; });
  const release = () => {
    inFlight = false;
    buttons().forEach(button => { delete button.dataset.busy; button.disabled = false; });
  };
  try {
    const state = store.getState();
    // Commit the sender only now; any known recipient name is kept as it is.
    store.setNames(me, state.sessionA.partnerName);
    if (!(await serverReady())) return false;
    const url = inviteUrl();
    if (method === 'copy') {
      return await copyInvite({ onPrepared: () => { lastPrepared = 'copy'; onSettled('copy'); } });
    }
    const popup = window.open(`https://wa.me/?text=${encodeURIComponent(inviteText(context, url))}`, '_blank');
    if (!popup) {
      feedback("WhatsApp couldn't open.", 'Copy the invite link below and send it however you like.', url, true);
      return false;
    }
    popup.opener = null;
    const onReturn = () => {
      if (document.visibilityState === 'hidden') return;
      cleanup();
      lastPrepared = 'whatsapp';
      onSettled('whatsapp');
    };
    const cleanup = () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
    registerCleanup?.(cleanup);
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return true;
  } finally {
    release();
  }
}
