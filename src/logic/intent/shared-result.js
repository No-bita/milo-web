// Intent model v3.1 -> the shared-result shape the app and server already use:
//   { sharedRows: [{ text }], difference: { dim, copy } | null, bridgeSentence, selectedNights }
// Only shared, couple-level wording comes out of here: never a person's own
// profile, values or which partner leaned which way.
import { NIGHTS_POOL } from '../../data/mockData.js';
import { Profile, mergeConstraints, topShared, revealText, LABEL } from './model.js';
import { pickNights, NIGHT_SCORES } from './nights.js';

// Copy is a first draft for review in phase C.
const ROW_TEXT = {
  romance: 'Something romantic', connection: 'Room for a real conversation', comfort: 'Cozy, nothing rushed',
  fun: 'A playful streak', discovery: 'A little novelty', feel_special: 'Feels like an occasion',
  social: 'Some buzz around you', meaning: 'Something that means something'
};
const DIFFERENCE_COPY = {
  energy: "One of you wants it livelier than the other. The stops take turns.",
  social_exposure: "One of you likes a buzzing room, the other a quiet corner. You'll get a bit of both.",
  novelty: "One of you wants something new, the other somewhere familiar. A bit of both."
};

// answers: { occasion, moods, modes, swipes: [[cardId, response]], pairs: [[pairId, answer]], edits? }
// occasion is a PRIORS key (night_out, first_date, anniversary, birthday, reconnecting, proposal).
export function profileFromAnswers(answers) {
  const p = new Profile(answers.occasion || 'night_out');
  p.mood(answers.moods || []);
  p.modePick(answers.modes || []);
  for (const [card, response] of answers.swipes || []) p.swipe(card, response);
  for (const [pair, answer] of answers.pairs || []) p.pair(pair, answer);
  for (const chip of answers.edits || []) p.edit(chip);
  return p;
}

export function computeSharedOutputV31(answersList, constraintsList = []) {
  const profiles = answersList.map(profileFromAnswers);
  const constraints = mergeConstraints(constraintsList);
  const { top, shared, conflicts } = pickNights(profiles, constraints);
  const [a, b] = topShared(shared, 2);
  const conflict = conflicts.find(c => DIFFERENCE_COPY[c.dimension]);
  return {
    sharedRows: [a, b].map(d => ({ text: ROW_TEXT[d] })),
    difference: conflict ? { dim: conflict.dimension, copy: DIFFERENCE_COPY[conflict.dimension] } : null,
    bridgeSentence: revealText(shared),
    selectedNights: top.map(([id], i) => {
      const night = NIGHTS_POOL.find(n => n.id === id);
      const turns = conflicts.length && NIGHT_SCORES[id].stops >= 3 ? ' Three stops, so you can take turns.' : '';
      return { num: String(i + 1).padStart(2, '0'), fitLine: night.reasonLine, whyItWorks: `It fits what you both leaned toward: ${LABEL[a]} and ${LABEL[b]}.${turns}`, night };
    })
  };
}
