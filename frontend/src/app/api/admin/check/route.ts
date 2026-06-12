import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Try to get profile
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Auto-create profile if missing (fallback for when DB trigger isn't set up)
    if (profileError || !profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email!.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        })
        .select('role')
        .single();

      if (insertError) {
        console.error('Auto-create profile failed:', insertError.message);
        return NextResponse.json({ isAdmin: false, error: 'Profile creation failed' }, { status: 500 });
      }

      // New users are not admin by default
      return NextResponse.json({ isAdmin: false, role: 'user' });
    }

    return NextResponse.json({ isAdmin: profile.role === 'admin', role: profile.role });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal error' }, { status: 500 });
  }
}
