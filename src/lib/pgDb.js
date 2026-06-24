import { createClient } from '@supabase/supabase-js';

let _supabase = null;

/**
 * Returns a singleton Supabase client for server-side use.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
export function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão configuradas. ' +
      'Adicione-as nas variáveis de ambiente da Vercel.'
    );
  }

  // service_role key bypasses RLS — safe for server-only usage
  _supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  return _supabase;
}
