import { store } from '../domain/store.js';
import { partnerLabel } from '../logic/partner.js';
import { NIGHTS_POOL, INTENTS } from '../data/mockData.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { copyInvite } from '../components/invite-feedback.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function whenLine(timing) {
  return timing ? timingLabel(timing) : '';
}

// Partner A's sealed waiting state. A sees a preview of their own half (night,
// time, moods). The merged night with the partner stays hidden until both land.
export function renderSealedWaiting(sessionId = 'aarav') {
  const a = store.getState().sessionA;
  const solo = !store.getState().shared.invitePrepared;
  const partner = partnerLabel(store.getState());
  const night = NIGHTS_POOL.find((n) => n.id === (a.savedSoloNightId || a.activeNightId)) || NIGHTS_POOL[0];
  const when = whenLine(timingForNight(night.id, { solo: true }));
  const moods = (a.intents || []).map((id) => INTENTS.find((i) => i.id === id)?.label).filter(Boolean);
  const chips = moods.map((m) => `<li>${escape(m)}</li>`).join('');
  const beats = night.beats.map((beat) => `<li>${escape(beat.name)}</li>`).join('');
  return `<div class="milo-booked" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body">
      <h1 class="milo-booked-title">Sealed.</h1>
      <p class="milo-booked-sub">${solo ? 'Your night is set.' : `Your half is done. Waiting on ${escape(partner)}'s.`}</p>
      <article class="milo-booked-card" aria-label="${solo ? 'Your night' : 'Your night so far'}">
        <p class="milo-booked-label">${solo ? 'YOUR NIGHT' : 'YOUR NIGHT, SO FAR'}</p>
        <h2 class="milo-booked-night">${escape(night.name)}</h2>
        ${when ? `<p class="milo-booked-when">${escape(when)}</p>` : ''}
        ${chips ? `<ul class="milo-booked-chips">${chips}</ul>` : ''}
        <p class="milo-booked-reason">${escape(night.reasonLine)}</p>
        <ul class="milo-booked-beats">${beats}</ul>
        ${solo ? '' : `<p class="milo-booked-ref">Milo blends it with ${escape(partner)}'s picks once they're in.</p>`}
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
    </div>
    ${solo ? `<div class="milo-booked-cta">
      <button class="milo-cta-button" type="button" id="miloBookedBook">Book this night</button>
      <button class="milo-text-button" type="button" id="miloBookedInvite">Bring ${escape(partner)} in</button>
    </div>` : `<div class="milo-booked-cta">
      <div class="milo-booked-cta-row">
        <button class="milo-pill-btn-secondary" type="button" id="miloBookedBook">Book this night</button>
        <button class="milo-cta-button" type="button" id="miloBookedInvite">Invite ${escape(partner)}</button>
      </div>
    </div>`}
  </div>`;
}

export function attachSealedWaitingListeners(container, sessionId = 'aarav') {
  container.querySelector('#miloBookedBook')?.addEventListener('click', () => store.setSessionScreen(sessionId, 'requests'));
  container.querySelector('#miloBookedInvite')?.addEventListener('click', () => copyInvite({ onPrepared: () => {} }));
}
