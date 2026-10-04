// ==========================================================
// MILO — DETERMINISTIC SHARED SYNTHESIS & SELECTION ENGINE
// Implements Appendix A.5 & A.6 from MILO_PRODUCT_SPEC.md
// ==========================================================

import { TRAIT_DIMENSIONS } from './deck.js';
import { NIGHTS_POOL } from '../data/mockData.js';
import { computeTraitLeanings } from './synthesis.js';

export const SHARED_ROW_PHRASES = {
  company: { pos: 'A bit of buzz', neg: 'Something intimate' },
  energy: { pos: 'A bit of energy', neg: 'Somewhere calm' },
  novelty: { pos: 'A little novelty', neg: 'Something easy and familiar' },
  occasion: { pos: 'Something a bit special', neg: 'Nothing too fussy' },
  pace: { pos: 'A night that moves', neg: 'Nothing too packed' },
  setting: { pos: 'Some time outdoors', neg: 'Somewhere cosy' }
};

export const BRIDGE_SHORT_FORMS = {
  company: { pos: 'somewhere with a bit of buzz', neg: 'something intimate' },
  novelty: { pos: 'a little different', neg: 'somewhere easy' },
  energy: { pos: 'with some energy', neg: 'calm' },
  occasion: { pos: 'a bit special', neg: 'nothing fussy' },
  pace: { pos: 'a night that moves', neg: 'unhurried' },
  setting: { pos: 'partly outdoors', neg: 'somewhere cosy' }
};

export const DIFFERENCE_COPY = {
  energy: 'One of you is up for a little more energy. The other would rather keep things easy.',
  novelty: "One of you wants to try something new. The other's happy with an old favourite.",
  pace: 'One of you likes a night that moves around. The other would rather settle in somewhere.',
  setting: "One of you wants to be outside for a bit. The other's leaning cosy and indoors."
};

export const RESOLUTION_CLAUSES = {
  energy: 'without making the night hectic',
  novelty: 'with something new that still feels easy',
  pace: 'with a little movement but no rushing',
  setting: 'with a bit of fresh air and somewhere warm after',
  none: 'and nothing too complicated'
};

const FIXED_SHARED_PRIORITY = ['company', 'energy', 'novelty', 'occasion', 'pace', 'setting'];
const ALLOWED_DIFFERENCE_DIMS = ['energy', 'novelty', 'pace', 'setting'];

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Computes shared traits, differences, bridge sentence, and 3 nights.
 */
