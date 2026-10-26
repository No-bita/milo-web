// Parity: the JS intent model (src/logic/intent/) must reproduce the Python
// reference (docs/intent-model/) on the fixed runs in golden.json.
// Regenerate after any reference change: cd docs/intent-model && python3 gen_golden.py
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as CB from './intent/codebook.js';
import { Profile, eligibleCards, pickCards, merge, isVetoed, mergeConstraints, mergeSwipes, revealText, CFG, MISERY, CONFLICT_GAP, LABEL } from './intent/model.js';
import { pickNights, NIGHT_SCORES } from './intent/nights.js';

const golden = JSON.parse(readFileSync(new URL('./intent/golden.json', import.meta.url), 'utf8'));
const TOL = 1e-6;
const close = (a, b, label) => assert.ok(Math.abs(a - b) <= TOL, `${label}: js ${a} vs py ${b}`);

test('codebook, parameters and night scores match the Python reference', () => {
  for (const [key, value] of Object.entries(golden.codebook)) assert.deepEqual(CB[key], value, `codebook ${key}`);
  assert.deepEqual(CFG, golden.params.CFG);
  assert.equal(MISERY, golden.params.MISERY);
  assert.equal(CONFLICT_GAP, golden.params.CONFLICT_GAP);
  assert.deepEqual(LABEL, golden.params.LABEL);
  assert.deepEqual(NIGHT_SCORES, golden.nights);
});

function replay(answers, context) {
  const p = new Profile(answers.occasion);
  p.mood(answers.moods);
  p.modePick(answers.modes);
  const cards = pickCards(p, context);
  answers.swipes.forEach(([c, r]) => p.swipe(c, r));
  answers.pairs.forEach(([pid, a]) => p.pair(pid, a));
  answers.edits.forEach(chip => p.edit(chip));
  return { p, cards };
}

test(`JS matches Python on ${golden.runs.length} recorded couples and groups`, () => {
  for (const [i, run] of golden.runs.entries()) {
    const context = new Set(run.context);
    assert.deepEqual(eligibleCards(context), run.eligible, `run ${i} eligible cards`);
    const people = run.answers.map((answers, j) => {
      const { p, cards } = replay(answers, context);
      assert.deepEqual(cards, answers.cards, `run ${i} person ${j} adaptive deck`);
      const want = run.profiles[j];
      for (const d of Object.keys(want.v)) { close(p.v[d], want.v[d], `run ${i} p${j} ${d}`); close(p.conf[d], want.conf[d], `run ${i} p${j} conf ${d}`); }
      assert.deepEqual(p.top(CB.DRIVERS, 2), want.top_drivers, `run ${i} p${j} top drivers`);
      assert.deepEqual(p.top(CB.MODES, 2), want.top_modes, `run ${i} p${j} top modes`);
      return p;
    });
    const { shared, conflicts } = merge(people);
    for (const d of Object.keys(run.shared)) close(shared[d], run.shared[d], `run ${i} shared ${d}`);
    assert.deepEqual(conflicts, run.conflicts, `run ${i} conflicts`);
    assert.deepEqual([...CB.DRIVERS, ...CB.MODES].filter(d => isVetoed(people, d)), run.vetoed, `run ${i} vetoes`);
    const cons = mergeConstraints(run.constraints);
    assert.deepEqual(cons, run.merged_constraints, `run ${i} constraints`);
    assert.deepEqual(mergeSwipes(run.answers.map(a => Object.fromEntries(a.swipes))), run.merged_swipes, `run ${i} swipes`);
    assert.equal(revealText(shared), run.reveal, `run ${i} reveal`);
    const { ranked } = pickNights(people, cons);
    assert.deepEqual(ranked.map(r => r[0]), run.nights.map(r => r[0]), `run ${i} night order`);
    ranked.forEach(([, s], k) => assert.ok(Math.abs(s - run.nights[k][1]) <= 0.0011, `run ${i} night score`));
  }
});

test('the golden set exercises the interesting branches', () => {
  const runs = golden.runs;
  assert.ok(runs.some(r => r.conflicts.length), 'some turn-taking flags');
  assert.ok(runs.some(r => r.vetoed.length), 'some vetoes');
  assert.ok(runs.some(r => r.answers.length === 3), 'some groups of three');
  assert.ok(runs.some(r => r.merged_constraints.alcohol === false), 'some no-alcohol plans');
  assert.ok(runs.some(r => r.context.includes('first_date') && !r.eligible.includes('D2')), 'not_ tags hide cards');
  assert.ok(runs.some(r => r.answers.some(a => a.edits.length)), 'some edit chips');
});

test('home-by merges across midnight', () => {
  assert.equal(mergeConstraints([{ home_by: '23:30' }, { home_by: '00:30' }]).home_by, '23:30');
  assert.equal(mergeConstraints([{ home_by: '01:00' }, { home_by: '00:30' }]).home_by, '00:30');
});
