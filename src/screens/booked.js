import { store } from '../domain/store.js';
import { partnerLabel, isInvited } from '../logic/partner.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { withSoloChoices } from '../logic/planning.js';
import { timingForNight, timingLabel } from '../components/night-timing.js';
import { soloSeatFor, currentSoloBooking, sendSoloCheckin } from '../domain/solo.js';
import { currentGifts, refreshGifts } from '../domain/gifts.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function whenLine(timing) {
  return timing ? timingLabel(timing) : 'Time to be set';
}

// The one "Sealed." screen, after the planner hands the night to Milo.
// With the server on, the status, venues and check-in come from the solo plan;
// in the preview (flag off) it says plainly that nothing has been booked.
function statusLine(view, live) {
  if (!live) return 'This is a preview. Nothing has been booked yet.';
  if (!view?.booking) return "We're booking every stop. You'll hear from us on WhatsApp.";
  if (view.booking.status === 'booked') return 'Booked. The details are on WhatsApp too.';
  if (view.booking.status === 'failed') return "Milo couldn't book this one as planned. We'll message you about options.";
  if (view.booking.status === 'cancelled') return 'This booking was cancelled.';
  return "We're booking every stop. You'll hear from us on WhatsApp.";
}

function stopsHtml(night, stops, venues) {
  return stops.map((name, i) => {
    const v = (venues || []).find(x => x.stop_index === i);
    return `<li><span>${escape(name)}</span>${v ? `<small>${escape(v.venue)}${v.area ? `, ${escape(v.area)}` : ''}${v.time ? ` &middot; ${escape(timingLabel({ date: '2000-01-01', time: v.time }).split(',')[0])}` : ''}</small>` : ''}</li>`;
  }).join('');
}

export function renderBooked(sessionId = 'aarav') {
  const state = store.getState();
  const nightId = state.sessionA.savedSoloNightId || state.shared.confirmedNightId || state.sessionA.activeNightId || NIGHTS_POOL[0].id;
  const night = withSoloChoices(state, NIGHTS_POOL.find((n) => n.id === nightId) || NIGHTS_POOL[0]);
  const partner = partnerLabel(state, sessionId);
  const me = sessionId === 'sneha' ? state.sessionB : state.sessionA;
  const seat = sessionId === 'sneha' ? null : soloSeatFor(night.id);
  const live = Boolean(seat);
  const view = live ? currentSoloBooking(state) : null;
  const timing = timingForNight(night.id) || timingForNight(night.id, { solo: true });
  const overrides = state.sessionA.soloItineraryOverrides?.[night.id] || {};
  const stops = night.beats.map((beat, i) => (overrides[i] || beat).name);
  const notes = (me.bookingRequests || '').trim();
  const surprise = me.bookingSurprise !== false;
  const lock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const privateBox = notes ? `<section class="milo-booked-private" aria-label="${surprise ? 'Private requests' : 'Requests'}">
        <p class="milo-booked-label">${surprise ? `${lock}PRIVATE REQUESTS · ONLY YOU` : `REQUESTS · ${escape(partner.toUpperCase())} WILL SEE THESE`}</p>
        <p>${escape(notes)}</p>
      </section>` : '';
  const checkin = view?.checkin?.open
    ? (view.checkin.done
      ? '<p class="milo-concierge-thanks">Thanks for telling us how it went. It shapes the next one.</p>'
      : `<section class="milo-concierge-card is-checkin"><p class="milo-concierge-eyebrow">How was it?</p><p class="milo-concierge-text">A minute, six questions. Only Milo sees your answers.</p><button type="button" class="milo-pill-btn-primary" id="miloSoloCheckin">Tell us</button></section>`)
    : '';
  return `<div class="milo-booked" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body">
      <h1 class="milo-booked-title">Sealed.</h1>
      <p class="milo-booked-sub">${live ? 'Milo is on it.' : 'Saved on this phone.'}</p>
      ${checkin ? `<div class="milo-concierge">${checkin}</div>` : ''}
      <article class="milo-booked-card" aria-label="Your night">
        <p class="milo-booked-label">YOUR NIGHT</p>
        <h2 class="milo-booked-night">${escape(night.name)}</h2>
        <p class="milo-booked-when">${escape(whenLine(timing))}</p>
        <ul class="milo-booked-beats milo-booked-stops-list">${stopsHtml(night, stops, view?.booking?.venues)}</ul>
        <p class="milo-booked-ref">${escape(statusLine(view, live))}</p>
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
      ${privateBox}
      ${live ? '<div id="miloBookedGifts"></div>' : ''}
    </div>
    <div class="milo-booked-cta">
      <button class="milo-cta-button" type="button" id="miloBookedDone">Done</button>
      <button class="milo-pill-btn-secondary" type="button" id="miloBookedShare">${sessionId === 'sneha' || isInvited(state) ? `Share with ${escape(partner)}` : 'Share the plan'}</button>
    </div>
  </div>`;
}

