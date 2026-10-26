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
  // Phase 1 server plans only: partnerFinished and serverResult are written from
  // the server plan view, never by the local demo. Once the partner's half is in,
  // the card stops saying "waiting" and opens the plan screen instead.
  // inviteSent is not required: copying the link creates the server plan without marking it sent.
  if (shared.partnerFinished || shared.serverResult) {
    const mine = shared.suggestion?.by === 'aarav';
    const planStatus = !shared.serverResult ? `${partner} is done. Your night is coming together`
      : shared.suggestion ? (mine ? `Suggested. Waiting on ${partner}` : `${partner} picked a night`)
      : `${partner} is done. Pick your night`;
    return { kind: 'together', invited, nightId: shared.suggestion?.nightId || null, planName: 'Your night with ' + partner, partner, planStatus, partnerStatus: `${partner} is done`, action: 'open-plan' };
  }
  // A server invite link exists once it is shared OR copied; copying alone never
  // sets inviteSent, so without this the creator saw 'Resume' back into the deck.
  if (shared.inviteSent || shared.serverInviteUrl) {
    return { kind: 'waiting', nightId: null, planName: 'Your night with ' + partner, partner, planStatus: `Waiting for ${partner}`, partnerStatus: `Invite sent. Waiting for ${partner}`, action: 'open-waiting' };
  }
  const ratedCount = (a.reactions || []).length;
  const started = ratedCount > 0 || (a.intents || []).length > 0 || !!a.planningMode;
  if (started) {
    return { kind: 'in-progress', invited, nightId: null, planName: 'Your night', partner, planStatus: 'Picks saved on this phone', partnerStatus: null, ratedCount, resumeStep: a.pausedScreen || (ratedCount > 0 ? 's2' : 's1'), action: 'resume' };
  }
  return { kind: 'fresh', invited, nightId: null, planName: null, partner, planStatus: null, partnerStatus: null, action: null };
}

// Home opens on every ordinary open; a mid-journey plan resumes from its card.
export function shouldShowHome() {
  return true;
}
