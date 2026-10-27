import test from 'node:test';
import assert from 'node:assert/strict';
import { answersFor, priorFor, deckContext, buildDeckV31, v31Output, personalReveal, bookingBrief, cleanExtras, pairsDone, MOOD_IDS } from './intent-quiz.js';
import { computeSharedOutputV31 } from './intent/shared-result.js';
import { CARDS, MOOD_TILES } from './intent/codebook.js';
import { V31_MOODS, OCCASION_PRIOR, OCCASION_IDS } from '../data/intent-v31.js';

const person = (over = {}) => ({
  intents: ['romance', 'comfort', 'connection'],
  v31: { modes: ['talk', 'consume'], pairs: { P6: 'lean_left', P3: 'def_left', P2: 'lean_right' } },
  reactions: [], ...over
});
const swipeAll = (s, occ, pick = () => 'into_it') => ({ ...s, reactions: buildDeckV31(s, occ).map((c, i) => ({ cardId: c.id, reaction: pick(i) })) });

test('the eight v3.1 mood tiles are exactly the model\'s, in its order', () => {
  assert.deepEqual(V31_MOODS.map(m => m.label), Object.keys(MOOD_TILES));
  assert.deepEqual(V31_MOODS.map(m => m.id), Object.values(MOOD_TILES));
  assert.ok(V31_MOODS.every(m => m.image && m.alt));
  assert.equal(MOOD_IDS.size, 8);
});

test('occasions map to the model\'s priors as approved', () => {
  assert.deepEqual(OCCASION_IDS.map(priorFor), ['night_out', 'anniversary', 'proposal', 'birthday', 'reconnecting', 'night_out']);
  assert.equal(priorFor('quality_time'), 'reconnecting', 'server keys work too');
  assert.equal(priorFor(undefined), 'night_out');
  assert.equal(Object.keys(OCCASION_PRIOR).length, 6);
});

test('answers carry tap order, labels the model keys on, and app reactions in model words', () => {
  const a = answersFor(person({ reactions: [{ cardId: 'C1', reaction: 'into_it' }, { cardId: 'M1', reaction: 'not_tonight' }, { cardId: 'nope', reaction: 'maybe' }] }), 'anniversary');
  assert.deepEqual(a, {
    occasion: 'anniversary',
    moods: ['Romantic', 'Cozy and calm', 'Deep conversation'],
    modes: ['Talking', 'Eating and drinking'],
    swipes: [['C1', 'into'], ['M1', 'not']],
    pairs: [['P6', 'lean_left'], ['P3', 'def_left'], ['P2', 'lean_right']]
  });
});

test('extras are cleaned: unknown activity tiles, extra tiles and bad pair answers are dropped', () => {
  assert.deepEqual(cleanExtras({ modes: ['talk', 'bogus', 'rest', 'move'], pairs: { P6: 'def_right', P3: 'sideways', P9: 'def_left' } }), { modes: ['talk', 'rest'], pairs: { P6: 'def_right' } });
  assert.equal(pairsDone({ pairs: { P6: 'def_right' } }), false);
  assert.equal(pairsDone(person().v31), true);
});

test('deck: 8 distinct model cards, stable while swiping, no premium or late cards before a budget', () => {
  const s = person();
  const deck = buildDeckV31(s, 'date-night');
  assert.equal(deck.length, 8);
  assert.equal(new Set(deck.map(c => c.id)).size, 8);
  assert.ok(deck.every(c => CARDS[c.id] && c.title === CARDS[c.id].text));
  assert.deepEqual(buildDeckV31({ ...s, reactions: deck.slice(0, 5).map(c => ({ cardId: c.id, reaction: 'not_tonight' })) }, 'date-night').map(c => c.id), deck.map(c => c.id));
  for (const occ of OCCASION_IDS) {
    for (const c of buildDeckV31(s, occ)) assert.ok(!CARDS[c.id].show.includes('budget_hi') && !CARDS[c.id].show.includes('late'), `${occ}: ${c.id}`);
  }
  assert.ok(!deckContext('quality-time').has('first_date'));
  assert.ok(deckContext('quality-time').has('reconnecting'));
  assert.ok(buildDeckV31(person({ intents: ['social', 'fun', 'discovery'] }), 'quality-time').every(c => c.id !== 'S1'), 'not_reconnecting card hidden for quality time');
});

test('v31Output equals the model run on the same answers (solo and couple)', () => {
  const a = swipeAll(person(), 'anniversary');
  const b = swipeAll(person({ intents: ['fun', 'social', 'discovery'], v31: { modes: ['create_do'], pairs: { P6: 'def_right', P3: 'def_right', P2: 'def_right' } } }), 'anniversary', i => (i % 2 ? 'maybe' : 'into_it'));
  assert.deepEqual(v31Output([a], 'anniversary'), computeSharedOutputV31([answersFor(a, 'anniversary')], [{}]));
  assert.deepEqual(v31Output([a, b], 'anniversary'), computeSharedOutputV31([answersFor(a, 'anniversary'), answersFor(b, 'anniversary')], [{}, {}]));
  assert.equal(v31Output([a], 'anniversary').selectedNights.length, 3);
});

test('personal reveal: top moods with the feel, then the night it points to; honest when nothing landed', () => {
  const lines = personalReveal(swipeAll(person(), 'anniversary'), 'anniversary');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^Something romantic and (cozy|full of conversation), (unhurried|easy-going)\.$/);
  assert.match(lines[1], /^It points to The /);
  assert.deepEqual(personalReveal(swipeAll(person(), 'anniversary', () => 'not_tonight'), 'anniversary'), ["Nothing quite landed. We'll keep tonight simple."]);
});

test('ops brief: plain words from both halves plus the limits, never card text or ids', () => {
  const a = swipeAll(person(), 'anniversary');
  const b = swipeAll(person({ intents: ['social', 'fun', 'discovery'], v31: { modes: ['create_do'], pairs: { P6: 'def_right', P3: 'def_right', P2: 'def_right' } } }), 'anniversary');
  const brief = bookingBrief([a, b], 'anniversary', { diet: ['vegetarian', 'no_pork'], alcohol: false, home_by: '23:00' });
  assert.match(brief[0], /^Mood: .+ and .+\.$/);
  assert.match(brief[1], /^Mostly about: .+ and .+\.$/);
  assert.match(brief[2], /^Energy: .+\. Room: .+\. Place: .+\.$/);
  assert.ok(brief.includes('Food: Vegetarian, No pork.'));
  assert.ok(brief.includes('No alcohol.'));
  assert.ok(brief.includes('Home by 11 pm.'));
  const text = brief.join(' ');
  for (const id of Object.keys(CARDS)) assert.ok(!text.includes(CARDS[id].text), id);
  assert.deepEqual(bookingBrief([], 'date-night', null), [], 'v3 plan, no limits: nothing');
  assert.deepEqual(bookingBrief([], 'date-night', { diet: [], alcohol: true, home_by: '00:00' }), ['Home by midnight.']);
});
