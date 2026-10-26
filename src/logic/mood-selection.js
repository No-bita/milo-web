// The mood page needs three distinct, known picks before it can continue.
import { INTENTS } from '../data/mockData.js';
const knownMoods = new Set(INTENTS.map(intent => intent.id));
export function hasThreeMoods(intents = []) {
  return intents.length === 3 && new Set(intents).size === 3 && intents.every(id => knownMoods.has(id));
}

// The button stays disabled until three are picked; the label nudges along the way.
export function moodCtaLabel(count = 0) {
  if (count <= 0) return "What's the vibe?";
  if (count === 1) return 'Ooh. Two more.';
  if (count === 2) return 'Last one, make it count';
  return 'Show me what fits →';
}
