// Concierge handover + next-morning check-in on the agreed screen (both seats,
// Phase 1 together mode). Forms open in sheets appended to <body>, so store
// re-renders of the screen never wipe what someone is typing.
import { store } from '../domain/store.js';
import { currentConcierge, requestBooking, cancelBooking, sendCheckin } from '../domain/concierge.js';
import { escapeHtml, partnerLabel } from '../logic/partner.js';
import { timingLabel } from './night-timing.js';
import '../styles/concierge.css';

// Copy is a first draft for review.
export const BUDGETS = { under_2k: 'Under ₹2,000', '2k_4k': '₹2,000 - 4,000', '4k_7k': '₹4,000 - 7,000', '7k_plus': '₹7,000+' };
const PAY = { nothing: 'Nothing', under_200: 'Under ₹200', '200_500': '₹200 - 500', '500_1000': '₹500 - 1,000', '1000_plus': '₹1,000+' };
const ERRORS = {
  exists: 'Someone already asked Milo to book this one.', locked: "It's already booked, so it can't be cancelled here.",
  not_ready: 'Set the time first.', invalid: 'Check the details and try again.', unreachable: "Couldn't reach Milo. Try again."
};
const errorText = r => ERRORS[r.code] || ERRORS[r.reason] || ERRORS.unreachable;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function venuesList(night, venues) {
  return `<ul class="milo-booked-stops">${[...venues].sort((a, b) => a.stop_index - b.stop_index).map(v => `
    <li><span class="milo-booked-stop">${escapeHtml(night.beats?.[v.stop_index]?.name || 'Stop')}</span>
    <span class="milo-booked-venue">${escapeHtml(v.venue)}${v.area ? `, ${escapeHtml(v.area)}` : ''}</span>
    ${v.time ? `<span class="milo-booked-time">${escapeHtml(timingLabel({ date: '2000-01-01', time: v.time }).split(',')[0])}</span>` : ''}</li>`).join('')}</ul>`;
}

export function renderConciergePanel(night, sessionId) {
  const view = currentConcierge(store.getState());
  if (!view) return '';
  const partner = cap(String(partnerLabel(store.getState(), sessionId) || 'your person'));
  const parts = [];
  if (view.checkin.open && !view.checkin.done) {
    parts.push(`<section class="milo-concierge-card is-checkin" aria-labelledby="miloCheckinTitle-${sessionId}">
      <p class="milo-concierge-eyebrow" id="miloCheckinTitle-${sessionId}">How was it?</p>
      <p class="milo-concierge-text">A minute, six questions. Only Milo sees your answers, not ${escapeHtml(partner)}.</p>
      <button type="button" class="milo-pill-btn-primary" id="miloCheckinOpen-${sessionId}">Tell us</button>
    </section>`);
  } else if (view.checkin.done) {
    parts.push(`<p class="milo-concierge-thanks">Thanks for telling us how it went. It shapes the next one.</p>`);
  }
  const b = view.booking;
  if (b?.status === 'booked') {
    parts.push(`<section class="milo-concierge-card is-booked" aria-label="Booked"><p class="milo-concierge-eyebrow">Booked</p>${venuesList(night, b.venues)}
      <p class="milo-concierge-text">Details are on WhatsApp too.</p></section>`);
  } else if (b?.status === 'requested') {
    parts.push(`<section class="milo-concierge-card" aria-label="Booking">
      <p class="milo-concierge-eyebrow">Milo is on it</p>
      <p class="milo-concierge-text">${b.requested_by_me ? "We're booking every stop. You'll hear from us on WhatsApp." : `${escapeHtml(partner)} asked Milo to book this. We're on it.`}</p>
      ${b.requested_by_me ? `<button type="button" class="milo-concierge-link" id="miloBookingCancel-${sessionId}">Cancel request</button>` : ''}
    </section>`);
  } else if (b?.status === 'failed') {
    parts.push(`<section class="milo-concierge-card"><p class="milo-concierge-eyebrow">Not booked yet</p>
      <p class="milo-concierge-text">Milo couldn't book this one as planned. We'll message about options.</p></section>`);
  } else if (view.can_request) {
    parts.push(`<section class="milo-concierge-card is-offer" aria-labelledby="miloBookTitle-${sessionId}">
      <p class="milo-concierge-eyebrow" id="miloBookTitle-${sessionId}">Want Milo to book it?</p>
      <p class="milo-concierge-text">We book every stop and send the details on WhatsApp. No payment in the app.</p>
      <button type="button" class="milo-pill-btn-primary" id="miloBookingOpen-${sessionId}">Let Milo book it</button>
    </section>`);
  }
  parts.push(`<p class="milo-gift-error" id="miloConciergeNote-${sessionId}" role="alert" hidden></p>`);
  return `<div class="milo-concierge">${parts.join('')}</div>`;
}

export function attachConciergePanel(container, night, sessionId, { timing } = {}) {
  const note = text => { const el = container.querySelector(`#miloConciergeNote-${sessionId}`); if (el) { el.textContent = text; el.hidden = !text; } };
  container.querySelector(`#miloBookingOpen-${sessionId}`)?.addEventListener('click', () => openBookingSheet(timing));
  container.querySelector(`#miloCheckinOpen-${sessionId}`)?.addEventListener('click', () => openCheckinSheet());
  const cancel = container.querySelector(`#miloBookingCancel-${sessionId}`);
  cancel?.addEventListener('click', async () => {
    cancel.disabled = true;
    const r = await cancelBooking();
    if (!r.ok) { note(errorText(r)); cancel.disabled = false; }
  });
}

function sheet(label, html, onSubmit) {
  document.querySelector('.milo-concierge-sheet')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'milo-invite-feedback milo-gift-sheet milo-concierge-sheet';
  dialog.setAttribute('aria-label', label);
  dialog.innerHTML = `<form class="milo-gift-form" novalidate>${html}
    <p class="milo-gift-error" role="alert" hidden></p>
    <button type="submit" class="milo-pill-btn-primary">Send</button>
    <button type="button" class="milo-pill-btn-secondary" data-close>Not now</button></form>`;
  const form = dialog.querySelector('form');
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const error = form.querySelector('.milo-gift-error');
    const submit = form.querySelector('[type=submit]');
    const problem = await onSubmit(form, () => { submit.disabled = true; });
    if (problem) { error.textContent = problem; error.hidden = false; submit.disabled = false; } else dialog.close();
  });
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
  form.querySelector('input, textarea, select')?.focus();
}

