/**
 * Verification script for Email Management System migration
 * Run with: npx tsx scripts/verify-email-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Starting Email Management System Migration Verification\n');
  console.log('=' .repeat(70));

  // Test 1: Verify all tables exist
  await testTablesExist();

  // Test 2: Verify indexes exist
  await testIndexesExist();

  // Test 3: Verify RLS policies exist
  await testRLSPolicies();

  // Test 4: Test provider constraints
  await testProviderConstraints();

  // Test 5: Test email validation
  await testEmailValidation();

  // Test 6: Test single active provider trigger
  await testSingleActiveProvider();

  // Test 7: Test single default sender trigger
  await testSingleDefaultSender();

  // Test 8: Test template versioning
  await testTemplateVersioning();

  // Test 9: Test email queue
  await testEmailQueue();

  // Test 10: Test email event tracking
  await testEmailEventTracking();

  // Print summary
  printSummary();
}

async function testTablesExist() {
  const expectedTables = [
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

  for (const table of expectedTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    if (error && error.code !== 'PGRST116') {
      results.push({
        category: 'Tables',
        test: `Table ${table} exists`,
        status: 'FAIL',
        message: error.message,
      });
    } else {
      results.push({
        category: 'Tables',
        test: `Table ${table} exists`,
        status: 'PASS',
      });
    }
  }
}

async function testIndexesExist() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'email_%'
    `,
  });

  if (error) {
    results.push({
      category: 'Indexes',
      test: 'Indexes created',
      status: 'FAIL',
      message: error.message,
    });
  } else {
    const count = data?.[0]?.count || 0;
    results.push({
      category: 'Indexes',
      test: 'Indexes created',
      status: count > 0 ? 'PASS' : 'FAIL',
      message: `${count} indexes found`,
    });
  }
}

async function testRLSPolicies() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT COUNT(*) as count
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'email_%'
    `,
  });

  if (error) {
    results.push({
      category: 'RLS Policies',
      test: 'RLS policies created',
      status: 'FAIL',
      message: error.message,
    });
  } else {
    const count = data?.[0]?.count || 0;
    results.push({
      category: 'RLS Policies',
      test: 'RLS policies created',
      status: count > 0 ? 'PASS' : 'FAIL',
      message: `${count} policies found`,
    });
  }
}

async function testProviderConstraints() {
  // Test invalid provider name (should fail)
  const { error: invalidError } = await supabase
    .from('email_providers')
    .insert({
      name: 'invalid-provider',
      config: { test: 'value' },
    });

  results.push({
    category: 'Constraints',
    test: 'Provider name validation',
    status: invalidError ? 'PASS' : 'FAIL',
    message: invalidError ? 'Invalid provider rejected' : 'Invalid provider accepted',
  });

  // Test valid provider name (should succeed)
  const { error: validError } = await supabase
    .from('email_providers')
    .insert({
      name: 'resend',
      config: { apiKey: 'test_key' },
    });

  results.push({
    category: 'Constraints',
    test: 'Valid provider accepted',
    status: !validError ? 'PASS' : 'FAIL',
    message: validError?.message,
  });

  // Cleanup
  await supabase.from('email_providers').delete().eq('name', 'resend');
}

async function testEmailValidation() {
  // Test invalid email (should fail)
  const { error: invalidError } = await supabase
    .from('sender_addresses')
    .insert({
      email: 'invalid-email',
    });

  results.push({
    category: 'Constraints',
    test: 'Email validation',
    status: invalidError ? 'PASS' : 'FAIL',
    message: invalidError ? 'Invalid email rejected' : 'Invalid email accepted',
  });

  // Test valid email (should succeed)
  const { error: validError } = await supabase
    .from('sender_addresses')
    .insert({
      email: 'test@example.com',
      name: 'Test Sender',
    });

  results.push({
    category: 'Constraints',
    test: 'Valid email accepted',
    status: !validError ? 'PASS' : 'FAIL',
    message: validError?.message,
  });

  // Cleanup
  await supabase.from('sender_addresses').delete().eq('email', 'test@example.com');
}

async function testSingleActiveProvider() {
  // Insert first active provider
  await supabase.from('email_providers').insert({
    name: 'resend',
    is_active: true,
    config: { apiKey: 'test_key' },
  });

  // Insert second active provider
  await supabase.from('email_providers').insert({
    name: 'aws-ses',
    is_active: true,
    config: { region: 'us-east-1' },
  });

  // Check only one is active
  const { data, error } = await supabase
    .from('email_providers')
    .select('*')
    .eq('is_active', true);

  results.push({
    category: 'Triggers',
    test: 'Single active provider',
    status: !error && data?.length === 1 ? 'PASS' : 'FAIL',
    message: `${data?.length || 0} active providers found`,
  });

  // Cleanup
  await supabase.from('email_providers').delete().in('name', ['resend', 'aws-ses']);
}

async function testSingleDefaultSender() {
  // Insert first default sender
  await supabase.from('sender_addresses').insert({
    email: 'sender1@example.com',
    name: 'Sender 1',
    is_default: true,
    is_verified: true,
  });

  // Insert second default sender
  await supabase.from('sender_addresses').insert({
    email: 'sender2@example.com',
    name: 'Sender 2',
    is_default: true,
    is_verified: true,
  });

  // Check only one is default
  const { data, error } = await supabase
    .from('sender_addresses')
    .select('*')
    .eq('is_default', true);

  results.push({
    category: 'Triggers',
    test: 'Single default sender',
    status: !error && data?.length === 1 ? 'PASS' : 'FAIL',
    message: `${data?.length || 0} default senders found`,
  });

  // Cleanup
  await supabase
    .from('sender_addresses')
    .delete()
    .in('email', ['sender1@example.com', 'sender2@example.com']);
}

async function testTemplateVersioning() {
  // Create a template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .insert({
      name: 'Test Template',
      slug: 'test-template',
      type: 'transactional',
      source: 'custom',
      subject: 'Test Subject',
      content: { html: '<p>Test content</p>' },
      variables: ['name', 'email'],
    })
    .select()
    .single();

  if (templateError || !template) {
    results.push({
      category: 'Templates',
      test: 'Template creation',
      status: 'FAIL',
      message: templateError?.message,
    });
    return;
  }

  // Create a version
  const { error: versionError } = await supabase
    .from('template_versions')
    .insert({
      template_id: template.id,
      version: 1,
      subject: 'Test Subject',
      content: { html: '<p>Test content</p>' },
      variables: ['name', 'email'],
    });

  results.push({
    category: 'Templates',
    test: 'Template versioning',
    status: !versionError ? 'PASS' : 'FAIL',
    message: versionError?.message,
  });

  // Cleanup
  await supabase.from('email_templates').delete().eq('id', template.id);
}

async function testEmailQueue() {
  // Create a queued email
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      from_address: 'sender@example.com',
      to_address: 'recipient@example.com',
      subject: 'Test Email',
      html_content: '<p>Test content</p>',
      priority: 'high',
      type: 'transactional',
      status: 'pending',
    })
    .select()
    .single();

  results.push({
    category: 'Queue',
    test: 'Email queue',
    status: !error && data ? 'PASS' : 'FAIL',
    message: error?.message,
  });

  // Cleanup
  if (data) {
    await supabase.from('email_queue').delete().eq('id', data.id);
  }
}

async function testEmailEventTracking() {
  // Create an email log
  const { data: log, error: logError } = await supabase
    .from('email_logs')
    .insert({
      provider: 'resend',
      provider_message_id: 'msg_test_123',
      from_address: 'sender@example.com',
      to_address: 'recipient@example.com',
      subject: 'Test Email',
      status: 'sent',
    })
    .select()
    .single();

  if (logError || !log) {
    results.push({
      category: 'Events',
      test: 'Email event tracking',
      status: 'FAIL',
      message: logError?.message,
    });
    return;
  }

  // Create an event
  const { error: eventError } = await supabase
    .from('email_events')
    .insert({
      log_id: log.id,
      event_type: 'opened',
      event_data: { timestamp: new Date().toISOString() },
    });

  // Check if email_logs was updated
  const { data: updatedLog } = await supabase
    .from('email_logs')
    .select('status, opened_at')
    .eq('id', log.id)
    .single();

  results.push({
    category: 'Events',
    test: 'Email event tracking',
    status: !eventError && updatedLog?.status === 'opened' ? 'PASS' : 'FAIL',
    message: eventError?.message || `Status: ${updatedLog?.status}`,
  });

  // Cleanup
  await supabase.from('email_logs').delete().eq('id', log.id);
}

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY\n');

  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    const passed = categoryResults.filter((r) => r.status === 'PASS').length;
    const failed = categoryResults.filter((r) => r.status === 'FAIL').length;

    console.log(`\n${category}:`);
    console.log(`  ✓ Passed: ${passed}`);
    console.log(`  ✗ Failed: ${failed}`);

    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      console.log(`    ${color}${icon}${reset} ${result.test}${result.message ? ` - ${result.message}` : ''}`);
    }
  }

  const totalPassed = results.filter((r) => r.status === 'PASS').length;
  const totalFailed = results.filter((r) => r.status === 'FAIL').length;
  const totalTests = results.length;

  console.log('\n' + '='.repeat(70));
  console.log(`\n📈 OVERALL: ${totalPassed}/${totalTests} tests passed`);

  if (totalFailed === 0) {
    console.log('\n✅ All tests passed! Migration is successful.\n');
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the errors above.\n`);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});
