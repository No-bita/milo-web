import { store } from '../domain/store.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { timingForNight } from '../components/night-timing.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Chips only drop starter text into the note. The user edits it there.
export const REQUEST_STARTERS = [
  { label: 'Flowers at the table', text: 'Flowers at the table: ' },
  { label: 'Dessert with a message', text: 'Dessert with a message: ' },
  { label: 'Window seat', text: 'Window seat if possible.' }
];


export const REQUEST_MAX = 1000;

export function addStarter(current, text) {
  const base = String(current || '').replace(/\s+$/, '');
  return (base ? `${base}\n${text}` : text).slice(0, REQUEST_MAX);
}

export function renderRequests(sessionId = 'aarav') {
  const a = store.getState().sessionA;
  const me = sessionId === 'sneha' ? store.getState().sessionB : a;
  const partner = escape(sessionId === 'sneha' ? 'Aarav' : (a.partnerName || 'your partner'));
  const night = NIGHTS_POOL.find((n) => n.id === (a.savedSoloNightId || a.activeNightId)) || NIGHTS_POOL[0];
  const chips = REQUEST_STARTERS.map((c, i) => `<button type="button" class="milo-req-chip" data-starter="${i}">+ ${escape(c.label)}</button>`).join('');
  return `<div class="milo-req" data-session-id="${sessionId}">
    <header class="milo-header"><button class="milo-header-back" id="miloReqBack" aria-label="Back">‹</button><span class="milo-wordmark">milo.</span><div class="milo-header-space"></div></header>
    <div class="milo-req-body">
      <h1 class="milo-req-title">Anything we should tell them?</h1>
      <textarea id="miloReqNote" class="milo-req-note" rows="4" placeholder="Write a note for the venue" aria-label="Note for the venue" maxlength="1000">${escape(me.bookingDraft ?? me.bookingRequests ?? '')}</textarea>
      <div class="milo-req-chips">${chips}</div>
      <div class="milo-req-secret">
        <div><b>Keep this secret from ${partner}</b><span>${partner} won't see these requests. Pinky promise.</span></div>
      </div>
    </div>
    <div class="milo-req-cta">
      <button class="milo-cta-button" type="button" id="miloReqBook">Book this night</button>
      <button class="milo-text-button" type="button" id="miloReqSkip">Skip</button>
    </div>
  </div>`;
}

export function attachRequestsListeners(container, sessionId = 'aarav') {
  const note = container.querySelector('#miloReqNote');
  container.querySelectorAll('.milo-req-chip').forEach((chip) => chip.addEventListener('click', () => {
    note.value = addStarter(note.value, REQUEST_STARTERS[Number(chip.dataset.starter)].text);
    note.focus();
    note.setSelectionRange(note.value.length, note.value.length);
  }));
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  // Keep what they type in their own session. Silent write while typing, so the box keeps focus.
  const saveDraft = () => {
    const state = store.getState();
    store.setState({ ...state, [sessionKey]: { ...state[sessionKey], bookingDraft: note.value } }, false);
  };
  note.addEventListener('input', saveDraft);
  container.querySelectorAll('.milo-req-chip').forEach((chip) => chip.addEventListener('click', saveDraft));
  container.querySelector('#miloReqBack')?.addEventListener('click', () => store.updateSession(sessionId, { bookingDraft: note.value, screen: 's4_waiting' }));
  // Demo only: the note stays in app state. Nothing is sent to a venue.
  const go = (text) => store.updateSession(sessionId, { bookingRequests: text.trim().slice(0, REQUEST_MAX), bookingDraft: null, screen: 'booked' });
  container.querySelector('#miloReqBook')?.addEventListener('click', () => go(note.value));
  container.querySelector('#miloReqSkip')?.addEventListener('click', () => go(''));
}
