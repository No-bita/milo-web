// Site plumbing from the 2026-10-28 audit: /app/ has a branded loading shell and a
// no-JavaScript message, link previews, a branded 404, and only content-hashed assets
// are cached forever. Reads the built dist/ (test:regression builds it first).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = (p) => readFile(new URL(`../../dist/${p}`, import.meta.url), 'utf8');
const site = 'http://127.0.0.1:4193';
let server, browser;

before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4193', '--strictPort'], { cwd: root });
  for (let n = 0; n < 100; n++) { try { if ((await fetch(`${site}/app/`)).ok) break; } catch { /* starting */ } await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), headless: true });
});
after(async () => { await browser?.close(); server?.kill(); });

test('/app/ carries the landing link preview, theme colour and icon', async () => {
  const html = await dist('app/index.html');
  for (const tag of [
    '<meta property="og:url" content="https://www.aaryanshah.co.in/app/" />',
    '<meta property="og:title" content="milo. - You picked the person. Milo handles the plan." />',
    '<meta property="og:image" content="https://www.aaryanshah.co.in/og-image.png" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="theme-color" content="#FBF8F4" />',
    '<link rel="icon" type="image/svg+xml" href="../favicon.svg" />'
  ]) assert.ok(html.includes(tag), tag);
  // Same words as the landing page's own preview.
  const landing = await dist('index.html');
  for (const prop of ['og:title', 'og:description', 'og:image']) {
    const pick = (h) => h.match(new RegExp(`<meta property="${prop}" content="([^"]+)"`))[1];
    assert.equal(pick(html), pick(landing), prop);
  }
});

test('loading shell shows before the app and goes once it mounts; no-JS gets a message', async () => {
  const html = await dist('app/index.html');
  assert.match(html, /<div id="app">\s*<div class="milo-boot" role="status">[\s\S]*Loading Milo…/);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${site}/app/?screen=home`);
  await page.locator('.milo-home').waitFor();
  assert.equal(await page.locator('.milo-boot').count(), 0, 'the app replaces the shell');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(251, 248, 244)');
  await context.close();

  // Chromium's script switch does not render <noscript>, so check the markup, and check
  // that a failed script load leaves the branded shell rather than a white page.
  assert.match(html, /<noscript><style>#app\{display:none!important\}<\/style><\/noscript>/);
  assert.match(html, /<noscript>\s*<div class="milo-boot">[\s\S]*Milo needs JavaScript to open\. Go to <a href="https:\/\/www\.aaryanshah\.co\.in\/">aaryanshah\.co\.in<\/a>/);
  const broken = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await broken.newPage();
  await p.route('**/assets/app-*.js', r => r.abort());
  await p.goto(`${site}/app/`);
  assert.equal(await p.locator('.milo-boot-line').first().textContent(), 'Loading Milo…');
  assert.equal(await p.locator('.milo-boot-mark').first().isVisible(), true);
  assert.equal(await p.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(251, 248, 244)');
  await broken.close();
});

test('branded 404 page with a way into the app', async () => {
  const html = await dist('404.html');
  assert.ok(html.includes("<h1>This link didn't open.</h1>"));
  assert.ok(html.includes('It may have been cut off when it was shared. Ask for it again, or start here.'));
  assert.ok(html.includes('<a class="cta" href="/app/">Open Milo</a>'));
  assert.ok(html.includes('<meta name="robots" content="noindex" />'));
});

test('only content-hashed JS and CSS are cached for a year', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const [rule] = config.headers;
  assert.deepEqual(rule.headers, [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]);
  // "/assets/:file(<regex>)": check the regex against what the build actually wrote.
  const pattern = new RegExp(`^/assets/${rule.source.match(/^\/assets\/:file\((.+)\)$/)[1]}$`);
  const files = await readdir(new URL('../../dist/assets/', import.meta.url));
  const hashed = files.filter(f => /\.(js|css)$/.test(f));
  assert.ok(hashed.length >= 4);
  for (const f of hashed) assert.ok(pattern.test(`/assets/${f}`), f);
  for (const f of files.filter(f => !/\.(js|css)$/.test(f))) assert.ok(!pattern.test(`/assets/${f}`), `${f} is not hashed, so not cached forever`);
  for (const p of ['/app/', '/index.html', '/assets/app.js', '/og-image.png']) assert.ok(!pattern.test(p), p);
});
