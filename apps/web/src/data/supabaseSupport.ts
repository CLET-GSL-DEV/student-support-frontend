import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Shared plumbing for the Supabase-backed repositories (src/data/<domain>/
 * supabase.ts). Throw on a Postgrest error, otherwise return the (non-null)
 * data. Works for both list queries (data: Row[]) and `.single()` queries
 * (data: Row) — pass the expected shape as the type argument.
 */
export function unwrap<T>(result: { data: unknown; error: PostgrestError | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) {
    throw new Error('Supabase returned no data for a required read.');
  }
  return result.data as T;
}

/** Client-side id for new text-PK rows (matches the mock repositories' ids). */
export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
