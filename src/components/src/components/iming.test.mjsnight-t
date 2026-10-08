import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNightStart,timingForNight} from './night-timing.js';
import {store} from '../domain/store.js';
test('timing parser rejects malformed, impossible dates and invalid clock values', () => {
  for(const [date,time] of [['2026-02-30','18:00'],['2026-13-01','18:00'],['2026-01-01','24:00'],['2026-01-01','18:60'],['2026-1-1','18:00'],['2026-01-01','6:00']]) assert.equal(parseNightStart(date,time),null);
  assert.ok(parseNightStart('2028-02-29','18:30') instanceof Date);
});
test('stored timing is scoped to its night and rejects bad data', () => {
  store.reset();store.updateShared({timing:{nightId:'middle-ground',date:'2028-02-29',time:'18:30',timeZone:'Asia/Kolkata'}});
  assert.ok(timingForNight('middle-ground'));
  assert.equal(timingForNight('little-adventure'),null);
  store.updateShared({timing:{nightId:'middle-ground',date:'2026-02-30',time:'18:30',timeZone:'Asia/Kolkata'}});
  assert.equal(timingForNight('middle-ground'),null);
});
