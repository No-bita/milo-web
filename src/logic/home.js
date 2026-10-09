import { NIGHTS_POOL } from '../data/mockData.js';

const nightName = (id) => NIGHTS_POOL.find((night) => night.id === id)?.name || 'Your night';

// What the homepage should show for the owner (aarav). Pure: takes the store state.
export function homeSummary(state) {
  const a = state.sessionA;
  const partner = a.partnerName || 'your partner';
  const shared = state.shared || {};
  if (shared.confirmedNightId) {
    return { kind: 'confirmed', nightId: shared.confirmedNightId, planName: nightName(shared.confirmedNightId), partner, planStatus: 'Both of you are in', partnerStatus: `${partner} is in`, action: 'open-plan' };
  }
  if (a.savedSoloNightId) {
    return { kind: 'draft', nightId: a.savedSoloNightId, planName: nightName(a.savedSoloNightId), partner, planStatus: 'Draft. Not shared yet', partnerStatus: shared.inviteSent ? `Invite sent to ${partner}` : `${partner} has not seen this yet`, action: 'open-plan' };
  }
  if (shared.inviteSent) {
    return { kind: 'waiting', nightId: null, planName: 'Your night with ' + partner, partner, planStatus: `Waiting for ${partner}`, partnerStatus: `Invite sent. Waiting for ${partner}`, action: 'open-waiting' };
  }
  return { kind: 'fresh', nightId: null, planName: null, partner, planStatus: null, partnerStatus: null, action: null };
}

// Show the homepage when the user has a plan, or has not started a night yet.
export function shouldShowHome(state) {
  const summary = homeSummary(state);
  return summary.kind !== 'fresh' || state.sessionA.screen === 's1';
}
