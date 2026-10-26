// TEST-ONLY local stand-in for the Vercel deployment: serves a flag-on build
// (VITE_MILO_PHASE1=true) and the real Phase 1 API handler on an in-memory
// PGlite database loaded from server/schema.sql. No Neon, no Vercel, no
// network beyond 127.0.0.1. Never import this from app or api code.
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../../server/phase1.js';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain', '.md': 'text/markdown' };

export async function startPhase1LocalServer({ distDir, opsSecret = 'local-ops-secret-for-tests' }) {
  const db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql']) await db.exec(await readFile(new URL(`../../../server/${file}`, import.meta.url), 'utf8'));
  // PGlite has one connection: serialize requests like a single pooled client.
  let tail = Promise.resolve();
  const acquire = async () => {
    const previous = tail; let release;
    tail = new Promise(resolve => { release = resolve; }); await previous;
    return { query: (sql, args) => db.query(sql, args), release };
  };
  const env = { NODE_ENV: 'test', MILO_PHASE1_ENABLED: 'true', MILO_PUBLIC_ORIGIN: 'http://127.0.0.1', RATE_LIMIT_SECRET: 'local-test-only', OPS_SECRET: opsSecret };
  // The server clock can be moved forward to test gift reveal times.
  let clockOffset = 0;
  const api = createApi({ acquire, env, clientIp: () => '127.0.0.1', now: () => Date.now() + clockOffset });

  const serveFile = async (pathname, res) => {
    let file = normalize(join(distDir, decodeURIComponent(pathname)));
    if (!file.startsWith(normalize(distDir))) { res.writeHead(403); res.end(); return; }
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { res.writeHead(404); res.end('not found'); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (!url.pathname.startsWith('/api')) { await serveFile(url.pathname, res); return; }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://127.0.0.1${req.url}`, { method: req.method, headers: req.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
    const result = await api(request);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const site = `http://127.0.0.1:${server.address().port}`;
  env.MILO_PUBLIC_ORIGIN = site; // invite links must point back at this server
  return { site, db, opsSecret, setClock: (ms) => { clockOffset = ms - Date.now(); }, close: async () => { await new Promise(resolve => server.close(resolve)); await db.close(); } };
}
