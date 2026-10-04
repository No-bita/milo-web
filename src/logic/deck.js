// ==========================================================
// MILO — DETERMINISTIC DECK BUILDER (Appendix A.2 & A.3)
// Generates an 8-card discovery deck from the 12-card pool
// shaped by the user's intent seed vector + 2 stretch cards.
// ==========================================================

import { INTENTS, EXPERIENCE_POOL } from '../data/mockData.js';

export const TRAIT_DIMENSIONS = ['energy', 'novelty', 'pace', 'setting', 'occasion', 'company'];

/**
 * Computes seed vector from selected intent IDs.
 * Each intent seeds with +0.5 on its mapped dimensions.
 */
export function computeSeedVector(intentIds) {
  const seed = {
    energy: 0,
    novelty: 0,
    pace: 0,
    setting: 0,
    occasion: 0,
    company: 0
  };

  const intentMap = {};
  for (const item of INTENTS) {
    intentMap[item.id] = item;
  }

  for (const id of intentIds) {
    const item = intentMap[id];
    if (item && item.seeds) {
      for (const [dim, weight] of Object.entries(item.seeds)) {
        seed[dim] = (seed[dim] || 0) + (0.5 * weight);
      }
    }
  }

  return seed;
}

/**
 * Computes dot product between a card's traits and the seed vector.
 */
export function dotProduct(cardTraits, seedVector) {
  let score = 0;
  for (const dim of TRAIT_DIMENSIONS) {
    score += (cardTraits[dim] || 0) * (seedVector[dim] || 0);
  }
  return score;
}

/**
 * Builds the 8-card deck for a user based on their intents.
 * Algorithm (Appendix A.3):
 * 1. Score each concept in the 12 pool by dot product.
 * 2. Sort all 12 by score descending, breaking ties by pool index ascending.
 * 3. Take top 6 and bottom 2.
 * 4. The top 6 are ordered by score.
 * 5. Insert the bottom 2 as stretch cards at position 3 and position 6 (1-indexed).
 * Returns array of 8 cards.
 */
export function buildDeck(intentIds) {
  const seed = computeSeedVector(intentIds);

  const scoredPool = EXPERIENCE_POOL.map((card, poolIndex) => ({
    card,
    poolIndex,
    score: dotProduct(card.traits, seed)
  }));

  // Sort descending by score, tie-break by poolIndex ascending
  scoredPool.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.poolIndex - b.poolIndex;
  });

  const top6 = scoredPool.slice(0, 6).map(item => item.card);
  // Bottom 2 stretch cards: sorted by score ascending (lowest score first)
  const bottom2Items = scoredPool.slice(10, 12);
  bottom2Items.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    return a.poolIndex - b.poolIndex;
  });
  const bottom2 = bottom2Items.map(item => item.card);

  // Position 3 (index 2) = stretch card 1
  // Position 6 (index 5) = stretch card 2
  const deck = [
    top6[0],
    top6[1],
    bottom2[0], // stretch card at pos 3
    top6[2],
    top6[3],
    bottom2[1], // stretch card at pos 6
    top6[4],
    top6[5]
  ];

  return deck;
}
