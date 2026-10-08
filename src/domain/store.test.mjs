import test from 'node:test';
import assert from 'node:assert/strict';
import {store} from './store.js';
test('intent cap and removal preserve the other session', () => {
  store.reset();
  store.toggleIntent('aarav','intimate');store.toggleIntent('aarav','fun');store.toggleIntent('aarav','special');
  assert.equal(store.toggleIntent('aarav','novelty').success,false);
  assert.deepEqual(store.getState().sessionB.intents,[]);
  assert.equal(store.toggleIntent('aarav','fun').action,'removed');
  assert.equal(store.toggleIntent('aarav','novelty').success,true);
});
test('shared suggestion and confirmation do not overwrite session preferences', () => {
  store.reset();store.updateSession('aarav',{intents:['intimate']});
  store.updateShared({suggestion:{by:'aarav',nightId:'middle-ground'}});
  store.updateShared({confirmedNightId:'middle-ground'});
  assert.equal(store.getState().shared.suggestion.by,'aarav');
  assert.equal(store.getState().shared.confirmedNightId,'middle-ground');
  assert.deepEqual(store.getState().sessionA.intents,['intimate']);
});
test('unsubscribe stops further notifications', () => {
  store.reset();let calls=0;const stop=store.subscribe(()=>calls++);
  store.updateSession('aarav',{screen:'s7'});stop();store.updateSession('aarav',{screen:'s6'});
  assert.equal(calls,1);
});
