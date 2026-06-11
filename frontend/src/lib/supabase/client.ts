import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
// Service role key is server-side ONLY. Never import this module from a 'use client'
// component. Only use supabaseAdmin in trusted server code (API routes, server
// components, scripts).
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Bypasses RLS. Use only from server-side code. Do not expose to client bundle.
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getSupabase(): SupabaseClient {
  return supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin;
}
