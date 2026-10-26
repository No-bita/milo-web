// Milo intent model v3.1 - JS port of docs/intent-model/model.py.
// Flow: priors -> mood tiles -> "mostly about" -> 8 adaptive swipe cards ->
// 3 four-point pairs -> one profile per person -> merge for 2+ people -> reveal.
// Runs in the browser and on the server (no DOM, no Node APIs). Any change here
// must be made in the Python reference too; the parity test checks golden.json.
import {
  MODES, DRIVERS, MODS, MOOD_TILES, MOOD_WEIGHTS, MODE_TILES, MODE_WEIGHTS, CARDS, SWIPE_WEIGHT,
  CARD_MODE_DELTA, CARD_DRIVER_DELTA, PAIRS, PRIORS, EDIT_CHIPS, ACTIVE_PAIRS, PAIR_STRENGTH, DEFAULT_ONLY
} from './codebook.js';

export const ALL_DIMS = [...MODES, ...DRIVERS, ...MODS];
const START = Object.fromEntries([...MODES, ...DRIVERS].map(d => [d, 0.3]).concat(MODS.map(m => [m, 0.5])));
export const CONF_START = 0.2, CONF_UP = 0.15, CONF_DOWN = 0.2, CONF_MAX = 0.9;
export const SURPRISE_SCALE = 0.8;                 // modulators learn only from unexpected reactions
export const CFG = { headroom: true, veto: 'v31', conflict: 'v31' };   // v3.1 switches (see README)
export let MISERY = 0.23;                          // below this on a mood or activity = strong no
export const CONFLICT_GAP = 0.4;                   // modulator gap that triggers turn-taking
export function setMisery(value) { MISERY = value; } // tests only: compare with v3 (0.2)

const clip = x => Math.max(0, Math.min(1, x));
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const byValueDesc = v => (a, b) => v[b] - v[a];     // Array.sort is stable, like Python's sorted

export class Profile {
  constructor(occasion = 'night_out') {
    this.occasion = occasion;
    this.v = { ...START };
    this.conf = Object.fromEntries(ALL_DIMS.map(d => [d, CONF_START]));
    this.lastDir = Object.fromEntries(ALL_DIMS.map(d => [d, 0]));
    this.log = [];
    for (const [d, val] of Object.entries(PRIORS[occasion] || {})) {
      this.v[d] = MODS.includes(d) ? val : clip(this.v[d] + val);
    }
  }

  nudge(dim, delta, source) {
    if (!delta) return;
    if (CFG.headroom) {
      // v3.1: moves shrink near the ends, so values approach but never sit at 0 or 1.
      const room = delta > 0 ? 1 - this.v[dim] : this.v[dim];
      delta *= Math.min(1, room / 0.5);
    }
    this.v[dim] = clip(this.v[dim] + delta);
    const direction = delta > 0 ? 1 : -1;
    if (this.lastDir[dim] === 0 || this.lastDir[dim] === direction) this.conf[dim] = Math.min(CONF_MAX, this.conf[dim] + CONF_UP);
    else this.conf[dim] = Math.max(0.05, this.conf[dim] - CONF_DOWN);
    this.lastDir[dim] = direction;
    this.log.push([source, dim, Math.round(delta * 1000) / 1000]);
  }

  mood(tiles) {                                    // screen 4: up to 3 mood tiles
    tiles.slice(0, 3).forEach((tile, i) => this.nudge(MOOD_TILES[tile], MOOD_WEIGHTS[i], `mood:${tile}`));
  }

  modePick(tiles) {                                // screen 5: up to 2 "mostly about"
    tiles.slice(0, 2).forEach((tile, i) => this.nudge(MODE_TILES[tile], MODE_WEIGHTS[i], `mode:${tile}`));
  }

  expected(cardId) {                               // reaction expected from mood + activity alone
    const c = CARDS[cardId];
    const m = mean(c.modes.map(x => this.v[x]));
    const d = mean(c.drivers.map(x => this.v[x]));
    const z = (0.45 * m + 0.45 * d - 0.38) * 7;
    return z > 0.8 ? 1.0 : (z > -0.5 ? 0.3 : -0.6);
  }

  swipe(cardId, response) {                        // screen 6: into | maybe | not
    const c = CARDS[cardId], w = SWIPE_WEIGHT[response];
    const surprise = w - this.expected(cardId);
    for (const m of c.modes) this.nudge(m, CARD_MODE_DELTA * w, cardId);
    for (const d of c.drivers) this.nudge(d, CARD_DRIVER_DELTA * w, cardId);
    for (const [k, n] of Object.entries(c.nudges)) this.nudge(k, n * surprise * SURPRISE_SCALE, cardId);
  }

  pair(pairId, answer) {                           // screen 7: def_left | lean_left | lean_right | def_right
    const s = PAIR_STRENGTH[answer];
    for (const [k, n] of Object.entries(PAIRS[pairId].effects)) {
      this.nudge(k, s * (n / 0.2), pairId);
      this.conf[k] = Math.max(this.conf[k], answer.startsWith('def') ? 0.6 : 0.45);
    }
  }

  edit(chip) {                                     // match-reveal correction
    for (const [k, n] of Object.entries(EDIT_CHIPS[chip])) {
      this.nudge(k, n, `edit:${chip}`);
      this.conf[k] = Math.max(this.conf[k], 0.8);
    }
  }

  top(group, n = 2) { return [...group].sort(byValueDesc(this.v)).slice(0, n); }

  asDict() {
    const r = g => Object.fromEntries(g.map(d => [d, { v: Math.round(this.v[d] * 100) / 100, conf: Math.round(this.conf[d] * 100) / 100 }]));
    return { occasion: this.occasion, drivers: r(DRIVERS), modes: r(MODES), modulators: r(MODS), default_only: DEFAULT_ONLY };
  }
}

