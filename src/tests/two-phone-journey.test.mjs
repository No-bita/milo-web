// Full two-phone Together journey with the Phase 1 flag ON: two isolated
// browser contexts (two "phones", no shared localStorage) drive the real UI
// against the real API handler on an in-memory PGlite database.
// Covers: create -> invite -> join -> both decks -> shared result -> suggest ->
// confirm -> set time -> the other phone reads the time -> Home card routing.
// Does NOT cover live Neon, Vercel routing, trusted ingress IP or cron.
// Updates arrive on app open / tab focus only (no polling), so the test fires
// a focus event where a real person would come back to the app.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-phase1/', import.meta.url));
const KEY = 'milo_prototype_v1_state';
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

async function phone() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata' });
  // Never open a real messaging service; capture copied invite links instead.
  await context.addInitScript(() => {
    window.open = () => null;
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.__copied.push(text) } });
  });
  context.setDefaultTimeout(10000);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  return { context, page };
}
const state = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
const seat = page => page.evaluate(() => JSON.parse(localStorage.getItem('milo_phase1_seat_v1')));
const comeBack = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));
// Poll from Node (not page.waitForFunction, which does not await async predicates).
async function until(check, ms = 15000, label = 'condition') {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await check()) return; await new Promise(r => setTimeout(r, 200)); }
  assert.fail(`timed out waiting for ${label}`);
}
const serverView = (page, s) => page.evaluate(async ({ planId, seatKey }) => (await fetch(`/api/plans/${planId}`, { headers: { authorization: `Bearer ${seatKey}` } })).json(), s);

async function moodsAndDeck(page, session, moods, reaction) {
  for (const id of moods) await page.locator(`[data-intent-id=${id}]`).click();
  await page.locator(`#miloCta-${session}`).click();
  await page.locator('.milo-threshold-container').click();
  const btn = { into: 'btnIntoIt', maybe: 'btnMaybe', no: 'btnNotTonight' };
  for (let i = 0; i < 8; i++) {
    const pick = Array.isArray(reaction) ? reaction[i] : reaction;
    const before = (await state(page))[session === 'sneha' ? 'sessionB' : 'sessionA'].reactions.length;
    await page.locator(`#${btn[pick]}-${session}`).click();
    await page.waitForFunction(({ k, key, n }) => JSON.parse(localStorage.getItem(k))[key].reactions.length > n, { k: KEY, key: session === 'sneha' ? 'sessionB' : 'sessionA', n: before });
  }
}

async function setTime(page, hour, minute) {
  const change = page.locator('.milo-timing-change:visible');
  if (await change.count()) await change.click();
  await page.locator('.milo-strip-day').last().click();
  await page.locator('.milo-clock-num', { hasText: new RegExp(`^${hour}$`) }).click();
  await page.locator('.milo-clock-num', { hasText: new RegExp(`^${String(minute).padStart(2, '0')}$`) }).click();
  await page.locator('.milo-timing-form button[type=submit]').click();
}

