// Accounts API client: the people you plan with and your dated nights.
// Off unless the build sets VITE_MILO_ACCOUNTS=true. With it off nothing here calls
// the network, so the You tab shows its placeholder and Nights > Past stays empty.
// Contract: docs/accounts-api.md. The server routes arrive with the accounts work.
// Never logs bodies, names or errors.

export const accountsEnabled = () => import.meta.env?.VITE_MILO_ACCOUNTS === 'true';

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const count = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
const text = (s) => (typeof s === 'string' ? [...s.replace(/[\p{C}<>]/gu, '').trim()].slice(0, 40).join('') : '');

// Keep only well-formed rows; a bad row is dropped, never shown half-filled.
export function cleanPeople(body) {
  const rows = Array.isArray(body?.people) ? body.people : [];
  return rows.flatMap((p) => {
    const name = text(p?.display_name);
    if (!ID.test(String(p?.id || '')) || !name) return [];
    return [{ id: p.id, display_name: name, since: DATE.test(p.since || '') ? p.since : null,
      nights: { booked: count(p.nights?.booked), planned: count(p.nights?.planned) } }];
  }).slice(0, 20);
}

export function cleanNights(body) {
  const rows = Array.isArray(body?.nights) ? body.nights : [];
  return rows.flatMap((n) => {
    if (!ID.test(String(n?.plan_id || '')) || !ID.test(String(n?.night_id || ''))) return [];
    if (!DATE.test(n.date || '') || !TIME.test(n.time || '')) return [];
    if (!['solo', 'together'].includes(n.mode) || !['booked', 'planned'].includes(n.status)) return [];
    const personId = ID.test(String(n.person_id || '')) ? n.person_id : null;
    return [{ plan_id: n.plan_id, mode: n.mode, night_id: n.night_id, date: n.date, time: n.time, person_id: personId, status: n.status }];
  }).slice(0, 100);
}

async function get(path, fetchImpl) {
  try {
    const res = await fetchImpl(path, { method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (res.status === 401) return { status: 'signed_out' };
    if (!res.ok) return { status: 'error' };
    return { status: 'ok', body: await res.json() };
  } catch { return { status: 'error' }; }
}

const cleanMe = (body) => {
  const a = body?.account;
  return a && typeof a.id === 'string' && typeof a.email === 'string' ? { id: a.id, email: a.email, name: text(a.name) || null } : null;
};

// Fetches who is signed in plus both lists and stores them as state.account. Anything but
// three good answers keeps the last good copy for offline use, except signed out, which clears it.
export async function refreshAccount(store, { enabled = accountsEnabled(), fetchImpl = globalThis.fetch } = {}) {
  if (!enabled || typeof fetchImpl !== 'function') return null;
  const [me, people, nights] = await Promise.all([get('/api/me', fetchImpl), get('/api/me/people', fetchImpl), get('/api/me/nights', fetchImpl)]);
  const all = [me, people, nights];
  let next;
  if (all.some(r => r.status === 'signed_out')) next = { status: 'signed_out', me: null, people: [], nights: [] };
  else if (all.every(r => r.status === 'ok') && cleanMe(me.body)) next = { status: 'ok', me: cleanMe(me.body), people: cleanPeople(people.body), nights: cleanNights(nights.body) };
  else next = { me: null, people: [], nights: [], ...(store.getState().account || {}), status: 'error' };
  if (JSON.stringify(store.getState().account) !== JSON.stringify(next)) store.setAccount(next);
  return next;
}

// The account data to show: nothing while the switch is off.
export const accountData = (state, enabled = accountsEnabled()) =>
  (enabled && state.account ? state.account : { status: 'off', me: null, people: [], nights: [] });

// The name this phone uses for a person: a local nickname, else what the server sends.
export const personName = (state, person) => state.sessionA?.personNames?.[person.id] || person.display_name;

// The signed-in account, or null.
export const accountMe = (state, enabled = accountsEnabled()) => accountData(state, enabled).me || null;

// Your person on the You tab: the most recent one the server lists.
export const yourPerson = (state, enabled = accountsEnabled()) => accountData(state, enabled).people[0] || null;

// Nights whose date has gone by, newest first. today: 'YYYY-MM-DD' in local time.
export function pastNights(state, today, enabled = accountsEnabled()) {
  return accountData(state, enabled).nights
    .filter((n) => n.date < today)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

export const localToday = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
