// Frontend timing contract. Replace the shared.timing write with server coordination later.
import { store } from '../domain/store.js';
import { defaultStart, buildDateStrip, isPastStart, to24h, from24h, disabledTimes, toDateKey } from '../logic/timing-picker.js';

const STRIP_DAYS = 14;
const FACE = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pos = (i, r) => { const a = (i / 12) * 2 * Math.PI; return { x: 110 + r * Math.sin(a), y: 110 - r * Math.cos(a) }; };

export function parseNightStart(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const start = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(start.getTime()) || start.getFullYear() !== y || start.getMonth() !== m - 1 || start.getDate() !== d || start.getHours() !== h || start.getMinutes() !== min) return null;
  return start;
}

export function timingForNight(nightId, { solo = false } = {}) {
  const state = store.getState();
  const timing = solo ? state.sessionA.soloTimings?.[nightId] : state.shared.timing;
  return timing?.nightId === nightId && parseNightStart(timing.date, timing.time) && typeof timing.timeZone === 'string' ? timing : null;
}

// One format everywhere: time first, then day, then date. "7:30 PM, Sat, Oct 17"
export function timingLabel(timing) {
  const [h, m] = timing.time.split(':').map(Number);
  const clock = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const date = new Date(`${timing.date}T12:00:00`);
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const md = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  return `${clock}, ${day}, ${md}`;
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderNightTiming(nightId, sessionId, { solo = false } = {}) {
  const timing = timingForNight(nightId, { solo });
  const id = `milo-timing-${sessionId}`;
  return `
    <section class="milo-timing-feed" aria-labelledby="${id}-title">
      <h2 id="${id}-title">When's your night?</h2>
      <p class="milo-timing-saved" role="status" ${timing ? '' : 'hidden'}>${timing ? escape(timingLabel(timing)) : ''}</p>
      <form class="milo-timing-form" ${timing ? 'hidden' : ''} novalidate>
        <input type="hidden" name="date" value="${timing ? timing.date : ''}">
        <input type="hidden" name="time" value="${timing ? timing.time : ''}">
        <div class="milo-strip" role="radiogroup" aria-label="Day">
          ${buildDateStrip(new Date(), STRIP_DAYS).map(d => `<button type="button" role="radio" aria-checked="false" class="milo-strip-day" data-date="${d.key}"><span>${d.isToday ? 'Today' : d.weekday}</span><strong>${d.day}</strong><em>${d.month}</em></button>`).join('')}
        </div>
        <div class="milo-clock" data-mode="hour">
          <div class="milo-clock-readout" aria-live="polite">
            <button type="button" class="milo-clock-part is-on" data-part="hour" aria-label="Hour">--</button><span>:</span><button type="button" class="milo-clock-part" data-part="minute" aria-label="Minute">--</button>
            <div class="milo-meridiem" role="radiogroup" aria-label="AM or PM"><button type="button" role="radio" aria-checked="false" data-m="AM">AM</button><button type="button" role="radio" aria-checked="true" data-m="PM">PM</button></div>
          </div>
          <svg class="milo-clock-face" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="104" class="milo-clock-ring"/><line class="milo-clock-hand" x1="110" y1="110" x2="110" y2="110"/></svg>
          <div class="milo-clock-nums"></div>
        </div>
        <p class="milo-timing-error" role="alert" hidden></p>
        <button type="submit" class="milo-pill-btn-primary">Set the time</button>
      </form>
      <button type="button" class="milo-secondary-link milo-timing-change" ${timing ? '' : 'hidden'}>Change date &amp; time</button>
    </section>`;
}

export function attachNightTiming(container, nightId, sessionId, { solo = false } = {}) {
  const feed = container.querySelector('.milo-timing-feed');
  if (!feed) return;
  const form = feed.querySelector('form');
  const change = feed.querySelector('.milo-timing-change');
  wirePicker(feed, form);
  change.addEventListener('click', () => {
    feed.querySelector('.milo-timing-saved').hidden = true;
    change.hidden = true;
    form.hidden = false;
    feed.querySelector('.milo-strip-day')?.focus({ preventScroll: true });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { date, time } = form.elements;
    const start = parseNightStart(date.value, time.value);
    const error = feed.querySelector('.milo-timing-error');
    if (!start) {
      error.textContent = !date.value || !time.value ? 'Pick a day and a time.' : 'Choose a valid date and time. This time may not exist when the clocks change.';
      error.hidden = false;
      return;
    }
    if (isPastStart(date.value, time.value)) { error.textContent = 'That time has already passed.'; error.hidden = false; return; }
    error.hidden = true;
    const scroll = container.querySelector('.milo-s7-container')?.scrollTop || 0;
    const timing = { version: 1, nightId, date: date.value, time: time.value, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local time', startAt: start.toISOString(), chosenBy: sessionId };
    if (solo) store.updateSession(sessionId, { soloTimings: { ...store.getState().sessionA.soloTimings, [nightId]: timing } });
    else store.updateShared({ timing });
    // The store renders synchronously. Restore position and focus in the replacement view.
    const replacement = document.querySelector(`#viewport-${sessionId}`);
    replacement?.querySelector('.milo-s7-container')?.scrollTo(0, scroll);
    replacement?.querySelector('.milo-timing-change')?.focus({ preventScroll: true });
  });
}

function wirePicker(feed, form) {
  const days = [...feed.querySelectorAll('.milo-strip-day')];
  const clock = feed.querySelector('.milo-clock');
  const nums = clock.querySelector('.milo-clock-nums');
  const hand = clock.querySelector('.milo-clock-hand');
  const parts = { hour: clock.querySelector('[data-part=hour]'), minute: clock.querySelector('[data-part=minute]') };
  const ampm = [...clock.querySelectorAll('[data-m]')];
  const sel = { hour: null, minute: null, meridiem: 'PM' };
  const dateInput = form.elements.date, timeInput = form.elements.time;
  const pad = n => String(n).padStart(2, '0');

  const sync = () => {
    const ok = sel.hour != null && sel.minute != null;
    timeInput.value = ok ? to24h(sel.hour, sel.minute, sel.meridiem) : '';
    parts.hour.textContent = sel.hour == null ? '--' : pad(sel.hour);
    parts.minute.textContent = sel.minute == null ? '--' : pad(sel.minute);
    ampm.forEach(b => b.setAttribute('aria-checked', String(b.dataset.m === sel.meridiem)));
  };
  const draw = () => {
    const mode = clock.dataset.mode;
    const off = disabledTimes(dateInput.value);
    const items = mode === 'hour' ? FACE : MINUTES;
    nums.innerHTML = items.map((v, i) => {
      const { x, y } = pos(i, 82);
      let dis = false;
      if (dateInput.value) dis = mode === 'hour' ? MINUTES.every(m => off(to24h(v, m, sel.meridiem))) : off(to24h(sel.hour ?? 12, v, sel.meridiem));
      const on = (mode === 'hour' ? sel.hour : sel.minute) === v;
      return `<button type="button" class="milo-clock-num${on ? ' is-on' : ''}" data-v="${v}" style="left:${(x / 220 * 100).toFixed(2)}%;top:${(y / 220 * 100).toFixed(2)}%" ${dis ? 'disabled' : ''} aria-label="${mode === 'hour' ? v + ' o\'clock' : pad(v) + ' minutes'}">${mode === 'hour' ? v : pad(v)}</button>`;
    }).join('');
    const cur = mode === 'hour' ? sel.hour : sel.minute;
    const idx = cur == null ? -1 : items.indexOf(cur);
    if (idx < 0) { hand.setAttribute('x2', 110); hand.setAttribute('y2', 110); } else { const p = pos(idx, 82); hand.setAttribute('x2', p.x); hand.setAttribute('y2', p.y); }
    parts.hour.classList.toggle('is-on', mode === 'hour');
    parts.minute.classList.toggle('is-on', mode === 'minute');
  };
  const reconcile = () => {
    // A day change can make the chosen time past (today only). Clear it rather than keep an invalid time.
    if (timeInput.value && isPastStart(dateInput.value, timeInput.value)) { sel.hour = sel.minute = null; clock.dataset.mode = 'hour'; }
    sync(); draw();
  };
  const pick = key => {
    dateInput.value = key;
    days.forEach(b => b.setAttribute('aria-checked', String(b.dataset.date === key)));
    days.forEach(b => b.classList.toggle('is-on', b.dataset.date === key));
    reconcile();
  };
  days.forEach(b => b.addEventListener('click', () => pick(b.dataset.date)));
  nums.addEventListener('click', e => {
    const b = e.target.closest('.milo-clock-num'); if (!b || b.disabled) return;
    const v = Number(b.dataset.v);
    if (clock.dataset.mode === 'hour') { sel.hour = v; clock.dataset.mode = 'minute'; if (sel.minute == null) sel.minute = null; } else sel.minute = v;
    reconcile();
  });
  Object.entries(parts).forEach(([k, el]) => el.addEventListener('click', () => { clock.dataset.mode = k; draw(); }));
  ampm.forEach(b => b.addEventListener('click', () => { sel.meridiem = b.dataset.m; reconcile(); }));
  // Restore an existing value when the form is reopened via Change.
  if (!dateInput.value && !timeInput.value) { const d = defaultStart(); dateInput.value = d.date; timeInput.value = d.time; }
  const had = from24h(timeInput.value);
  if (had) { sel.hour = had.hour12; sel.minute = had.minute; sel.meridiem = had.meridiem; }
  sync(); draw();
  if (dateInput.value) pick(dateInput.value);
}
