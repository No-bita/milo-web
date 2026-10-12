import test from 'node:test';
import assert from 'node:assert/strict';
import { hasThreeMoods } from './mood-selection.js';
test('Continue needs exactly three distinct known moods', () => {
  for(const picks of [[],['intimate'],['intimate','fun'],['intimate','fun','novelty','special'],['intimate','intimate','fun'],['intimate','fun','unknown']]) assert.equal(hasThreeMoods(picks), false);
  assert.equal(hasThreeMoods(['intimate','fun','novelty']), true);
});
