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
    // `code` is the server's safe error code (e.g. limit, too_soon), never exception text.
    return { ok: false, status: response.status, reason: REASONS[response.status] || (response.status >= 500 ? 'unreachable' : 'invalid'), code: typeof data.error === 'string' ? data.error : undefined };
  } catch { return { ok: false, reason: 'unreachable' }; }
}

// Initiator: create the plan once and keep the server's invite link.
export async function ensureServerInvite(store) {
  const shared = store.getState().shared;
  if (!store.getState().sessionA.localOnlyPlan && shared.serverInviteUrl && readSeat()) return { ok: true };
  const { name, partnerName } = store.getState().sessionA;
  const me = cleanName(name);
  if (!me) return { ok: false, reason: 'invalid' };
  const other = cleanName(partnerName);
  const result = await api('POST', '/api/plans', { body: {
    name: me, ...(other ? { partnerName: other } : {}), ...(shared.occasion ? { occasion: serverOccasion(shared.occasion) } : {})
  } });
  if (!result.ok) return result;
  saveSeat({ planId: result.data.plan_id, seatKey: result.data.seat_key, role: 'initiator' });
  store.updateShared({ serverInviteUrl: result.data.invite_url, serverResult: null, serverResultPlanId: null, suggestion: null, confirmedNightId: null, partnerJoined: false, partnerFinished: false, planStatus: null });
  store.updateSession('aarav', { localOnlyPlan: false });
  return { ok: true };
}

export const previewInvite = (token) => api('GET', `/api/invites/${encodeURIComponent(token)}`);

export async function joinInvite(token, name) {
  const result = await api('POST', `/api/invites/${encodeURIComponent(token)}/join`, { body: { name: cleanName(name) } });
  if (result.ok) saveSeat({ planId: result.data.plan_id, seatKey: result.data.seat_key, role: 'partner' });
  return result;
}

// Sends only my own half (my seat's row), about one second after it changes. Reads the seat on every
// send, so an initiator who creates the plan after startup, or a partner who just joined, syncs without
// a reload. Before the first send for a seat it loads the server copy, so an empty local half never
// overwrites picks already saved. Sends run one at a time and always send the newest local state.
export function attachNetworkSync(store) {
  let timer = null;
  let chain = Promise.resolve();
  let hydratedFor = null;
  let lastSent = null;
  let retryDelay = 0;
  const RETRY_START = 2000;
  const RETRY_MAX = 30000;
  // A failed send is retried with capped backoff (2s, doubling to 30s), so picks reach the server
  // even without another local change. Only 'unreachable' (network error or 5xx) retries.
  const retry = () => {
    retryDelay = Math.min(retryDelay ? retryDelay * 2 : RETRY_START, RETRY_MAX);
    clearTimeout(timer);
    timer = setTimeout(() => { chain = chain.then(send).catch(() => {}); }, retryDelay);
  };
  const payloadFor = (half) => {
    const reactions = (half.reactions || []).map(({ cardId, reaction }) => ({ cardId, reaction }));
    const finished = reactions.length === 8 && !['s1', 'threshold', 's2'].includes(half.screen);
    return { intents: half.intents || [], reactions, finished };
  };
  const send = async () => {
    const seat = readSeat();
    if (!seat) return;
    const half = store.getState()[seat.role === 'partner' ? 'sessionB' : 'sessionA'];
    if (store.getState().sessionA.localOnlyPlan || half.localOnlyPlan) return;
    const payload = payloadFor(half);
    if (hydratedFor !== seat.seatKey) {
      const current = await api('GET', `/api/plans/${seat.planId}`, { seatKey: seat.seatKey });
      if (!current.ok) { if (current.reason === 'unreachable') retry(); return; }
      const mine = current.data?.me || {};
      const saved = { intents: mine.intents || [], reactions: (mine.reactions || []).map(({ cardId, reaction }) => ({ cardId, reaction })), finished: !!mine.finished };
      hydratedFor = seat.seatKey;
      lastSent = JSON.stringify(saved);
      const localEmpty = !payload.intents.length && !payload.reactions.length;
      if (localEmpty && (saved.intents.length || saved.reactions.length)) return;
    }
    // Hydration may finish after a new local journey has started.
    if (store.getState().sessionA.localOnlyPlan || store.getState()[seat.role === 'partner' ? 'sessionB' : 'sessionA'] !== half) return;
    const serial = JSON.stringify(payload);
    if (serial === lastSent) return;
    const result = await api('PUT', `/api/plans/${seat.planId}/me`, { body: payload, seatKey: seat.seatKey });
    if (result.ok) { lastSent = serial; retryDelay = 0; }
    else if (result.reason === 'unreachable') retry();
  };
  const schedule = () => { chain = chain.then(send).catch(() => {}); };
  const unsubscribe = store.subscribe(() => { clearTimeout(timer); timer = setTimeout(schedule, 1000); });
  return () => { clearTimeout(timer); unsubscribe(); };
}
