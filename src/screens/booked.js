import { store } from '../domain/store.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { timingForNight } from '../components/night-timing.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function whenLine(timing) {
  if (!timing) return 'Time to be set';
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${timing.date}T12:00:00`));
  const [h, m] = timing.time.split(':').map(Number);
  const clock = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${day} · ${clock}`;
}

// Sealed booking confirmation. Night, time and partner come from app state.
// There is no booking backend yet, so the reference is a visible demo value.
export function renderBooked(sessionId = 'aarav') {
  const state = store.getState();
  const nightId = state.sessionA.savedSoloNightId || state.shared.confirmedNightId || state.sessionA.activeNightId || NIGHTS_POOL[0].id;
  const night = NIGHTS_POOL.find((n) => n.id === nightId) || NIGHTS_POOL[0];
  const partner = state.sessionA.partnerName || 'your partner';
  const timing = timingForNight(night.id) || timingForNight(night.id, { solo: true });
  const beats = night.beats.map((beat) => `<li>${escape(beat.name)}</li>`).join('');
  const notes = (state.sessionA.bookingRequests || '').trim();
  const lock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const privateBox = notes ? `<section class="milo-booked-private" aria-label="Private requests">
        <p class="milo-booked-label">${lock}PRIVATE REQUESTS · ONLY YOU</p>
        <p>${escape(notes)}</p>
      </section>` : '';
  return `<div class="milo-booked" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body">
      <h1 class="milo-booked-title">Sealed.</h1>
      <p class="milo-booked-sub">Milo is on it.</p>
      <article class="milo-booked-card" aria-label="Your night">
        <p class="milo-booked-label">YOUR NIGHT</p>
        <h2 class="milo-booked-night">${escape(night.name)}</h2>
        <p class="milo-booked-when">${escape(whenLine(timing))} · 2 people</p>
        <ul class="milo-booked-beats">${beats}</ul>
        <p class="milo-booked-ref">Ref MLO-DEMO</p>
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
      ${privateBox}
    </div>
    <div class="milo-booked-cta">
      <button class="milo-cta-button" type="button" id="miloBookedCalendar">Add to calendar</button>
      <button class="milo-text-button" type="button" id="miloBookedShare">Share with ${escape(partner)}</button>
    </div>
  </div>`;
}

export function attachBookedListeners(container, sessionId = 'aarav') {
  // Demo screen: no booking backend yet. Calendar and share arrive with the booking flow.
  container.querySelector('#miloBookedCalendar')?.addEventListener('click', () => {});
}
