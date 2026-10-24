import test from 'node:test';
import assert from 'node:assert/strict';
import { hasThreeMoods, moodCtaLabel } from './mood-selection.js';
test('Continue needs exactly three distinct known moods', () => {
  for(const picks of [[],['intimate'],['intimate','fun'],['intimate','fun','novelty','special'],['intimate','intimate','fun'],['intimate','fun','unknown']]) assert.equal(hasThreeMoods(picks), false);
  assert.equal(hasThreeMoods(['intimate','fun','novelty']), true);
});

test('CTA guidance updates reactively with mood count', () => {
  assert.equal(moodCtaLabel(0), 'Show me what fits →');
  assert.equal(moodCtaLabel(1), 'Pick 2 more moods');
  assert.equal(moodCtaLabel(2), 'Pick 1 more mood');
  assert.equal(moodCtaLabel(3), 'Show me what fits →');
});
