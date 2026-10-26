import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const site = 'http://127.0.0.1:4186';
const origin = site + '/app/';
let browser, server;

before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort']);
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      ready = (await fetch(site)).ok;
    } catch {}
    if (ready) break;
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(ready, 'Preview server failed to start');
  browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

test('Email login screen renders editorial branding, accessible form, and placeholders', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));

  try {
    await p.goto(origin + '?screen=login');
    await p.locator('.milo-login-container').waitFor();

    // Check header and typography
    assert.equal(await p.locator('.milo-wordmark').textContent(), 'milo.');
    assert.equal(await p.locator('.milo-login-headline').textContent(), 'Welcome to Milo.');
    assert.match(await p.locator('.milo-login-subline').textContent(), /Sign in to save your date nights/);

    // Form inputs and labels
    const emailInput = p.locator('#miloEmailInput-aarav');
    const passwordInput = p.locator('#miloPasswordInput-aarav');
    const submitBtn = p.locator('#miloLoginSubmit-aarav');
    const pwdToggle = p.locator('#miloPwdToggle-aarav');

    assert.equal(await emailInput.getAttribute('type'), 'email');
    assert.equal(await emailInput.getAttribute('autocomplete'), 'email');
    assert.equal(await passwordInput.getAttribute('type'), 'password');
    assert.equal(await passwordInput.getAttribute('autocomplete'), 'current-password');

    // Password visibility toggle test
    assert.equal(await pwdToggle.getAttribute('aria-pressed'), 'false');
    await pwdToggle.click();
    assert.equal(await passwordInput.getAttribute('type'), 'text');
    assert.equal(await pwdToggle.getAttribute('aria-pressed'), 'true');
    await pwdToggle.click();
    assert.equal(await passwordInput.getAttribute('type'), 'password');
    assert.equal(await pwdToggle.getAttribute('aria-pressed'), 'false');

    // Placeholders for Google and Phone auth
    const googleBtn = p.locator('#miloGoogleBtn-aarav');
    const phoneBtn = p.locator('#miloPhoneBtn-aarav');
    assert.equal(await googleBtn.isDisabled(), true);
    assert.equal(await phoneBtn.isDisabled(), true);
    assert.match(await googleBtn.textContent(), /Continue with Google[\s\S]*Soon/);
    assert.match(await phoneBtn.textContent(), /Continue with Phone[\s\S]*Soon/);

    // Form submission validation
    await emailInput.fill('invalid-email');
    await submitBtn.click();
    assert.equal(await emailInput.getAttribute('aria-invalid'), 'true');

    // Enter valid email and password, submit
    await emailInput.fill('aarav@example.com');
    await passwordInput.fill('supersecret');
    await submitBtn.click();

    // Should redirect to 'you' tab with account details updated
    await p.locator('.milo-tabscreen').waitFor();
    assert.equal(await p.locator('h1.milo-home-headline').textContent(), 'You');
    assert.match(await p.locator('.milo-home-row b').first().textContent(), /aarav@example\.com/);

    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('Navigation from You tab opens login screen and Back returns to You', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    await p.goto(origin + '?screen=you');
    await p.locator('.milo-tabscreen').waitFor();
    assert.equal(await p.locator('h1.milo-home-headline').textContent(), 'You');

    const accountLink = p.locator('#miloYouLoginBtn');
    await accountLink.waitFor();
    await accountLink.click();

    await p.locator('.milo-login-container').waitFor();
    assert.equal(await p.locator('.milo-login-headline').textContent(), 'Welcome to Milo.');

    // Back button returns to 'you'
    const backBtn = p.locator('#miloLoginBack-aarav');
    await backBtn.click();
    await p.locator('.milo-tabscreen').waitFor();
    assert.equal(await p.locator('h1.milo-home-headline').textContent(), 'You');
  } finally {
    await context.close();
  }
});

test('Login is not shown upfront; planning starts immediately with zero-friction discovery', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    // Open planner directly
    await p.goto(origin + '?screen=s1');
    await p.locator('.milo-s1-container').waitFor();

    // Mood picker is directly accessible without any login wall upfront
    assert.equal(await p.locator('h1').textContent(), 'How do you want tonight to feel?');
    assert.equal(await p.locator('.milo-login-container').count(), 0);
  } finally {
    await context.close();
  }
});

