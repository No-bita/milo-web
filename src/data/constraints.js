// Hard limits asked at the booking step (intent model v3.1 constraints). Shared by
// the app and the server: the server accepts only the ids listed here.
// Diet = food choices, not health details: allergies stay in free-text requests.
export const DIET_OPTIONS = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  jain: 'Jain',
  eggless: 'No egg',
  no_beef: 'No beef',
  no_pork: 'No pork'
};
// Plain-words lines for whoever books the night, from the limits given at booking.
export function limitsBrief(constraints) {
  const lines = [];
  if (!constraints) return lines;
  const diet = (constraints.diet || []).map(d => DIET_OPTIONS[d]).filter(Boolean);
  if (diet.length) lines.push(`Food: ${diet.join(', ')}.`);
  if (constraints.alcohol === false) lines.push('No alcohol.');
  if (constraints.home_by) lines.push(`Home ${HOME_BY_OPTIONS[constraints.home_by].toLowerCase()}.`);
  return lines;
}
export const HOME_BY_OPTIONS = { '': 'No rush', '22:00': 'By 10 PM', '23:00': 'By 11 PM', '00:00': 'By midnight' };
