// Owner-only fulfilment list for physical gifts (/ops/). Not linked from the app.
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

async function load() {
  if (!secret) return signIn();
  root.innerHTML = '<p class="ops-muted">Loading...</p>';
  const { status, data } = await call('GET', '/api/ops/gifts');
  if (status === 401) { save(''); secret = ''; return signIn('That key did not work.'); }
  if (status !== 200) return signIn(status === 503 ? 'Ops is not configured on the server.' : "Couldn't reach Milo.");
  const gifts = data.gifts || [];
  root.innerHTML = `<header class="ops-top"><h1>Gift requests</h1><div><button type="button" id="opsReload">Refresh</button> <button type="button" id="opsOut">Sign out</button></div></header>
    ${gifts.length ? gifts.map(row).join('') : '<p class="ops-muted">No gift requests yet.</p>'}`;
  root.querySelector('#opsReload').addEventListener('click', load);
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
}

load();
