// The mood page needs three distinct, known picks before it can continue.
import { INTENTS } from '../data/mockData.js';
const knownMoods = new Set(INTENTS.map(intent => intent.id));
export function hasThreeMoods(intents = []) {
  return intents.length === 3 && new Set(intents).size === 3 && intents.every(id => knownMoods.has(id));
}

export function moodCtaLabel(count = 0) {
  if (count === 1) return 'Pick 2 more moods';
  if (count === 2) return 'Pick 1 more mood';
  return 'Show me what fits →';
}
