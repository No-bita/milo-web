import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
let server, browser;
const origin = 'http://127.0.0.1:4180';
const key = 'milo_prototype_v1_state';
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4180', '--strictPort']);
  let ready = false;
  for (let n = 0; n < 100; n++) { try { ready = (await fetch(origin)).ok; } catch {} if (ready) break; await new Promise(r => setTimeout(r, 100)); }
  assert.ok(ready);
  browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
});
after(async () => { await browser?.close(); server?.kill(); });
const state = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
for (const width of [320, 420, 1024]) {
  test(`Plan choices overlay, dismissal and both continuations (${width})`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { localStorage.setItem('milo_intro_seen_v1', '1'); window.open = () => { throw Error('No external invite expected'); }; });
    const page = await context.newPage(); page.setDefaultTimeout(6000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(origin); await page.locator('.milo-home').waitFor();
      const initial = await state(page);
      const plan = page.locator('[data-tab=plan]');
      for (const dismiss of ['close', 'escape', 'backdrop', 'back']) {
        await plan.click();
        const dialog = page.locator('.milo-planning-sheet'); await dialog.waitFor();
        assert.equal((await state(page)).sessionA.screen, 'home');
        assert.equal(await page.locator('[data-planning-mode=solo]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-planning-mode=together]').click();
        assert.deepEqual(await state(page), initial, 'Selecting without Continue must not mutate state');
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 845);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
        if (dismiss === 'close') await page.getByRole('button', { name: 'Close planning choices' }).click();
        if (dismiss === 'escape') await page.keyboard.press('Escape');
        if (dismiss === 'backdrop') await page.mouse.click(box.x + 5, box.y - 5);
        if (dismiss === 'back') await page.goBack();
        await dialog.waitFor({ state: 'detached' });
        await page.waitForFunction(() => history.state.miloJourney.kind === 'route');
        assert.deepEqual(await state(page), initial);
        assert.equal(await plan.evaluate(el => el === document.activeElement), true);
      }
      for (const mode of ['solo', 'together']) {
        await plan.click(); await page.locator(`[data-planning-mode=${mode}]`).click();
        if (process.env.MILO_EVIDENCE_DIR) {
          await mkdir(process.env.MILO_EVIDENCE_DIR, { recursive: true });
          await page.screenshot({ path: `${process.env.MILO_EVIDENCE_DIR}/planning-${mode}-${width}.png` });
        }
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.locator('.milo-s1-container').waitFor();
        assert.equal((await state(page)).sessionA.planningMode, mode);
        assert.deepEqual((await state(page)).shared, initial.shared);
        if (!(await state(page)).sessionA.intents.includes('intimate')) await page.locator('[data-intent-id=intimate]').click();
        await page.locator('#miloCta-aarav').click(); await page.locator('.milo-s2-container').waitFor();
        assert.equal(await page.locator('.milo-path-container').count(), 0, 'No redundant pre-deck fork');
        await page.goBack(); await page.locator('.milo-s1-container').waitFor();
        await page.goBack(); await page.locator('.milo-home').waitFor();
        assert.equal(await page.locator('dialog').count(), 0);
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}
test('legacy planning fork link opens choices over Home', async () => {
  const page = await browser.newPage();
  try { await page.goto(origin + '?screen=planning_path'); await page.locator('.milo-planning-sheet').waitFor(); assert.equal(await page.locator('.milo-home').count(), 1); assert.equal(await page.locator('.milo-path-container').count(), 0); } finally { await page.close(); }
});

test('saved legacy fork with confirmed night opens choices without losing agreement', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin + '?golden=1&screen=closed');
    const saved = await state(page);
    await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.sessionA.screen = 'planning_path'; localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('milo_intro_seen_v1', '1'); }, key);
    await page.goto(origin);
    await page.locator('.milo-planning-sheet').waitFor();
    assert.equal(await page.locator('.milo-home').count(), 1);
    assert.deepEqual((await state(page)).shared, saved.shared);
    await page.getByRole('button', { name: 'Close planning choices' }).click();
    await page.locator('dialog').waitFor({ state: 'detached' });
    assert.deepEqual((await state(page)).shared, saved.shared);
  } finally { await page.close(); }
});
