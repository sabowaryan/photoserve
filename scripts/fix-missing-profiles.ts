/**
 * Script to create missing profiles for users in Supabase Auth
 * This fixes users who exist in auth.users but not in public.profiles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function fixMissingProfiles() {
  console.log('🔧 Starting to fix missing profiles...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get all users from Supabase Auth
    const { data: authData, error: authError } = await (supabase.auth.admin as any).listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const authUsers = authData?.users || [];
    console.log(`📊 Found ${authUsers.length} users in Supabase Auth\n`);

    let createdCount = 0;
    let alreadyExistsCount = 0;
    let errorCount = 0;

    for (const authUser of authUsers) {
      const userId = authUser.id;
      const email = authUser.email;
      const name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || email?.split('@')[0];

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        alreadyExistsCount++;
        continue;
      }

      // Profile doesn't exist, create it
      console.log(`🔄 Creating profile for: ${email} (${userId})`);

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email!,
          name: name,
          email_verified: authUser.email_confirmed_at !== null,
          email_verified_at: authUser.email_confirmed_at,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`  ❌ Failed to create profile for ${email}:`, insertError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Profile created for ${email}`);
        createdCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  ✅ Created: ${createdCount} profiles`);
    console.log(`  ℹ️  Already exists: ${alreadyExistsCount} profiles`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total auth users: ${authUsers.length}`);
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
fixMissingProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
