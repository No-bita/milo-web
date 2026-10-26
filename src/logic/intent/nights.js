// Milo intent model v3.1 - night scoring (JS port of docs/intent-model/nights.py).
// Ranks the app's six nights (NIGHTS_POOL ids) against a merged couple profile.
// Scores below are reasoned starting values approved for V1, not measured.
import { DRIVERS, MODES } from './codebook.js';
import { merge, isVetoed } from './model.js';

export const NIGHT_SCORES = {
  'middle-ground':    { drivers: { connection: 0.8, romance: 0.6, discovery: 0.3 }, modes: { talk: 0.8, consume: 0.6, move: 0.5 },
                        mods: { energy: 0.35, social_exposure: 0.3, novelty: 0.5 }, stops: 3, drinks: false },
  'little-adventure': { drivers: { discovery: 0.9, fun: 0.7, connection: 0.4 }, modes: { create_do: 0.9, consume: 0.5, talk: 0.3 },
                        mods: { energy: 0.55, social_exposure: 0.4, novelty: 0.85 }, stops: 3, drinks: false },
  'lively-one':       { drivers: { social: 0.9, fun: 0.7, feel_special: 0.4 }, modes: { watch: 0.7, consume: 0.6, talk: 0.3 },
                        mods: { energy: 0.8, social_exposure: 0.85, novelty: 0.45 }, stops: 3, drinks: true },
  'slow-one':         { drivers: { romance: 0.8, comfort: 0.7, connection: 0.6, feel_special: 0.4 }, modes: { consume: 0.9, talk: 0.7 },
                        mods: { energy: 0.15, social_exposure: 0.2, novelty: 0.2 }, stops: 2, drinks: true },
  'golden-hour':      { drivers: { meaning: 0.7, romance: 0.6, discovery: 0.5, comfort: 0.4 }, modes: { move: 0.7, consume: 0.5, rest: 0.3 },
                        mods: { energy: 0.4, social_exposure: 0.35, novelty: 0.55 }, stops: 3, drinks: false },
  'dressed-up-one':   { drivers: { feel_special: 0.9, romance: 0.7 }, modes: { consume: 0.8, talk: 0.5 },
                        mods: { energy: 0.45, social_exposure: 0.55, novelty: 0.35 }, stops: 2, drinks: true }
};

const weighted = (shared, weights) => {
  const entries = Object.entries(weights);
  return entries.reduce((s, [d, w]) => s + shared[d] * w, 0) / entries.reduce((s, [, w]) => s + w, 0);
};
const round3 = x => Math.round(x * 1000) / 1000;

// Score of one night, or null when a hard constraint rules it out.
export function scoreNight(id, shared, vetoed, conflicts, constraints) {
  const n = NIGHT_SCORES[id];
  if (constraints && constraints.alcohol === false && n.drinks) return null;
  let s = 0.45 * weighted(shared, n.drivers) + 0.30 * weighted(shared, n.modes);
  const mods = Object.entries(n.mods);
  s += 0.25 * (1 - mods.reduce((sum, [m, v]) => sum + Math.abs(shared[m] - v), 0) / mods.length);
  // A night that relies (weight >= 0.6) on a vetoed mood or activity is pushed down.
  s -= 0.25 * Object.entries({ ...n.drivers, ...n.modes }).reduce((sum, [d, w]) => sum + (vetoed.has(d) && w >= 0.6 ? w : 0), 0);
  if (conflicts.length && n.stops >= 3) s += 0.03;   // more stops = room to take turns
  return round3(s);
}

// Returns { top: [[id, score] x k], ranked, shared, conflicts, vetoed }.
export function pickNights(profiles, constraints = null, k = 3) {
  const { shared, conflicts } = merge(profiles);
  const vetoed = new Set([...DRIVERS, ...MODES].filter(d => isVetoed(profiles, d)));
  const ranked = Object.keys(NIGHT_SCORES)
    .map(id => [id, scoreNight(id, shared, vetoed, conflicts, constraints)])
    .filter(([, s]) => s !== null)
    .sort((a, b) => b[1] - a[1]);
  return { top: ranked.slice(0, k), ranked, shared, conflicts, vetoed };
}
