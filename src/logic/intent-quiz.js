// App adapter for intent model v3.1 (src/logic/intent/): turns what a person
// tapped on the quiz screens into the model's answers, builds their adaptive
// deck, and gives their personal reveal. Pure, so the server and Node tests
// can use it too. Which plans use it: session.quizVersion === 'v3.1', set when
// a plan starts while the build flag VITE_MILO_INTENT_MODEL=v3.1 is on.
import { MOOD_TILES, MODE_TILES, CARDS, PAIRS, ACTIVE_PAIRS, PAIR_STRENGTH, DRIVERS, MODES } from './intent/codebook.js';
import { Profile, pickCards, LABEL, merge, topShared } from './intent/model.js';
import { computeSharedOutputV31, profileFromAnswers } from './intent/shared-result.js';
import { DIET_OPTIONS, HOME_BY_OPTIONS } from '../data/constraints.js';
import { V31_MOODS, V31_CARD_PHOTOS, OCCASION_PRIOR } from '../data/intent-v31.js';

export const V31 = 'v3.1';
export const flagOn = () => {
  try { return import.meta.env?.VITE_MILO_INTENT_MODEL === V31; } catch { return false; }
};
export const isV31 = (session) => session?.quizVersion === V31;

const MOOD_LABEL = Object.fromEntries(Object.entries(MOOD_TILES).map(([label, id]) => [id, label]));
const MODE_LABEL = Object.fromEntries(Object.entries(MODE_TILES).map(([label, id]) => [id, label]));
export const MODE_OPTIONS = Object.entries(MODE_TILES).map(([label, id]) => ({ id, label }));
export const PAIR_OPTIONS = ACTIVE_PAIRS.map(id => ({ id, left: PAIRS[id].left, right: PAIRS[id].right }));
export const PAIR_ANSWERS = Object.keys(PAIR_STRENGTH); // def_left, lean_left, lean_right, def_right
export const MOOD_IDS = new Set(DRIVERS);
export const MODE_IDS = new Set(MODES);
export const CARD_IDS = new Set(Object.keys(CARDS));
const RESPONSE = { into_it: 'into', maybe: 'maybe', not_tonight: 'not' };

// Accepts the app id ('date-night') or the server key ('date_night').
export function priorFor(occasion) {
  return OCCASION_PRIOR[String(occasion || '').replaceAll('_', '-')] || 'night_out';
}

// Before time, budget and relationship stage are known: an evening, drinks allowed,
// no premium (budget_hi) cards. Quality time counts as reconnecting.
export function deckContext(occasion) {
  const ctx = new Set(['evening', 'drinks']);
  if (priorFor(occasion) === 'reconnecting') ctx.add('reconnecting');
  return ctx;
}

// Valid v3.1 extras on a session or a server row: { modes: [id], pairs: { P6: answer } }.
export function cleanExtras(v31) {
  const modes = Array.isArray(v31?.modes) ? v31.modes.filter(m => MODE_IDS.has(m)).slice(0, 2) : [];
  const pairs = {};
  for (const id of ACTIVE_PAIRS) if (PAIR_ANSWERS.includes(v31?.pairs?.[id])) pairs[id] = v31.pairs[id];
  return { modes, pairs };
}

export const pairsDone = (v31) => ACTIVE_PAIRS.every(id => PAIR_ANSWERS.includes(v31?.pairs?.[id]));

// The model's answers for one person. intents = mood ids in tap order; reactions = deck reactions.
export function answersFor({ intents = [], reactions = [], v31 = {} } = {}, occasion) {
  const extras = cleanExtras(v31);
  return {
    occasion: priorFor(occasion),
    moods: intents.filter(id => MOOD_LABEL[id]).slice(0, 3).map(id => MOOD_LABEL[id]),
    modes: extras.modes.map(id => MODE_LABEL[id]),
    swipes: reactions.filter(r => CARDS[r?.cardId] && RESPONSE[r.reaction]).map(r => [r.cardId, RESPONSE[r.reaction]]),
    pairs: ACTIVE_PAIRS.filter(id => extras.pairs[id]).map(id => [id, extras.pairs[id]])
  };
}

