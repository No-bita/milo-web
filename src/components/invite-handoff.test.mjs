import test from 'node:test';
import assert from 'node:assert/strict';
import { INVITE_MESSAGES, inviteText, renderInvitePreview, renderSender, preparedUrl } from './invite-handoff.js';
import { renderScreen04 } from '../screens/s4-invite-wait.js';
import { store } from '../domain/store.js';

const URL_A = 'https://www.aaryanshah.co.in/app/?invite=abcDEF123';

test('outgoing text is the approved message then the real URL on its own line', () => {
  assert.equal(inviteText('together', URL_A), `I've started a night for us on Milo. Add what feels like you, and we'll find something that fits us both.\n${URL_A}`);
  assert.equal(inviteText('solo', URL_A), `I've found a starting point for us. Add your picks on Milo so the night feels like both of us.\n${URL_A}`);
  for (const text of Object.values(INVITE_MESSAGES)) assert.doesNotMatch(text, /minute|Sent|Delivered|book/i);
});

test('preview shows an honest placeholder before preparation and the same URL after', () => {
  const before = renderInvitePreview('together', null, 'p');
  assert.match(before, /Your invitation/);
  assert.match(before, /is-placeholder/);
  assert.doesNotMatch(before, /https?:/);
  const after = renderInvitePreview('together', URL_A, 'p');
  assert.ok(after.includes(URL_A.replace(/&/g, '&amp;')));
  assert.ok(after.includes(INVITE_MESSAGES.together.replace(/'/g, '&#39;')) || after.includes(INVITE_MESSAGES.together));
});

test('rendering never creates an invite link', () => {
  store.reset();
  assert.equal(preparedUrl(), null);
  renderScreen04('aarav');
  assert.equal(store.getState().shared.serverInviteUrl ?? null, null);
  assert.equal(store.getState().shared.inviteToken ?? null, null);
});

test('sender: name with Edit when known, field when missing; names are escaped', () => {
  const known = renderSender({ label: "Who's asking", name: '<b>Asha</b>', inputId: 'n', editId: 'e' });
  assert.match(known, /&lt;b&gt;Asha&lt;\/b&gt;/);
  assert.doesNotMatch(known, /<b>Asha/);
  assert.match(known, /id="e"/);
  assert.match(known, /<label class="milo-name-field" hidden>/);
  const missing = renderSender({ label: 'Invite from', name: '   ', inputId: 'n', editId: 'e' });
  assert.match(missing, /milo-handoff-sender-row" hidden/);
  assert.match(missing, /<label class="milo-name-field" >/);
});

test('A screen: approved words, no recipient-name field, no illustration, actions off without a name', () => {
  store.reset();
  store.updateSession('aarav', { screen: 's4_invite', planningMode: 'together', name: '', partnerName: 'Ravi' });
  const html = renderScreen04('aarav');
  for (const words of ['A night shaped by both of you', "You've added your taste. Invite theirs, without showing your picks.",
    'Your picks', 'Added', 'Their picks', 'Not added yet', "Who's asking", 'Your invitation',
    'They make their own choices privately. Nothing is booked.', 'Share via WhatsApp', 'Copy invite link', 'No live delivery or notifications yet.']) {
    assert.ok(html.replace(/&#39;/g, "'").includes(words), words);
  }
  assert.doesNotMatch(html, /miloTheirName|Their name|toasting-glasses|Planning this together\?/);
  assert.match(html, /id="miloShareWhatsappBtn" disabled/);
  assert.match(html, /id="miloCopyLinkBtn" disabled/);
  assert.equal(store.getState().sessionA.partnerName, 'Ravi', 'known recipient name is kept');
});

test('A screen: their status comes from existing state only', () => {
  store.reset();
  store.updateSession('aarav', { screen: 's4_invite', planningMode: 'together', name: 'Asha' });
  store.updateShared({ partnerJoined: true });
  assert.match(renderScreen04('aarav'), /Joined\. Not added yet/);
  store.updateShared({ partnerFinished: true });
  assert.match(renderScreen04('aarav'), /<b class="is-added">Added<\/b><\/li>\s*<\/ul>/);
});
