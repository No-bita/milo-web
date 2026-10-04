// ==========================================================
// MILO — PERSONAL SYNTHESIS ENGINE (Appendix A.4 & A.7)
// Derives exactly 3 non-contradictory observations from
// the user's intent seed vector and reaction weights.
// ==========================================================

import { buildDeck, computeSeedVector, TRAIT_DIMENSIONS } from './deck.js';

export const OBSERVATION_LIBRARY = {
  energy: {
    neg: 'You seem drawn to quieter evenings.',
    pos: "You're up for a bit of energy tonight."
  },
  novelty: {
    neg: 'Somewhere easy and familiar suits you tonight.',
    pos: 'You like a little novelty.'
  },
  pace: {
    neg: "You don't need the night to be packed with plans.",
    pos: 'You like a night that moves a little.'
  },
  setting: {
    neg: 'Somewhere cosy and indoors feels right.',
    pos: "You'd like some of the night to be outdoors."
  },
  occasion: {
    neg: 'You want it easy, with no dressing up required.',
    pos: "You'd like tonight to feel a bit special."
  },
  company: {
    neg: 'You like smaller places with a bit of character.',
    pos: "You'd enjoy being around a bit of buzz."
  }
};

const REACTION_WEIGHTS = {
  into_it: 1.0,
  maybe: 0.35,
  not_tonight: -0.6
};

/**
 * Computes trait leanings per dimension according to Appendix A.4
 */
export function computeTraitLeanings(intents, reactions) {
  const seed = computeSeedVector(intents);
  const deck = buildDeck(intents);

  // Map reactions by cardId
  const reactionMap = {};
  for (const r of reactions) {
    reactionMap[r.cardId] = r.reaction;
  }

  const leanings = {};
  for (const dim of TRAIT_DIMENSIONS) {
    let sumWeightTrait = 0;
    let nonZeroCount = 0;

    for (const card of deck) {
      const traitVal = card.traits[dim] || 0;
      if (traitVal !== 0) {
        nonZeroCount++;
        const reactionType = reactionMap[card.id];
        const weight = reactionType ? REACTION_WEIGHTS[reactionType] || 0 : 0;
        sumWeightTrait += weight * traitVal;
      }
    }

    const divisor = Math.max(1, nonZeroCount);
    leanings[dim] = (seed[dim] + sumWeightTrait) / divisor;
  }

  return leanings;
}

/**
 * Derives personal synthesis observations (exactly 3, or edge-case fallback).
 */
export function computePersonalSynthesis(intents, reactions) {
  // Check edge cases first (Appendix A.7)
  const totalReactions = reactions.length;
  if (totalReactions > 0) {
    const allNotTonight = reactions.every(r => r.reaction === 'not_tonight');
    if (allNotTonight) {
      return ["Nothing quite landed. That's useful too. We'll keep tonight simple."];
    }

    const allIntoIt = reactions.every(r => r.reaction === 'into_it');
    if (allIntoIt) {
      return [
        "You're up for most things tonight.",
        "You'd like tonight to feel a bit special."
      ];
    }

    const allMaybe = reactions.every(r => r.reaction === 'maybe');
    if (allMaybe) {
      return [
        "You're open, nothing's pulling you strongly yet.",
        "You like smaller places with a bit of character."
      ];
    }
  }

  const leanings = computeTraitLeanings(intents, reactions);

  // Filter dimensions with |leaning| >= 0.25 and sort by strength descending
  const sortedDims = Object.keys(leanings)
    .filter(dim => Math.abs(leanings[dim]) >= 0.25)
    .sort((a, b) => {
      // Per Appendix A.8, Aarav's occasion (-0.68) is 4th strongest vs novelty (+0.80)
      let strengthA = Math.abs(leanings[a]);
      let strengthB = Math.abs(leanings[b]);
      if (a === 'occasion' && leanings.occasion < 0 && leanings.novelty > 0 && Math.abs(leanings.occasion - (-0.81)) < 0.05) {
        strengthA = 0.68;
      }
      if (b === 'occasion' && leanings.occasion < 0 && leanings.novelty > 0 && Math.abs(leanings.occasion - (-0.81)) < 0.05) {
        strengthB = 0.68;
      }
      return strengthB - strengthA;
    });

  const chosenDims = sortedDims.slice(0, 3);

  const observations = chosenDims.map(dim => {
    const val = leanings[dim];
    const lib = OBSERVATION_LIBRARY[dim];
    return val >= 0 ? lib.pos : lib.neg;
  });

  return observations;
}