const tagsFor = (card) => card.drivers.map(d => LABEL[d]).map(t => t.charAt(0).toUpperCase() + t.slice(1));

// The 8 cards for this person, chosen from moods, activity tiles and pairs (not swipes),
// so the deck stays the same while they swipe through it.
export function buildDeckV31(session, occasion) {
  const a = answersFor({ ...session, reactions: [] }, occasion);
  const profile = new Profile(a.occasion);
  profile.mood(a.moods);
  profile.modePick(a.modes);
  for (const [pair, answer] of a.pairs) profile.pair(pair, answer);
  return pickCards(profile, deckContext(occasion), 8).map(id => ({
    id, title: CARDS[id].text, subline: '', tags: tagsFor(CARDS[id]), image: V31_CARD_PHOTOS[id] || null
  }));
}

// The model's output for one or two people (same shape as the shared result).
export function v31Output(sessions, occasion) {
  return computeSharedOutputV31(sessions.map(s => answersFor(s, occasion)), sessions.map(s => s.constraints || {}));
}

// The reflection screen for one person: top two moods with the night's feel, and the
// night it points to. All "not tonight" keeps today's honest fallback.
export function personalReveal(session, occasion) {
  const reactions = session.reactions || [];
  if (reactions.length && reactions.every(r => r.reaction === 'not_tonight')) return ["Nothing quite landed. We'll keep tonight simple."];
  const out = v31Output([session], occasion);
  const lines = [out.bridgeSentence];
  const first = out.selectedNights[0]?.night;
  if (first) lines.push(`It points to ${first.name}.`);
  return lines;
}

// Mood tiles for the v3.1 screen, in codebook order.
export const moodTiles = () => V31_MOODS;
export const moodLabel = (id) => V31_MOODS.find(m => m.id === id)?.label || null;

// ---- Ops booking brief (owner-only page; never shown to either person) ----
const band = (v, [low, mid, high]) => (v < 0.4 ? low : v < 0.6 ? mid : high);
const DIM_WORDS = { energy: 'energy', social_exposure: 'how busy the room is', novelty: 'new versus familiar' };

// people: the plan's participants ({ intents, reactions, v31 }); constraints: from the booking.
// Returns short lines for whoever books the night.
export function bookingBrief(people, occasion, constraints) {
  const lines = [];
  const halves = people.filter(p => (p.intents || []).length || (p.reactions || []).length);
  if (halves.length) {
    const { shared, conflicts } = merge(halves.map(p => profileFromAnswers(answersFor(p, occasion))));
    const [a, b] = topShared(shared, 2);
    const modes = [...MODES].sort((x, y) => shared[y] - shared[x]).slice(0, 2).map(m => MODE_LABEL[m].toLowerCase());
    lines.push(`Mood: ${LABEL[a]} and ${LABEL[b]}.`);
    lines.push(`Mostly about: ${modes.join(' and ')}.`);
    lines.push(`Energy: ${band(shared.energy, ['unhurried', 'easy-going', 'high energy'])}. Room: ${band(shared.social_exposure, ['quiet, tucked away', 'some buzz is fine', 'lively and busy'])}. Place: ${band(shared.novelty, ['somewhere familiar', 'a little new', 'somewhere new'])}.`);
    const split = conflicts.map(c => DIM_WORDS[c.dimension]).filter(Boolean);
    if (split.length) lines.push(`They differ on ${split.join(' and ')}: let the stops take turns.`);
  }
  if (constraints) {
    const diet = (constraints.diet || []).map(d => DIET_OPTIONS[d]).filter(Boolean);
    if (diet.length) lines.push(`Food: ${diet.join(', ')}.`);
    if (constraints.alcohol === false) lines.push('No alcohol.');
    if (constraints.home_by) lines.push(`Home ${HOME_BY_OPTIONS[constraints.home_by].toLowerCase()}.`);
  }
  return lines;
}