test('two phones plan one night together through the server', async () => {
  const a = await phone();
  const b = await phone();
  try {
    // ---- Phone A: the creator plans their half and creates the invite ----
    await a.page.goto(`${server.site}/app/`);
    await a.page.locator('.milo-first-open').click();
    await a.page.locator('.milo-home-occ-1').click(); // Date night
    await moodsAndDeck(a.page, 'aarav', ['intimate', 'low-key', 'fun'], 'into');
    await a.page.locator('#miloS3Cta-aarav').click();
    await a.page.locator('#miloEmailInput-aarav').fill('asha@example.com');
    await a.page.locator('#miloPasswordInput-aarav').fill('local-only');
    await a.page.locator('#miloLoginSubmit-aarav').click();
    await a.page.locator('#miloBringIn-aarav').click();
    await a.page.locator('#miloMyName').fill('Asha');
    await a.page.locator('#miloTheirName').fill('Ravi');
    await a.page.locator('#miloCopyLinkBtn').click();
    await a.page.waitForFunction(() => window.__copied.length === 1);
    const inviteUrl = await a.page.evaluate(() => window.__copied[0]);
    assert.ok(inviteUrl.startsWith(`${server.site}/app/?invite=`), 'the copied link is the server invite, not a demo link');
    const seatA = await seat(a.page);
    assert.equal(seatA.role, 'initiator');
    // Copying (not sharing) the link: Home must say "waiting", not "Resume".
    await a.page.goto(`${server.site}/app/`);
    await a.page.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    await a.page.locator('.milo-home').waitFor();
    assert.match(await a.page.locator('.milo-home-card').textContent(), /Waiting for Ravi/);
    assert.equal(await a.page.locator('#miloHomeResume').count(), 0);
    // A's own half reaches the server (debounced sync) without the partner.
    await until(async () => (await serverView(a.page, seatA)).me.finished, 15000, "A's half on the server");

    // ---- Phone B: the partner follows the link, joins, plays their half ----
    await b.page.goto(inviteUrl);
    await b.page.locator('#miloJoinTitle').waitFor();
    assert.match(await b.page.locator('#miloJoinTitle').textContent(), /Asha wants to plan/);
    await b.page.locator('#miloJoinName').fill('Ravi');
    await b.page.locator('#miloJoinBtn').click();
    await b.page.waitForURL(/\/app\/\?as=sneha$/);
    const seatB = await seat(b.page);
    assert.equal(seatB.role, 'partner');
    assert.equal(seatB.planId, seatA.planId);
    await moodsAndDeck(b.page, 'sneha', ['fun', 'novelty', 'buzz'], ['into', 'maybe', 'no', 'into', 'maybe', 'into', 'no', 'into']);
    // Whatever B sees after the deck, B's half must land and the server must compute once.
    await until(async () => Boolean((await serverView(b.page, seatB)).shared_result), 15000, 'the shared result');
    const viewA = await serverView(a.page, seatA);
    assert.equal(viewA.partner.display_name, 'Ravi');
    assert.equal(viewA.partner.finished, true);
    assert.equal(viewA.shared_result.selectedNights.length, 3);

    // ---- Phone A: reopening the app, Home no longer says "waiting" ----
    await a.page.goto(`${server.site}/app/`);
    await a.page.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    await a.page.locator('.milo-home').waitFor();
    await a.page.waitForFunction(() => /Ravi is done/.test(document.querySelector('.milo-home-card')?.textContent || ''));
    assert.match(await a.page.locator('#miloHomeOpen').textContent(), /Open plan/);
    await a.page.locator('#miloHomeOpen').click();
    await a.page.locator('#miloPsSuggest-aarav').waitFor();

    // ---- Suggest on A, confirm on B ----
    const suggested = viewA.shared_result.selectedNights[0].night.id;
    await a.page.locator('#miloPsSuggest-aarav').click();
    await a.page.locator('.milo-cta-suggested-notice').waitFor();
    // B comes back to the app and sees A's pick.
    await b.page.goto(`${server.site}/app/?as=sneha`);
    await comeBack(b.page);
    await b.page.locator('#miloPsConfirm-sneha').waitFor();
    await b.page.locator('#miloPsConfirm-sneha').click();
    await b.page.locator('.milo-closing-state').waitFor();
    await comeBack(a.page);
    await a.page.locator('.milo-closing-state').waitFor();
    assert.equal((await state(a.page)).shared.confirmedNightId, suggested);

    // ---- B sets the time; A reads it back from the server ----
    await setTime(b.page, 7, 30);
    await b.page.locator('.milo-timing-saved:visible').waitFor();
    assert.match(await b.page.locator('.milo-timing-saved').textContent(), /7:30 PM/);
    const timed = await serverView(b.page, seatB);
    assert.equal(timed.timing.time, '19:30');
    assert.match(timed.timing.time_zone, /^Asia\/(Kolkata|Calcutta)$/); // Chromium may report the legacy alias
    await comeBack(a.page);
    await a.page.waitForFunction(() => /7:30 PM/.test(document.querySelector('.milo-timing-saved:not([hidden])')?.textContent || ''));
    assert.equal((await state(a.page)).shared.timing.nightId, suggested);

    // ---- A changes it; last write wins on B ----
    await setTime(a.page, 8, 0);
    await a.page.waitForFunction(() => /8:00 PM/.test(document.querySelector('.milo-timing-saved:not([hidden])')?.textContent || ''));
    await comeBack(b.page);
    await b.page.waitForFunction(() => /8:00 PM/.test(document.querySelector('.milo-timing-saved:not([hidden])')?.textContent || ''));

    // ---- A's Home card shows the agreed night and the synced time ----
    await a.page.goto(`${server.site}/app/`);
    await a.page.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    await a.page.locator('.milo-home').waitFor();
    await a.page.waitForFunction(() => /8:00 PM/.test(document.querySelector('.milo-home-when')?.textContent || ''));
    assert.match(await a.page.locator('.milo-home-card').textContent(), /Both of you are in/);

    // ---- Privacy: neither phone ever holds the other seat's picks ----
    const finalA = await serverView(a.page, seatA);
    assert.deepEqual(Object.keys(finalA.partner).sort(), ['display_name', 'finished']);
  } finally {
    await a.context.close();
    await b.context.close();
  }
});

test('no uncaught browser errors across the two-phone journey', () => assert.deepEqual(errors, []));