function nightFromState(state) {
  const nightId = state.sessionA.savedSoloNightId || state.shared.confirmedNightId || state.sessionA.activeNightId || NIGHTS_POOL[0].id;
  const night = withSoloChoices(state, NIGHTS_POOL.find((n) => n.id === nightId) || NIGHTS_POOL[0]);
  return { night, timing: timingForNight(night.id) || timingForNight(night.id, { solo: true }) };
}

function escapeIcsText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// .ics calendar invite containing the night title, formatted timing, and address links to Google Maps for each beat.
export function calendarFile(night, timing) {
  if (!timing || !night) return null;
  const stamp = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const [h, m] = timing.time.split(':').map(Number);
  const [y, mo, d] = timing.date.split('-').map(Number);
  const start = new Date(y, mo - 1, d, h, m);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const when = timingLabel(timing);

  const beatLines = (night.beats || []).map((beat, i) => {
    const query = encodeURIComponent(`${beat.name}, Bengaluru`);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
    return `${i + 1}. ${beat.name}${beat.desc ? `: ${beat.desc}` : ''} - ${mapsLink}`;
  });

  const descriptionLines = [
    night.name,
    `Timing: ${when}`,
    '',
    'Itinerary:',
    ...beatLines,
    '',
    'Planned with Milo.'
  ];

  const description = escapeIcsText(descriptionLines.join('\n'));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Milo//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${night.id}-${timing.date}@milo`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcsText(night.name)}`,
    `DESCRIPTION:${description}`,
    'LOCATION:Bengaluru\\, Karnataka\\, India',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// The solo night as booked, with the planner's own stop swaps.
function soloNight(state) {
  const { night, timing } = nightFromState(state);
  const overrides = state.sessionA.soloItineraryOverrides?.[night.id] || {};
  return { night: { ...night, beats: night.beats.map((beat, i) => overrides[i] || beat) }, timing };
}

// Solo surprises: opened right after booking when asked for in the booking step,
// and listed here once added. Loaded on demand (the panel imports a stylesheet).
function attachSoloGifts(container, sessionId) {
  const state = store.getState();
  const { night, timing } = soloNight(state);
  if (sessionId === 'sneha' || !soloSeatFor(night.id)) return false;
  if (state.sessionA.pendingSurprise) {
    store.updateSession('aarav', { pendingSurprise: false });
    import('../components/gifts-panel.js').then(m => m.openGiftSheet(night, timing, { solo: true }));
    return true;
  }
  const slot = container.querySelector('#miloBookedGifts');
  if (!currentGifts()) { refreshGifts(); return false; }
  if (slot) import('../components/gifts-panel.js').then(m => {
    if (!slot.isConnected) return;
    slot.innerHTML = m.renderGiftsPanel(night, sessionId, { solo: true, listOnly: true });
    m.attachGiftsPanel(slot, night, sessionId, { timing, solo: true });
  });
  return false;
}

export function attachBookedListeners(container, sessionId = 'aarav') {
  // A re-render already wired the fresh screen when the surprise sheet opened.
  if (attachSoloGifts(container, sessionId)) return;
  /* Calendar sync commented out for now:
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
  */
  container.querySelector('#miloBookedDone')?.addEventListener('click', () => store.setSessionScreen(sessionId, 'home'));
  // Loaded on demand so this screen's module stays free of stylesheet imports (unit tests run it in Node).
  container.querySelector('#miloSoloCheckin')?.addEventListener('click', () => import('../components/concierge-panel.js').then(m => m.openCheckinSheet(sendSoloCheckin)));
  container.querySelector('#miloBookedShare')?.addEventListener('click', () => {
    const { night, timing } = nightFromState(store.getState());
    // With a booked solo plan, share the read-only Milo link: it shows the night,
    // venues once booked, and only the requests not kept as a surprise.
    const seat = sessionId === 'sneha' ? null : soloSeatFor(night.id);
    const text = seat?.shareUrl
      ? `${night.name}${timing ? `, ${timingLabel(timing)}` : ''}. Here's our night: ${seat.shareUrl}`
      : `${night.name}${timing ? `, ${timingLabel(timing)}` : ''}. Planned with Milo.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}
