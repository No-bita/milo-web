import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSharedResult } from './shared-result.js';
import { computeSharedOutput } from './shared.js';
import { computeSharedOutputV31 } from './intent/shared-result.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

const oldHalf = (from, intents) => ({ intents, reactions: EXPERIENCE_POOL.slice(from, from + 8).map(c => ({ cardId: c.id, reaction: 'into_it' })) });
const asha = { occasion: 'anniversary', moods: ['Romantic', 'Cozy and calm'], modes: ['Talking', 'Eating and drinking'],
  swipes: [['C1', 'into'], ['T3', 'into'], ['W3', 'into'], ['M1', 'into'], ['S1', 'not'], ['D4', 'not'], ['C5', 'maybe'], ['W2', 'not']],
  pairs: [['P6', 'def_left'], ['P3', 'def_left'], ['P2', 'lean_right']] };
const ravi = { occasion: 'anniversary', moods: ['Romantic', 'Something new'], modes: ['Eating and drinking', 'Doing something together'],
  swipes: [['C1', 'into'], ['D1', 'into'], ['C5', 'into'], ['T2', 'into'], ['M3', 'maybe'], ['C2', 'maybe'], ['D5', 'maybe'], ['R2', 'maybe']],
  pairs: [['P6', 'lean_right'], ['P3', 'lean_left'], ['P2', 'def_right']] };

test('default and v3.1-without-answers both keep the current trait logic', () => {
  const a = oldHalf(0, ['intimate', 'low-key']), b = oldHalf(4, ['fun', 'novelty']);
  const expected = computeSharedOutput(a, b);
  assert.deepEqual(computeSharedResult(a, b), expected);
  assert.deepEqual(computeSharedResult(a, b, { model: 'v3.1' }), expected);
  assert.deepEqual(computeSharedResult({ ...a, quiz_v31: { answers: asha } }, b, { model: 'v3.1' }), expected, 'needs both halves');
});

test('v3.1 with both answers returns the same shape, three distinct known nights', () => {
  const out = computeSharedResult({ quiz_v31: { answers: asha, constraints: { home_by: '23:00' } } }, { quiz_v31: { answers: ravi } }, { model: 'v3.1' });
  assert.deepEqual(Object.keys(out).sort(), ['bridgeSentence', 'difference', 'selectedNights', 'sharedRows']);
  assert.equal(out.selectedNights.length, 3);
  assert.equal(new Set(out.selectedNights.map(n => n.night.id)).size, 3);
  out.selectedNights.forEach((n, i) => { assert.equal(n.num, `0${i + 1}`); assert.ok(n.night.beats.length >= 2); assert.ok(n.fitLine && n.whyItWorks); });
  assert.match(out.bridgeSentence, /^Something romantic and /);
  assert.ok(out.sharedRows.every(r => typeof r.text === 'string'));
});

test('v3.1 output never carries a person\'s own profile or who leaned which way', () => {
  const out = JSON.stringify(computeSharedOutputV31([asha, ravi]));
  for (const leak of ['"v":', '"conf"', '"low":', '"high":', 'Asha', 'Ravi', 'C1', 'P6', 'def_left']) assert.ok(!out.includes(leak), `leaks ${leak}`);
});

test('no-alcohol constraint drops the drinks nights', () => {
  const out = computeSharedOutputV31([asha, ravi], [{ alcohol: false }, {}]);
  assert.ok(out.selectedNights.every(n => !['lively-one', 'slow-one', 'dressed-up-one'].includes(n.night.id)));
});