export function computeSharedOutput(sessionA, sessionB) {
  const leaningsA = computeTraitLeanings(sessionA.intents || [], sessionA.reactions || []);
  const leaningsB = computeTraitLeanings(sessionB.intents || [], sessionB.reactions || []);

  // 1. Shared dimensions: sign(A) === sign(B) and |A| >= 0.2 and |B| >= 0.2
  const qualifyingShared = [];
  for (const dim of TRAIT_DIMENSIONS) {
    const a = leaningsA[dim] || 0;
    const b = leaningsB[dim] || 0;
    if (Math.abs(a) >= 0.2 && Math.abs(b) >= 0.2 && Math.sign(a) === Math.sign(b)) {
      qualifyingShared.push({
        dim,
        sign: Math.sign(a),
        combinedStrength: Math.abs(a) + Math.abs(b),
        valA: a,
        valB: b
      });
    }
  }

  // Sort by combined strength descending, take top 2-3
  qualifyingShared.sort((x, y) => y.combinedStrength - x.combinedStrength);
  const topShared = qualifyingShared.slice(0, 3);

  // Then display them in fixed priority order: company, energy, novelty, occasion, pace, setting
  topShared.sort((x, y) => {
    return FIXED_SHARED_PRIORITY.indexOf(x.dim) - FIXED_SHARED_PRIORITY.indexOf(y.dim);
  });

  // Shared row phrases
  let sharedRows = topShared.map(item => {
    const phrases = SHARED_ROW_PHRASES[item.dim];
    return {
      dim: item.dim,
      sign: item.sign,
      text: item.sign > 0 ? phrases.pos : phrases.neg
    };
  });

  // Low-overlap fallback check (Appendix A.5)
  let isLowOverlap = false;
  if (sharedRows.length < 2) {
    // Intent overlap fallback
    const intentOverlap = (sessionA.intents || []).filter(id => (sessionB.intents || []).includes(id));
    for (const intentId of intentOverlap) {
      if (sharedRows.length >= 2) break;
      if (intentId === 'intimate' && !sharedRows.find(r => r.dim === 'company')) {
        sharedRows.push({ dim: 'company', sign: -1, text: SHARED_ROW_PHRASES.company.neg });
      } else if (intentId === 'novelty' && !sharedRows.find(r => r.dim === 'novelty')) {
        sharedRows.push({ dim: 'novelty', sign: 1, text: SHARED_ROW_PHRASES.novelty.pos });
      }
    }
  }

  if (sharedRows.length === 0) {
    isLowOverlap = true;
    sharedRows.push({
      dim: null,
      sign: 0,
      text: 'Time together, nothing too complicated.'
    });
  }

  // 2. Difference: allowed dims only, opposite signs, |a - b| >= 0.8
  let difference = null;
  let maxGap = 0;
  for (const dim of ALLOWED_DIFFERENCE_DIMS) {
    const a = leaningsA[dim] || 0;
    const b = leaningsB[dim] || 0;
    if (Math.sign(a) !== Math.sign(b) && Math.sign(a) !== 0 && Math.sign(b) !== 0) {
      const gap = Math.abs(a - b);
      if (gap >= 0.8 && gap > maxGap) {
        maxGap = gap;
        difference = {
          dim,
          gap,
          valA: a,
          valB: b,
          copy: DIFFERENCE_COPY[dim]
        };
      }
    }
  }

  // 3. Bridge sentence
  let bridgeSentence = '';
  if (isLowOverlap && topShared.length === 0) {
    bridgeSentence = "You're after different nights tonight, so each of these meets you halfway.";
  } else {
    const shortA = topShared[0]
      ? (topShared[0].sign > 0 ? BRIDGE_SHORT_FORMS[topShared[0].dim].pos : BRIDGE_SHORT_FORMS[topShared[0].dim].neg)
      : 'something easy';
    const shortB = topShared[1]
      ? (topShared[1].sign > 0 ? BRIDGE_SHORT_FORMS[topShared[1].dim].pos : BRIDGE_SHORT_FORMS[topShared[1].dim].neg)
      : 'time together';

    const resolutionClause = difference
      ? RESOLUTION_CLAUSES[difference.dim]
      : RESOLUTION_CLAUSES.none;

    bridgeSentence = capitalizeFirst(`${shortA}, ${shortB}, ${resolutionClause}.`);
  }

  // 4. Night Selection (Appendix A.6)
  // Combined vector = mean of A and B
  const combined = {};
  for (const dim of TRAIT_DIMENSIONS) {
    combined[dim] = ((leaningsA[dim] || 0) + (leaningsB[dim] || 0)) / 2;
  }

  function euclideanDistance(nightProfile) {
    let sumSq = 0;
    for (const dim of TRAIT_DIMENSIONS) {
      const diff = (nightProfile[dim] || 0) - (combined[dim] || 0);
      sumSq += diff * diff;
    }
    return Math.sqrt(sumSq);
  }

  const poolWithDist = NIGHTS_POOL.map(night => ({
    night,
    dist: euclideanDistance(night.profile)
  }));

  poolWithDist.sort((x, y) => x.dist - y.dist);

  let night01 = null;
  let night02 = null;
  let night03 = null;

  if (isLowOverlap && topShared.length === 0) {
    // Greatest spread: 01 = best fit, 02 and 03 = farthest from 01 and from each other
    night01 = poolWithDist[0].night;
    const remaining = poolWithDist.slice(1).map(p => p.night);
    // Sort remaining by distance to night01
    remaining.sort((x, y) => {
      let dX = 0, dY = 0;
      for (const dim of TRAIT_DIMENSIONS) {
        dX += Math.pow((x.profile[dim] || 0) - (night01.profile[dim] || 0), 2);
        dY += Math.pow((y.profile[dim] || 0) - (night01.profile[dim] || 0), 2);
      }
      return dY - dX;
    });
    night02 = remaining[0];
    night03 = remaining[1];
  } else {
    // 01 = best fit
    night01 = poolWithDist[0].night;

    // 02 = best remaining fit with novelty >= +0.5, or failing that best remaining fit
    const remainingAfter01 = poolWithDist.slice(1);
    const withNovelty = remainingAfter01.filter(p => (p.night.profile.novelty || 0) >= 0.5);
    if (withNovelty.length > 0) {
      night02 = withNovelty[0].night;
    } else {
      night02 = remainingAfter01[0].night;
    }

    // 03 = if difference, remaining night with strongest value on difference dim on side opposite to 01's lean
    const remainingAfter02 = poolWithDist.filter(
      p => p.night.id !== night01.id && p.night.id !== night02.id
    );

    if (difference) {
      const dim = difference.dim;
      const lean01 = night01.profile[dim] || 0;
      const targetSign = lean01 < 0 ? 1 : -1;

      // Sort remaining by strongest value in targetSign direction
      remainingAfter02.sort((x, y) => {
        const valX = (x.night.profile[dim] || 0) * targetSign;
        const valY = (y.night.profile[dim] || 0) * targetSign;
        return valY - valX;
      });
      night03 = remainingAfter02[0].night;
    } else {
      // Remaining night farthest from 01
      remainingAfter02.sort((x, y) => {
        let dX = 0, dY = 0;
        for (const dim of TRAIT_DIMENSIONS) {
          dX += Math.pow((x.night.profile[dim] || 0) - (night01.profile[dim] || 0), 2);
          dY += Math.pow((y.night.profile[dim] || 0) - (night01.profile[dim] || 0), 2);
        }
        return dY - dX;
      });
      night03 = remainingAfter02[0].night;
    }
  }

  // 5. Fit lines calculation for the 3 selected nights
  function computeFitLine(night, index) {
    // If night 03 was chosen to resolve a difference and has leanLine, use leanLine
    if (index === 2 && difference && night.leanLine) {
      return night.leanLine;
    }

    // Fill {Short} with bridge short form of the shared dimension that best matches the night:
    // the largest (night profile value * combined leaning) among shared dimensions
    let bestDim = null;
    let maxMatch = -Infinity;

    for (const item of topShared) {
      const match = (night.profile[item.dim] || 0) * (combined[item.dim] || 0);
      if (match > maxMatch) {
        maxMatch = match;
        bestDim = item;
      }
    }

    if (!bestDim || maxMatch <= 0) {
      bestDim = topShared[0];
    }

    let shortForm = 'Something easy';
    if (bestDim) {
      const sign = bestDim.sign > 0 ? 'pos' : 'neg';
      shortForm = BRIDGE_SHORT_FORMS[bestDim.dim][sign];
    }

    // Capitalize first letter
    shortForm = capitalizeFirst(shortForm);

    return night.fitTemplate.replace('{Short}', shortForm);
  }

  const selectedNights = [
    {
      num: '01',
      night: night01,
      fitLine: computeFitLine(night01, 0)
    },
    {
      num: '02',
      night: night02,
      fitLine: computeFitLine(night02, 1)
    },
    {
      num: '03',
      night: night03,
      fitLine: computeFitLine(night03, 2)
    }
  ];

  // Why it works sentence for S7:
  // e.g. "It keeps things intimate, adds something new, and never gets hectic."
  function computeWhyItWorks(night) {
    if (night.id === 'middle-ground') {
      return 'It keeps things intimate, adds something new, and never gets hectic.';
    } else if (night.id === 'little-adventure') {
      return 'It puts something completely new first, then gives you space to settle in.';
    } else if (night.id === 'lively-one') {
      return 'It brings the energy Sneha wants, with plenty of room to talk and keep it effortless.';
    }
    return 'A balanced evening shaped around what you both want tonight.';
  }

  return {
    leaningsA,
    leaningsB,
    combined,
    sharedRows,
    difference,
    bridgeSentence,
    selectedNights: selectedNights.map(sn => ({
      ...sn,
      whyItWorks: computeWhyItWorks(sn.night)
    }))
  };
}
