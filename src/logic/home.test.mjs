import test from 'node:test';
import assert from 'node:assert/strict';
import { homeSummary, shouldShowHome } from './home.js';
import { INITIAL_STATE } from '../domain/store.js';

const fresh = () => structuredClone(INITIAL_STATE);

test('fresh user has no plan and sees the homepage', () => {
  const s = fresh();
  assert.equal(homeSummary(s).kind, 'fresh');
  assert.equal(shouldShowHome(s), true);
});

test('saved solo draft shows as a draft', () => {
  const s = fresh();
  s.sessionA.savedSoloNightId = 'middle-ground';
  const h = homeSummary(s);
  assert.equal(h.kind, 'draft');
  assert.equal(h.planName, 'The Middle Ground');
  assert.equal(h.action, 'open-plan');
});

test('sent invite without a plan waits on the partner', () => {
  const s = fresh();
  s.shared.inviteSent = true;
  assert.equal(homeSummary(s).kind, 'waiting');
  assert.equal(homeSummary(s).action, 'open-waiting');
});

test('confirmed night wins over a draft', () => {
  const s = fresh();
  s.sessionA.savedSoloNightId = 'middle-ground';
  s.shared.confirmedNightId = 'middle-ground';
  assert.equal(homeSummary(s).kind, 'confirmed');
});

test('a user mid-journey still opens Home, with a resume card for the saved step', () => {
  const s = fresh();
  s.sessionA.screen = 's3';
  s.sessionA.reactions = [{ cardId: 'tiny-bar', reaction: 'into_it' }];
  s.sessionA.pausedScreen = 's3';
  assert.equal(shouldShowHome(s), true);
  const h = homeSummary(s);
  assert.equal(h.kind, 'in-progress');
  assert.equal(h.ratedCount, 1);
  assert.equal(h.resumeStep, 's3');
});

test('server plan: partner finished switches the card to the plan screen, even after copy-link only', () => {
  const s = fresh();
  s.shared.serverInviteUrl = 'https://example.test/app/?invite=x';
  s.shared.partnerFinished = true;
  const h = homeSummary(s);
  assert.equal(h.kind, 'together');
  assert.equal(h.action, 'open-plan');
  assert.equal(h.nightId, null);
});

test('server plan: a partner suggestion opens on the suggested night', () => {
  const s = fresh();
  s.shared.inviteSent = true;
  s.shared.serverResult = { selectedNights: [] };
  s.shared.suggestion = { by: 'sneha', nightId: 'middle-ground' };
  const h = homeSummary(s);
  assert.equal(h.kind, 'together');
  assert.equal(h.nightId, 'middle-ground');
  assert.match(h.planStatus, /picked a night/);
});

test('demo suggestion without a server result keeps the waiting card', () => {
  const s = fresh();
  s.shared.inviteSent = true;
  s.shared.suggestion = { by: 'aarav', nightId: 'middle-ground' };
  assert.equal(homeSummary(s).kind, 'waiting');
});

test('a local-only plan ignores server fields', () => {
  const s = fresh();
  s.sessionA.localOnlyPlan = true;
  s.shared.inviteSent = true;
  s.shared.partnerFinished = true;
  assert.equal(homeSummary(s).kind, 'fresh');
});

test('server plan: a copied (not shared) invite link shows the waiting card, not Resume', () => {
  const s = fresh();
  s.sessionA.reactions = Array.from({ length: 8 }, (_, i) => ({ cardId: `c${i}`, reaction: 'into_it' }));
  s.shared.serverInviteUrl = 'https://example.test/app/?invite=x';
  const h = homeSummary(s);
  assert.equal(h.kind, 'waiting');
  assert.equal(h.action, 'open-waiting');
});
