// Gifting V1 across two real phones + the owner's ops page, flag ON, real API
// handler on in-memory PGlite. The server clock is moved forward to check the
// timed reveals (teaser the day before, sealed note at the start, memory card).
// Does NOT cover live Neon, Vercel, payments or real fulfilment.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
import { agreedPair, comeBack, phone } from './support/journey.mjs';
import { zonedToUtc } from '../../server/gifts.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-phase1/', import.meta.url));
let server, browser;
const errors = [];

before(async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-phase1', '--emptyOutDir', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_PHASE1: 'true' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  server = await startPhase1LocalServer({ distDir });
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
});
after(async () => { await browser?.close(); await server?.close(); });

const panelText = page => page.locator('.milo-gifts').textContent();
const waitPanel = (page, re) => page.waitForFunction(src => new RegExp(src).test(document.querySelector('.milo-gifts')?.textContent || ''), re.source);

test('gifts stay secret, reveal on time, and reach the ops list', async () => {
  const { a, b, timing } = await agreedPair({ site: server.site, browser, errors });
  const ops = await phone(browser, errors);
  try {
    // ---- A: a physical moment drop with a hint, a teaser, and a sealed note ----
    await a.page.locator('#miloGiftAdd-aarav').click();
    const sheet = a.page.locator('.milo-gift-sheet');
    await sheet.locator('[data-kind=moment_drop]').click();
    await sheet.locator('.milo-gift-item', { hasText: 'Hand-tied bouquet' }).click();
    await sheet.locator('select[name=stop_index]').selectOption('2');
    await sheet.locator('input[name=venue]').fill('Courtyard Cafe, Indiranagar');
    await sheet.locator('input[name=note]').fill('Happy Saturday');
    // Missing contact is caught before anything is sent.
    await sheet.locator('button[type=submit]').click();
    assert.match(await sheet.locator('.milo-gift-error').textContent(), /WhatsApp/);
    await sheet.locator('input[name=contact]').fill('+91 98765 43210');
    await sheet.locator('input[name=show_hint]').check();
    await sheet.locator('button[type=submit]').click();
    await sheet.waitFor({ state: 'detached' });
    await waitPanel(a.page, /Hand-tied bouquet[\s\S]*Sent to Milo/);

    await a.page.locator('#miloGiftAdd-aarav').click();
    await sheet.locator('[data-kind=teaser]').click();
    await sheet.locator('input[name=note]').fill('Wear something you can walk in.');
    await sheet.locator('button[type=submit]').click();
    await sheet.waitFor({ state: 'detached' });

    await a.page.locator('#miloGiftAdd-aarav').click();
    await sheet.locator('[data-kind=sealed_note]').click();
    await sheet.locator('textarea[name=note]').fill('Read this at dessert. I mean it.');
    await sheet.locator('select[name=stop_index]').selectOption('2');
    await sheet.locator('button[type=submit]').click();
    await sheet.waitFor({ state: 'detached' });
    await waitPanel(a.page, /A sealed note/);
    assert.equal(await a.page.locator('.milo-gift-row').count(), 3);

    // ---- B before the day: only the hint and "a sealed note is waiting" ----
    await comeBack(b.page);
    await waitPanel(b.page, /on its way to you/);
    let seen = await panelText(b.page);
    assert.match(seen, /Asha left you a sealed note/);
    for (const secret of ['bouquet', 'Courtyard', 'Happy Saturday', 'walk in', 'dessert. I mean', '98765']) {
      assert.ok(!seen.includes(secret), `recipient sees "${secret}" too early`);
    }

    // ---- The day before: the teaser opens ----
    server.setClock(zonedToUtc(timing.date, '00:00', timing.time_zone) - 86400000 + 60000);
    await comeBack(b.page);
    await waitPanel(b.page, /A teaser from Asha[\s\S]*Wear something you can walk in\./);
    assert.ok(!(await panelText(b.page)).includes('I mean it'));

    // ---- Night starts: the sealed note opens on tap; memory card opens ----
    server.setClock(zonedToUtc(timing.date, timing.time, timing.time_zone) + 60000);
    await comeBack(b.page);
    await b.page.locator('.milo-gift-open').waitFor();
    assert.match(await b.page.locator('[data-gift-sealed]').textContent(), /Best opened at dessert/);
    await b.page.locator('.milo-gift-open').click();
    assert.equal(await b.page.locator('.milo-gift-open').isVisible(), false);
    assert.equal(await b.page.locator('[data-gift-sealed] .milo-gift-note').textContent(), 'Read this at dessert. I mean it.');
    assert.ok(!(await panelText(b.page)).includes('bouquet'), 'the physical gift itself is never revealed in the app');

    await b.page.locator('#miloMemoryLine').fill('The walk back, obviously.');
    await b.page.locator('.milo-gift-memory button[type=submit]').click();
    await waitPanel(b.page, /Asha's line shows up once they add it/);
    await comeBack(a.page);
    await a.page.locator('#miloMemoryLine').fill('That dessert.');
    await a.page.locator('.milo-gift-memory button[type=submit]').click();
    await waitPanel(a.page, /You: That dessert\.[\s\S]*Ravi: The walk back, obviously\./);
    await comeBack(b.page);
    await waitPanel(b.page, /You: The walk back, obviously\.[\s\S]*Asha: That dessert\./);

    // ---- Ops: the owner sees the request and moves it along ----
    await ops.page.goto(`${server.site}/ops/`);
    await ops.page.locator('#opsKey').fill('not-the-key');
    await ops.page.locator('#opsLogin button').click();
    await ops.page.locator('.ops-error').waitFor();
    await ops.page.locator('#opsKey').fill(server.opsSecret);
    await ops.page.locator('#opsLogin button').click();
    const card = ops.page.locator('.ops-gift:not(.ops-booking)', { hasText: 'Hand-tied bouquet' });
    await card.waitFor();
    const text = await card.textContent();
    for (const detail of ['Asha', 'Ravi', 'Courtyard Cafe, Indiranagar', 'Happy Saturday', '+919876543210', 'Hint shown: yes']) assert.ok(text.includes(detail), `ops card missing ${detail}`);
    assert.equal(await ops.page.locator('.ops-gift:not(.ops-booking)').count(), 1, 'digital gifts are not in the ops list');
    await card.locator('select').selectOption('dispatched');
    await card.locator('.ops-status', { hasText: 'dispatched' }).waitFor();
    await comeBack(a.page);
    await waitPanel(a.page, /On its way/);
    assert.equal(await a.page.locator('.milo-gift-row', { hasText: 'Hand-tied bouquet' }).locator('.milo-gift-remove').count(), 0, 'a dispatched gift cannot be removed');
  } finally {
    await a.context.close(); await b.context.close(); await ops.context.close();
  }
});

test('no uncaught browser errors across the gifting journey', () => assert.deepEqual(errors, []));
