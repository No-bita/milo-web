// Solo journey with the Phase 1 flag ON: one planner hands the night to Milo,
// ops books it, the partner opens the shared link, the planner checks in.
// Real UI, real API handler, in-memory PGlite, moved server clock.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
import { phone, state } from './support/journey.mjs';
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

const comeBack = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));
const waitText = (page, sel, re) => page.waitForFunction(({ sel, src }) => new RegExp(src).test(document.querySelector(sel)?.textContent || ''), { sel, src: re.source });

test('solo: pick a time for real, hand it to Milo, ops books it, partner sees the shared plan', async () => {
  const a = await phone(browser, errors);
  const b = await phone(browser, errors);
  const ops = await phone(browser, errors);
  try {
    const p = a.page;
    await p.goto(`${server.site}/app/`);
    await p.locator('.milo-first-open').click();
    await p.locator('.milo-home-occ-1').click();
    // Mood button: playful countdown, disabled until three.
    const cta = p.locator('#miloCta-aarav');
    const label = async () => (await cta.textContent()).trim();
    assert.equal(await label(), "What's the vibe?"); assert.equal(await cta.isDisabled(), true);
    await p.locator('[data-intent-id=intimate]').click(); assert.equal(await label(), 'Ooh. Two more.');
    await p.locator('[data-intent-id=fun]').click(); assert.equal(await label(), 'Last one, make it count');
    await p.locator('[data-intent-id=novelty]').click(); assert.equal(await label(), 'Show me what fits →'); assert.equal(await cta.isDisabled(), false);
    await cta.click();
    await p.locator('.milo-threshold-container').click();
    for (let i = 0; i < 8; i++) {
      const before = (await state(p)).sessionA.reactions.length;
      await p.locator('#btnIntoIt-aarav').click();
      await p.waitForFunction(n => JSON.parse(localStorage.getItem('milo_prototype_v1_state')).sessionA.reactions.length > n, before);
    }
    await p.locator('#miloS3Cta-aarav').click();
    await p.locator('#miloEmailInput-aarav').fill('asha@example.com');
    await p.locator('#miloPasswordInput-aarav').fill('local-only');
    await p.locator('#miloLoginSubmit-aarav').click();

    // Three nights, shaped by you: the bring-in is a card under the nights.
    await p.locator('.milo-bring-card').waitFor();
    assert.match(await p.locator('.milo-bring-card').textContent(), /Planning this with someone\?[\s\S]*They pick privately, Milo finds the overlap/);
    await p.locator('[data-open-night]').first().click();
    await p.locator('#miloSoloSave').click();

    // Date & time: nothing pre-selected; "Set the time" waits for a real choice.
    await p.locator('.milo-timing-form').waitFor();
    assert.equal(await p.locator('.milo-strip-day[aria-checked=true]').count(), 0, 'no day pre-selected');
    assert.equal(await p.locator('.milo-clock-part[data-part=hour]').textContent(), '--', 'no hour pre-selected');
    assert.equal(await p.locator('.milo-timing-form button[type=submit]').isDisabled(), true);
    await p.locator('.milo-strip-day').last().click();
    assert.equal(await p.locator('.milo-timing-form button[type=submit]').isDisabled(), true, 'a day alone is not enough');
    await p.locator('.milo-clock-num', { hasText: /^7$/ }).click();
    await p.locator('.milo-clock-num', { hasText: /^30$/ }).click();
    await p.locator('.milo-timing-form button[type=submit]').click();
    await p.locator('#miloSoloContinue').click();

    // One seal only: this screen is "Your night is set", not "Sealed".
    await waitText(p, '.milo-booked-title', /^Your night is set\.$/);
    assert.match(await p.locator('#miloBookedBook').textContent(), /Let Milo book it/);
    await p.locator('#miloBookedBook').click();

    // Booking step: requests, surprise toggle, and what Milo needs to book.
    await p.locator('#miloReqNote').fill('Window seat if possible.');
    const line = p.locator('#miloReqSurpriseLine');
    assert.match(await line.textContent(), /Only Milo sees these/);
    await p.locator('.milo-req-toggle').click();
    assert.match(await line.textContent(), /will see these on the plan you share/);
    await p.locator('#miloReqBook').click();
    assert.match(await p.locator('#miloReqError').textContent(), /budget/);
    await p.locator('.milo-choice-pill', { hasText: '₹4,000 - 7,000' }).click();
    await p.locator('.milo-choice-pill', { hasText: '4 hours' }).click();
    await p.locator('input[name=contact]').fill('+91 98765 43210');
    await p.locator('#miloReqBook').click();

    // The single "Sealed." screen: Done + Share, real status.
    await waitText(p, '.milo-booked-title', /^Sealed\.$/);
    await waitText(p, '.milo-booked-sub', /Milo is on it/);
    await waitText(p, '.milo-booked-ref', /We're booking every stop/);
    assert.match(await p.locator('.milo-booked-private').textContent(), /WILL SEE THESE[\s\S]*Window seat/);
    assert.equal(await p.locator('#miloBookedDone').count(), 1);
    assert.equal(await p.locator('#miloBookedShare').count(), 1);

    // Ops: a SOLO booking with the requests and the not-a-secret flag.
    await ops.page.goto(`${server.site}/ops/`);
    await ops.page.locator('#opsKey').fill(server.opsSecret);
    await ops.page.locator('#opsLogin button').click();
    const card = ops.page.locator('.ops-booking');
    await card.waitFor();
    const opsText = await card.textContent();
    for (const detail of ['SOLO', 'partner is not on Milo', 'Not a secret', 'Window seat if possible.', '₹4,000 - 7,000', '+919876543210']) assert.ok(opsText.includes(detail), `ops card missing ${detail}`);
    await card.locator('.ops-venue').first().locator('[data-f=venue]').fill('Clay Station');
    await card.locator('.ops-venue').first().locator('[data-f=area]').fill('Indiranagar');
    await card.locator('.ops-venue').first().locator('[data-f=time]').fill('19:30');
    await card.locator('[data-f=status]').selectOption('booked');
    await card.locator('[data-save]').click();
    await card.locator('.ops-status', { hasText: 'booked' }).waitFor();

    await comeBack(p);
    await waitText(p, '.milo-booked-ref', /^Booked\./);
    assert.match(await p.locator('.milo-booked-card').textContent(), /Clay Station, Indiranagar/);

    // Share: a read-only Milo link, not plain text.
    await p.locator('#miloBookedShare').click();
    const opened = await p.evaluate(() => window.__opened.at(-1));
    const text = decodeURIComponent(new URL(opened).searchParams.get('text'));
    const link = text.match(/https?:\/\/\S+\?shared=[A-Za-z0-9_-]{22}/)[0];
    await b.page.goto(link);
    await waitText(b.page, '.milo-booked-title', /planned a night for you/);
    const shared = await b.page.locator('.milo-shared-plan').textContent();
    assert.match(shared, /Booked\./); assert.match(shared, /Clay Station, Indiranagar/); assert.match(shared, /Window seat if possible\./);
    assert.ok(!shared.includes('98765') && !shared.includes('4,000'), 'no contact or budget on the shared link');

    // Done goes Home, where the card reflects the booking.
    await p.locator('#miloBookedDone').click();
    await waitText(p, '.milo-home-card', /YOUR NIGHT[\s\S]*Booked/);

    // Next morning: the planner's check-in is on the Sealed screen.
    const t = (await state(p)).sessionA.soloTimings[(await state(p)).sessionA.savedSoloNightId];
    server.setClock(zonedToUtc(new Date(Date.parse(`${t.date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10), '09:10', 'Asia/Kolkata'));
    await p.locator('#miloHomeOpen').click();
    await comeBack(p);
    await p.locator('#miloSoloCheckin').click();
    const s = p.locator('.milo-concierge-sheet');
    await s.locator('fieldset', { hasText: 'differently' }).locator('.milo-choice-pill', { hasText: 'No' }).click();
    await s.locator('fieldset', { hasText: 'Rate the night' }).locator('.milo-choice-pill', { hasText: '5' }).click();
    await s.locator('fieldset', { hasText: 'use Milo again' }).locator('.milo-choice-pill', { hasText: 'Yes' }).click();
    await s.locator('fieldset', { hasText: 'recommend' }).locator('.milo-choice-pill', { hasText: 'Yes' }).click();
    await s.locator('fieldset', { hasText: 'paid Milo' }).locator('.milo-choice-pill', { hasText: '₹500 - 1,000' }).click();
    await s.locator('button[type=submit]').click();
    await s.waitFor({ state: 'detached' });
    await waitText(p, '.milo-booked', /Thanks for telling us/);
  } finally {
    await a.context.close(); await b.context.close(); await ops.context.close();
  }
});

test('a past saved time is not treated as a plan', async () => {
  const { context, page } = await phone(browser, errors);
  try {
    await page.goto(`${server.site}/app/`);
    await page.locator('.milo-first-open').click();
    await page.locator('.milo-home').waitFor();
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('milo_prototype_v1_state'));
      Object.assign(s.sessionA, { screen: 's7', planningMode: 'solo', intents: ['intimate', 'fun', 'novelty'], activeNightId: 'middle-ground', savedSoloNightId: 'middle-ground',
        soloTimingStep: 'middle-ground', soloTimings: { 'middle-ground': { version: 1, nightId: 'middle-ground', date: '2026-10-11', time: '19:30', timeZone: 'Asia/Kolkata' } } });
      localStorage.setItem('milo_prototype_v1_state', JSON.stringify(s));
    });
    await page.goto(`${server.site}/app/?screen=s7`);
    await page.locator('.milo-timing-stale').waitFor();
    assert.match(await page.locator('.milo-timing-stale').textContent(), /has passed\. Pick a new time\./);
    assert.equal(await page.locator('#miloSoloContinue').count(), 0, 'no Continue on a past time');
    assert.equal(await page.locator('.milo-timing-form').isVisible(), true);
  } finally { await context.close(); }
});

test('no uncaught browser errors across the solo journey', () => assert.deepEqual(errors, []));
