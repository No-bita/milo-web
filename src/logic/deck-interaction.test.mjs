import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeckInteraction } from './deck-interaction.js';
function harness() {
  const handlers = new Set();
  const timers = new Map();
  const votes = [];
  let current = true, id = 0, locks = 0;
  const target = {
    addEventListener: (_, fn) => handlers.add(fn),
    removeEventListener: (_, fn) => handlers.delete(fn)
  };
  const mount = () => {
    const gate = createDeckInteraction({ target, isCurrent: () => current,
      isTyping: element => element?.typing, record: vote => votes.push(vote), onLock: () => locks++,
      schedule: fn => { timers.set(++id, fn); return id; }, cancel: id => timers.delete(id) });
    gate.bindKeyboard(vote => gate.commit(vote, () => {}, 260));
    return gate;
  };
  const flush = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); };
  const key = (key, overrides = {}) => {
    const event = {key, target: {}, preventDefault() { this.prevented = true; }, ...overrides};
    [...handlers].forEach(fn => fn(event));
    return event;
  };
  return { mount, flush, key, votes, handlers, timers, exit: () => { current = false; }, locks: () => locks };
}
test('double tap and competing input commit only one reaction', () => {
  const h = harness(), gate = h.mount();
  assert.equal(gate.commit('into_it', () => {}, 260), true);
  assert.equal(gate.commit('maybe', () => {}, 240), false);
  h.key('ArrowLeft'); h.flush();
  assert.deepEqual(h.votes, ['into_it']); assert.equal(h.locks(), 1);
});
test('Back/unmount cancels pending timer and keyboard handler', () => {
  const h = harness(), gate = h.mount(); gate.commit('into_it', () => {}, 260);
  gate.dispose(); gate.dispose(); h.key('ArrowRight'); h.flush();
  assert.deepEqual(h.votes, []); assert.equal(h.timers.size, 0); assert.equal(h.handlers.size, 0);
});
test('changing the active card/screen prevents stale delayed votes', () => {
  const h = harness(), gate = h.mount(); gate.commit('maybe', () => {}, 240); h.exit(); h.flush();
  assert.deepEqual(h.votes, []);
});
test('repeated remounts do not accumulate keyboard listeners', () => {
  const h = harness(); for (let i = 0; i < 8; i++) h.mount().dispose();
  h.mount(); assert.equal(h.handlers.size, 1); h.key('ArrowRight'); h.flush();
  assert.deepEqual(h.votes, ['into_it']);
});
test('Tab and unrelated keys do not consume keyboard navigation', () => {
  const h = harness(); h.mount(); assert.equal(h.key('Tab').prevented, undefined);
  assert.equal(h.key('ArrowDown').prevented, true); h.flush(); assert.deepEqual(h.votes, ['maybe']);
});
test('editable fields, handled events and shortcuts do not vote', () => {
  const h = harness(); h.mount(); h.key('ArrowRight', {target: {typing: true}});
  h.key('ArrowRight', {defaultPrevented: true}); h.key('ArrowRight', {ctrlKey: true});
  h.key('ArrowLeft'); h.flush(); assert.deepEqual(h.votes, ['not_tonight']);
});
test('fresh card can vote after the previous card is disposed', () => {
  const h = harness(), first = h.mount(); h.key('ArrowRight'); h.flush(); first.dispose();
  h.mount(); h.key('ArrowDown'); h.flush(); assert.deepEqual(h.votes, ['into_it','maybe']);
});
