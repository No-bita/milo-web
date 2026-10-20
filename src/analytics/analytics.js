// Custom events only. No SDK: no autocapture, no session replay, no feature flags,
// no surveys, no URL or referrer properties. Every event passes an allowlist, so
// names, picks, invite tokens and page URLs cannot be attached by accident.
import { POSTHOG_KEY, POSTHOG_HOST } from './config.js';

const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(Math.round(v), 100000)) : undefined);
const oneOf = (...values) => (v) => (values.includes(v) ? v : undefined);
const token = (v) => (typeof v === 'string' && /^[a-z0-9_-]{1,40}$/i.test(v) && !/^[A-Za-z0-9_-]{30,}$/.test(v) ? v.toLowerCase() : undefined);

export const EVENTS = {
  landing_viewed: { source: token },
  prototype_started: { occasion: token },
  moods_done: { count: num },
  deck_done: { into_it: num, maybe: num, not_tonight: num },
  path_chosen: { mode: oneOf('solo', 'together') },
  invite_sent: { method: oneOf('share', 'copy') },
  partner_opened: { status: oneOf('valid', 'expired', 'invalid') },
  partner_done: {},
  night_suggested: { role: oneOf('initiator', 'partner') },
  night_confirmed: { role: oneOf('initiator', 'partner') },
  sealed: { mode: oneOf('solo', 'together'), minutes_since_start: num },
  feedback_given: { answer: oneOf('easier', 'same', 'harder') }
};

const ID_KEY = 'milo.anon';
const START_KEY = 'milo.startedAt';

function enabled() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return false;
  if (navigator.doNotTrack === '1') return false;
  return !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
}

function anonId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(ID_KEY, id); }
    return id;
  } catch { return 'anonymous'; }
}

export function sanitize(event, props = {}) {
  const spec = EVENTS[event];
  if (!spec) return null;
  const out = {};
  for (const [key, clean] of Object.entries(spec)) {
    const value = clean(props[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function track(event, props) {
  const clean = sanitize(event, props);
  if (!clean || !enabled()) return;
  const body = JSON.stringify({
    api_key: POSTHOG_KEY,
    event,
    distinct_id: anonId(),
    properties: { ...clean, $process_person_profile: false, $geoip_disable: true },
    timestamp: new Date().toISOString()
  });
  try {
    // text/plain keeps this a simple request (no CORS preflight); keepalive survives navigation.
    fetch(`${POSTHOG_HOST}/capture/`, { method: 'POST', body, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* telemetry never breaks the app */ }
}

export function markStart() {
  try { if (!sessionStorage.getItem(START_KEY)) sessionStorage.setItem(START_KEY, String(Date.now())); } catch { /* ignore */ }
}
export function minutesSinceStart() {
  try {
    const t = Number(sessionStorage.getItem(START_KEY));
    return t ? (Date.now() - t) / 60000 : undefined;
  } catch { return undefined; }
}
