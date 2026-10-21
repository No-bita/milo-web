import pg from 'pg';
import { createApi } from '../server/phase1.js';
let pool;
const api = createApi({
  acquire: async () => {
    if (!process.env.DATABASE_URL) throw new Error('Database not configured');
    if (!pool) {
      // URL params override pg's explicit ssl option, so unsafe modes must be
      // rejected, not just defaulted. pg's duplicate-param handling is
      // last-wins. Never log the URL: it carries credentials.
      const databaseUrl = new URL(process.env.DATABASE_URL);
      const last = name => databaseUrl.searchParams.getAll(name).at(-1);
      const insecure = ['0','no-verify','false','disable'].includes(last('ssl'))
        || ['disable','no-verify'].includes(last('sslmode'))
        || last('uselibpqcompat') === 'true';
      if (insecure) throw new Error('Milo database SSL must validate certificates');
      pool = new pg.Pool({ connectionString:process.env.DATABASE_URL, ssl:{ rejectUnauthorized:true }, max:2, connectionTimeoutMillis:5000, idleTimeoutMillis:10000, statement_timeout:8000 });
      // Idle clients can fail outside a request. pg removes the failed client;
      // handle its event without logging credentials, SQL or private payloads.
      pool.on('error', () => { console.error('Milo database idle connection error'); });
    }
    return pool.connect();
  },
  // Vercel sets/overwrites this trusted header. Do not trust x-forwarded-for.
  // A different host MUST supply its own trusted ingress IP implementation.
  clientIp: request => process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() : null
});
export default { fetch: api };
