// Accounts v1 on a real phone against the local server: email code sign-in, the name
// step, the You tab reading the real account, and sign out. Google can't run here, so its
// button is only checked to be absent without a client id.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-accounts-links/', import.meta.url));
const SHOTS = process.env.MILO_SCREENS || null;
let server, browser;

before(async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-accounts-links', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_PHASE1: 'true', VITE_MILO_ACCOUNTS: 'true' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  server = await startPhase1LocalServer({ distDir, accounts: true });
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => { await browser?.close(); await server?.close(); });
const shot = async (page, name) => { if (SHOTS) { await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); } };

test('email code sign-in, name once, You shows the account, sign out', async () => {
  const context = await browser.newContext({ viewport: { width: 420, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(`${server.site}/app/?screen=you`);
    await page.locator('.milo-you').waitFor();
    assert.equal(await page.locator('#miloYouLoginBtn').textContent(), 'Sign in or create account');
    await page.locator('#miloYouLoginBtn').click();
    await page.locator('#miloEmailForm-aarav').waitFor();
    assert.equal(await page.locator('#miloPasswordInput-aarav').count(), 0, 'no password field');
    assert.equal(await page.locator('#miloGoogleSlot').count(), 0, 'no Google button without a client id');
    await shot(page, 'login-1-email');

    await page.locator('#miloEmailInput-aarav').fill('Asha@Example.com');
    await page.locator('#miloEmailSubmit-aarav').click();
    await page.locator('#miloCodeForm-aarav').waitFor();
    assert.match(await page.locator('.milo-login-subline').textContent(), /We sent a sign-in link and 6-digit code to Asha@Example\.com/);
    await shot(page, 'login-2-code');
    const code = server.mail.at(-1).code;
    assert.equal(server.mail.at(-1).to, 'asha@example.com');

    await page.locator('#miloCodeInput-aarav').fill(code === '000000' ? '111111' : '000000');
    await page.locator('#miloCodeSubmit-aarav').click();
    await page.locator('#miloAuthError-aarav:not([hidden])').waitFor();
    assert.match(await page.locator('#miloAuthError-aarav').textContent(), /That code didn't work/);

    await page.locator('#miloCodeInput-aarav').fill(code);
    await page.locator('#miloCodeSubmit-aarav').click();
    await page.locator('#miloNameForm-aarav').waitFor();
    assert.equal(await page.locator('.milo-login-headline').textContent(), 'What should Milo call you?');
    await shot(page, 'login-3-name');
    await page.locator('#miloAccountName-aarav').fill('Asha');
    await page.locator('#miloNameSubmit-aarav').click();

    await page.locator('.milo-you-account').waitFor();
    assert.equal(await page.locator('.milo-you-account h2').textContent(), 'Asha');
    assert.equal(await page.locator('.milo-you-account p').textContent(), 'asha@example.com · Signed in');
    const cookies = await context.cookies();
    const session = cookies.find(c => c.name === 'milo_session');
    assert.ok(session && session.httpOnly && session.path === '/api' && session.sameSite === 'Lax');
    assert.equal(await page.evaluate(() => document.cookie.includes('milo_session')), false, 'page scripts cannot read it');
    assert.ok(!(await page.evaluate(() => localStorage.getItem('milo_prototype_v1_state'))).includes(session.value), 'token never in storage');
    await shot(page, 'you-signed-in-real');

    // Still signed in after a fresh open.
    await page.goto(`${server.site}/app/?screen=you`);
    await page.locator('.milo-you-account').waitFor();
    await page.locator('#miloYouAccountManage').click();
    await page.locator('#miloYouSignOut').click();
    await page.locator('#miloYouLoginBtn').waitFor();
    assert.equal(await page.locator('#miloYouLoginBtn').textContent(), 'Sign in or create account');
    const after = await page.evaluate(() => fetch('/api/me', { credentials: 'same-origin' }).then(r => r.status));
    assert.equal(after, 401);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('emailed link: explicit confirm, URL cleared, name step then signed-in You', async () => {
  const context = await browser.newContext({ viewport: { width: 420, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${server.site}/app/?screen=login`);
    await page.locator('#miloEmailInput-aarav').fill('link-browser@example.com');
    await page.locator('#miloEmailSubmit-aarav').click();
    await page.locator('#miloCodeForm-aarav').waitFor();
    const link = server.mail.at(-1).link;
    await page.goto(link);
    await page.locator('#miloLinkContinue-aarav').waitFor();
    assert.equal(new URL(page.url()).hash, '');
    assert.equal((await context.cookies()).some(c => c.name === 'milo_session'), false, 'opening/previewing alone does not sign in');
    await shot(page, 'login-link-confirm');
    await page.locator('#miloLinkContinue-aarav').click();
    await page.locator('#miloNameForm-aarav').waitFor();
    await page.locator('#miloAccountName-aarav').fill('Link Person');
    await page.locator('#miloNameSubmit-aarav').click();
    await page.locator('.milo-you-account').waitFor();
    assert.equal(await page.locator('.milo-you-account h2').textContent(), 'Link Person');
    await shot(page, 'login-link-signed-in');
    await page.goto(link);
    await page.locator('#miloLinkContinue-aarav').click();
    await page.locator('#miloAuthError-aarav:not([hidden])').waitFor();
    assert.match(await page.locator('#miloAuthError-aarav').textContent(), /That code didn't work/);
  } finally { await context.close(); }
});
