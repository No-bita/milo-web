// Frontend timing contract. Replace the shared.timing write with server coordination later.
import { store } from '../domain/store.js';

export function parseNightStart(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const start = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(start.getTime()) || start.getFullYear() !== y || start.getMonth() !== m - 1 || start.getDate() !== d || start.getHours() !== h || start.getMinutes() !== min) return null;
  return start;
}

export function timingForNight(nightId) {
  const timing = store.getState().shared.timing;
  return timing?.nightId === nightId && parseNightStart(timing.date, timing.time) && typeof timing.timeZone === 'string' ? timing : null;
}

export function timingLabel(timing) {
  const date = new Date(`${timing.date}T12:00:00`);
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  return `${day} at ${timing.time} (${timing.timeZone.replace(/_/g, ' ')})`;
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderNightTiming(nightId, sessionId) {
  const timing = timingForNight(nightId);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local time';
  const id = `milo-timing-${sessionId}`;
  return `
    <section class="milo-timing-feed" aria-labelledby="${id}-title">
      <div class="milo-section-label">MAKE TIME FOR IT</div>
      <h2 id="${id}-title">When's your night?</h2>
      <p class="milo-timing-intro">The plan's picked. Choose when it happens.</p>
      <p class="milo-timing-saved" role="status" ${timing ? '' : 'hidden'}>${timing ? escape(timingLabel(timing)) : ''}</p>
      <form class="milo-timing-form" ${timing ? 'hidden' : ''}>
        <div class="milo-timeline-item">
          <div class="milo-timeline-track" aria-hidden="true"><div class="milo-timeline-dot"></div><div class="milo-timeline-line"></div></div>
          <div class="milo-timeline-content">
            <label for="${id}-date">Pick the day</label>
            <input id="${id}-date" name="date" type="date" value="${timing ? timing.date : ''}" required>
          </div>
        </div>
        <div class="milo-timeline-item">
          <div class="milo-timeline-track" aria-hidden="true"><div class="milo-timeline-dot"></div></div>
          <div class="milo-timeline-content">
            <label for="${id}-time">Pick the start time</label>
            <input id="${id}-time" name="time" type="time" value="${timing ? timing.time : ''}" required>
          </div>
        </div>
        <p class="milo-timing-zone">Times are in ${escape(zone.replace(/_/g, ' '))}.</p>
        <p class="milo-timing-error" role="alert" hidden></p>
        <button type="submit" class="milo-pill-btn-primary">Set date &amp; time</button>
      </form>
      <button type="button" class="milo-secondary-link milo-timing-change" ${timing ? '' : 'hidden'}>Change date &amp; time</button>
      <p class="milo-timing-note">Saved on this device only. No booking or calendar event.</p>
    </section>`;
}

export function attachNightTiming(container, nightId, sessionId) {
  const feed = container.querySelector('.milo-timing-feed');
  if (!feed) return;
  const form = feed.querySelector('form');
  const change = feed.querySelector('.milo-timing-change');
  change.addEventListener('click', () => {
    feed.querySelector('.milo-timing-saved').hidden = true;
    change.hidden = true;
    form.hidden = false;
    form.elements.date.focus({ preventScroll: true });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { date, time } = form.elements;
    const start = parseNightStart(date.value, time.value);
    const error = feed.querySelector('.milo-timing-error');
    if (!start) {
      error.textContent = 'Choose a valid date and time. This time may not exist when the clocks change.';
      error.hidden = false;
      return;
    }
    const scroll = container.querySelector('.milo-closing-state').scrollTop;
    store.updateShared({ timing: { version: 1, nightId, date: date.value, time: time.value, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local time', startAt: start.toISOString(), chosenBy: sessionId } });
    // The store renders synchronously. Restore position and focus in the replacement view.
    const replacement = document.querySelector(`#viewport-${sessionId}`);
    replacement?.querySelector('.milo-closing-state')?.scrollTo(0, scroll);
    replacement?.querySelector('.milo-timing-change')?.focus({ preventScroll: true });
  });
}
