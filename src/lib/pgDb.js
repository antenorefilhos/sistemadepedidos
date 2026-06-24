import { createClient } from '@supabase/supabase-js';

let _supabase = null;

/**
 * Returns a singleton Supabase client for server-side use.
 * Tries SUPABASE_SERVICE_ROLE_KEY first (full access),
 * falls back to SUPABASE_ANON_KEY (injected automatically by Vercel integration).
 */
export function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  // Vercel integration injects SUPABASE_ANON_KEY; prefer service_role if manually set
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas. ' +
      'Conecte o projeto Supabase na Vercel ou adicione as variáveis manualmente.'
    );
  }

  _supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  return _supabase;
}
