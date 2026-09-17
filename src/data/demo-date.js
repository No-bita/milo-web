// ==========================================================
// MILO V2 — DYNAMIC DEMO DATE SYSTEM
// Never hardcode static weekdays or calendar months.
// Derives calendar strip and display strings from ISO date.
// ==========================================================

export const DEMO_DATE_ISO = '2026-10-25';
export const DEMO_TIME_DEFAULT = '19:30';

export function getDemoDateInfo(isoString = DEMO_DATE_ISO, timeStr = DEMO_TIME_DEFAULT) {
  const d = new Date(isoString + 'T00:00:00');
  
  const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
  const weekdayFull = d.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDay = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedFull = `${weekdayFull}, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
  const dayNum = d.getDate();

  // Convert "19:30" to "7:30 PM"
  let formattedTime = '7:30 PM';
  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    formattedTime = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // Generate 7-day strip centered around the date
  // Start 4 days before, go to 2 days after
  const weekStrip = [];
  for (let offset = -4; offset <= 2; offset++) {
    const dayDate = new Date(d);
    dayDate.setDate(d.getDate() + offset);
    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, '0');
    const day = String(dayDate.getDate()).padStart(2, '0');
    const localIso = `${y}-${m}-${day}`;
    weekStrip.push({
      iso: localIso,
      dayNum: dayDate.getDate(),
      dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
      isSelected: offset === 0
    });
  }

  return {
    iso: isoString,
    monthYear,
    weekdayShort,
    weekdayFull,
    formattedDay,
    formattedFull,
    dayNum,
    time: timeStr,
    formattedTime,
    weekStrip
  };
}
