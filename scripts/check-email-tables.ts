/**
 * Check if email management tables exist in the database
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables are not set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Checking email management tables...\n');

  const tables = [
    'email_providers',
    'sender_addresses',
    'email_templates',
    'template_versions',
    'email_queue',
    'email_logs',
    'email_events',
    'email_suppressions',
    'email_unsubscribes',
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: NOT FOUND (${error.message})`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count} rows)`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR (${error})`);
    }
  }
}

main();
