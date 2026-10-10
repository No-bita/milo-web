// Pure helpers for the date strip and clock picker. No DOM, no store.
import { parseNightStart } from '../components/night-timing.js';

const pad = n => String(n).padStart(2, '0');
export const toDateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Date strip: starts at today, one entry per day. `days` is the cap (1b); omit for a window the caller extends (1a).
export function buildDateStrip(now = new Date(), days = 14) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      key: toDateKey(d),
      isToday: i === 0,
      weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d),
      day: d.getDate(),
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(d)
    });
  }
  return out;
}

export const isPastDate = (key, now = new Date()) => key < toDateKey(now);

// A chosen day+time is past when the start is not strictly in the future.
export function isPastStart(date, time, now = new Date()) {
  const start = parseNightStart(date, time);
  return !start || start.getTime() <= now.getTime();
}

// Clock: 12-hour face + AM/PM <-> 24h "HH:MM" used by storage. Minutes snap to 5.
export function to24h(hour12, minute, meridiem) {
  if (!(hour12 >= 1 && hour12 <= 12) || !(minute >= 0 && minute <= 59)) return null;
  const h = (hour12 % 12) + (meridiem === 'PM' ? 12 : 0);
  return `${pad(h)}:${pad(minute)}`;
}
export function from24h(time) {
  const m = /^(\d{2}):(\d{2})$/.exec(time || '');
  if (!m) return null;
  const h = Number(m[1]);
  return { hour12: h % 12 || 12, minute: Number(m[2]), meridiem: h >= 12 ? 'PM' : 'AM' };
}
export const snapMinute = m => (Math.round(m / 5) * 5) % 60;

// Which hours/minutes are disabled for the chosen day (only matters for today).
export function disabledTimes(date, now = new Date()) {
  if (date !== toDateKey(now)) return () => false;
  return time => isPastStart(date, time, now);
}

// Default start: 7:30 PM today, or tomorrow if that has already passed.
export function defaultStart(now = new Date()) {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return { date: toDateKey(t), time: '19:30' };
}
