// Partner's first screen for a server invite (mockups 03/04): who invited, which occasion, the day
// only if set, one name field. Nothing here promises a booking or a notification.
import { store } from '../domain/store.js';
import { escapeHtml } from '../logic/partner.js';
import { previewInvite, joinInvite, cleanName } from '../domain/network-adapter.js';
import { renderInviteError } from '../domain/invite.js';
import '../styles/invite-errors.css';

const OCCASIONS = { date_night: 'Date night', anniversary: 'Anniversary', proposal: 'Proposal', birthday: 'Birthday', quality_time: 'Quality Time', just_because: 'Just because' };
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shell = (html) => `<div class="milo-stage"><div class="milo-viewport">${html}</div></div>`;

const ENVELOPE = `<svg class="milo-invite-problem-art" viewBox="0 0 144 100" aria-hidden="true" fill="none" stroke="#C9A898" stroke-width="2.5" stroke-linejoin="round">
  <path d="M4 34 72 4l68 30v62H4z" fill="#F3DFC8"/><rect x="32" y="12" width="80" height="54" rx="7" fill="#FFFDF9"/>
  <path d="M72 52c-9-6-13-10-13-15a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 5-4 9-13 15z" fill="#C9657A" stroke="none"/>
  <path d="M4 34l68 40 68-40" /></svg>`;

// Mockups 10, 11 and 12. Expired and taken offer a way out; an unreachable server offers a retry.
const PROBLEMS = {
  expired: { eyebrow: 'Link expired', title: 'This invite has gone cold', body: 'Invites last about a month and this one has run out. Ask for a fresh link.', cta: 'Plan my own night' },
  taken: { eyebrow: 'Seat taken', title: "This invite's already been used", body: "Someone has taken this seat. If you're the one who sent it, share a new link from your plan.", cta: 'Plan my own night' },
  unreachable: { eyebrow: 'Connection', title: 'Milo lost the signal', body: "Couldn't reach Milo. Your picks are saved on this phone. Try again.", cta: 'Try again' }
};

function problem(reason) {
  if (reason === 'invalid') return renderInviteError(reason);
  const copy = PROBLEMS[reason] || PROBLEMS.unreachable;
  return `<section class="milo-invite-problem"><header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-invite-problem-body">${ENVELOPE}
    <p class="milo-invite-problem-eyebrow">${copy.eyebrow}</p>
    <h1 class="milo-headline">${copy.title}</h1><p class="milo-body-text">${copy.body}</p></div>
    <button class="milo-cta-button milo-invite-problem-cta" id="miloProblemCta" type="button" data-reason="${PROBLEMS[reason] ? reason : 'unreachable'}">${copy.cta}</button></section>`;
}

export async function showPartnerJoin(container, token) {
  container.innerHTML = shell('<section class="milo-invite-error"><div class="milo-invite-error-content"><div class="milo-invite-seal" aria-hidden="true">m.</div></div></section>');
  const viewport = () => container.querySelector('.milo-viewport');
  const showProblem = (reason) => {
    viewport().innerHTML = problem(reason);
    container.querySelector('#miloProblemCta')?.addEventListener('click', () => {
      if (reason === 'expired' || reason === 'taken') window.location.assign('/app/');
      else showPartnerJoin(container, token);
    });
  };
  const preview = await previewInvite(token);
  if (!preview.ok) { showProblem(preview.reason); return; }
  if (preview.data.status !== 'valid') { showProblem(preview.data.status); return; }
  const { initiator_name: inviter, occasion, day } = preview.data;
  viewport().innerHTML = `<section class="milo-partner-welcome" aria-labelledby="miloJoinTitle">
    <div class="milo-partner-welcome-body">
      <div class="milo-partner-brand" aria-label="Milo">milo.</div>
      <div class="milo-partner-invitation">
        <h1 id="miloJoinTitle">${escapeHtml(inviter)} wants to plan<br>a night with you.</h1>
        <p class="milo-partner-task">${occasion && OCCASIONS[occasion] ? `${escapeHtml(OCCASIONS[occasion])}${day ? ` &middot; ${escapeHtml(dayLabel(day))}` : ''}. ` : ''}Pick a mood. Tell us what feels like you.</p>
        <label class="milo-name-field"><span>Your name</span><input id="miloJoinName" type="text" maxlength="40" autocomplete="given-name" placeholder="First name"></label>
        <p class="milo-partner-privacy">Nothing is booked. Your picks aren't shown to ${escapeHtml(inviter)} in the plan, just the shared picture.</p>
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
      } else showProblem(joined.reason);
      return;
    }
    // This phone is the partner's seat: their own name, the inviter's name, straight to moods.
    store.reset();
    store.setNames(inviter, cleanName(input.value));
    store.updateShared({ inviteSent: true });
    store.setSessionScreen('sneha', 's1');
    window.location.replace('/app/?as=sneha');
  });
}
