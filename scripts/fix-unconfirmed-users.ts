/**
 * Script to fix users with unconfirmed emails in Supabase Auth
 * This confirms their email in Supabase Auth so they can sign in
 * They will still need to verify via our custom email verification flow
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function fixUnconfirmedUsers() {
  console.log('🔧 Starting to fix unconfirmed users...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
    const { data, error } = await (supabase.auth.admin as any).listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    const users = data?.users || [];
    console.log(`📊 Found ${users.length} total users\n`);

    let fixedCount = 0;
    let alreadyConfirmedCount = 0;

    for (const user of users) {
      const email = user.email;
      const isConfirmed = user.email_confirmed_at !== null;

      if (!isConfirmed) {
        console.log(`� Confirming email for: ${email}`);
        
        // Confirm the email in Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error(`  ❌ Failed to confirm ${email}:`, updateError.message);
        } else {
          console.log(`  ✅ Email confirmed for ${email}`);
          fixedCount++;
        }
      } else {
        alreadyConfirmedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  ✅ Fixed: ${fixedCount} users`);
    console.log(`  ℹ️  Already confirmed: ${alreadyConfirmedCount} users`);
    console.log(`  📊 Total: ${users.length} users`);
    console.log('\n✨ Done!');
    console.log('\nNote: Users can now sign in, but they still need to verify their email via our custom verification flow.');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
fixUnconfirmedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
