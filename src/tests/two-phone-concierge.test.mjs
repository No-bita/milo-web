// Concierge handover + next-morning check-in + PMF export, two real phones and
// the ops page, flag ON, real API handler on in-memory PGlite, moved clock.
// Does NOT cover live Neon/Vercel, payments, or real booking with venues.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
import { agreedPair, comeBack, phone } from './support/journey.mjs';
import { zonedToUtc } from '../../server/gifts.js';
import { EXPORT_COLUMNS } from '../../server/concierge.js';

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

const text = (page, sel) => page.locator(sel).textContent();
const waitText = (page, sel, re) => page.waitForFunction(({ sel, src }) => new RegExp(src).test(document.querySelector(sel)?.textContent || ''), { sel, src: re.source });

test('hand the night to Milo, get it booked, check in the next morning, export the PMF row', async () => {
  const { a, b, timing } = await agreedPair({ site: server.site, browser, errors, browse: 3 });
  const ops = await phone(browser, errors);
  try {
    // ---- A asks Milo to book ----
    await a.page.locator('#miloBookingOpen-aarav').click();
    const sheet = a.page.locator('.milo-concierge-sheet');
    await sheet.locator('button[type=submit]').click();
    assert.match(await sheet.locator('.milo-gift-error').textContent(), /budget/);
    await sheet.locator('.milo-choice-pill', { hasText: '₹2,000 - 4,000' }).click();
    await sheet.locator('.milo-choice-pill', { hasText: '4 hours' }).click();
    await sheet.locator('input[name=contact]').fill('+91 98765 43210');
    await sheet.locator('textarea[name=notes]').fill('Indiranagar please');
    await sheet.locator('button[type=submit]').click();
    await sheet.waitFor({ state: 'detached' });
    await waitText(a.page, '.milo-concierge', /We're booking every stop/);
    assert.equal(await a.page.locator('#miloBookingCancel-aarav').count(), 1);

    // ---- B sees it is handled, without A's details ----
    await comeBack(b.page);
    await waitText(b.page, '.milo-concierge', /Asha asked Milo to book this/);
    assert.equal(await b.page.locator('#miloBookingOpen-sneha').count(), 0);
    assert.ok(!(await text(b.page, '.milo-closing-state')).includes('Indiranagar please'));

    // ---- Ops books it with a venue ----
    await ops.page.goto(`${server.site}/ops/`);
    await ops.page.locator('#opsKey').fill(server.opsSecret);
    await ops.page.locator('#opsLogin button').click();
    const card = ops.page.locator('.ops-booking');
    await card.waitFor();
    for (const detail of ['Asha', 'Ravi', '4 hours', '₹2,000 - 4,000', 'Indiranagar please', '+919876543210']) assert.ok((await card.textContent()).includes(detail), `ops card missing ${detail}`);
    await card.locator('.ops-venue').first().locator('[data-f=venue]').fill('Toit');
    await card.locator('.ops-venue').first().locator('[data-f=area]').fill('Indiranagar');
    await card.locator('.ops-venue').first().locator('[data-f=time]').fill('19:30');
    await card.locator('[data-f=status]').selectOption('booked');
    await card.locator('[data-f=ops_minutes]').fill('20');
    await card.locator('[data-save]').click();
    await card.locator('.ops-status', { hasText: 'booked' }).waitFor();
    for (const p of [a.page, b.page]) {
      await comeBack(p);
      await waitText(p, '.milo-concierge', /Booked[\s\S]*Toit, Indiranagar[\s\S]*7:30 PM/);
    }

    // ---- Next morning: each person checks in privately ----
    server.setClock(zonedToUtc(new Date(Date.parse(`${timing.date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10), '09:05', timing.time_zone));
    for (const [p, id, rating, line] of [[a.page, 'aarav', '5', 'The dessert stop.'], [b.page, 'sneha', '4', 'Booking it all for us.']]) {
      await comeBack(p);
      await p.locator(`#miloCheckinOpen-${id}`).click();
      const s = p.locator('.milo-concierge-sheet');
      await s.locator('.milo-choice-pill', { hasText: 'No' }).first().click();
      await s.locator('button[type=submit]').click();
      assert.match(await s.locator('.milo-gift-error').textContent(), /five quick ones/);
      await s.locator('textarea[name=wouldnt_have]').fill(line);
      await s.locator('fieldset', { hasText: 'Rate the night' }).locator('.milo-choice-pill', { hasText: rating }).click();
      await s.locator('fieldset', { hasText: 'use Milo again' }).locator('.milo-choice-pill', { hasText: 'Yes' }).click();
      await s.locator('fieldset', { hasText: 'recommend' }).locator('.milo-choice-pill', { hasText: 'Maybe' }).click();
      await s.locator('fieldset', { hasText: 'paid Milo' }).locator('.milo-choice-pill', { hasText: '₹200 - 500' }).click();
      await s.locator('button[type=submit]').click();
      await s.waitFor({ state: 'detached' });
      await waitText(p, '.milo-concierge', /Thanks for telling us/);
    }
    assert.ok(!(await text(a.page, '.milo-closing-state')).includes('Booking it all for us'));
    assert.ok(!(await text(b.page, '.milo-closing-state')).includes('The dessert stop'));

    // ---- Export: one PMF row with the whole story ----
    await ops.page.locator('#opsReload').click();
    const [download] = await Promise.all([ops.page.waitForEvent('download'), ops.page.locator('#opsExport').click()]);
    const csv = await readFile(await download.path(), 'utf8');
    const [header, row] = csv.trim().split('\r\n');
    assert.equal(header, EXPORT_COLUMNS.join(','));
    const r = Object.fromEntries(row.split(',').map((v, i) => [EXPORT_COLUMNS[i], v]));
    assert.equal(r.status, 'confirmed'); assert.equal(r.accepted_first_plan, 'true'); assert.equal(r.suggestions, '1');
    assert.equal(r.see_other_partner, '3'); assert.equal(r.see_other_initiator, '0');
    assert.equal(r.booking_status, 'booked'); assert.equal(r.ops_minutes, '20'); assert.equal(r.window_hours, '4');
    assert.equal(r.checkins, '2'); assert.equal(r.rating_initiator, '5'); assert.equal(r.rating_partner, '4');
    assert.equal(r.would_pay_partner, '200_500');
  } finally {
    await a.context.close(); await b.context.close(); await ops.context.close();
  }
});

test('no uncaught browser errors across the concierge journey', () => assert.deepEqual(errors, []));
