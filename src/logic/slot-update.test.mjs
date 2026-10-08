import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSlotAndRestore } from './slot-update.js';
test('slot swap restores scroll and focus on the replacement, not detached view', () => {
  const oldItinerary = { scrollTop: 430 };
  const itinerary = { scrollTop: 0 };
  let updated = false, focused = false;
  const container = { querySelector: selector => { assert.equal(selector, '.milo-s7-container'); return oldItinerary; } };
  const root = { getElementById: id => {
    assert.equal(id, 'viewport-sneha'); assert.equal(updated, true);
    return { querySelector: selector => {
      if (selector === '.milo-s7-container') return itinerary;
      assert.equal(selector, '[data-customise-slot="2"]');
      return { focus: options => { assert.deepEqual(options, { preventScroll: true }); assert.equal(itinerary.scrollTop, 430); focused = true; } };
    } };
  } };
  updateSlotAndRestore(container, 'sneha', 2, () => { updated = true; }, root);
  assert.equal(focused, true); assert.equal(oldItinerary.scrollTop, 430);
});
test('a removed itinerary does not focus unrelated content', () => {
  let updates = 0;
  updateSlotAndRestore({querySelector: () => ({scrollTop: 100})}, 'aarav', 0,
    () => updates++, {getElementById: () => null});
  assert.equal(updates, 1);
});
test('top of itinerary stays at top and missing slot is safe', () => {
  const itinerary = { scrollTop: 99 };
  updateSlotAndRestore({querySelector: () => ({scrollTop: 0})}, 'aarav', 1,
    () => {}, {getElementById: () => ({querySelector: selector => selector === '.milo-s7-container' ? itinerary : null})});
  assert.equal(itinerary.scrollTop, 0);
});
