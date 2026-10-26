import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedTimingFromView } from './plan-view.js';

test('server timing maps onto the confirmed night', () => {
  const t = sharedTimingFromView({ date: '2026-11-07', time: '19:30', time_zone: 'Asia/Kolkata' }, 'middle-ground');
  assert.equal(t.nightId, 'middle-ground');
  assert.equal(t.date, '2026-11-07');
  assert.equal(t.time, '19:30');
  assert.equal(t.timeZone, 'Asia/Kolkata');
  assert.ok(Number.isFinite(new Date(t.startAt).getTime()));
});

test('no server timing or no confirmed night means no shared timing', () => {
  assert.equal(sharedTimingFromView(null, 'middle-ground'), null);
  assert.equal(sharedTimingFromView({ date: '2026-11-07', time: '19:30', time_zone: 'UTC' }, null), null);
  assert.equal(sharedTimingFromView({ date: 7, time: '19:30', time_zone: 'UTC' }, 'x'), null);
});
