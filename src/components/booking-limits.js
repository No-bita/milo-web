// "Anything Milo must work around?": food and drink, alcohol and a home-by time,
// on both booking forms (solo and Together). All optional. No stylesheet import,
// so screens that unit tests load in Node can use it; it reuses the booking pills.
import { DIET_OPTIONS, HOME_BY_OPTIONS } from '../data/constraints.js';
import { flagOn } from '../logic/intent-quiz.js';

// Shown with the intent model v3.1 switch, so deploying this code changes nothing until it is on.
export const limitsOn = () => flagOn();

export function renderLimits() {
  return `<fieldset class="milo-choice milo-limits"><legend>Food and drink (optional)</legend>
      ${Object.entries(DIET_OPTIONS).map(([id, label]) => `<label class="milo-choice-pill"><input type="checkbox" name="diet" value="${id}"><span>${label}</span></label>`).join('')}
      <label class="milo-choice-pill"><input type="checkbox" name="no_alcohol" value="1"><span>No alcohol</span></label>
    </fieldset>
    <fieldset class="milo-choice milo-limits"><legend>Home by (optional)</legend>
      ${Object.entries(HOME_BY_OPTIONS).map(([value, label]) => `<label class="milo-choice-pill"><input type="radio" name="home_by" value="${value}"><span>${label}</span></label>`).join('')}
    </fieldset>`;
}

// The constraints to send, or undefined when nothing was chosen.
export function readLimits(form) {
  const diet = [...form.querySelectorAll('input[name=diet]:checked')].map(i => i.value);
  const noAlcohol = Boolean(form.querySelector('input[name=no_alcohol]:checked'));
  const homeBy = form.querySelector('input[name=home_by]:checked')?.value || '';
  if (!diet.length && !noAlcohol && !homeBy) return undefined;
  return { diet, alcohol: !noAlcohol, ...(homeBy ? { home_by: homeBy } : {}) };
}
