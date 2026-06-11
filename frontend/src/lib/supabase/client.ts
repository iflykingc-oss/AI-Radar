/**
 * Supabase client - re-exports from the new @supabase/ssr setup.
 * Existing imports from '@/lib/supabase/client' will continue to work.
 */
import { createClient as createBrowserClient } from '@/utils/supabase/client';

// Singleton browser client for use in client components
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient();
  }
  return _supabase;
}

// Named export for backward compatibility
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  from(table: string) {
    return getSupabase().from(table);
  },
};
