// Contribution handoff (A: Together from the start, B: bring someone into a solo plan),
// on a flag-on build against the local Phase 1 stand-in. Real browser, no real messaging.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPhase1LocalServer } from './support/phase1-local-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distDir = fileURLToPath(new URL('../../dist-phase1/', import.meta.url));
const KEY = 'milo_prototype_v1_state';
const SHOTS = process.env.MILO_SCREENS || null;
const MSG_A = "I've started a night for us on Milo. Add what feels like you, and we'll find something that fits us both.";
const MSG_B = "I've found a starting point for us. Add your picks on Milo so the night feels like both of us.";
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

async function phone(width = 420, height = 900) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Kolkata' });
  await context.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => { window.__opened.push(String(url)); return {}; };
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.__copied.push(text) } });
  });
  context.setDefaultTimeout(10000);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const creates = [];
  page.on('request', r => { if (r.method() === 'POST' && /\/api\/plans$/.test(new URL(r.url()).pathname)) creates.push(r.url()); });
  return { context, page, creates };
}
const state = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
const seat = page => page.evaluate(() => localStorage.getItem('milo_phase1_seat_v1'));
const comeBack = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));
const shot = async (page, name) => { if (SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };

// Home -> Date night -> moods -> eight swipes -> reflection -> sign in -> the three nights (solo).
async function toThreeNights(page) {
  await page.goto(`${server.site}/app/`);
  await page.locator('.milo-first-open').click();
  await page.locator('.milo-home-occ-1').click();
  for (const id of ['intimate', 'low-key', 'fun']) await page.locator(`[data-intent-id=${id}]`).click();
  await page.locator('#miloCta-aarav').click();
  await page.locator('.milo-threshold-container').click();
  for (let i = 0; i < 8; i++) {
    const n = (await state(page)).sessionA.reactions.length;
    await page.locator('#btnIntoIt-aarav').click();
    await page.waitForFunction(({ k, n }) => JSON.parse(localStorage.getItem(k)).sessionA.reactions.length > n, { k: KEY, n });
  }
  await page.locator('#miloS3Cta-aarav').click();
  await page.locator('#miloEmailInput-aarav').fill('asha@example.com');
  await page.locator('#miloPasswordInput-aarav').fill('local-only');
  await page.locator('#miloLoginSubmit-aarav').click();
  await page.locator('.milo-bring-card').waitFor();
}

test('B: opening and dismissing the sheet changes nothing; drafts and focus survive', async () => {
  const { context, page, creates } = await phone(420, 700);
  try {
    await toThreeNights(page);
    const scroller = () => page.evaluate(() => document.querySelector('.milo-s6-container').scrollTop);
    await page.evaluate(() => { const s = document.querySelector('.milo-s6-container'); s.scrollTop = s.scrollHeight; });
    let scroll = await scroller();
    assert.ok(scroll > 50, 'the three nights scroll');
    const before = await state(page);
    await page.locator('#miloBringIn-aarav').click();
    const sheet = page.locator('dialog.milo-bring-sheet');
    await sheet.waitFor();
    assert.equal(await sheet.getAttribute('aria-labelledby'), 'miloBringSheetTitle');
    assert.equal(await page.locator('#miloBringSheetTitle').textContent(), 'Make room for their taste');
    for (const words of ['This is shaped by your picks so far. Invite their choices before you decide together.', 'Invite from', 'Your invitation', MSG_B,
      'Your picks stay private. Their input can change the plan. Nothing is booked.', 'No live delivery or notifications yet.', 'Share via WhatsApp', 'Copy invite link']) {
      assert.ok((await sheet.textContent()).includes(words), words);
    }
    assert.match(await sheet.locator('.milo-handoff-link').textContent(), /added when you share/);
    assert.equal(await page.locator('#miloBringName').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('#miloBringShare').isDisabled(), true);
    await page.locator('#miloBringName').fill('   ');
    assert.equal(await page.locator('#miloBringCopy').isDisabled(), true, 'whitespace is not a name');
    await page.locator('#miloBringName').fill('Asha <b>Ramaswamy-Venkataraghavan</b>');
    assert.equal(await page.locator('#miloBringCopy').isDisabled(), false);
    await shot(page, 'B-sheet-420x700');
    await page.setViewportSize({ width: 420, height: 900 });
    await shot(page, 'B-sheet-420x900');
    await page.setViewportSize({ width: 420, height: 700 });
    await page.evaluate(() => { const s = document.querySelector('.milo-s6-container'); s.scrollTop = s.scrollHeight; });
    scroll = await scroller();
    // Escape: closed, focus back on the trigger, nothing written, scroll kept.
    await page.keyboard.press('Escape');
    await sheet.waitFor({ state: 'detached' });
    assert.equal(await page.locator('#miloBringIn-aarav').evaluate(e => e === document.activeElement), true);
    assert.deepEqual(await state(page), before);
    assert.equal(await seat(page), null);
    assert.equal(creates.length, 0, 'opening the sheet creates no invitation');
    assert.ok(Math.abs((await scroller()) - scroll) <= 1, 'scroll kept after Escape');
    await shot(page, 'B-dismissed-420x700');
    // Reopen: the unsent name is still there. Close with the visible control, then the backdrop.
    await page.locator('#miloBringIn-aarav').click();
    assert.equal(await page.locator('#miloBringName').inputValue(), 'Asha <b>Ramaswamy-Venkataraghavan</b>');
    await page.locator('.milo-bring-close').click();
    await sheet.waitFor({ state: 'detached' });
    await page.locator('#miloBringIn-aarav').click();
    await page.mouse.click(10, 10);
    await sheet.waitFor({ state: 'detached' });
    assert.deepEqual(await state(page), before);
    assert.ok(Math.abs((await scroller()) - scroll) <= 1, 'scroll position kept');
    // 320px: actions stay reachable inside the sheet.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.locator('#miloBringIn-aarav').click();
    await page.locator('#miloBringName').fill('Asha');
    await page.locator('#miloBringCopy').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#miloBringCopy').isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow');
    await page.keyboard.press('Escape');
  } finally { await context.close(); }
});

test('B: a real copy prepares one invitation, keeps the solo plan, and copies the URL only', async () => {
  const { context, page, creates } = await phone(420, 700);
  try {
    await toThreeNights(page);
    const before = await state(page);
    await page.evaluate(() => { const s = document.querySelector('.milo-s6-container'); s.scrollTop = s.scrollHeight; });
    const scroll = await page.evaluate(() => document.querySelector('.milo-s6-container').scrollTop);
    await page.locator('#miloBringIn-aarav').click();
    await page.locator('#miloBringName').fill('Asha');
    await page.evaluate(() => { const b = document.querySelector('#miloBringCopy'); b.click(); b.click(); b.click(); });
    await page.locator('.milo-bring-status').waitFor();
    assert.equal(await page.locator('.milo-bring-status').textContent(), 'Link copied.');
    assert.equal(creates.length, 1, 'repeated taps prepare one invitation');
    await page.waitForTimeout(100);
    assert.ok(Math.abs((await page.evaluate(() => document.querySelector('.milo-s6-container').scrollTop)) - scroll) <= 1, 'scroll kept after the plan re-renders');
    assert.equal(await page.locator('#miloBringIn-aarav').evaluate(e => e === document.activeElement), true, 'focus returns to the card');
    const copied = await page.evaluate(() => window.__copied);
    assert.equal(copied.length, 1);
    assert.match(copied[0], /^http:\/\/127\.0\.0\.1:\d+\/app\/\?invite=[A-Za-z0-9_-]+$/, 'the link only, not the message');
    const after = await state(page);
    assert.equal(after.sessionA.screen, 's6');
    assert.equal(after.sessionA.planningMode, 'solo');
    assert.deepEqual(after.sessionA.reactions, before.sessionA.reactions);
    assert.deepEqual(after.sessionA.intents, before.sessionA.intents);
    assert.equal(after.shared.inviteSent, before.shared.inviteSent, 'no sent claim');
    // WhatsApp from the same sheet: the preview now shows the real link, and the composer text matches it.
    await page.locator('#miloBringIn-aarav').click();
    const preview = (await page.locator('.milo-handoff-message').innerText()).trim();
    assert.equal(preview, `${MSG_B}\n${copied[0]}`);
    await page.locator('#miloBringShare').click();
    const opened = await page.evaluate(() => window.__opened);
    assert.equal(opened.length, 1);
    assert.equal(decodeURIComponent(new URL(opened[0]).searchParams.get('text')), `${MSG_B}\n${copied[0]}`);
    assert.equal(creates.length, 1, 'sharing again reuses the same invitation');
    await comeBack(page);
    await page.locator('dialog.milo-bring-sheet').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.milo-bring-status').textContent(), 'Your link is ready.');
    assert.doesNotMatch(await page.locator('body').innerText(), /\bSent\b|Delivered|They saw it|Invite accepted/);
    // The solo plan screen: only Back and Book this night. Booking before their picks asks first.
    const first = page.locator('.milo-night-option').first();
    if (!(await first.evaluate(e => e.classList.contains('is-expanded')))) await first.locator('.milo-night-toggle').click();
    await first.locator('[data-open-night]').click();
    await page.locator('#miloSoloSave').waitFor();
    assert.equal(await page.locator('#miloSoloSave').textContent(), 'Book this night');
    assert.equal(await page.locator('#miloSoloOther, #miloSoloBringIn').count(), 0);
    await shot(page, 'B-plan-book-only-420x700');
    const draft = await state(page);
    await page.locator('#miloSoloSave').click();
    await page.locator('#miloBookFirstTitle').waitFor();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#miloBookFirstTitle').textContent(), "Their picks aren't in yet.");
    await shot(page, 'B-book-first-420x700');
    await page.locator('#miloWaitTheirs').click();
    await page.locator('dialog.milo-bring-sheet').waitFor({ state: 'detached' });
    assert.deepEqual(await state(page), draft, 'waiting changes nothing');
    await page.locator('#miloSoloSave').click();
    await page.locator('#miloBookMine').click();
    await page.locator('.milo-timing-form, #miloSoloTimingBack').first().waitFor();
    assert.ok((await state(page)).sessionA.soloTimingStep, 'booking goes on to date and time');
  } finally { await context.close(); }
});

test('B: a failed preparation keeps the solo draft and shows no success', async () => {
  const { context, page } = await phone();
  try {
    await toThreeNights(page);
    const before = await state(page);
    await page.route('**/api/plans', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, body: '{}' }) : route.continue());
    await page.locator('#miloBringIn-aarav').click();
    await page.locator('#miloBringName').fill('Asha');
    await page.locator('#miloBringCopy').click();
    await page.locator('#miloInviteFeedbackTitle').waitFor();
    assert.match(await page.locator('#miloInviteFeedbackTitle').textContent(), /Couldn't reach Milo/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.milo-bring-status').count(), 0);
    const after = await state(page);
    assert.equal(after.sessionA.screen, 's6');
    assert.equal(after.sessionA.planningMode, 'solo');
    assert.equal(after.sessionA.bringIn ?? null, null);
    assert.deepEqual(after.sessionA.reactions, before.sessionA.reactions);
    assert.equal(await page.locator('#miloBringCopy').isDisabled(), false, 'can try again');
  } finally { await context.close(); }
});

