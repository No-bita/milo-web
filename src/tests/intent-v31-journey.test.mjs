// Intent model v3.1 switched on (VITE_MILO_INTENT_MODEL=v3.1 + Phase 1 server) on real
// phones: the swapped quiz, the new "Tonight is mostly about…" screen, the model's own
// deck and reveal, booking limits, the ops brief, and a two-phone Together plan.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';
import { phone, state, seat, serverView, until } from './support/journey.mjs';
import { CARDS, MOOD_TILES } from '../logic/intent/codebook.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-v31/', import.meta.url));
const SHOTS = process.env.MILO_SCREENS || null;
let server, browser;
const errors = [];

before(async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-v31', '--emptyOutDir', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_PHASE1: 'true', VITE_MILO_INTENT_MODEL: 'v3.1' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  server = await startPhase1LocalServer({ distDir });
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => { await browser?.close(); await server?.close(); assert.deepEqual(errors, []); });

const shot = async (page, name) => { if (SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
const KEY = 'milo_prototype_v1_state';

// Moods -> "Tonight is mostly about…" -> deck, for either seat.
async function quiz(page, session, { moods, modes, pairs, react = () => '#btnIntoIt' }) {
  for (const id of moods) await page.locator(`[data-intent-id=${id}]`).click();
  await page.locator(`#miloCta-${session}`).click();
  await page.locator('.milo-tonight').waitFor();
  for (const m of modes) await page.locator(`[data-mode=${m}]`).click();
  for (const [pair, answer] of Object.entries(pairs)) await page.locator(`#miloPair-${pair}-${answer}-${session}`).click();
  await page.locator(`#miloS1bCta-${session}`).click();
  await page.locator('.milo-threshold-container').click();
  const key = session === 'sneha' ? 'sessionB' : 'sessionA';
  const titles = [];
  for (let i = 0; i < 8; i++) {
    titles.push(await page.locator(`#miloActiveCard-${session} .milo-card-title`).textContent());
    const n = (await state(page))[key].reactions.length;
    await page.locator(`${react(i)}-${session}`).click();
    await page.waitForFunction(({ k, key, n }) => JSON.parse(localStorage.getItem(k))[key].reactions.length > n, { k: KEY, key, n });
  }
  return titles;
}

test('solo on v3.1: the model\'s moods, the new screen, its deck and reveal, then booking limits reach ops', async () => {
  const a = await phone(browser, errors);
  try {
    const p = a.page;
    await p.setViewportSize({ width: 420, height: 900 });
    await p.goto(`${server.site}/app/`);
    await p.locator('.milo-first-open').click();
    await p.locator('.milo-home-occ-2').click(); // Anniversary
    await p.locator('[data-intent-id=romance]').waitFor();
    assert.deepEqual(await p.locator('.milo-tile-label').allTextContents(), Object.keys(MOOD_TILES));
    assert.equal((await state(p)).shared.occasion, 'anniversary', 'the tapped occasion is saved');
    assert.equal((await state(p)).sessionA.quizVersion, 'v3.1');
    for (const id of ['romance', 'comfort', 'connection']) await p.locator(`[data-intent-id=${id}]`).click();
    await p.locator('#miloCta-aarav').click();
    // "Tonight is mostly about…": up to two tiles, all three pairs before it moves on.
    await p.locator('.milo-tonight').waitFor();
    await shot(p, 'v31-s1b-empty');
    const cta = p.locator('#miloS1bCta-aarav');
    assert.equal(await cta.isDisabled(), true);
    for (const m of ['talk', 'consume', 'rest']) await p.locator(`[data-mode=${m}]`).click();
    assert.equal(await p.locator('[data-mode=rest]').getAttribute('aria-pressed'), 'false', 'a third tile is refused');
    assert.equal(await cta.isDisabled(), true, 'pairs still unanswered');
    await p.locator('#miloPair-P6-lean_left-aarav').click();
    await p.locator('#miloPair-P3-def_left-aarav').focus();
    await p.keyboard.press('Enter');
    await p.locator('#miloPair-P2-lean_right-aarav').click();
    assert.equal(await p.locator('#miloPair-P3-def_left-aarav').getAttribute('aria-pressed'), 'true', 'keyboard works');
    assert.equal(await cta.isDisabled(), false);
    await shot(p, 'v31-s1b-done');
    // Back keeps the moods; forward keeps the answers.
    await p.locator('#miloS1bBack-aarav').click();
    assert.equal(await p.locator('[data-intent-id=romance]').getAttribute('aria-pressed'), 'true');
    await p.locator('#miloCta-aarav').click();
    assert.equal(await p.locator('#miloPair-P2-lean_right-aarav').getAttribute('aria-pressed'), 'true');
    await p.locator('#miloS1bCta-aarav').click();
    await p.locator('.milo-threshold-container').click();
    const titles = [];
    for (let i = 0; i < 8; i++) {
      titles.push(await p.locator('#miloActiveCard-aarav .milo-card-title').textContent());
      if (await p.locator('#miloActiveCard-aarav.is-text').count()) await shot(p, 'v31-deck-text-card');
      else if (i === 1) await shot(p, 'v31-deck-photo-card');
      const n = (await state(p)).sessionA.reactions.length;
      await p.locator(i % 3 ? '#btnIntoIt-aarav' : '#btnMaybe-aarav').click();
      await p.waitForFunction(({ k, n }) => JSON.parse(localStorage.getItem(k)).sessionA.reactions.length > n, { k: KEY, n });
    }
    const texts = new Set(Object.values(CARDS).map(c => c.text));
    assert.ok(titles.every(t => texts.has(t)), 'every card is one of the model\'s 24');
    assert.equal(new Set(titles).size, 8);
    // Reflection: the model's reveal.
    await p.locator('.milo-observations-list').waitFor();
    const lines = await p.locator('.milo-obs-text').allTextContents();
    assert.match(lines[0], /^Something romantic and /);
    assert.match(lines[1], /^It points to The /);
    await shot(p, 'v31-reflection');
    await p.locator('#miloS3Cta-aarav').click();
    await p.locator('#miloEmailInput-aarav').fill('asha@example.com');
    await p.locator('#miloPasswordInput-aarav').fill('local-only');
    await p.locator('#miloLoginSubmit-aarav').click();
    await p.locator('.milo-night-option').first().waitFor();
    // The three nights come from v3.1 and the first is the one the reveal pointed to.
    const first = (await p.locator('.milo-night-option-name').first().textContent()).trim();
    assert.equal(`It points to ${first}.`, lines[1]);
    await p.locator('[data-open-night]').first().click();
    await p.locator('#miloSoloSave').click();
    await p.locator('.milo-strip-day').last().click();
    await p.locator('.milo-clock-num', { hasText: /^7$/ }).click();
    await p.locator('.milo-clock-num', { hasText: /^30$/ }).click();
    await p.locator('.milo-timing-form button[type=submit]').click();
    await p.locator('#miloSoloContinue').click();
    await p.locator('#miloBookedBook').click();
    // Booking step: the limits sit next to budget; all optional.
    await p.locator('.milo-limits').first().waitFor();
    await p.locator('.milo-choice-pill', { hasText: '₹4,000 - 7,000' }).click();
    await p.locator('.milo-choice-pill', { hasText: '4 hours' }).click();
    await p.locator('.milo-choice-pill', { hasText: 'Vegetarian' }).click();
    await p.locator('.milo-choice-pill', { hasText: 'No alcohol' }).click();
    await p.locator('.milo-choice-pill', { hasText: 'By 11 PM' }).click();
    await p.locator('input[name=contact]').fill('+91 98765 43210');
    await shot(p, 'v31-booking-limits');
    await p.locator('#miloReqBook').click();
    await p.waitForFunction(() => document.querySelector('.milo-booked-title')?.textContent === 'Sealed.');
    const ops = await p.evaluate(async (key) => (await fetch('/api/ops/bookings', { headers: { authorization: `Bearer ${key}` } })).json(), server.opsSecret);
    const row = ops.bookings.find(b => b.mode === 'solo' && b.occasion === 'anniversary');
    assert.deepEqual(row.constraints, { diet: ['vegetarian'], alcohol: false, home_by: '23:00' });
    assert.match(row.brief[0], /^Mood: romantic and /);
    assert.ok(row.brief.includes('No alcohol.') && row.brief.includes('Home by 11 pm.') && row.brief.includes('Food: Vegetarian.'));
    // The ops page shows the brief on the booking card.
    await p.goto(`${server.site}/ops/`);
    await p.locator('#opsKey').fill(server.opsSecret);
    await p.locator('#opsLogin button').click();
    await p.locator('.ops-brief').first().waitFor();
    assert.match(await p.locator('.ops-brief').first().textContent(), /Mood: romantic[\s\S]*Food: Vegetarian\.[\s\S]*No alcohol\./);
    await shot(p, 'v31-ops-brief');
  } finally { await a.context.close(); }
});

test('Together on v3.1: the partner gets the same quiz, and the server computes the result with v3.1', async () => {
  const a = await phone(browser, errors);
  const b = await phone(browser, errors);
  try {
    await a.page.goto(`${server.site}/app/`);
    await a.page.locator('.milo-first-open').click();
    await a.page.locator('.milo-home-occ-1').click(); // Date night
    await quiz(a.page, 'aarav', { moods: ['fun', 'social', 'discovery'], modes: ['create_do'], pairs: { P6: 'def_right', P3: 'lean_right', P2: 'def_right' } });
    await a.page.locator('#miloS3Cta-aarav').click();
    await a.page.locator('#miloEmailInput-aarav').fill('asha@example.com');
    await a.page.locator('#miloPasswordInput-aarav').fill('local-only');
    await a.page.locator('#miloLoginSubmit-aarav').click();
    await a.page.locator('#miloBringIn-aarav').click();
    await a.page.locator('#miloBringName').fill('Asha');
    await a.page.locator('#miloBringCopy').click();
    await a.page.waitForFunction(() => window.__copied.length === 1);
    const inviteUrl = await a.page.evaluate(() => window.__copied[0]);
    const seatA = await seat(a.page);
    await until(async () => (await serverView(a.page, seatA)).me.finished, 15000, "A's half");
    assert.equal((await serverView(a.page, seatA)).intent_model, 'v3.1');
    await b.page.goto(inviteUrl);
    await b.page.locator('#miloJoinName').fill('Ravi');
    await b.page.locator('#miloJoinBtn').click();
    await b.page.waitForURL(/\/app\/\?as=sneha$/);
    await b.page.locator('[data-intent-id=romance]').waitFor();
    assert.deepEqual(await b.page.locator('.milo-tile-label').allTextContents(), Object.keys(MOOD_TILES), 'the partner gets the model\'s moods');
    assert.equal((await state(b.page)).shared.occasion, 'date-night');
    await quiz(b.page, 'sneha', { moods: ['romance', 'comfort', 'connection'], modes: ['talk'], pairs: { P6: 'lean_left', P3: 'def_left', P2: 'lean_left' } });
    const seatB = await seat(b.page);
    await until(async () => Boolean((await serverView(b.page, seatB)).shared_result), 15000, 'the shared result');
    const result = (await serverView(b.page, seatB)).shared_result;
    assert.equal(result.selectedNights.length, 3);
    assert.match(result.bridgeSentence, /^Something /, 'v3.1 reveal wording');
    assert.ok(result.selectedNights.every(n => /It fits what you both leaned toward/.test(n.whyItWorks)));
  } finally { await a.context.close(); await b.context.close(); }
});
