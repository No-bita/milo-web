import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLogin } from '../screens/login.js';
import { store } from '../domain/store.js';

test('renderLogin renders accessible email form with future auth placeholders', () => {
  store.reset();
  const html = renderLogin('aarav');

  // Contains email input with accessibility attributes
  assert.match(html, /type="email"/);
  assert.match(html, /id="miloEmailInput-aarav"/);
  assert.match(html, /autocomplete="email"/);
  assert.match(html, /aria-describedby="miloEmailHint-aarav"/);
  assert.match(html, /aria-errormessage="miloEmailError-aarav"/);

  // Contains password input and toggle
  assert.match(html, /type="password"/);
  assert.match(html, /id="miloPasswordInput-aarav"/);
  assert.match(html, /id="miloPwdToggle-aarav"/);
  assert.match(html, /aria-label="Show password"/);

  // Contains primary CTA
  assert.match(html, /id="miloLoginSubmit-aarav"/);
  assert.match(html, /Sign in with email/);

  // Contains future Google and Phone options (disabled with Soon badge)
  assert.match(html, /id="miloGoogleBtn-aarav"[^>]*disabled/);
  assert.match(html, /id="miloPhoneBtn-aarav"[^>]*disabled/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /Continue with Phone/);
  assert.match(html, /class="milo-social-badge">Soon<\/span>/);
});

test('renderLogin pre-fills email when user already has an email stored', () => {
  store.reset();
  store.setSessionUser('aarav', { email: 'already@milo.app', loggedIn: true });
  const html = renderLogin('aarav');
  assert.match(html, /value="already@milo\.app"/);
});

test('store.setSessionUser updates user and preserves other session fields', () => {
  store.reset();
  store.setSessionUser('aarav', { email: 'partner@example.com', loggedIn: true });

  const state = store.getState();
  assert.equal(state.sessionA.user.email, 'partner@example.com');
  assert.equal(state.sessionA.user.loggedIn, true);
  assert.equal(state.sessionA.id, 'aarav');
});

test('renderLogin adapts copy when shown after plan is made', () => {
  store.reset();
  store.updateSession('aarav', { savedSoloNightId: 'middle-ground', loginReason: 'save_plan' });
  const html = renderLogin('aarav');

  assert.match(html, /Save tonight&#39;s plan\.|Save tonight's plan\./);
  assert.match(html, /Save plan &amp; sign in|Save plan & sign in/);
  // Signing up is mandatory: no skip button
  assert.doesNotMatch(html, /id="miloLoginSkip-aarav"/);
  assert.doesNotMatch(html, /Skip for now/);
});

test('renderLogin adapts copy for synthesis completion when user clicks Looks good', () => {
  store.reset();
  store.updateSession('aarav', { loginReason: 'synthesis', originScreen: 's3', returnScreen: 's6' });
  const html = renderLogin('aarav');

  assert.match(html, /Sign up to see your night\./);
  assert.match(html, /Sign up with email/);
  // Signing up is mandatory: no skip button
  assert.doesNotMatch(html, /id="miloLoginSkip-aarav"/);
  assert.doesNotMatch(html, /Skip for now/);
});



