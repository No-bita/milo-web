// Gifting V1 panel on the agreed screen (both seats, Phase 1 together mode).
// Renders only what the server's gifts view holds for THIS phone:
//   - "For you": the hint, the teaser, a sealed note (once open), the memory card.
//   - "From you": this phone's own gifts and their status.
//   - "Add a gift": a sheet appended to <body>, so store re-renders of the
//     screen never wipe a half-filled form.
import { store } from '../domain/store.js';
import { currentGifts, addGift, removeGift } from '../domain/gifts.js';
import { GIFT_KINDS, DELIVERY_WINDOWS, PRICE_LABEL, itemsFor, giftItem } from '../data/gifts.js';
import { escapeHtml } from '../logic/partner.js';
import '../styles/gifts.css';

const STATUS = {
  requested: 'Sent to Milo', confirmed: 'Confirmed', dispatched: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled'
};
const DIGITAL_STATUS = { teaser: 'Shows the day before', sealed_note: 'Opens when the night starts' };
const ERRORS = {
  limit: "That's the most you can add of this one.",
  too_soon: "Not enough time for that one. Pick another.",
  not_ready: 'Set the time first.',
  locked: 'Too late to take this one back.',
  invalid: 'Check the details and try again.',
  unreachable: "Couldn't reach Milo. Try again."
};
const errorText = (result) => ERRORS[result.code] || ERRORS[result.reason] || ERRORS.unreachable;

const stopName = (night, index) => (Number.isInteger(index) ? night.beats?.[index]?.name : null);

function daysUntil(dateKey) {
  if (!dateKey) return Infinity;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateKey}T00:00:00`) - today) / 86400000);
}

function forYou(view, night) {
  const name = String(view.from || 'your person');
  const from = name.charAt(0).toUpperCase() + name.slice(1); // escaped at each use
  const blocks = [];
  if (view.hint) blocks.push(`<p class="milo-gift-hint">Something's on its way to you. That's all we're saying.</p>`);
  for (const gift of view.for_me) {
    if (gift.kind === 'teaser') {
      blocks.push(`<article class="milo-gift-card is-teaser"><p class="milo-gift-eyebrow">A teaser from ${escapeHtml(from)}</p><p class="milo-gift-note">${escapeHtml(gift.note)}</p></article>`);
    }
    if (gift.kind === 'sealed_note') {
      const at = stopName(night, gift.stop_index);
      blocks.push(`<article class="milo-gift-card is-sealed" data-gift-sealed>
        <p class="milo-gift-eyebrow">A note from ${escapeHtml(from)}</p>
        ${at ? `<p class="milo-gift-sub">Best opened at ${escapeHtml(at.toLowerCase())}.</p>` : ''}
        <button type="button" class="milo-pill-btn-secondary milo-gift-open" aria-expanded="false">Open the note</button>
        <p class="milo-gift-note" hidden>${escapeHtml(gift.note)}</p>
      </article>`);
    }
  }
  if (view.sealed_waiting) blocks.push(`<p class="milo-gift-hint">${escapeHtml(from)} left you a sealed note. It opens when the night starts.</p>`);
  if (view.memory.open) {
    const m = view.memory;
    blocks.push(`<article class="milo-gift-card is-memory">
      <p class="milo-gift-eyebrow">One line about tonight</p>
      ${m.mine === null ? `<form class="milo-gift-memory" novalidate>
          <label class="milo-gift-vh" for="miloMemoryLine">Your line</label>
          <textarea id="miloMemoryLine" maxlength="200" rows="2" placeholder="The bit you'll still be talking about."></textarea>
          <button type="submit" class="milo-pill-btn-primary">Save my line</button>
          <p class="milo-gift-error" role="alert" hidden></p>
        </form>`
        : `<p class="milo-gift-note"><span>You:</span> ${escapeHtml(m.mine)}</p>
           ${m.theirs === null ? `<p class="milo-gift-sub">${escapeHtml(from)}'s line shows up once they add it.</p>` : `<p class="milo-gift-note"><span>${escapeHtml(from)}:</span> ${escapeHtml(m.theirs)}</p>`}`}
    </article>`);
  }
  return blocks.join('');
}

