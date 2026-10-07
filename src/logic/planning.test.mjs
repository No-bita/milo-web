import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../domain/store.js';
import { computePlanningOutput } from './planning.js';

test('initiator sees path choice, invitee stays on existing path', () => {
  store.reset(); store.advanceFromS1('aarav');
  assert.equal(store.getState().sessionA.screen, 'planning_path');
  store.advanceFromS1('sneha');
  assert.equal(store.getState().sessionB.screen, 'threshold');
});
test('solo recommendations do not depend on partner input', () => {
  store.reset(); store.updateSession('aarav', { planningMode: 'solo', intents: ['low-key'] });
  const first = computePlanningOutput(store.getState());
  store.updateSession('sneha', { intents: ['fun', 'novelty', 'special'], reactions: [{ cardId: 'live-music', reaction: 'into_it' }] });
  assert.deepEqual(computePlanningOutput(store.getState()), first);
  assert.equal(first.selectedNights.length, 3);
  assert.equal(new Set(first.selectedNights.map(item => item.night.id)).size, 3);
  assert.ok(first.selectedNights.every(item => !item.whyItWorks.includes('Sneha')));
});
