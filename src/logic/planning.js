import { computeSharedResult } from './shared-result.js';
import { isV31, v31Output } from './intent-quiz.js';
import { computeTraitLeanings } from './synthesis.js';
import { TRAIT_DIMENSIONS } from './deck.js';
import { NIGHTS_POOL } from '../data/mockData.js';

export const isSoloPlanning = (state, sessionId = 'aarav') => sessionId !== 'sneha' && state.sessionA.planningMode === 'solo';

// The solo route never reads, averages or attributes the partner's signals.
export function computePlanningOutput(state, sessionId = 'aarav') {
  const occasion = state.shared?.occasion;
  // Together, worked out on this phone (no server result): v3.1 only when both halves took the v3.1 quiz.
  if (!isSoloPlanning(state, sessionId)) {
    const both = isV31(state.sessionA) && isV31(state.sessionB);
    if (both) return v31Output([state.sessionA, state.sessionB], occasion);
    return computeSharedResult(state.sessionA, state.sessionB, { model: 'v3' });
  }
  const planner = state.sessionA;
  // Solo on v3.1: one profile, the same night scoring the couple uses.
  if (isV31(planner)) {
    return { selectedNights: v31Output([planner], occasion).selectedNights.map(item => ({
      ...item, whyItWorks: 'A starting point shaped by your mood and picks. Your partner has not added theirs.'
    })) };
  }
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
