import { sendToSignInForBooking } from '../domain/auth.js';
import { renderLimits, readLimits, limitsOn } from '../components/booking-limits.js';
import { store } from '../domain/store.js';
import { partnerLabel } from '../logic/partner.js';
import { isPhase1Enabled } from '../domain/network-adapter.js';
import { bookSolo, soloSeatFor } from '../domain/solo.js';
import { BUDGETS } from '../data/concierge.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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

// Copy for the surprise toggle. ON (default): only Milo sees the requests.
// OFF: they appear on the plan link the planner shares.
export function surpriseLine(on, partner) {
  return on ? `Only Milo sees these. ${cap(partner)} won't, even if you share the plan.` : `${cap(partner)} will see these on the plan you share.`;
}

const pills = (name, options, legend) => `<fieldset class="milo-choice"><legend>${legend}</legend>${Object.entries(options).map(([v, l]) =>
  `<label class="milo-choice-pill"><input type="radio" name="${name}" value="${v}"><span>${l}</span></label>`).join('')}</fieldset>`;

// Solo booking step: requests + surprise toggle, and (with the server on) the
// details Milo needs to actually book: budget, window, WhatsApp.
export function renderRequests(sessionId = 'aarav') {
  const state = store.getState();
  const me = sessionId === 'sneha' ? state.sessionB : state.sessionA;
  const partner = partnerLabel(state, sessionId);
  const surprise = me.bookingSurprise !== false;
  const live = isPhase1Enabled() && sessionId !== 'sneha';
  const chips = REQUEST_STARTERS.map((c, i) => `<button type="button" class="milo-req-chip" data-starter="${i}">+ ${escape(c.label)}</button>`).join('');
  return `<div class="milo-req" data-session-id="${sessionId}">
    <header class="milo-header"><button class="milo-header-back" id="miloReqBack" aria-label="Back">‹</button><span class="milo-wordmark">milo.</span><div class="milo-header-space"></div></header>
    <form class="milo-req-body milo-gift-form" id="miloReqForm" novalidate>
      <h1 class="milo-req-title">Anything special we should know?</h1>
      <textarea id="miloReqNote" class="milo-req-note" rows="4" placeholder="Flowers, a quiet table, something to celebrate..." aria-label="Anything special we should know" maxlength="1000">${escape(me.bookingDraft ?? me.bookingRequests ?? '')}</textarea>
      <div class="milo-req-chips">${chips}</div>
      <label class="milo-req-toggle">
        <input type="checkbox" id="miloReqSurprise" ${surprise ? 'checked' : ''}>
        <span class="milo-switch" aria-hidden="true"></span>
        <span><b>Keep these a surprise</b><small id="miloReqSurpriseLine">${escape(surpriseLine(surprise, partner))}</small></span>
      </label>
      ${live ? `${pills('budget_band', BUDGETS, 'Budget for two')}
        ${limitsOn() ? renderLimits() : ''}
        <label>Your WhatsApp number<input name="contact" type="tel" inputmode="tel" maxlength="20" placeholder="+91 98765 43210" autocomplete="tel"></label>
        <label class="milo-gift-check"><input type="checkbox" name="add_surprise" id="miloReqSurpriseGift"> Add a surprise</label>
        <p class="milo-gift-sub">Something waiting at the table or at their door. You pick it right after this.</p>
        <p class="milo-req-fineprint">Milo books every stop and confirms on WhatsApp. Nothing is charged in the app.</p>`
      : `<p class="milo-req-fineprint">Preview: this is saved on this phone. Nothing is booked.</p>`}
      <p class="milo-gift-error" id="miloReqError" role="alert" hidden></p>
    </form>
    <div class="milo-req-cta">
      <button class="milo-cta-button" type="submit" form="miloReqForm" id="miloReqBook">Book this night</button>
    </div>
  </div>`;
}

export function attachRequestsListeners(container, sessionId = 'aarav') {
  const note = container.querySelector('#miloReqNote');
  const form = container.querySelector('#miloReqForm');
  const surprise = container.querySelector('#miloReqSurprise');
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const partner = partnerLabel(store.getState(), sessionId);
  // Silent writes while typing/toggling, so the screen does not re-render under the user.
  const saveDraft = () => {
    const state = store.getState();
    store.setState({ ...state, [sessionKey]: { ...state[sessionKey], bookingDraft: note.value, bookingSurprise: surprise.checked } }, false);
  };
  container.querySelectorAll('.milo-req-chip').forEach((chip) => chip.addEventListener('click', () => {
    note.value = addStarter(note.value, REQUEST_STARTERS[Number(chip.dataset.starter)].text);
    note.focus();
    note.setSelectionRange(note.value.length, note.value.length);
    saveDraft();
  }));
  note.addEventListener('input', saveDraft);
  surprise.addEventListener('change', () => {
    container.querySelector('#miloReqSurpriseLine').textContent = surpriseLine(surprise.checked, partner);
    saveDraft();
  });
  container.querySelector('#miloReqBack')?.addEventListener('click', () => store.updateSession(sessionId, { bookingDraft: note.value, bookingSurprise: surprise.checked, screen: 's4_waiting' }));
  const error = container.querySelector('#miloReqError');
  const fail = (text) => { error.textContent = text; error.hidden = !text; };
  // pendingSurprise: the booked screen opens the surprise sheet once, right after the request lands.
  const done = (text) => store.updateSession(sessionId, { bookingRequests: text, bookingSurprise: surprise.checked, bookingDraft: null, pendingSurprise: Boolean(form.elements.add_surprise?.checked), screen: 'booked' });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = note.value.trim().slice(0, REQUEST_MAX);
    const live = isPhase1Enabled() && sessionId !== 'sneha';
    if (!live) { done(text); return; }                       // preview: stays on this phone
    if (soloSeatFor(store.getState().sessionA.savedSoloNightId)) { done(text); return; } // already booked this night
    if (sendToSignInForBooking(sessionId)) return;           // accounts on: sign in first, then back here
    const picked = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value;
    const limits = readLimits(form);
    const booking = { budget_band: picked('budget_band'), contact: form.elements.contact.value.trim(), surprise: surprise.checked, ...(text ? { requests: text } : {}), ...(limits ? { constraints: limits } : {}) };
    if (!booking.budget_band) return fail('Pick a budget.');
    if ((booking.contact.match(/\d/g) || []).length < 10) return fail('Add a WhatsApp number we can reach you on.');
    fail('');
    const button = container.querySelector('#miloReqBook');
    button.disabled = true;
    const result = await bookSolo(booking);
    if (result.ok) { done(text); return; }
    button.disabled = false;
    fail(result.reason === 'invalid' ? 'Check the details and try again.' : result.reason === 'rate_limited' ? 'Too many tries. Wait a minute and try again.' : "Couldn't reach Milo. Try again.");
  });
}
