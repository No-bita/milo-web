import { store } from '../domain/store.js';
import { partnerLabel, isInvited } from '../logic/partner.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function whenLine(timing) {
  return timing ? timingLabel(timing) : 'Time to be set';
}

// Sealed booking confirmation. Night, time and partner come from app state.
// There is no booking backend yet, so the reference is a visible demo value.
export function renderBooked(sessionId = 'aarav') {
  const state = store.getState();
  const nightId = state.sessionA.savedSoloNightId || state.shared.confirmedNightId || state.sessionA.activeNightId || NIGHTS_POOL[0].id;
  const night = NIGHTS_POOL.find((n) => n.id === nightId) || NIGHTS_POOL[0];
  const partner = partnerLabel(state, sessionId);
  const shareLabel = sessionId === 'sneha' || isInvited(state) ? `Share with ${escape(partner)}` : 'Share the plan';
  const timing = timingForNight(night.id) || timingForNight(night.id, { solo: true });
  const beats = night.beats.map((beat) => `<li>${escape(beat.name)}</li>`).join('');
  const notes = ((sessionId === 'sneha' ? state.sessionB : state.sessionA).bookingRequests || '').trim();
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
        <p class="milo-booked-when">${escape(whenLine(timing))}</p>
        <ul class="milo-booked-beats">${beats}</ul>
        <p class="milo-booked-ref">Nothing to do now. We'll take it from here.</p>
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
      ${privateBox}
    </div>
    <div class="milo-booked-cta">
      <button class="milo-cta-button" type="button" id="miloBookedCalendar">Add to calendar</button>
      <button class="milo-text-button" type="button" id="miloBookedShare">${shareLabel}</button>
    </div>
  </div>`;
}

function nightFromState(state) {
  const nightId = state.sessionA.savedSoloNightId || state.shared.confirmedNightId || state.sessionA.activeNightId || NIGHTS_POOL[0].id;
  const night = NIGHTS_POOL.find((n) => n.id === nightId) || NIGHTS_POOL[0];
  return { night, timing: timingForNight(night.id) || timingForNight(night.id, { solo: true }) };
}

// A plain calendar file with the night and time. No venue details, nothing private.
export function calendarFile(night, timing) {
  if (!timing) return null;
  const stamp = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const [h, m] = timing.time.split(':').map(Number);
  const [y, mo, d] = timing.date.split('-').map(Number);
  const start = new Date(y, mo - 1, d, h, m);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Milo//EN', 'BEGIN:VEVENT', `UID:${night.id}-${timing.date}@milo`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${night.name}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

export function attachBookedListeners(container, sessionId = 'aarav') {
  container.querySelector('#miloBookedCalendar')?.addEventListener('click', () => {
    const { night, timing } = nightFromState(store.getState());
    const ics = calendarFile(night, timing);
    if (!ics) return;
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'milo-night.ics';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  container.querySelector('#miloBookedShare')?.addEventListener('click', () => {
    const { night, timing } = nightFromState(store.getState());
    const text = `${night.name}${timing ? `, ${timingLabel(timing)}` : ''}. Sealed with Milo.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}
