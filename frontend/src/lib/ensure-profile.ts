import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

/**
 * Ensure a user_profiles row exists for the given user.
 * Creates one if missing (fallback for when DB trigger isn't set up).
 * Returns the profile row.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ id: string; role: string } | null> {
  // Try to get existing profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profile) return profile;

  // Create profile if missing
  const { data: newProfile, error } = await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      email: user.email!,
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email!.split('@')[0],
      avatar_url:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null,
    })
    .select('id, role')
    .single();

  if (error) {
    console.error('Auto-create profile failed:', error.message);
    return null;
  }

  return newProfile;
}
