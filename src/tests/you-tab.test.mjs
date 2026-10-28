// You tab (who you are, who your person is) and Nights > Past, on a real browser.
// The accounts API routes are not built yet, so this test answers them with page.route.
// Builds dist-accounts with VITE_MILO_ACCOUNTS=true; the default build (dist) is checked
// to make no accounts calls at all.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const SHOTS = process.env.MILO_SCREENS || null;
const KEY = 'milo_prototype_v1_state';
const ON = 'http://127.0.0.1:4191';
const OFF = 'http://127.0.0.1:4192';
let browser; const servers = [];

async function preview(outDir, port) {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', outDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root });
  servers.push(server);
  for (let n = 0; n < 100; n++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/app/`)).ok) return; } catch { /* starting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`preview ${outDir} did not start`);
}

before(async () => {
  const built = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-accounts', '--emptyOutDir', '--logLevel', 'error'], {
    cwd: root, env: { ...process.env, VITE_MILO_ACCOUNTS: 'true' }, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr);
  await preview('dist-accounts', 4191);
  await preview('dist', 4192);
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => { await browser?.close(); for (const s of servers) s.kill(); });

const PEOPLE = { people: [{ id: 'p_ravi', display_name: 'Ravi', since: '2026-10-03', nights: { booked: 3, planned: 1 } }] };
const NIGHTS = { nights: [
  { plan_id: 'a1', mode: 'together', night_id: 'slow-one', date: '2026-10-11', time: '19:30', person_id: 'p_ravi', status: 'booked' },
  { plan_id: 'a2', mode: 'solo', night_id: 'slow-one', date: '2026-10-20', time: '20:00', person_id: null, status: 'planned' },
  { plan_id: 'a3', mode: 'together', night_id: 'slow-one', date: '2099-01-01', time: '20:00', person_id: 'p_ravi', status: 'planned' }
] };

const ME = { account: { id: 'a_asha', email: 'asha@example.com', name: 'Asha' } };
async function phone({ me = [200, ME], people = [200, PEOPLE], nights = [200, NIGHTS] } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = []; const calls = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/me/')) calls.push(new URL(r.url()).pathname); });
  const answer = (route, [status, body]) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/me', r => answer(r, me));
  await page.route('**/api/me/people', r => answer(r, people));
  await page.route('**/api/me/nights', r => answer(r, nights));
  return { context, page, errors, calls };
}
const shot = async (page, name) => { if (SHOTS) { await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); } };
const signIn = (page, user) => page.evaluate(({ KEY, user }) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.sessionA.user = { email: user.email }; s.sessionA.name = user.name; localStorage.setItem(KEY, JSON.stringify(s));
}, { KEY, user });

test('switch off: the default build makes no accounts calls and shows the quiet placeholder', async () => {
  const { context, page, errors, calls } = await phone();
  try {
    await page.goto(`${OFF}/app/?screen=you`);
    await page.locator('.milo-you').waitFor();
    await page.waitForTimeout(400);
    assert.deepEqual(calls, []);
    assert.equal(await page.locator('#miloYouPersonTitle').textContent(), 'Your person shows up here');
    assert.equal(await page.locator('.milo-you-person').count(), 0);
    assert.equal(await page.locator('#miloYouLoginBtn').textContent(), 'Sign in or create account');
    assert.equal(await page.locator('#miloYouHelp').getAttribute('href'), 'mailto:aaryan@aaryanshah.co.in?subject=Milo%20help');
    await shot(page, 'you-1-signed-out');
    await signIn(page, { email: 'asha@example.com', name: 'Asha' });
    await page.goto(`${OFF}/app/?screen=you`);
    await page.locator('.milo-you-account').waitFor();
    assert.equal(await page.locator('.milo-you-account h2').textContent(), 'Asha');
    assert.equal(await page.locator('.milo-you-account p').textContent(), 'asha@example.com · Signed in');
    await shot(page, 'you-2-signed-in-no-person');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('switch on: your person card, no plan status or plan buttons, rename on this phone', async () => {
  const { context, page, errors, calls } = await phone();
  try {
    await page.goto(`${ON}/app/?screen=you`);
    await page.locator('.milo-you').waitFor();
    await signIn(page, { email: 'asha@example.com', name: 'Asha' });
    await page.goto(`${ON}/app/?screen=you`);
    await page.locator('.milo-you-person').waitFor();
    assert.ok(calls.includes('/api/me/people') && calls.includes('/api/me/nights'));
    assert.equal(await page.locator('#miloYouPersonTitle').textContent(), 'Ravi');
    assert.match(await page.locator('.milo-you-person-head p').textContent(), /^Together on Milo since Oct 2026$/);
    assert.equal(await page.locator('.milo-you-count').textContent(), '4 nights together');
    assert.equal(await page.locator('.milo-you-dots .is-booked').count(), 3);
    assert.equal(await page.locator('.milo-you-dots .is-planned').count(), 1);
    assert.equal(await page.locator('.milo-you-split').textContent(), '3 booked · 1 planned');
    assert.equal(await page.locator('.milo-you-dots').getAttribute('aria-label'), '3 booked nights and 1 planned night');
    assert.deepEqual(await page.locator('.milo-you-pair i').allTextContents(), ['A', 'R']);
    // Plans live on Home and Nights.
    const body = await page.locator('.milo-home-body').textContent();
    for (const words of [/plan a night/i, /plan another/i, /share the link/i, /your link/i, /\bnext\b/i, /resume/i]) assert.doesNotMatch(body, words);
    await shot(page, 'you-3-person-joined');

    await page.locator('#miloYouManagePerson').click();
    assert.equal(await page.locator('#miloYouRename').isVisible(), true);
    await page.locator('#miloYouRenameInput').fill('Ravs <3');
    await shot(page, 'you-4-rename');
    await page.locator('#miloYouRenameSave').click();
    await page.waitForFunction(() => document.querySelector('#miloYouPersonTitle')?.textContent === 'Ravs 3');
    const stored = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).sessionA.personNames, KEY);
    assert.deepEqual(stored, { p_ravi: 'Ravs 3' });
    await page.goto(`${ON}/app/?screen=you`);
    await page.locator('.milo-you-person').waitFor();
    assert.equal(await page.locator('#miloYouPersonTitle').textContent(), 'Ravs 3', 'kept on this phone');

    await page.locator('#miloYouManagePerson').click();
    await page.locator('#miloYouRenameInput').fill('');
    await page.locator('#miloYouRenameSave').click();
    await page.waitForFunction(() => document.querySelector('#miloYouPersonTitle')?.textContent === 'Ravi');

    // Cancel closes without saving.
    await page.locator('#miloYouManagePerson').click();
    await page.locator('#miloYouRenameInput').fill('Nope');
    await page.locator('#miloYouRenameCancel').click();
    assert.equal(await page.locator('#miloYouRename').isVisible(), false);
    assert.equal(await page.locator('#miloYouPersonTitle').textContent(), 'Ravi');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('switch on: Nights > Past lists past nights, newest first, with who and status', async () => {
  const { context, page, errors } = await phone();
  try {
    await page.goto(`${ON}/app/?screen=nights`);
    await page.locator('.milo-nights-past').first().waitFor();
    const rows = await page.locator('.milo-nights-past').evaluateAll(els => els.map(e => [...e.querySelectorAll('span')].map(s => s.textContent)));
    assert.equal(rows.length, 2, 'the 2099 night is not past');
    assert.deepEqual(rows[0], ['8:00 PM, Tue, Oct 20', 'Just you · Planned']);
    assert.deepEqual(rows[1], ['7:30 PM, Sun, Oct 11', 'With Ravi · Booked']);
    await shot(page, 'nights-past');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('switch on: signed out or a broken answer shows the placeholder and an empty Past', async () => {
  for (const people of [[401, {}], [200, { people: [{ id: 'x y', display_name: '' }] }]]) {
    const { context, page, errors } = await phone({ me: people[0] === 401 ? [401, {}] : [200, ME], people, nights: [401, {}] });
    try {
      await page.goto(`${ON}/app/?screen=you`);
      await page.locator('.milo-you').waitFor();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#miloYouPersonTitle').textContent(), 'Your person shows up here');
      await page.locator('.milo-tab[data-tab=nights]').click();
      await page.locator('.milo-nights-heading').first().waitFor();
      assert.equal(await page.locator('.milo-nights-past').count(), 0);
      assert.equal(await page.locator('.milo-nights-empty').last().textContent(), 'Nothing here yet. The good ones go here.');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
