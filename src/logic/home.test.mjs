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

test('a user mid-journey with no plan resumes where they were', () => {
  const s = fresh();
  s.sessionA.screen = 's3';
  assert.equal(shouldShowHome(s), false);
});
