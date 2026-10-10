import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultStart, buildDateStrip, isPastDate, isPastStart, to24h, from24h, snapMinute, disabledTimes } from './timing-picker.js';
const now = new Date(2026, 9, 9, 19, 10); // Fri 9 Oct 2026 19:10 local
test('strip starts at today, is consecutive and capped', () => {
  const s = buildDateStrip(now, 14);
  assert.equal(s.length, 14); assert.equal(s[0].key, '2026-10-09'); assert.ok(s[0].isToday); assert.equal(s[0].weekday, 'Fri');
  assert.equal(s[13].key, '2026-10-22'); assert.equal(s[1].isToday, false);
  assert.equal(buildDateStrip(new Date(2026, 11, 30), 3).map(d => d.key).join(), '2026-12-30,2026-12-31,2027-01-01');
});
test('past dates are blocked, today is not', () => {
  assert.ok(isPastDate('2026-10-08', now)); assert.equal(isPastDate('2026-10-09', now), false);
});
test('past start times blocked for today only', () => {
  assert.ok(isPastStart('2026-10-09', '19:00', now)); assert.ok(isPastStart('2026-10-09', '19:10', now));
  assert.equal(isPastStart('2026-10-09', '19:30', now), false); assert.equal(isPastStart('2026-10-10', '09:00', now), false);
  assert.ok(isPastStart('2026-02-30', '09:00', now));
  const d = disabledTimes('2026-10-09', now); assert.ok(d('18:00')); assert.equal(d('20:00'), false);
  assert.equal(disabledTimes('2026-10-10', now)('01:00'), false);
});
test('12h <-> 24h conversion incl. noon and midnight', () => {
  assert.equal(to24h(12, 0, 'AM'), '00:00'); assert.equal(to24h(12, 30, 'PM'), '12:30'); assert.equal(to24h(7, 30, 'PM'), '19:30');
  assert.equal(to24h(13, 0, 'AM'), null); assert.deepEqual(from24h('00:05'), { hour12: 12, minute: 5, meridiem: 'AM' });
  assert.deepEqual(from24h('19:30'), { hour12: 7, minute: 30, meridiem: 'PM' }); assert.equal(from24h('7:30'), null);
  assert.equal(snapMinute(58), 0); assert.equal(snapMinute(32), 30);
});
test('default start is 7:30 PM today, or tomorrow once that has passed', () => {
  assert.deepEqual(defaultStart(new Date(2026, 9, 9, 12, 12, 30)), { date: '2026-10-09', time: '19:30' });
  assert.deepEqual(defaultStart(new Date(2026, 9, 9, 19, 30, 0)), { date: '2026-10-10', time: '19:30' });
  assert.deepEqual(defaultStart(new Date(2026, 9, 9, 23, 58)), { date: '2026-10-10', time: '19:30' });
});