function fromYou(view, night) {
  if (!view.mine.length) return '';
  return `<ul class="milo-gift-list" aria-label="Gifts from you">${view.mine.map(gift => {
    const kind = GIFT_KINDS[gift.kind];
    const title = kind.physical ? (giftItem(gift.item_id)?.name || 'A gift') : kind.label;
    const where = gift.kind === 'moment_drop' ? `At ${stopName(night, gift.stop_index)?.toLowerCase() || 'the night'}, ${gift.venue}`
      : gift.kind === 'home_delivery' ? `To their door, ${DELIVERY_WINDOWS[gift.deliver_window]?.split(' (')[0].toLowerCase()}`
      : gift.note;
    const status = kind.physical ? STATUS[gift.status] || gift.status : DIGITAL_STATUS[gift.kind];
    const removable = kind.physical ? gift.status === 'requested' : true;
    return `<li class="milo-gift-row" data-gift-id="${escapeHtml(gift.id)}">
      <div><p class="milo-gift-title">${escapeHtml(title)}</p><p class="milo-gift-sub">${escapeHtml(where || '')}</p></div>
      <div class="milo-gift-row-end"><span class="milo-gift-status" data-status="${escapeHtml(gift.status)}">${escapeHtml(status)}</span>
      ${removable ? `<button type="button" class="milo-gift-remove" aria-label="Remove ${escapeHtml(title)}">Remove</button>` : ''}</div>
    </li>`;
  }).join('')}</ul>`;
}

export function renderGiftsPanel(night, sessionId) {
  const view = currentGifts(store.getState());
  if (!view) return `<section class="milo-gifts" aria-label="Gifts" data-loading><div class="milo-section-label">GIFTS</div></section>`;
  const mine = fromYou(view, night);
  return `<section class="milo-gifts" aria-labelledby="miloGiftsTitle-${sessionId}">
    <div class="milo-section-label" id="miloGiftsTitle-${sessionId}">GIFTS</div>
    ${forYou(view, night)}
    ${mine}
    ${view.can_add
      ? `<button type="button" class="milo-pill-btn-secondary milo-gift-add" id="miloGiftAdd-${sessionId}">${view.mine.length ? 'Add another gift' : 'Add a gift'}</button>
         ${view.mine.length ? '' : '<p class="milo-gift-sub">Something waiting at the table, at their door, or a note for later. Only you see what you pick.</p>'}`
      : '<p class="milo-gift-sub">Set the time first, then you can add a gift.</p>'}
    <p class="milo-gift-error" id="miloGiftNote-${sessionId}" role="alert" hidden></p>
  </section>`;
}

export function attachGiftsPanel(container, night, sessionId, { timing } = {}) {
  const panel = container.querySelector('.milo-gifts');
  if (!panel) return;
  const note = (text) => { const el = panel.querySelector(`#miloGiftNote-${sessionId}`); if (el) { el.textContent = text; el.hidden = !text; } };
  panel.querySelectorAll('[data-gift-sealed] .milo-gift-open').forEach(button => button.addEventListener('click', () => {
    const body = button.parentElement.querySelector('.milo-gift-note');
    body.hidden = false; button.hidden = true; button.setAttribute('aria-expanded', 'true');
  }));
  panel.querySelectorAll('.milo-gift-remove').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    const result = await removeGift(button.closest('[data-gift-id]').dataset.giftId);
    if (!result.ok) { note(errorText(result)); button.disabled = false; }
  }));
  const memory = panel.querySelector('.milo-gift-memory');
  memory?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const field = memory.querySelector('textarea');
    const error = memory.querySelector('.milo-gift-error');
    if (!field.value.trim()) { error.textContent = 'Write a line first.'; error.hidden = false; return; }
    memory.querySelector('button').disabled = true;
    const result = await addGift({ kind: 'memory', note: field.value.trim() });
    if (!result.ok) { error.textContent = errorText(result); error.hidden = false; memory.querySelector('button').disabled = false; }
  });
  panel.querySelector(`#miloGiftAdd-${sessionId}`)?.addEventListener('click', () => openGiftSheet(night, timing));
}

// ---------- Add-a-gift sheet ----------

function kindStep() {
  return `<h2>Add a gift</h2>
    <p>Only you see what you pick.</p>
    <div class="milo-gift-kinds">${Object.entries(GIFT_KINDS).map(([id, kind]) => `
      <button type="button" class="milo-gift-kind" data-kind="${id}">
        <span class="milo-gift-title">${kind.label}</span><span class="milo-gift-sub">${kind.line}</span>
      </button>`).join('')}</div>
    <button type="button" class="milo-pill-btn-secondary" data-close>Not now</button>`;
}

function stopOptions(night, { optional = false } = {}) {
  return `${optional ? '<option value="">Any time</option>' : ''}${(night.beats || []).map((beat, i) => `<option value="${i}">${escapeHtml(beat.name)}</option>`).join('')}`;
}

