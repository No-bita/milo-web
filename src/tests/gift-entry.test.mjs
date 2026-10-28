// Gifting entry points: findable from the agreed plan, the booking step and Home,
// for Together plans and (physical gifts only) for solo plans. Flag-on build,
// real API handler on in-memory PGlite. No real messaging or payments.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
import { phone, state, agreedPair } from './support/journey.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-phase1/', import.meta.url));
const SHOTS = process.env.MILO_SCREENS || null;
let server, browser;
const errors = [];

before(async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-phase1', '--emptyOutDir', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_PHASE1: 'true' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  server = await startPhase1LocalServer({ distDir });
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => { await browser?.close(); await server?.close(); assert.deepEqual(errors, []); });

const shot = async (page, name) => { if (SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
const kinds = page => page.locator('.milo-gift-sheet .milo-gift-kind .milo-gift-title').allTextContents();

async function soloToBookingStep(p) {
  await p.goto(`${server.site}/app/`);
  await p.locator('.milo-first-open').click();
  await p.locator('.milo-home-occ-1').click();
  for (const id of ['intimate', 'fun', 'novelty']) await p.locator(`[data-intent-id=${id}]`).click();
  await p.locator('#miloCta-aarav').click();
  await p.locator('.milo-threshold-container').click();
  for (let i = 0; i < 8; i++) {
    const n = (await state(p)).sessionA.reactions.length;
    await p.locator('#btnIntoIt-aarav').click();
    await p.waitForFunction(n => JSON.parse(localStorage.getItem('milo_prototype_v1_state')).sessionA.reactions.length > n, n);
  }
  await p.locator('#miloS3Cta-aarav').click();
  await p.locator('#miloEmailInput-aarav').fill('asha@example.com');
  await p.locator('#miloPasswordInput-aarav').fill('local-only');
  await p.locator('#miloLoginSubmit-aarav').click();
  await p.locator('[data-open-night]').first().click();
  await p.locator('#miloSoloSave').click();
  await p.locator('.milo-strip-day').last().click();
  await p.locator('.milo-clock-num', { hasText: /^7$/ }).click();
  await p.locator('.milo-clock-num', { hasText: /^30$/ }).click();
  await p.locator('.milo-timing-form button[type=submit]').click();
  await p.locator('#miloSoloContinue').click();
  await p.locator('#miloBookedBook').click();
  await p.locator('#miloReqNote').waitFor();
}

test('solo: "Add a surprise" in the booking step opens the sheet right after booking, physical gifts only', async () => {
  const a = await phone(browser, errors);
  try {
    const p = a.page;
    await soloToBookingStep(p);
    await p.locator('.milo-choice-pill', { hasText: '₹4,000 - 7,000' }).click();
    await p.locator('input[name=contact]').fill('+91 98765 43210');
    assert.equal(await p.locator('#miloReqSurpriseGift').isChecked(), false, 'off unless chosen');
    await p.locator('label', { has: p.locator('#miloReqSurpriseGift') }).click();
    await shot(p, 'gift-solo-booking-step');
    await p.locator('#miloReqBook').click();
    // The request lands, then the sheet opens over "Sealed.".
    const sheet = p.locator('dialog.milo-gift-sheet');
    await sheet.waitFor();
    assert.equal(await sheet.getAttribute('aria-label'), 'Add a surprise');
    assert.equal(await p.locator('.milo-booked-title').textContent(), 'Sealed.');
    assert.deepEqual(await kinds(p), ['Waiting at the table', 'Delivered to them'], 'no notes or teasers for solo');
    await shot(p, 'gift-solo-sheet');
    await p.locator('.milo-gift-kind', { hasText: 'Waiting at the table' }).click();
    assert.equal(await p.locator('input[name=show_hint]').count(), 0, 'no hint for someone who has no Milo screen');
    await p.locator('label.milo-gift-item', { hasText: 'Hand-tied bouquet' }).click();
    // No venue question, and no second WhatsApp: the booking just saved the number.
    assert.equal(await p.locator('input[name=venue]').count(), 0);
    assert.equal(await p.locator('.milo-gift-contact').isVisible(), false);
    await p.locator('.milo-gift-form [type=submit]').click();
    await sheet.waitFor({ state: 'detached' });
    // Listed on the booked screen with its status; the sheet does not reopen on its own.
    await p.locator('#miloBookedGifts .milo-gift-row').waitFor();
    assert.match(await p.locator('#miloBookedGifts').textContent(), /Hand-tied bouquet[\s\S]*Sent to Milo/);
    assert.equal(await p.locator('#miloGiftAdd-aarav').count(), 0, 'list only on this screen');
    await p.reload();
    await p.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    // Home: the plan card carries the entry.
    await p.locator('#miloHomeSurprise').waitFor();
    assert.equal(await p.locator('dialog.milo-gift-sheet').count(), 0);
    assert.match(await p.locator('#miloHomeSurprise').textContent(), /Add a surprise/);
    await shot(p, 'gift-home-card-solo');
    await p.locator('#miloHomeSurprise').click();
    await sheet.waitFor();
    assert.deepEqual(await kinds(p), ['Waiting at the table', 'Delivered to them']);
    await p.keyboard.press('Escape');
    await sheet.waitFor({ state: 'detached' });
  } finally { await a.context.close(); }
});

test('solo: without the box ticked, booking opens no sheet', async () => {
  const a = await phone(browser, errors);
  try {
    const p = a.page;
    await soloToBookingStep(p);
    await p.locator('.milo-choice-pill', { hasText: '₹2,000 - 4,000' }).click();
    await p.locator('input[name=contact]').fill('+91 98765 43210');
    await p.locator('#miloReqBook').click();
    await p.waitForFunction(() => document.querySelector('.milo-booked-title')?.textContent === 'Sealed.');
    await p.waitForTimeout(500);
    assert.equal(await p.locator('dialog.milo-gift-sheet').count(), 0);
  } finally { await a.context.close(); }
});

test('Together: surprises sit above the itinerary, the booking sheet offers one, and Home links to it', async () => {
  const { a, b } = await agreedPair({ site: server.site, browser, errors });
  try {
    const p = a.page;
    await p.locator('#miloGiftAdd-aarav').waitFor();
    assert.equal(await p.locator('#miloGiftAdd-aarav').textContent(), 'Add a surprise');
    const above = await p.evaluate(() => Boolean(document.querySelector('.milo-gifts').compareDocumentPosition(document.querySelector('.milo-closing-plan')) & Node.DOCUMENT_POSITION_FOLLOWING));
    assert.equal(above, true, 'gifts come before the itinerary');
    await shot(p, 'gift-together-agreed');
    // Booking sheet: tick "Add a surprise", send, and the gift sheet follows.
    await p.locator('#miloBookingOpen-aarav').click();
    const booking = p.locator('dialog.milo-concierge-sheet');
    await booking.waitFor();
    await booking.locator('.milo-choice-pill', { hasText: '₹2,000 - 4,000' }).click();
    await booking.locator('input[name=contact]').fill('+91 98765 43210');
    await booking.locator('label', { has: p.locator('input[name=add_surprise]') }).click();
    await booking.locator('[type=submit]').click();
    await booking.waitFor({ state: 'detached' });
    await p.locator('dialog.milo-gift-sheet').waitFor();
    assert.deepEqual(await kinds(p), ['Waiting at the table', 'Delivered to them', 'A sealed note', 'A teaser']);
    await p.keyboard.press('Escape');
    // Home: the agreed plan card carries the entry.
    await p.goto(`${server.site}/app/`);
    await p.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    await p.locator('#miloHomeSurprise').waitFor();
    await shot(p, 'gift-home-card-together');
    await p.locator('#miloHomeSurprise').click();
    await p.locator('dialog.milo-gift-sheet').waitFor();
    assert.equal((await kinds(p)).length, 4);
  } finally { await a.context.close(); await b.context.close(); }
});
