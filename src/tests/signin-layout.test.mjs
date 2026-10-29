// UI-only Google fixture. No Google credential or external auth request is made.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
const root = new URL('../../', import.meta.url).pathname;
test('Google-first layout, keyboard email reveal, retained input and code flow', async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'qa', '--outDir', 'dist-signin-layout', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_PHASE1: 'true', VITE_MILO_ACCOUNTS: 'true', VITE_GOOGLE_CLIENT_ID: 'layout-test-only' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  const server = await startPhase1LocalServer({ distDir: `${root}/dist-signin-layout`, accounts: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}) });
  const context = await browser.newContext({ viewport: { width: 420, height: 720 } });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.google = { accounts: { id: { initialize() {}, renderButton(slot, options) {
        window.layoutGoogleOptions = options;
        const button = document.createElement('button');
        button.textContent = 'G   Continue with Google';
        button.style.cssText = 'width:100%;height:44px;border:0;border-radius:24px;background:#131314;color:#fff;font:500 14px Arial';
        slot.append(button);
      } } } };
    });
    await page.goto(`${server.site}/app/?screen=you`);
    await page.locator('#miloYouLoginBtn').click();
    await page.locator('#miloGoogleSlot button').waitFor();
    assert.equal(await page.locator('.milo-login-headline').textContent(), 'Make yourself at home.');
    assert.equal(await page.evaluate(() => window.layoutGoogleOptions.theme), 'filled_black');
    assert.equal(await page.locator('#miloPhoneBtn-aarav').count(), 0);
    const reveal = page.locator('#miloEmailReveal-aarav');
    const form = page.locator('#miloEmailForm-aarav');
    assert.equal(await form.isVisible(), false);
    if (process.env.MILO_SCREENS) await page.screenshot({ path: `${process.env.MILO_SCREENS}/signin-collapsed.png` });
    await reveal.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#miloEmailReveal-aarav').getAttribute('aria-expanded'), 'true');
    await page.waitForFunction(() => document.activeElement?.id === 'miloEmailInput-aarav');
    await page.locator('#miloEmailInput-aarav').fill('layout@example.com');
    await page.locator('#miloEmailReveal-aarav').click();
    await form.waitFor({ state: 'hidden' });
    assert.equal(await form.isVisible(), false);
    await page.locator('#miloEmailReveal-aarav').click();
    await form.waitFor();
    assert.equal(await page.locator('#miloEmailInput-aarav').inputValue(), 'layout@example.com');
    if (process.env.MILO_SCREENS) await page.screenshot({ path: `${process.env.MILO_SCREENS}/signin-expanded.png` });
    await page.locator('#miloEmailSubmit-aarav').click();
    await page.locator('#miloCodeForm-aarav').waitFor();
    assert.equal(server.mail.at(-1).to, 'layout@example.com');
  } finally { await context.close(); await browser.close(); await server.close(); }
});
