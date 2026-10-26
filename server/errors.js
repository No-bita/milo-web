// Safe-error helpers shared by the Phase 1 handler and the gifting routes.
// Only SafeError codes ever reach a response body; never exception text.
export class SafeError extends Error {
  constructor(status, code) { super(code); this.status = status; }
}
export const fail = (status, code) => { throw new SafeError(status, code); };
export const valid = condition => { if (!condition) fail(400, 'invalid_request'); };
export function object(value) { valid(value && typeof value === 'object' && !Array.isArray(value)); return value; }
export function keys(value, allowed) { object(value); valid(Object.keys(value).every(key => allowed.includes(key))); }
