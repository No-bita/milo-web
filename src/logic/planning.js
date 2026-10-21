import { computeSharedOutput } from './shared.js';
import { computeTraitLeanings } from './synthesis.js';
import { TRAIT_DIMENSIONS } from './deck.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { togetherOutput } from '../domain/plan-view.js';

export const isSoloPlanning = (state, sessionId = 'aarav') => sessionId !== 'sneha' && state.sessionA.planningMode === 'solo';

// The shared picture both phones look at. With a server seat the server's
// persisted result wins, so the two phones always show the same rows; without
// one (solo, flag off, demo) the local synthesis runs as before.
export function sharedOutput(state) {
  return togetherOutput(state) || computeSharedOutput(state.sessionA, state.sessionB);
}

// The solo route never reads, averages or attributes the partner's signals.
export function computePlanningOutput(state, sessionId = 'aarav') {
  if (!isSoloPlanning(state, sessionId)) return sharedOutput(state);
  const planner = state.sessionA;
  const leanings = computeTraitLeanings(planner.intents || [], planner.reactions || []);
  const ranked = NIGHTS_POOL.map(night => ({
    night,
    distance: TRAIT_DIMENSIONS.reduce((sum, dim) => sum + ((night.profile[dim] || 0) - (leanings[dim] || 0)) ** 2, 0)
  })).sort((a, b) => a.distance - b.distance);
  return {
    selectedNights: ranked.slice(0, 3).map(({ night }, index) => ({
      num: String(index + 1).padStart(2, '0'), night,
      fitLine: night.reasonLine,
      whyItWorks: 'A starting point shaped by your mood and picks. Your partner has not added theirs.'
    }))
  };
}
