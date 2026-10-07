import { computeSharedOutput } from './shared.js';
import { computeTraitLeanings } from './synthesis.js';
import { TRAIT_DIMENSIONS } from './deck.js';
import { NIGHTS_POOL } from '../data/mockData.js';

export const isSoloPlanning = (state, sessionId = 'aarav') => sessionId !== 'sneha' && state.sessionA.planningMode === 'solo';

// The solo route never reads, averages or attributes the partner's signals.
export function computePlanningOutput(state, sessionId = 'aarav') {
  if (!isSoloPlanning(state, sessionId)) return computeSharedOutput(state.sessionA, state.sessionB);
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
