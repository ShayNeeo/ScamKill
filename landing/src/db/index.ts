import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Drizzle client factory. `DB` is the D1 binding declared in wrangler.jsonc.
 * The client is cheap to create per request; do not cache it across requests.
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
