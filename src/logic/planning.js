import { computeSharedResult } from './shared-result.js';
import { computeTraitLeanings } from './synthesis.js';
import { TRAIT_DIMENSIONS } from './deck.js';
import { NIGHTS_POOL } from '../data/mockData.js';

export const isSoloPlanning = (state, sessionId = 'aarav') => sessionId !== 'sneha' && state.sessionA.planningMode === 'solo';

// The solo route never reads, averages or attributes the partner's signals.
export function computePlanningOutput(state, sessionId = 'aarav') {
  // Same switch as the server; v3.1 needs quiz_v31 answers on both halves (phase C).
  if (!isSoloPlanning(state, sessionId)) return computeSharedResult(state.sessionA, state.sessionB, { model: import.meta.env?.VITE_MILO_INTENT_MODEL === 'v3.1' ? 'v3.1' : 'v3' });
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
