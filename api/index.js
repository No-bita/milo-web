import pg from 'pg';
import { createApi } from '../server/phase1.js';
let pool;
const api = createApi({
  acquire: async () => {
    if (!process.env.DATABASE_URL) throw new Error('Database not configured');
    if (!pool) {
      pool = new pg.Pool({ connectionString:process.env.DATABASE_URL, max:2, connectionTimeoutMillis:5000, idleTimeoutMillis:10000, statement_timeout:8000 });
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