test('A: Together from the start goes to the handoff screen, then the provisional plan', async () => {
  const { context, page, creates } = await phone(420, 900);
  try {
    await toThreeNights(page);
    // The planner chose Together before discovery: seed that choice, then reopen on the handoff.
    await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.sessionA.planningMode = 'together'; s.sessionA.screen = 's4_invite'; s.sessionA.pausedScreen = 's4_invite'; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.goto(`${server.site}/app/`);
    await page.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
    await page.locator('#miloHomeResume').click();
    await page.locator('.milo-handoff-screen').waitFor();
    const text = (await page.locator('.milo-handoff-screen').innerText()).replace(/\s+/g, ' ');
    for (const words of ['A night shaped by both of you', "You've added your taste. Invite theirs, without showing your picks.", 'Your picks Added', 'Their picks Not added yet',
      "WHO'S ASKING", 'YOUR INVITATION', MSG_A, 'They make their own choices privately. Nothing is booked.', 'No live delivery or notifications yet.']) {
      assert.ok(text.toLowerCase().includes(words.toLowerCase()), words);
    }
    assert.equal(await page.locator('#miloTheirName, .milo-s4-illustration').count(), 0);
    assert.equal(await page.locator('#miloShareWhatsappBtn').isDisabled(), true);
    await shot(page, 'A-handoff-420x900');
    await page.setViewportSize({ width: 420, height: 700 });
    await shot(page, 'A-handoff-420x700');
    await page.locator('#miloMyName').fill('Asha');
    assert.equal(await page.locator('#miloCopyLinkBtn').isDisabled(), false);
    await page.locator('#miloCopyLinkBtn').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#miloCopyLinkBtn').isVisible(), 'actions reachable at 420x700');
    await page.locator('#miloCopyLinkBtn').click();
    // Never a standalone waiting room: the creator's own provisional plan, with an honest line.
    await page.locator('.milo-plan-status').waitFor();
    assert.match(await page.locator('.milo-plan-status').textContent(), /^Link copied\. Waiting for your person to join\.$/);
    assert.equal(creates.length, 1);
    const copied = await page.evaluate(() => window.__copied);
    assert.match(copied[0], /\/app\/\?invite=[A-Za-z0-9_-]+$/);
    await shot(page, 'A-after-copy-420x700');
    // Back to the handoff: the saved name shows with Edit; the preview carries the real link.
    await page.locator('#miloPsBack-aarav').click();
    await page.locator('.milo-handoff-screen').waitFor();
    assert.equal(await page.locator('.milo-handoff-sender-name').textContent(), 'Asha');
    assert.equal((await page.locator('.milo-handoff-message').innerText()).trim(), `${MSG_A}\n${copied[0]}`);
    await page.locator('#miloMyNameEdit').click();
    assert.equal(await page.locator('#miloMyName').evaluate(e => e === document.activeElement), true);
    await page.locator('#miloShareWhatsappBtn').click();
    const opened = await page.evaluate(() => window.__opened);
    assert.equal(decodeURIComponent(new URL(opened[0]).searchParams.get('text')), `${MSG_A}\n${copied[0]}`);
    assert.equal(creates.length, 1, 'no duplicate invitation');
  } finally { await context.close(); }
});

