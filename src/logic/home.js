import { NIGHTS_POOL } from '../data/mockData.js';
import { isInvited, partnerLabel } from './partner.js';

const nightName = (id) => NIGHTS_POOL.find((night) => night.id === id)?.name || 'Your night';

// What the homepage should show for the owner (aarav). Pure: takes the store state.
export function homeSummary(state) {
  const a = state.sessionA;
  const invited = !a.localOnlyPlan && isInvited(state);
  const partner = partnerLabel(state);
  const shared = a.localOnlyPlan ? {} : state.shared || {};
  if (shared.confirmedNightId) {
    return { kind: 'confirmed', nightId: shared.confirmedNightId, planName: nightName(shared.confirmedNightId), partner, planStatus: 'Both of you are in', partnerStatus: `${partner} is in`, action: 'open-plan' };
  }
  if (a.savedSoloNightId) {
    return { kind: 'draft', invited, nightId: a.savedSoloNightId, planName: nightName(a.savedSoloNightId), partner, planStatus: invited ? 'Draft. Not shared yet' : 'Just yours for now', partnerStatus: shared.inviteSent ? `Invite sent to ${partner}` : invited ? `${partner} has not seen this yet` : 'Not invited yet', action: 'open-plan' };
  }
  if (shared.inviteSent) {
    return { kind: 'waiting', nightId: null, planName: 'Your night with ' + partner, partner, planStatus: `Waiting for ${partner}`, partnerStatus: `Invite sent. Waiting for ${partner}`, action: 'open-waiting' };
  }
  const ratedCount = (a.reactions || []).length;
  const started = ratedCount > 0 || (a.intents || []).length > 0 || !!a.planningMode;
  if (started) {
    return { kind: 'in-progress', invited, nightId: null, planName: 'Your night', partner, planStatus: 'Picks saved on this phone', partnerStatus: null, ratedCount, resumeStep: resumeStepFor(a, ratedCount), action: 'resume' };
  }
  return { kind: 'fresh', invited, nightId: null, planName: null, partner, planStatus: null, partnerStatus: null, action: null };
}

// Home opens on every ordinary open; a mid-journey plan resumes from its card.
export function shouldShowHome() {
  return true;
}

// Where Home's Resume card returns to. A finished deck (8 reactions) goes to the synthesis
// screen even when an older pre-completion screen was remembered. 'threshold' is a transient
// crossfade whose auto-advance clears the deck, so it resumes at the deck instead.
function resumeStepFor(a, ratedCount) {
  const paused = a.pausedScreen === 'threshold' ? 's2' : a.pausedScreen;
  if (ratedCount >= 8 && paused !== 's3' && paused !== 's4_invite') return 's3';
  return paused || (ratedCount > 0 ? 's2' : 's1');
}
