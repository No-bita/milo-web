// The mood page needs three distinct, known picks before it can continue.
import { INTENTS } from '../data/mockData.js';
const knownMoods = new Set(INTENTS.map(intent => intent.id));
export function hasThreeMoods(intents = []) {
  return intents.length === 3 && new Set(intents).size === 3 && intents.every(id => knownMoods.has(id));
}
