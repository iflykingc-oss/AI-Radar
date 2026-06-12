#!/usr/bin/env node
/**
 * Set the first admin user for AI Radar
 *
 * Usage:
 *   node tools/set-admin.js <user-email>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node tools/set-admin.js <user-email>');
  process.exit(1);
}

async function setAdmin() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // List users to find the target
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const targetUser = users.find(u => u.email === email);
  if (!targetUser) {
    console.error(`User with email "${email}" not found. Have they signed up?`);
    process.exit(1);
  }

  console.log(`Found user: ${targetUser.email} (${targetUser.id})`);

  // Upsert user_profiles with admin role
  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert({
      id: targetUser.id,
      email: targetUser.email,
      display_name: targetUser.user_metadata?.display_name || targetUser.user_metadata?.full_name || email.split('@')[0],
      role: 'admin',
    }, { onConflict: 'id' });

  if (upsertError) {
    console.error('Failed to set admin role:', upsertError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully set ${email} as admin!`);
}

setAdmin().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