const radios = (name, options, legend) => `<fieldset class="milo-choice"><legend>${legend}</legend>${Object.entries(options).map(([v, l]) =>
  `<label class="milo-choice-pill"><input type="radio" name="${name}" value="${v}"><span>${l}</span></label>`).join('')}</fieldset>`;
const picked = (form, name) => form.querySelector(`input[name="${name}"]:checked`)?.value;

export function openBookingSheet(timing) {
  const from = timing ? timingLabel(timing) : 'your agreed time';
  sheet('Let Milo book it', `<h2>Let Milo book it</h2>
    <p>We book every stop for ${escapeHtml(from)} and confirm on WhatsApp. Nothing is charged in the app.</p>
    ${radios('budget_band', BUDGETS, 'Budget for two')}
    ${radios('window_hours', { 3: '3 hours', 4: '4 hours' }, 'How long is the night?')}
    <label>Your WhatsApp number<input name="contact" type="tel" inputmode="tel" maxlength="20" placeholder="+91 98765 43210" autocomplete="tel"></label>
    <label>Anything we should know? (optional)<textarea name="notes" maxlength="300" rows="3" placeholder="Area, diet, no alcohol, a place you love"></textarea></label>`,
  async (form, busy) => {
    const body = { budget_band: picked(form, 'budget_band'), window_hours: Number(picked(form, 'window_hours')), contact: form.elements.contact.value.trim() };
    const notes = form.elements.notes.value.trim(); if (notes) body.notes = notes;
    if (!body.budget_band) return 'Pick a budget.';
    if (!body.window_hours) return 'Pick how long the night is.';
    if ((body.contact.match(/\d/g) || []).length < 10) return 'Add a WhatsApp number we can reach you on.';
    busy();
    const r = await requestBooking(body);
    return r.ok ? '' : errorText(r);
  });
}

export function openCheckinSheet() {
  sheet('How was it?', `<h2>How was it?</h2><p>Only Milo sees this.</p>
    ${radios('differently', { yes: 'Yes', partly: 'A bit', no: 'No' }, 'Would you have planned this differently yourself?')}
    <label>What did Milo do that you wouldn't have? (optional)<textarea name="wouldnt_have" maxlength="300" rows="2"></textarea></label>
    ${radios('rating', { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }, 'Rate the night')}
    ${radios('use_again', { yes: 'Yes', maybe: 'Maybe', no: 'No' }, 'Would you use Milo again?')}
    ${radios('recommend', { yes: 'Yes', maybe: 'Maybe', no: 'No' }, 'Would you recommend it to a friend?')}
    ${radios('would_pay', PAY, 'What would you have paid Milo to plan it?')}`,
  async (form, busy) => {
    const body = { differently: picked(form, 'differently'), rating: Number(picked(form, 'rating')), use_again: picked(form, 'use_again'), recommend: picked(form, 'recommend'), would_pay: picked(form, 'would_pay') };
    if (!body.differently || !body.rating || !body.use_again || !body.recommend || !body.would_pay) return 'Answer the five quick ones first.';
    const extra = form.elements.wouldnt_have.value.trim(); if (extra) body.wouldnt_have = extra;
    busy();
    const r = await sendCheckin(body);
    return r.ok ? '' : errorText(r);
  });
}
