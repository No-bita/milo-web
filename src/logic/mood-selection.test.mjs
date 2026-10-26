import test from 'node:test';
import assert from 'node:assert/strict';
import { hasThreeMoods, moodCtaLabel } from './mood-selection.js';
test('Continue needs exactly three distinct known moods', () => {
  for(const picks of [[],['intimate'],['intimate','fun'],['intimate','fun','novelty','special'],['intimate','intimate','fun'],['intimate','fun','unknown']]) assert.equal(hasThreeMoods(picks), false);
  assert.equal(hasThreeMoods(['intimate','fun','novelty']), true);
});

test('CTA guidance updates reactively with mood count', () => {
  assert.equal(moodCtaLabel(0), "What's the vibe?");
  assert.equal(moodCtaLabel(1), 'Ooh. Two more.');
  assert.equal(moodCtaLabel(2), 'Last one, make it count');
  assert.equal(moodCtaLabel(3), 'Show me what fits →');
});
