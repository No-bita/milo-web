// Owner-only ops page (/ops/): booking requests, gift requests, PMF CSV export.
// Not linked from the app.
// The OPS_SECRET is typed in and kept for this tab only (sessionStorage); the
// server checks it on every request. Nothing here is cached or logged.
import { GIFT_STATUSES, DELIVERY_WINDOWS } from '../data/gifts.js';
import './ops.css';

const KEY = 'milo_ops_secret';
const root = document.querySelector('#ops');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const read = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
const save = (v) => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { /* tab-only convenience */ } };
let secret = read();

async function call(method, path, body) {
  try {
    const res = await fetch(path, { method, headers: { authorization: `Bearer ${secret}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  } catch { return { status: 0, data: {} }; }
}

function signIn(message = '') {
  root.innerHTML = `<section class="ops-card"><h1>Gift requests</h1>
    <form id="opsLogin"><label>Ops key<input type="password" id="opsKey" autocomplete="current-password" required></label>
    <button type="submit">Open</button></form>${message ? `<p class="ops-error" role="alert">${esc(message)}</p>` : ''}</section>`;
  root.querySelector('#opsLogin').addEventListener('submit', (e) => { e.preventDefault(); secret = root.querySelector('#opsKey').value.trim(); save(secret); load(); });
}

const when = (t) => (t ? `${t.date} ${t.time} (${t.time_zone})` : 'No time set');

function row(g) {
  const where = g.kind === 'moment_drop' ? `At ${esc(g.stop || 'a stop')}: ${esc(g.venue)}` : `Deliver to: ${esc(g.address)}<br>${esc(DELIVERY_WINDOWS[g.deliver_window] || g.deliver_window)}`;
  return `<article class="ops-gift" data-id="${esc(g.id)}">
    <header><h2>${esc(g.item_name)}</h2><span class="ops-status" data-status="${esc(g.status)}">${esc(g.status)}</span></header>
    <p><strong>${esc(g.giver_name)}</strong> for <strong>${esc(g.recipient_name || '?')}</strong> &middot; ${esc(g.night_name || '')}</p>
    <p>Night: ${esc(when(g.timing))}</p>
    <p>${where}</p>
    ${g.note ? `<p>Card: "${esc(g.note)}"</p>` : ''}
    <p>WhatsApp: <a href="https://wa.me/${esc(String(g.contact || '').replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(g.contact)}</a> &middot; Hint shown: ${g.show_hint ? 'yes' : 'no'}</p>
    <label>Status <select data-status-select>${GIFT_STATUSES.map(s => `<option ${s === g.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    <p class="ops-error" role="alert" hidden></p>
  </article>`;
}

const BUDGETS = { under_2k: 'Under ₹2,000', '2k_4k': '₹2,000 - 4,000', '4k_7k': '₹4,000 - 7,000', '7k_plus': '₹7,000+' };
const BOOKING_STATUSES = ['requested', 'booked', 'failed', 'cancelled'];

function bookingRow(b) {
  const venueAt = i => (b.venues || []).find(v => v.stop_index === i) || {};
  return `<article class="ops-gift ops-booking" data-booking-id="${esc(b.id)}">
    <header><h2>${esc(b.night_name || 'Night')}</h2><span class="ops-status" data-status="${esc(b.status)}">${esc(b.status)}</span></header>
    <p><strong>${esc(b.requester_name)}</strong> asked, with <strong>${esc(b.partner_name || '?')}</strong>${b.occasion ? ` &middot; ${esc(b.occasion.replace(/_/g, ' '))}` : ''}</p>
    <p>Night: ${esc(when(b.timing))} &middot; ${esc(b.window_hours)} hours &middot; ${esc(BUDGETS[b.budget_band] || b.budget_band)} for two</p>
    ${b.notes ? `<p>Notes: "${esc(b.notes)}"</p>` : ''}
    <p>WhatsApp: <a href="https://wa.me/${esc(String(b.contact || '').replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(b.contact)}</a>${b.physical_gifts ? ` &middot; ${esc(b.physical_gifts)} physical gift(s) on this plan` : ''}</p>
    <fieldset class="ops-venues"><legend>Venues (both phones see these once booked)</legend>
      ${(b.stops || []).map((stop, i) => `<div class="ops-venue" data-stop="${i}"><span>${esc(stop)}</span>
        <input data-f="venue" placeholder="Venue" value="${esc(venueAt(i).venue || '')}" maxlength="120">
        <input data-f="area" placeholder="Area" value="${esc(venueAt(i).area || '')}" maxlength="80">
        <input data-f="time" type="time" value="${esc(venueAt(i).time || '')}"></div>`).join('')}
    </fieldset>
    <div class="ops-row"><label>Status <select data-f="status">${BOOKING_STATUSES.map(s => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Your minutes <input data-f="ops_minutes" type="number" min="0" max="1440" value="${b.ops_minutes ?? ''}"></label>
      <button type="button" data-save>Save</button></div>
    <p class="ops-error" role="alert" hidden></p>
  </article>`;
}

async function exportCsv() {
  try {
    const res = await fetch('/api/ops/export.csv', { headers: { authorization: `Bearer ${secret}` } });
    if (!res.ok) throw new Error('export');
    const url = URL.createObjectURL(await res.blob());
    const link = Object.assign(document.createElement('a'), { href: url, download: `milo-plans-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { alertBox('Export failed. Refresh and try again.'); }
}
const alertBox = (text) => { const el = root.querySelector('#opsTopError'); if (el) { el.textContent = text; el.hidden = !text; } };

async function load() {
  if (!secret) return signIn();
  root.innerHTML = '<p class="ops-muted">Loading...</p>';
  const [giftsRes, bookingsRes] = await Promise.all([call('GET', '/api/ops/gifts'), call('GET', '/api/ops/bookings')]);
  const status = giftsRes.status === 200 ? bookingsRes.status : giftsRes.status;
  if (status === 401) { save(''); secret = ''; return signIn('That key did not work.'); }
  if (status !== 200) return signIn(status === 503 ? 'Ops is not configured on the server.' : "Couldn't reach Milo.");
  const gifts = giftsRes.data.gifts || [];
  const bookings = bookingsRes.data.bookings || [];
  root.innerHTML = `<header class="ops-top"><h1>Milo ops</h1><div><button type="button" id="opsExport">Export CSV</button> <button type="button" id="opsReload">Refresh</button> <button type="button" id="opsOut">Sign out</button></div></header>
    <p class="ops-error" id="opsTopError" role="alert" hidden></p>
    <h2 class="ops-section">Booking requests</h2>
    ${bookings.length ? bookings.map(bookingRow).join('') : '<p class="ops-muted">No booking requests yet.</p>'}
    <h2 class="ops-section">Gift requests</h2>
    ${gifts.length ? gifts.map(row).join('') : '<p class="ops-muted">No gift requests yet.</p>'}`;
  root.querySelector('#opsReload').addEventListener('click', load);
  root.querySelector('#opsExport').addEventListener('click', exportCsv);
  root.querySelector('#opsOut').addEventListener('click', () => { save(''); secret = ''; signIn(); });
  root.querySelectorAll('[data-status-select]').forEach(select => select.addEventListener('change', async () => {
    const card = select.closest('[data-id]');
    const error = card.querySelector('.ops-error');
    select.disabled = true;
    const res = await call('POST', `/api/ops/gifts/${card.dataset.id}`, { status: select.value });
    select.disabled = false;
    if (res.status === 200) { card.querySelector('.ops-status').textContent = res.data.status; card.querySelector('.ops-status').dataset.status = res.data.status; error.hidden = true; }
    else { error.textContent = 'Could not update. Refresh and try again.'; error.hidden = false; }
  }));
  root.querySelectorAll('[data-booking-id] [data-save]').forEach(button => button.addEventListener('click', async () => {
    const card = button.closest('[data-booking-id]');
    const error = card.querySelector('.ops-error');
    const venues = [...card.querySelectorAll('.ops-venue')].map(row => {
      const f = name => row.querySelector(`[data-f="${name}"]`).value.trim();
      return f('venue') ? { stop_index: Number(row.dataset.stop), venue: f('venue'), ...(f('area') ? { area: f('area') } : {}), ...(f('time') ? { time: f('time') } : {}) } : null;
    }).filter(Boolean);
    const minutes = card.querySelector('[data-f="ops_minutes"]').value;
    const body = { status: card.querySelector('[data-f="status"]').value, venues, ...(minutes !== '' ? { ops_minutes: Number(minutes) } : {}) };
    button.disabled = true;
    const res = await call('POST', `/api/ops/bookings/${card.dataset.bookingId}`, body);
    button.disabled = false;
    if (res.status === 200) { const pill = card.querySelector('.ops-status'); pill.textContent = res.data.status; pill.dataset.status = res.data.status; error.hidden = true; }
    else { error.textContent = body.status === 'booked' && !venues.length ? 'Add at least one venue before marking it booked.' : 'Could not save. Check the venue names and times.'; error.hidden = false; }
  }));
}

load();
