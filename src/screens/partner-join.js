// Partner's first screen for a server invite (mockups 03/04): who invited, which occasion, the day
// only if set, one name field. Nothing here promises a booking or a notification.
import { store } from '../domain/store.js';
import { escapeHtml } from '../logic/partner.js';
import { previewInvite, joinInvite, cleanName } from '../domain/network-adapter.js';
import { renderInviteError } from '../domain/invite.js';

const OCCASIONS = { date_night: 'Date night', anniversary: 'Anniversary', proposal: 'Proposal', birthday: 'Birthday', quality_time: 'Quality Time', just_because: 'Just because' };
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shell = (html) => `<div class="milo-stage"><div class="milo-viewport">${html}</div></div>`;

function problem(reason) {
  if (reason === 'expired' || reason === 'invalid') return renderInviteError(reason);
  const title = reason === 'taken' ? 'This invite has already been used.' : "Couldn't reach Milo.";
  const body = reason === 'taken' ? 'Ask your date to send a fresh invite link.' : 'Try again in a moment.';
  return `<section class="milo-invite-error"><header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-invite-error-content"><div class="milo-invite-seal" aria-hidden="true">m.</div>
    <h1 class="milo-headline">${title}</h1><p class="milo-body-text">${body}</p></div></section>`;
}

export async function showPartnerJoin(container, token) {
  container.innerHTML = shell('<section class="milo-invite-error"><div class="milo-invite-error-content"><div class="milo-invite-seal" aria-hidden="true">m.</div></div></section>');
  const viewport = () => container.querySelector('.milo-viewport');
  const preview = await previewInvite(token);
  if (!preview.ok) { viewport().innerHTML = problem(preview.reason); return; }
  if (preview.data.status !== 'valid') { viewport().innerHTML = problem(preview.data.status); return; }
  const { occasion, day } = preview.data;
  // Server data is untrusted shape-wise: a missing or blank inviter name falls back to a neutral label.
  const inviter = String(preview.data.initiator_name || '').trim() || 'Your date';
  viewport().innerHTML = `<section class="milo-partner-welcome" aria-labelledby="miloJoinTitle">
    <div class="milo-partner-welcome-body">
      <div class="milo-partner-brand" aria-label="Milo">milo.</div>
      <div class="milo-partner-invitation">
        <h1 id="miloJoinTitle">${escapeHtml(inviter)} wants to plan<br>a night with you.</h1>
        <p class="milo-partner-task">${occasion && OCCASIONS[occasion] ? `${escapeHtml(OCCASIONS[occasion])}${day ? ` &middot; ${escapeHtml(dayLabel(day))}` : ''}. ` : ''}Pick a mood. Tell us what feels like you.</p>
        <ol class="milo-partner-steps" aria-label="How this works">
          <li>Pick the mood.</li>
          <li>Swipe a few ideas.</li>
          <li>Milo finds what fits you both.</li>
        </ol>
        <p class="milo-partner-privacy">Your picks stay private. Nothing is booked.</p>
        <label class="milo-name-field"><span>Your name</span><input id="miloJoinName" type="text" maxlength="40" autocomplete="given-name" placeholder="First name"></label>
        <p class="milo-invite-error-note" id="miloJoinNote" role="status"></p>
      </div>
    </div>
    <button class="milo-cta-button milo-partner-cta" id="miloJoinBtn" type="button" disabled>Let's begin <span aria-hidden="true">&rarr;</span></button>
  </section>`;
  const input = container.querySelector('#miloJoinName');
  const button = container.querySelector('#miloJoinBtn');
  input.addEventListener('input', () => { button.disabled = !cleanName(input.value); });
  button.addEventListener('click', async () => {
    button.disabled = true;
    const joined = await joinInvite(token, input.value);
    if (!joined.ok) {
      if (joined.reason === 'unreachable' || joined.reason === 'rate_limited') {
        container.querySelector('#miloJoinNote').textContent = "Couldn't reach Milo. Try again.";
        button.disabled = false;
      } else viewport().innerHTML = problem(joined.reason);
      return;
    }
    // This phone is the partner's seat: their own name, the inviter's name, straight to moods.
    store.reset();
    store.setNames(inviter, cleanName(input.value));
    // The partner answers for the same occasion the plan was made with.
    store.updateShared({ inviteSent: true, ...(occasion ? { occasion: String(occasion).replaceAll('_', '-') } : {}) });
    store.setSessionScreen('sneha', 's1');
    window.location.replace('/app/?as=sneha');
  });
}
