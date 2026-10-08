import test from 'node:test';
import assert from 'node:assert/strict';
import {createInvite, validateInvite, inviteFromParams, INVITE_LIFETIME_MS} from './invite.js';
const now = 1700000000000;
test('invite is valid before expiry and expired at the boundary', () => {
  const token = createInvite(now);
  assert.equal(validateInvite(token, now), 'valid');
  assert.equal(validateInvite(token, now + INVITE_LIFETIME_MS - 1), 'valid');
  assert.equal(validateInvite(token, now + INVITE_LIFETIME_MS), 'expired');
});
test('malformed and future-issued invitations are invalid', () => {
  for (const token of ['', '!!!', 'x'.repeat(513), createInvite(now + 300001)]) {
    assert.equal(validateInvite(token, now), 'invalid');
  }
});
test('partner routes reject wrong or repeated parameters', () => {
  assert.equal(inviteFromParams(new URLSearchParams()), null);
  for (const query of ['invite=bad', 'as=aarav&invite=bad', 'as=sneha&invite=a&invite=b', 'as=sneha&as=sneha&invite=a']) {
    assert.equal(inviteFromParams(new URLSearchParams(query)), 'invalid');
  }
});
