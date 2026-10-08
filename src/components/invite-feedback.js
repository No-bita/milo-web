// Native share and clipboard outcomes, with a manual-copy escape hatch.
import { store } from '../domain/store.js';
import { createInvite, validateInvite } from '../domain/invite.js';

export function inviteUrl() {
  let token = store.getState().shared.inviteToken;
  if (validateInvite(token) !== 'valid') {
    token = createInvite();
    store.updateShared({ inviteToken: token });
  }
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('as', 'sneha');
  url.searchParams.set('invite', token);
  return url.href;
}

export function feedback(title, detail, url, manual = false) {
  document.querySelector('#miloInviteFeedback')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'miloInviteFeedback';
  dialog.className = 'milo-invite-feedback';
  dialog.setAttribute('aria-labelledby', 'miloInviteFeedbackTitle');
  dialog.setAttribute('aria-describedby', 'miloInviteFeedbackDetail');
  dialog.innerHTML = `
    <form method="dialog">
      <h2 id="miloInviteFeedbackTitle"></h2>
      <p id="miloInviteFeedbackDetail"></p>
      ${manual ? `<label for="miloManualInviteLink">Your invite link</label>
        <textarea id="miloManualInviteLink" readonly rows="3" spellcheck="false"></textarea>
        <button type="button" class="milo-pill-btn-secondary" id="miloSelectInviteLink">Select link</button>` : ''}
      <button class="milo-pill-btn-primary" autofocus>Got it</button>
    </form>`;
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('#miloInviteFeedbackDetail').textContent = detail;
  if (manual) {
    const field = dialog.querySelector('textarea');
    field.value = url;
    const select = () => { field.focus(); field.select(); field.setSelectionRange(0, field.value.length); };
    field.addEventListener('click', select);
    dialog.querySelector('#miloSelectInviteLink').addEventListener('click', select);
  }
  document.querySelector('.milo-viewport').append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
  });
  dialog.showModal();
}

function readyToSend() {
  // Prepared/shared is not proof that the recipient received it.
  store.updateShared({ inviteSent: true });
  store.setSessionScreen('aarav', 's4_waiting');
}

export async function copyInvite({ sharingUnavailable = false, prepare = false, onPrepared } = {}) {
  const url = inviteUrl();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    if (onPrepared) { onPrepared(); return true; }
    if (prepare) readyToSend();
    feedback(sharingUnavailable ? 'Sharing is taking the night off.' : 'Link copied.',
      sharingUnavailable ? 'The invite link is copied. Paste it into a message to your date.' : 'Paste it into a message.', url);
    return true;
  } catch {
    feedback("Couldn't copy the link.", sharingUnavailable
      ? 'Sharing and copying are sitting this one out. Select the link below, then copy it into a message.'
      : 'The clipboard got cold feet. Select the link below, then copy it into a message.', url, true);
    return false;
  }
}

export async function shareInvite() {
  if (typeof navigator.share !== 'function') {
    return copyInvite({ sharingUnavailable: true, prepare: true });
  }
  try {
    await navigator.share({ title: 'Plan a night with Milo', text: 'Planning tonight with Milo. Add your picks, it takes about a minute.', url: inviteUrl() });
    readyToSend();
  } catch (error) {
    // Dismissing the share sheet is a choice, not a failure or a sent invite.
    if (error?.name === 'AbortError') return;
    return copyInvite({ sharingUnavailable: true, prepare: true });
  }
}
