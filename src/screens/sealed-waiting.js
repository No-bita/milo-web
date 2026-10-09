import { store } from '../domain/store.js';
import { NIGHTS_POOL, INTENTS } from '../data/mockData.js';
import { timingForNight } from '../components/night-timing.js';
import { copyInvite } from '../components/invite-feedback.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function whenLine(timing) {
  if (!timing) return '';
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${timing.date}T12:00:00`));
  const [h, m] = timing.time.split(':').map(Number);
  return `${day} · ${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Partner A's sealed waiting state. A sees a preview of their own half (night,
// time, moods). The merged night with the partner stays hidden until both land.
export function renderSealedWaiting(sessionId = 'aarav') {
  const a = store.getState().sessionA;
  const partner = a.partnerName || 'your partner';
  const night = NIGHTS_POOL.find((n) => n.id === (a.savedSoloNightId || a.activeNightId)) || NIGHTS_POOL[0];
  const when = whenLine(timingForNight(night.id, { solo: true }));
  const moods = (a.intents || []).map((id) => INTENTS.find((i) => i.id === id)?.label).filter(Boolean);
  const chips = moods.map((m) => `<li>${escape(m)}</li>`).join('');
  const beats = night.beats.map((beat) => `<li>${escape(beat.name)}</li>`).join('');
  return `<div class="milo-booked" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body">
      <h1 class="milo-booked-title">Sealed.</h1>
      <p class="milo-booked-sub">Your half is done. Waiting on ${escape(partner)}'s.</p>
      <article class="milo-booked-card" aria-label="Your night so far">
        <p class="milo-booked-label">YOUR NIGHT, SO FAR</p>
        <h2 class="milo-booked-night">${escape(night.name)}</h2>
        ${when ? `<p class="milo-booked-when">${escape(when)}</p>` : ''}
        ${chips ? `<ul class="milo-booked-chips">${chips}</ul>` : ''}
        <p class="milo-booked-reason">${escape(night.reasonLine)}</p>
        <ul class="milo-booked-beats">${beats}</ul>
        <p class="milo-booked-ref">Milo blends it with ${escape(partner)}'s picks once they're in.</p>
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
    </div>
    <div class="milo-booked-cta">
      <div class="milo-booked-cta-row">
        <button class="milo-pill-btn-secondary" type="button" id="miloBookedBook">Book this night</button>
        <button class="milo-cta-button" type="button" id="miloBookedInvite">Invite ${escape(partner)}</button>
      </div>
    </div>
  </div>`;
}

export function attachSealedWaitingListeners(container, sessionId = 'aarav') {
  container.querySelector('#miloBookedBook')?.addEventListener('click', () => store.setSessionScreen(sessionId, 'booked'));
  container.querySelector('#miloBookedInvite')?.addEventListener('click', () => copyInvite({ onPrepared: () => {} }));
}
