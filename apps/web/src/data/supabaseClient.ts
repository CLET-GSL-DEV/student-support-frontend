import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

/**
 * Browser Supabase client for the Admin Portal's `supabase` data source
 * (VITE_ADMIN_DATA_SOURCE=supabase). Uses the PUBLIC anon key only — never a
 * service-role key, which must never reach the browser. The Supabase
 * repositories in src/data/<domain>/supabase.ts read and write through this.
 *
 * `null` when the env is unset, so a build without Supabase configured still
 * boots (e.g. running in mock mode). `requireSupabase()` throws a clear error
 * if a Supabase repository is actually exercised without configuration.
 *
 * Session persistence is off: this app authenticates via ZITADEL, not Supabase
 * Auth, so there is no Supabase session to store.
 */
export const supabase: SupabaseClient | null =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
