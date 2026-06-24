import { neon } from '@neondatabase/serverless';

let _sql = null;

/**
 * Returns a Neon SQL tagged-template function.
 * Falls back to null if DATABASE_URL is not configured (e.g. local dev).
 */
export function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Please create a Postgres database in Vercel and add the DATABASE_URL environment variable.'
    );
  }
  _sql = neon(url);
  return _sql;
}
