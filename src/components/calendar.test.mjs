import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarFile } from '../screens/booked.js';

test('calendarFile returns null when timing or night is missing', () => {
  assert.equal(calendarFile(null, { date: '2026-11-01', time: '19:30' }), null);
  assert.equal(calendarFile({ id: 'test', name: 'Test Night', beats: [] }, null), null);
});

test('calendarFile formats .ics with night title, formatted timing, and Google Maps links for beats', () => {
  const night = {
    id: 'middle-ground',
    name: 'The Middle Ground',
    beats: [
      { name: 'Dinner', desc: 'somewhere small and candlelit, no rush.' },
      { name: 'Walk', desc: 'quiet streets, nowhere we need to be.' },
      { name: 'Dessert', desc: 'a table outside if it is warm.' }
    ]
  };
  const timing = { date: '2026-11-01', time: '19:30', timeZone: 'Asia/Kolkata' };

  const ics = calendarFile(night, timing);
  assert.ok(ics);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.endsWith('END:VCALENDAR'));

  // Summary has night title
  assert.match(ics, /SUMMARY:The Middle Ground/);

  // Description contains formatted timing
  assert.match(ics, /Timing: /);

  // Description contains Google Maps links for each beat
  assert.match(ics, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Dinner%2C%20Bengaluru/);
  assert.match(ics, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Walk%2C%20Bengaluru/);
  assert.match(ics, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Dessert%2C%20Bengaluru/);

  // Line breaks use CRLF
  assert.ok(ics.includes('\r\n'));
});