test('Partner onboarding explains Milo before the name', async () => {
  const a = await phone();
  const b = await phone();
  try {
    await toThreeNights(a.page);
    await a.page.locator('#miloBringIn-aarav').click();
    await a.page.locator('#miloBringName').fill('Asha');
    await a.page.locator('#miloBringCopy').click();
    await a.page.locator('.milo-bring-status').waitFor();
    const url = (await a.page.evaluate(() => window.__copied))[0];
    await b.page.goto(url);
    await b.page.locator('#miloJoinTitle').waitFor();
    assert.match(await b.page.locator('#miloJoinTitle').textContent(), /Asha wants to plan/);
    assert.deepEqual(await b.page.locator('.milo-partner-steps li').allTextContents(), ['Pick the mood.', 'Swipe a few ideas.', 'Milo finds what fits you both.']);
    assert.equal(await b.page.locator('.milo-partner-privacy').textContent(), 'Your picks stay private. Nothing is booked.');
    const order = await b.page.evaluate(() => {
      const steps = document.querySelector('.milo-partner-steps'), name = document.querySelector('#miloJoinName');
      return Boolean(steps.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    assert.equal(order, true, 'steps come before the name field');
    assert.doesNotMatch(await b.page.locator('body').innerText(), /intimate|low-key|Pottery/i, "the creator's picks are not shown");
    await shot(b.page, 'partner-onboarding-420x900');
  } finally { await a.context.close(); await b.context.close(); }
});
