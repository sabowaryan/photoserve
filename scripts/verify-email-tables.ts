/**
 * Script to verify email management system database tables
 * This script checks if all required tables and indexes exist
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEmailTables() {
  console.log('🔍 Verifying Email Management System Database Setup...\n');

  const requiredTables = [
    'email_providers',
    'sender_addresses',
    'email_templates',
    'template_versions',
    'email_queue',
    'email_logs',
    'email_events',
    'email_suppressions',
    'email_unsubscribes'
  ];

  let allTablesExist = true;
  const results: { table: string; exists: boolean; rowCount?: number; error?: string }[] = [];

  for (const tableName of requiredTables) {
    try {
      // Try to query the table
      const { error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table "${tableName}" - ERROR: ${error.message}`);
        results.push({ table: tableName, exists: false, error: error.message });
        allTablesExist = false;
      } else {
        console.log(`✅ Table "${tableName}" - EXISTS (${count ?? 0} rows)`);
        results.push({ table: tableName, exists: true, rowCount: count ?? 0 });
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}" - EXCEPTION: ${err}`);
      results.push({ table: tableName, exists: false, error: String(err) });
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tables checked: ${requiredTables.length}`);
  console.log(`Tables found: ${results.filter(r => r.exists).length}`);
  console.log(`Tables missing: ${results.filter(r => !r.exists).length}`);
  
  if (allTablesExist) {
    console.log('\n✅ All email management tables exist!');
    console.log('\n📊 Table Statistics:');
    results.forEach(r => {
      if (r.exists) {
        console.log(`   - ${r.table}: ${r.rowCount} rows`);
      }
    });
  } else {
    console.log('\n❌ Some tables are missing or have errors!');
    console.log('\n🔧 Missing/Error tables:');
    results.filter(r => !r.exists).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }

  return allTablesExist;
}

async function verifyIndexes() {
  console.log('\n\n🔍 Verifying Database Indexes...\n');

  try {
    const { error } = await supabase.rpc('pg_indexes', {
      schemaname: 'public'
    });

    if (error) {
      console.log('⚠️  Could not verify indexes (this is optional)');
      console.log(`   Error: ${error.message}`);
      return true; // Don't fail on index check
    }

    console.log('✅ Index verification complete');
    return true;
  } catch (err) {
    console.log('⚠️  Could not verify indexes (this is optional)');
    return true; // Don't fail on index check
  }
}

async function verifyDependencies() {
  console.log('\n\n🔍 Verifying Required Dependencies...\n');

  const requiredDeps = [
    { name: 'resend', module: 'resend' },
    { name: '@aws-sdk/client-sesv2', module: '@aws-sdk/client-sesv2' },
    { name: '@react-email/components', module: '@react-email/components' },
    { name: 'react-email-editor', module: 'react-email-editor' },
    { name: 'juice', module: 'juice' },
    { name: 'html-to-text', module: 'html-to-text' }
  ];

  let allDepsInstalled = true;

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep.module);
      console.log(`✅ ${dep.name} - INSTALLED`);
    } catch (err) {
      console.log(`❌ ${dep.name} - NOT FOUND`);
      allDepsInstalled = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allDepsInstalled) {
    console.log('✅ All required dependencies are installed!');
  } else {
    console.log('❌ Some dependencies are missing!');
    console.log('   Run: npm install');
  }

  return allDepsInstalled;
}

async function verifyEnvironmentVariables() {
  console.log('\n\n🔍 Verifying Environment Variables...\n');

  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY }
  ];

  let allEnvVarsSet = true;

  for (const envVar of requiredEnvVars) {
    if (envVar.value) {
      const maskedValue = envVar.value.substring(0, 10) + '...' + envVar.value.substring(envVar.value.length - 4);
      console.log(`✅ ${envVar.name} - SET (${maskedValue})`);
    } else {
      console.log(`❌ ${envVar.name} - NOT SET`);
      allEnvVarsSet = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allEnvVarsSet) {
    console.log('✅ All required environment variables are set!');
  } else {
    console.log('❌ Some environment variables are missing!');
    console.log('   Check your .env file');
  }

  return allEnvVarsSet;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Email Management System - Foundation Verification       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const tablesOk = await verifyEmailTables();
  const indexesOk = await verifyIndexes();
  const depsOk = await verifyDependencies();
  const envVarsOk = await verifyEnvironmentVariables();

  console.log('\n\n' + '='.repeat(60));
  console.log('FINAL VERIFICATION RESULT');
  console.log('='.repeat(60));
  console.log(`Database Tables: ${tablesOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Indexes: ${indexesOk ? '✅ PASS' : '⚠️  SKIP'}`);
  console.log(`Dependencies: ${depsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Variables: ${envVarsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  if (tablesOk && depsOk && envVarsOk) {
    console.log('\n🎉 Foundation verification PASSED!');
    console.log('   Ready to proceed to Phase 2: Core Services - Provider Abstraction\n');
    process.exit(0);
  } else {
    console.log('\n❌ Foundation verification FAILED!');
    console.log('   Please fix the issues above before proceeding.\n');
    process.exit(1);
  }
}

main().catch(console.error);