// ---- card selection (screen 6) ------------------------------------------------
// context: a Set of true tags, e.g. new Set(['evening', 'drinks', 'budget_hi', 'first_date']).
export function eligibleCards(context) {
  return Object.keys(CARDS).filter(cid => CARDS[cid].show.every(t =>
    t.startsWith('not_') ? !context.has(t.slice(4)) : context.has(t)));
}

// Energy-contrast pairs for the top two moods, then fill unseen activity types.
export function pickCards(profile, context, n = 8) {
  const pool = eligibleCards(context);
  const chosen = [];
  const energy = c => CARDS[c].nudges.energy || 0;
  for (const d of profile.top(DRIVERS, 2)) {
    const cands = pool.filter(c => CARDS[c].drivers.includes(d) && !chosen.includes(c)).sort((a, b) => energy(a) - energy(b));
    if (cands.length >= 2) chosen.push(cands[0], cands[cands.length - 1]);
    else if (cands.length) chosen.push(cands[0]);
  }
  const shown = new Set(chosen.flatMap(c => CARDS[c].modes));
  // Rounded like the reference, so float summation order cannot reorder exact ties.
  const key = c => -Math.round((CARDS[c].modes.filter(m => !shown.has(m)).length * 0.5
    + Object.values(CARDS[c].nudges).reduce((s, v) => s + Math.abs(v), 0)) * 1e9) / 1e9;
  const rest = pool.filter(c => !chosen.includes(c)).sort((a, b) => key(a) - key(b));
  for (const c of rest) {
    if (chosen.length >= n) break;
    chosen.push(c); CARDS[c].modes.forEach(m => shown.add(m));
  }
  return chosen.slice(0, n);
}

export const pickPairs = () => [...ACTIVE_PAIRS];

// ---- merging 2 or more people ---------------------------------------------------
export function isVetoed(profiles, d) {
  const vals = profiles.map(p => p.v[d]);
  if (CFG.veto === 'v3') return Math.min(...vals) < MISERY;
  // v3.1: a strong no only vetoes if nobody else holds this as a top-2 want.
  if (Math.min(...vals) >= MISERY) return false;
  const group = DRIVERS.includes(d) ? DRIVERS : MODES;
  return !profiles.some(p => p.top(group, 2).includes(d) && p.v[d] >= 0.5);
}

function realGap(vals) {
  const gap = Math.max(...vals) - Math.min(...vals) > CONFLICT_GAP;
  if (CFG.conflict === 'v3') return gap;
  // v3.1: also require the two ends to sit on opposite sides of the middle.
  return gap && Math.min(...vals) < 0.45 && Math.max(...vals) > 0.55;
}

const round2 = x => Math.round(x * 100) / 100;

export function merge(profiles) {
  const shared = {}, conflicts = [];
  for (const d of [...DRIVERS, ...MODES]) {
    const vals = profiles.map(p => p.v[d]);
    shared[d] = isVetoed(profiles, d) ? Math.min(...vals) : mean(vals);
  }
  for (const m of MODS) {
    const vals = profiles.map(p => p.v[m]);
    shared[m] = mean(vals);
    if (realGap(vals)) conflicts.push({ dimension: m, low: round2(Math.min(...vals)), high: round2(Math.max(...vals)), resolve: 'take turns across stops' });
  }
  return { shared, conflicts };
}

// Minutes after noon, so 00:30 counts as later than 23:30.
const lateness = t => ((Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) - 720) % 1440 + 1440) % 1440;

// Hard constraints: strictest wins.
export function mergeConstraints(list) {
  const out = { diet: new Set(), alcohol: true, budget_for_two: null, home_by: null, max_travel_min: null };
  for (const c of list) {
    (c.diet || []).forEach(x => out.diet.add(x));
    out.alcohol = out.alcohol && (c.alcohol ?? true);
    for (const key of ['budget_for_two', 'max_travel_min']) {
      if (c[key] !== undefined && c[key] !== null) out[key] = out[key] === null ? c[key] : Math.min(out[key], c[key]);
    }
    if (c.home_by) out.home_by = out.home_by === null || lateness(c.home_by) < lateness(out.home_by) ? c.home_by : out.home_by;
  }
  return { ...out, diet: [...out.diet].sort() };
}

// [{card: response}] per person -> ranked shared candidates; any "not" = out.
export function mergeSwipes(swipeMaps) {
  const rank = { into: 2, maybe: 1 };
  const order = Object.keys(CARDS);
  const score = {};
  for (const c of order) {
    if (!swipeMaps.some(s => c in s)) continue;
    const rs = swipeMaps.map(s => s[c]);
    if (rs.includes('not')) continue;
    score[c] = rs.reduce((sum, r) => sum + (rank[r] || 0), 0);
  }
  return Object.keys(score).sort((a, b) => score[b] - score[a] || order.indexOf(a) - order.indexOf(b));
}

// v3.1: single-idea labels so two of them join cleanly with one "and".
export const LABEL = {
  romance: 'romantic', connection: 'full of conversation', comfort: 'cozy', fun: 'playful',
  discovery: 'a little new', feel_special: 'special', social: 'lively', meaning: 'meaningful'
};

export function topShared(shared, n = 2) { return [...DRIVERS].sort(byValueDesc(shared)).slice(0, n); }

export function revealText(shared) {
  const [a, b] = topShared(shared, 2);
  const e = shared.energy;
  const feel = e < 0.4 ? 'unhurried' : (e < 0.6 ? 'easy-going' : 'high energy');
  return `Something ${LABEL[a]} and ${LABEL[b]}, ${feel}.`;
}
