// Calendar export is offered only after both people confirm their night.
const THREE_HOURS = 3 * 60 * 60 * 1000;
const escapeText = value => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const utcStamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

// Interpret the native date/time fields in the device's local timezone.
export function calendarStart(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(start.getTime()) || start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day || start.getHours() !== hour || start.getMinutes() !== minute) return null;
  return start;
}

// RFC 5545 lines are limited to 75 UTF-8 octets (including continuation space).
function foldLine(line) {
  const encoder = new TextEncoder();
  let result = '', length = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (length + size > 75) { result += '\r\n '; length = 1; }
    result += char;
    length += size;
  }
  return result;
}

export function buildCalendarFile(night, partnerName, start) {
  const end = new Date(start.getTime() + THREE_HOURS);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Milo//Tonight//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:milo-${night.id}-${utcStamp(start)}@milo`,
    `DTSTAMP:${utcStamp(new Date())}`, `DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(`${night.name} with ${partnerName}`)}`,
    `DESCRIPTION:${escapeText(night.beats.map(b => `${b.name}: ${b.desc}`).join('\n'))}`,
    'END:VEVENT', 'END:VCALENDAR', ''
  ].map(foldLine).join('\r\n');
}

export function askCalendarDate(container, trigger, night, partnerName) {
  if (container.querySelector('.milo-calendar-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'milo-calendar-dialog';
  dialog.setAttribute('aria-labelledby', 'milo-calendar-title');
  dialog.setAttribute('aria-describedby', 'milo-calendar-hint');
  dialog.innerHTML = `
    <form class="milo-calendar-form">
      <div class="milo-section-label">YOUR NIGHT</div>
      <h2 id="milo-calendar-title">When's your night?</h2>
      <p id="milo-calendar-hint">Choose a date and start time. We'll save a 3-hour plan in your calendar.</p>
      <label for="milo-calendar-date">Date</label>
      <input id="milo-calendar-date" name="date" type="date" required autofocus>
      <label for="milo-calendar-time">Start time</label>
      <input id="milo-calendar-time" name="time" type="time" required>
      <p class="milo-calendar-zone"></p>
      <p class="milo-calendar-error" role="alert" hidden></p>
      <div class="milo-calendar-actions">
        <button class="milo-pill-btn-primary" type="submit">Save calendar file</button>
        <button class="milo-pill-btn-secondary" type="button" data-calendar-cancel>Not now</button>
      </div>
    </form>`;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your device timezone';
  dialog.querySelector('.milo-calendar-zone').textContent = `Times are in ${zone.replace(/_/g, ' ')}.`;
  container.appendChild(dialog);
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  }, { once: true });
  dialog.querySelector('[data-calendar-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const start = calendarStart(fields.get('date'), fields.get('time'));
    const error = dialog.querySelector('.milo-calendar-error');
    if (!start) {
      error.textContent = 'Choose a valid date and time. This time may not exist when the clocks change.';
      error.hidden = false;
      return;
    }
    try {
      const url = URL.createObjectURL(new Blob([buildCalendarFile(night, partnerName, start)], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tonight.ics';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      dialog.close();
    } catch {
      error.textContent = 'The calendar file could not be saved. Please try again.';
      error.hidden = false;
    }
  });
  dialog.showModal();
}
