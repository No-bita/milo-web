// Two-phone Phase 1 network adapter. Off unless the build sets VITE_MILO_PHASE1=true (a public,
// non-secret flag). With it off, nothing here runs and the prototype behaves as before.
// Contract: docs/phase1-server.md in the API PR (#67). Frontend only; no secrets live here.
const SEAT_KEY = 'milo_phase1_seat_v1';

export const isPhase1Enabled = () => import.meta.env?.VITE_MILO_PHASE1 === 'true';

// The server rejects control characters and < > @ in names. Clean on this side so the call can't 400.
export function cleanName(value) {
  return [...String(value || '').replace(/[\p{C}<>@]/gu, '').trim()].slice(0, 40).join('');
}

// Plan tile ids are kebab-case in the app, snake_case on the server.
export const serverOccasion = (id) => (id ? String(id).replaceAll('-', '_') : undefined);

export function readSeat() {
  try {
    const seat = JSON.parse(localStorage.getItem(SEAT_KEY));
    return seat && seat.planId && seat.seatKey && seat.role ? seat : null;
  } catch { return null; }
}
const saveSeat = (seat) => { try { localStorage.setItem(SEAT_KEY, JSON.stringify(seat)); } catch { /* offline cache only */ } };

const REASONS = { 404: 'invalid', 409: 'taken', 410: 'expired', 429: 'rate_limited' };

// Resolves { ok, status, data } or { ok:false, reason }. Never throws, never logs bodies.
export async function api(method, path, { body, seatKey } = {}) {
  try {
    const response = await fetch(path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(seatKey ? { authorization: `Bearer ${seatKey}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, status: response.status, data };
    return { ok: false, status: response.status, reason: REASONS[response.status] || (response.status >= 500 ? 'unreachable' : 'invalid') };
  } catch { return { ok: false, reason: 'unreachable' }; }
}

// Initiator: create the plan once and keep the server's invite link.
export async function ensureServerInvite(store) {
  const shared = store.getState().shared;
  if (shared.serverInviteUrl && readSeat()) return { ok: true };
  const { name, partnerName } = store.getState().sessionA;
  const me = cleanName(name);
  if (!me) return { ok: false, reason: 'invalid' };
  const other = cleanName(partnerName);
  const result = await api('POST', '/api/plans', { body: {
    name: me, ...(other ? { partnerName: other } : {}), ...(shared.occasion ? { occasion: serverOccasion(shared.occasion) } : {})
  } });
  if (!result.ok) return result;
  saveSeat({ planId: result.data.plan_id, seatKey: result.data.seat_key, role: 'initiator' });
  store.updateShared({ serverInviteUrl: result.data.invite_url });
  return { ok: true };
}

export const previewInvite = (token) => api('GET', `/api/invites/${encodeURIComponent(token)}`);

export async function joinInvite(token, name) {
  const result = await api('POST', `/api/invites/${encodeURIComponent(token)}/join`, { body: { name: cleanName(name) } });
  if (result.ok) saveSeat({ planId: result.data.plan_id, seatKey: result.data.seat_key, role: 'partner' });
  return result;
}

// Sends only my own half (my seat's row), about one second after it changes. Reads come in later PRs.
export function attachNetworkSync(store) {
  const seat = readSeat();
  if (!seat) return () => {};
  const key = seat.role === 'partner' ? 'sessionB' : 'sessionA';
  let lastSent = null;
  let timer = null;
  const send = async () => {
    const half = store.getState()[key];
    const reactions = (half.reactions || []).map(({ cardId, reaction }) => ({ cardId, reaction }));
    const finished = reactions.length === 8 && !['s1', 'threshold', 's2'].includes(half.screen);
    const payload = { intents: half.intents || [], reactions, finished };
    const serial = JSON.stringify(payload);
    if (serial === lastSent) return;
    const result = await api('PUT', `/api/plans/${seat.planId}/me`, { body: payload, seatKey: seat.seatKey });
    if (result.ok) lastSent = serial;
  };
  const unsubscribe = store.subscribe(() => { clearTimeout(timer); timer = setTimeout(send, 1000); });
  return () => { clearTimeout(timer); unsubscribe(); };
}
