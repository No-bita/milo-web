// TEST-ONLY helpers to drive two real phones (isolated browser contexts)
// through the Phase 1 Together flow up to an agreed night with a time set.
import assert from 'node:assert/strict';

export const STATE_KEY = 'milo_prototype_v1_state';

export async function phone(browser, errors) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata' });
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

export const state = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), STATE_KEY);
export const seat = page => page.evaluate(() => JSON.parse(localStorage.getItem('milo_phase1_seat_v1')));
export const comeBack = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));
export const serverView = (page, s) => page.evaluate(async ({ planId, seatKey }) => (await fetch(`/api/plans/${planId}`, { headers: { authorization: `Bearer ${seatKey}` } })).json(), s);

export async function until(check, ms = 15000, label = 'condition') {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await check()) return; await new Promise(r => setTimeout(r, 200)); }
  assert.fail(`timed out waiting for ${label}`);
}

async function moodsAndDeck(page, session, moods, reactions) {
  const key = session === 'sneha' ? 'sessionB' : 'sessionA';
  for (const id of moods) await page.locator(`[data-intent-id=${id}]`).click();
  await page.locator(`#miloCta-${session}`).click();
  await page.locator('.milo-threshold-container').click();
  const btn = { into: 'btnIntoIt', maybe: 'btnMaybe', no: 'btnNotTonight' };
  for (let i = 0; i < 8; i++) {
    const before = (await state(page))[key].reactions.length;
    await page.locator(`#${btn[reactions[i % reactions.length]]}-${session}`).click();
    await page.waitForFunction(({ k, key, n }) => JSON.parse(localStorage.getItem(k))[key].reactions.length > n, { k: STATE_KEY, key, n: before });
  }
}

export async function setTime(page, hour, minute) {
  const change = page.locator('.milo-timing-change:visible');
  if (await change.count()) await change.click();
  await page.locator('.milo-strip-day').last().click();
  await page.locator('.milo-clock-num', { hasText: new RegExp(`^${hour}$`) }).click();
  await page.locator('.milo-clock-num', { hasText: new RegExp(`^${String(minute).padStart(2, '0')}$`) }).click();
  await page.locator('.milo-timing-form button[type=submit]').click();
}

// Asha (A, creator) and Ravi (B, partner) reach "You're both in" with 7:30 PM set.
// browse: how many times B taps "See the other two" before confirming.
export async function agreedPair({ site, browser, errors, browse = 0 }) {
  const a = await phone(browser, errors);
  const b = await phone(browser, errors);
  await a.page.goto(`${site}/app/`);
  await a.page.locator('.milo-first-open').click();
  await a.page.locator('.milo-home-occ-1').click();
  await moodsAndDeck(a.page, 'aarav', ['intimate', 'low-key', 'fun'], ['into']);
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
  const seatA = await seat(a.page);
  await until(async () => (await serverView(a.page, seatA)).me.finished, 15000, "A's half");
  await b.page.goto(inviteUrl);
  await b.page.locator('#miloJoinName').fill('Ravi');
  await b.page.locator('#miloJoinBtn').click();
  await b.page.waitForURL(/\/app\/\?as=sneha$/);
  const seatB = await seat(b.page);
  await moodsAndDeck(b.page, 'sneha', ['fun', 'novelty', 'buzz'], ['into', 'maybe', 'no']);
  await until(async () => Boolean((await serverView(b.page, seatB)).shared_result), 15000, 'shared result');
  await a.page.goto(`${site}/app/`);
  await a.page.locator('.milo-first-open').click({ timeout: 3000 }).catch(() => {});
  await a.page.locator('#miloHomeOpen').click();
  await a.page.locator('#miloPsSuggest-aarav').click();
  await a.page.locator('.milo-cta-suggested-notice').waitFor();
  await b.page.goto(`${site}/app/?as=sneha`);
  await comeBack(b.page);
  for (let i = 0; i < browse; i++) { await b.page.locator('#miloPsOther-sneha').click(); await b.page.waitForTimeout(150); }
  // Back to the suggested night through the partner banner, if browsing moved away from it.
  if (browse && !(await b.page.locator('#miloPsConfirm-sneha').count())) await b.page.locator('#miloPsBanner-sneha').click();
  await b.page.locator('#miloPsConfirm-sneha').click();
  await b.page.locator('.milo-closing-state').waitFor();
  await setTime(b.page, 7, 30);
  await b.page.locator('.milo-timing-saved:visible').waitFor();
  await comeBack(a.page);
  await a.page.locator('.milo-closing-state').waitFor();
  await a.page.waitForFunction(() => /7:30 PM/.test(document.querySelector('.milo-timing-saved:not([hidden])')?.textContent || ''));
  return { a, b, seatA, seatB, timing: (await serverView(a.page, seatA)).timing };
}
