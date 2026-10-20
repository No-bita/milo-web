// Derives events from state changes so screens stay untouched.
import { store } from '../domain/store.js';
import { inviteFromParams } from '../domain/invite.js';
import { track, markStart, minutesSinceStart } from './analytics.js';

const COLLECT = ['threshold', 's2', 'planning_path_review', 's3'];
const NOT_SEALING = ['home', 'nights', 'you', 'plan', 'requests', 'booked', 'group', 's4_waiting'];

function counts(reactions = []) {
  const c = { into_it: 0, maybe: 0, not_tonight: 0 };
  for (const r of reactions) { const k = r?.reaction; if (k in c) c[k] += 1; }
  return c;
}

export function startAnalytics() {
  const params = new URLSearchParams(location.search);
  const state = store.getState();
  markStart();
  track('prototype_started');
  const status = inviteFromParams(params);
  if (status) track('partner_opened', { status });

  // A state change replayed from another tab was already counted by that tab.
  let remote = false;
  window.addEventListener('storage', () => { remote = true; setTimeout(() => { remote = false; }, 0); }, true);

  let prev = state;
  store.subscribe((next) => {
    if (remote) { prev = next; return; }
    const a0 = prev.sessionA || {}, a1 = next.sessionA || {};
    const b0 = prev.sessionB || {}, b1 = next.sessionB || {};
    if (a0.screen === 's1' && COLLECT.includes(a1.screen) && (a1.intents || []).length > 0) track('moods_done', { count: a1.intents.length });
    if ((a0.reactions || []).length < 8 && (a1.reactions || []).length >= 8) track('deck_done', counts(a1.reactions));
    if ((b0.reactions || []).length < 8 && (b1.reactions || []).length >= 8) track('partner_done');
    if (a1.planningMode && a1.planningMode !== a0.planningMode) track('path_chosen', { mode: a1.planningMode });
    if (a1.screen === 's4_waiting' && a0.screen !== 's4_waiting' && !NOT_SEALING.includes(a0.screen)) {
      track('sealed', { mode: next.shared?.invitePrepared ? 'together' : 'solo', minutes_since_start: minutesSinceStart() });
    }
    const s0 = prev.shared || {}, s1 = next.shared || {};
    if (s1.suggestion && s1.suggestion !== s0.suggestion) track('night_suggested', { role: s1.suggestion.by === 'sneha' ? 'partner' : 'initiator' });
    if (s1.confirmedNightId && s1.confirmedNightId !== s0.confirmedNightId) track('night_confirmed');
    prev = next;
  });
}