test('Email login screen is shown after the plan is made; signup is mandatory', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    // Set up a state where user has created a solo plan and is at the timing step
    await p.addInitScript(() => {
      const state = {
        sessionA: {
          id: 'aarav',
          screen: 's7',
          planningMode: 'solo',
          intents: ['intimate', 'fun', 'novelty'],
          reactions: [{ cardId: 'courtyard-dinner', reaction: 'into_it' }],
          activeNightId: 'middle-ground',
          savedSoloNightId: 'middle-ground',
          soloTimingStep: 'middle-ground',
          soloTimings: {
            'middle-ground': { nightId: 'middle-ground', date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), time: '19:30', timeZone: 'Asia/Kolkata' }
          }
        },
        sessionB: { id: 'sneha', screen: 's0', intents: [], reactions: [] },
        shared: { inviteSent: false, confirmedNightId: null }
      };
      localStorage.setItem('milo_prototype_v1_state', JSON.stringify(state));
    });

    await p.goto(origin + '?screen=s7');
    await p.locator('.milo-closing-state').waitFor();

    // Wait for the timing view with its "Continue" CTA
    const sealBtn = p.locator('#miloSoloContinue');
    await sealBtn.waitFor();
    await sealBtn.click();

    // The plan is now made! Because user is not logged in, login screen is shown to save the plan
    await p.locator('.milo-login-container').waitFor();
    assert.equal(await p.locator('.milo-login-headline').textContent(), "Save tonight's plan.");
    assert.match(await p.locator('.milo-login-subline').textContent(), /Sign in with your email to keep your date night saved/);
    assert.equal(await p.locator('#miloLoginSubmit-aarav').textContent().then(t => t.trim()), 'Save plan & sign in');

    // Skip button is deleted - signing up is mandatory
    assert.equal(await p.locator('#miloLoginSkip-aarav').count(), 0);

    // Fill in email and sign in to save plan
    await p.locator('#miloEmailInput-aarav').fill('dateplanner@example.com');
    await p.locator('#miloPasswordInput-aarav').fill('password123');
    await p.locator('#miloLoginSubmit-aarav').click();

    // Transition back to post-plan view
    await p.locator('#viewport-aarav').waitFor();
  } finally {
    await context.close();
  }
});

test('Confirmed shared night shows Save Plan banner if not logged in, opening login screen', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    // Navigate to confirmed shared night
    await p.goto(origin + '?golden=1&screen=closed');
    await p.locator('.milo-closing-state').waitFor();

    // Confirm that the save-plan-to-account banner is visible
    const savePlanBtn = p.locator('#miloClosingSignIn-aarav');
    await savePlanBtn.waitFor();
    assert.match(await p.locator('.milo-closing-signin-banner').textContent(), /Save this plan to your account/);

    await savePlanBtn.click();
    await p.locator('.milo-login-container').waitFor();
    assert.equal(await p.locator('.milo-login-headline').textContent(), "Save tonight's plan.");

    // Back returns to the closing plan screen
    await p.locator('#miloLoginBack-aarav').click();
    await p.locator('.milo-closing-state').waitFor();
  } finally {
    await context.close();
  }
});

test('Right after S3 personal synthesis, clicking Looks good prompts user to sign up', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    // Open S3 synthesis screen ("We're getting a feel for your night.")
    await p.goto(origin + '?golden=1&screen=s3');
    await p.locator('.milo-s3-container').waitFor();

    // Verify S3 header and buttons
    assert.match(await p.locator('.milo-headline').textContent(), /getting a feel/);
    const looksGoodBtn = p.locator('#miloS3Cta-aarav');
    await looksGoodBtn.waitFor();
    assert.equal(await looksGoodBtn.textContent(), 'Looks good');

    // Click "Looks good"
    await looksGoodBtn.click();

    // Sign up screen should be presented immediately
    await p.locator('.milo-login-container').waitFor();
    assert.equal(await p.locator('.milo-login-headline').textContent(), 'Sign up to see your night.');
    assert.match(await p.locator('.milo-login-subline').textContent(), /Sign up to save what we just learned/);
    assert.equal(await p.locator('#miloLoginSubmit-aarav').textContent().then(t => t.trim()), 'Sign up with email');

    // Back button returns user back to S3 synthesis
    await p.locator('#miloLoginBack-aarav').click();
    await p.locator('.milo-s3-container').waitFor();
    assert.match(await p.locator('.milo-headline').textContent(), /getting a feel/);

    // Click "Looks good" again and verify signing up is mandatory (no skip button)
    await p.locator('#miloS3Cta-aarav').click();
    await p.locator('.milo-login-container').waitFor();
    assert.equal(await p.locator('#miloLoginSkip-aarav').count(), 0);

    // Fill in credentials and sign up to proceed to curated nights
    await p.locator('#miloEmailInput-aarav').fill('synthesis_user@example.com');
    await p.locator('#miloPasswordInput-aarav').fill('password123');
    await p.locator('#miloLoginSubmit-aarav').click();

    // Navigates to curated nights / next step
    await p.locator('.milo-s6-container, .milo-path-container, #viewport-aarav').first().waitFor();
  } finally {
    await context.close();
  }
});

test('Homepage removes Good evening, Your night, and Bring your person in sections, keeping plan and occasions', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);

  try {
    await p.goto(origin + '?screen=home', { waitUntil: 'domcontentloaded' });
    await p.locator('.milo-home').waitFor();

    // Verify greeting and headline are deleted
    assert.equal(await p.locator('.milo-home-greet').count(), 0);
    assert.equal(await p.locator('.milo-home-headline').count(), 0);

    // Verify "Bring your person in" / "Invite your person" row is deleted
    assert.equal(await p.locator('.milo-home-row').count(), 0);

    // Verify occasions grid is present on homepage
    assert.equal(await p.locator('.milo-plan-card-grid').count(), 1);
    assert.equal(await p.locator('.milo-plan-card').count(), 6);
  } finally {
    await context.close();
  }
});


