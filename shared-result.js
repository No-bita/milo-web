// One entry point for the couple's shared result, so the intent model can be
// switched on without touching callers. 'v3' (default) is the current trait
// logic in shared.js. 'v3.1' uses src/logic/intent/ but ONLY when both people
// carry v3.1 quiz answers (`quiz_v31: { answers, constraints }`); until the new
// quiz screens and server fields ship (phases C and D), nobody does, so the
// result is unchanged.
import { computeSharedOutput } from './shared.js';
import { computeSharedOutputV31 } from './intent/shared-result.js';

export const INTENT_MODELS = ['v3', 'v3.1'];

export function computeSharedResult(a, b, { model = 'v3' } = {}) {
  if (model === 'v3.1' && a?.quiz_v31 && b?.quiz_v31) {
    return computeSharedOutputV31([a.quiz_v31.answers, b.quiz_v31.answers], [a.quiz_v31.constraints || {}, b.quiz_v31.constraints || {}]);
  }
  return computeSharedOutput(a, b);
}
