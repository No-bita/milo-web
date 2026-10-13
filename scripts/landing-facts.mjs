// One fact record (src/landing/facts.json) feeds the visible FAQ, JSON-LD, /index.md and /llms.txt.
// `node scripts/landing-facts.mjs`          regenerates the outputs
// `node scripts/landing-facts.mjs --check`  fails if any output has drifted (runs before every build)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const facts = JSON.parse(read('src/landing/facts.json'));
const check = process.argv.includes('--check');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const problems = [];

// Honesty guards: never promise group plans; booking only ever appears as coming soon.
const allText = [facts.tagline, facts.description, ...facts.status, ...facts.faq.flatMap((f) => [f.q, f.a])].join('\n');
if (/group/i.test(allText)) problems.push('facts mention "group"');
for (const s of allText.match(/[^.]*\bbooking\b[^.]*\./gi) || []) {
  if (!/coming soon/i.test(s)) problems.push(`booking sentence without "coming soon": ${s.trim()}`);
}

const faqHtml = [
  '    <section class="lp-section lp-faq" id="faq">',
  '      <h2>Quick answers.</h2>',
  '      <dl>',
  ...facts.faq.flatMap((f) => [`        <dt>${esc(f.q)}</dt>`, `        <dd>${esc(f.a)}</dd>`]),
  '      </dl>',
  '    </section>',
].join('\n');

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${facts.url}#website`, name: facts.name, url: facts.url, description: facts.description, inLanguage: 'en' },
    { '@type': 'Organization', '@id': `${facts.url}#org`, name: facts.name, url: facts.url, description: facts.description },
  ],
};
const jsonLdHtml = `  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>`;

const indexMd = [
  `# ${facts.name}`,
  '',
  `> ${facts.tagline} ${facts.description}`,
  '',
  '## Status',
  '',
  ...facts.status.map((s) => `- ${s}`),
  '',
  '## Quick answers',
  '',
  ...facts.faq.flatMap((f) => [`**${f.q}**`, f.a, '']),
  '## Links',
  '',
  `- Landing page: ${facts.url}`,
  `- Try the prototype: ${facts.prototypeUrl}`,
  '',
].join('\n');

const llmsTxt = [
  `# ${facts.name}`,
  '',
  `> ${facts.description} ${facts.status[0]}`,
  '',
  'Milo is not a dating app. Booking and reminders are coming soon. Milo does not take payments.',
  '',
  '## Pages',
  '',
  `- [Landing page](${facts.url}): what Milo is, how it works, quick answers`,
  `- [Landing page as Markdown](${facts.url}index.md): the same facts in plain text`,
  `- [Prototype](${facts.prototypeUrl}): try the early prototype in your browser`,
  '',
].join('\n');

function swap(html, name, body, indent) {
  const re = new RegExp(`<!-- facts:${name}:start -->[\\s\\S]*?<!-- facts:${name}:end -->`);
  if (!re.test(html)) { problems.push(`index.html is missing the facts:${name} markers`); return html; }
  return html.replace(re, () => `<!-- facts:${name}:start -->\n${body}\n${indent}<!-- facts:${name}:end -->`);
}

let html = read('index.html');
html = swap(html, 'jsonld', jsonLdHtml, '  ');
html = swap(html, 'faq', faqHtml, '    ');

const outputs = [['index.html', html], ['public/index.md', indexMd], ['public/llms.txt', llmsTxt]];
for (const [path, content] of outputs) {
  const current = existsSync(join(root, path)) ? read(path) : null;
  if (current === content) continue;
  if (check) problems.push(`${path} is out of date. Run: node scripts/landing-facts.mjs`);
  else writeFileSync(join(root, path), content);
}

if (problems.length) {
  console.error(problems.map((p) => `landing-facts: ${p}`).join('\n'));
  process.exit(1);
}
console.log(check ? 'landing-facts: in sync' : 'landing-facts: written');
