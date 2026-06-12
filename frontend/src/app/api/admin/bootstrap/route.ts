import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Bootstrap the first admin user.
 * Only works when NO admin exists yet. First caller becomes admin.
 * POST /api/admin/bootstrap
 */
export async function POST() {
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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role to check if any admin exists
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: admins, error: adminCheckError } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) {
      console.error('Admin check error:', adminCheckError.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (admins && admins.length > 0) {
      return NextResponse.json({
        error: 'Admin already exists. Use set-role endpoint instead.',
      }, { status: 403 });
    }

    // No admin exists - make this user the first admin
    // Upsert profile with admin role
    const { error: upsertError } = await adminClient
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email!.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: 'admin',
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('Upsert error:', upsertError.message);
      return NextResponse.json({ error: 'Failed to set admin' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully set ${user.email} as the first admin!`,
      userId: user.id,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