function formStep(kind, night, timing) {
  const days = daysUntil(timing?.date);
  const items = itemsFor(kind).map(item => {
    const tooSoon = days < item.leadDays;
    return `<label class="milo-gift-item${tooSoon ? ' is-disabled' : ''}">
      <input type="radio" name="item_id" value="${item.id}" ${tooSoon ? 'disabled' : ''} required>
      <span><span class="milo-gift-title">${escapeHtml(item.name)}</span>
      <span class="milo-gift-sub">${escapeHtml(item.desc)} ${tooSoon ? `Needs ${item.leadDays} days' notice.` : ''}</span>
      <span class="milo-gift-price">${PRICE_LABEL}</span></span>
    </label>`;
  }).join('');
  const physical = GIFT_KINDS[kind].physical;
  const fields = {
    moment_drop: `<label>Which stop?<select name="stop_index">${stopOptions(night)}</select></label>
      <label>Where's that stop? <input name="venue" maxlength="120" placeholder="Venue name and area" autocomplete="off"></label>`,
    home_delivery: `<label>Their address<textarea name="address" maxlength="300" rows="3" autocomplete="street-address"></textarea></label>
      <label>When should it arrive?<select name="deliver_window">${Object.entries(DELIVERY_WINDOWS).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>`,
    sealed_note: `<label>Your note<textarea name="note" maxlength="500" rows="5" placeholder="Say the thing."></textarea></label>
      <label>Best opened at<select name="stop_index">${stopOptions(night, { optional: true })}</select></label>`,
    teaser: `<label>The teaser<input name="note" maxlength="140" placeholder="Saturday. Dress up a little." autocomplete="off"></label>`
  }[kind];
  return `<h2>${GIFT_KINDS[kind].label}</h2>
    <p>${GIFT_KINDS[kind].line}</p>
    <form class="milo-gift-form" novalidate data-kind="${kind}">
      ${physical ? `<fieldset class="milo-gift-items"><legend>Pick one</legend>${items}</fieldset>` : ''}
      ${fields}
      ${physical ? `<label>Card message (optional)<input name="note" maxlength="200" autocomplete="off"></label>
        <label>Your WhatsApp number<input name="contact" type="tel" inputmode="tel" maxlength="20" placeholder="+91 98765 43210" autocomplete="tel"></label>
        <label class="milo-gift-check"><input type="checkbox" name="show_hint"> Let them know something's coming</label>
        <p class="milo-gift-sub">No payment now. Milo confirms the price with you on WhatsApp before anything is ordered.</p>` : ''}
      <p class="milo-gift-error" role="alert" hidden></p>
      <button type="submit" class="milo-pill-btn-primary">Add gift</button>
      <button type="button" class="milo-pill-btn-secondary" data-back>Back</button>
    </form>`;
}

function bodyFor(form, kind) {
  const f = form.elements;
  const value = (name) => f[name]?.value?.trim() ?? '';
  if (kind === 'teaser') return { kind, note: value('note') };
  if (kind === 'sealed_note') return { kind, note: value('note'), ...(value('stop_index') !== '' ? { stop_index: Number(value('stop_index')) } : {}) };
  const body = { kind, item_id: form.querySelector('input[name=item_id]:checked')?.value, contact: value('contact'), show_hint: f.show_hint.checked };
  if (value('note')) body.note = value('note');
  if (kind === 'moment_drop') Object.assign(body, { stop_index: Number(value('stop_index')), venue: value('venue') });
  if (kind === 'home_delivery') Object.assign(body, { address: value('address'), deliver_window: value('deliver_window') });
  return body;
}

function localCheck(body) {
  if (GIFT_KINDS[body.kind].physical) {
    if (!body.item_id) return 'Pick a gift first.';
    if (body.kind === 'moment_drop' && body.venue.length < 2) return 'Add the venue for that stop.';
    if (body.kind === 'home_delivery' && body.address.length < 10) return 'Add their full address.';
    if ((body.contact.match(/\d/g) || []).length < 10) return 'Add a WhatsApp number we can reach you on.';
  } else if (!body.note) return body.kind === 'teaser' ? 'Write the teaser first.' : 'Write the note first.';
  return '';
}

export function openGiftSheet(night, timing) {
  document.querySelector('.milo-gift-sheet')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'milo-invite-feedback milo-gift-sheet';
  dialog.setAttribute('aria-label', 'Add a gift');
  const show = (html) => { dialog.innerHTML = `<div class="milo-gift-sheet-body">${html}</div>`; wire(); };
  function wire() {
    dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-back]')?.addEventListener('click', () => show(kindStep()));
    dialog.querySelectorAll('[data-kind]').forEach(button => {
      if (button.tagName === 'BUTTON') button.addEventListener('click', () => show(formStep(button.dataset.kind, night, timing)));
    });
    const form = dialog.querySelector('.milo-gift-form');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const error = form.querySelector('.milo-gift-error');
      const body = bodyFor(form, form.dataset.kind);
      const problem = localCheck(body);
      if (problem) { error.textContent = problem; error.hidden = false; return; }
      const submit = form.querySelector('[type=submit]');
      submit.disabled = true;
      const result = await addGift(body);
      if (result.ok) { dialog.close(); return; }
      error.textContent = errorText(result); error.hidden = false; submit.disabled = false;
    });
    dialog.querySelector('button, input, textarea, select')?.focus();
  }
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  show(kindStep());
  dialog.showModal();
}
