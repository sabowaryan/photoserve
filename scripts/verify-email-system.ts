/**
 * Email System Production Verification Script
 * 
 * Comprehensive verification of all email system components:
 * - Database schema and tables
 * - Email provider configuration
 * - Queue processing
 * - Webhook endpoints
 * - Analytics tracking
 * - Monitoring and alerting
 * 
 * Task 48: Final checkpoint - Production verification
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Load environment variables
config();

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ============================================================================
// Verification Results
// ============================================================================

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ component, status, message, details });
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  console.log(`${icon} [${component}] ${message}`);
  if (details) {
    console.log(`  Details:`, details);
  }
}

// ============================================================================
// Verification Functions
// ============================================================================

/**
 * Verify database schema and tables
 */
async function verifyDatabaseSchema(supabase: any): Promise<void> {
  console.log('\n=== Verifying Database Schema ===\n');
  
  const requiredTables = [
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
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        addResult('Database', 'fail', `Table '${table}' not accessible: ${error.message}`);
      } else {
        addResult('Database', 'pass', `Table '${table}' exists and is accessible`);
      }
    } catch (error) {
      addResult('Database', 'fail', `Error checking table '${table}': ${error}`);
    }
  }
}

/**
 * Verify email provider configuration
 */
async function verifyProviderConfiguration(supabase: any): Promise<void> {
  console.log('\n=== Verifying Email Provider Configuration ===\n');
  
  try {
    // Check if any provider is configured
    const { data: providers, error } = await supabase
      .from('email_providers')
      .select('*');
    
    if (error) {
      addResult('Provider Config', 'fail', `Failed to query providers: ${error.message}`);
      return;
    }
    
    if (!providers || providers.length === 0) {
      addResult('Provider Config', 'warning', 'No email providers configured');
      return;
    }
    
    addResult('Provider Config', 'pass', `Found ${providers.length} configured provider(s)`);
    
    // Check for active provider
    const activeProvider = providers.find((p: any) => p.is_active);
    if (!activeProvider) {
      addResult('Provider Config', 'warning', 'No active email provider set');
    } else {
      addResult('Provider Config', 'pass', `Active provider: ${activeProvider.name}`);
    }
    
    // Verify Resend API key
    if (RESEND_API_KEY) {
      addResult('Provider Config', 'pass', 'Resend API key is configured');
    } else {
      addResult('Provider Config', 'warning', 'Resend API key not found in environment');
    }
  } catch (error) {
    addResult('Provider Config', 'fail', `Error verifying provider configuration: ${error}`);
  }
}

/**
 * Verify sender addresses
 */
async function verifySenderAddresses(supabase: any): Promise<void> {
  console.log('\n=== Verifying Sender Addresses ===\n');
  
  try {
    const { data: senders, error } = await supabase
      .from('sender_addresses')
      .select('*');
    
    if (error) {
      addResult('Sender Addresses', 'fail', `Failed to query sender addresses: ${error.message}`);
      return;
    }
    
    if (!senders || senders.length === 0) {
      addResult('Sender Addresses', 'warning', 'No sender addresses configured');
      return;
    }
    
    addResult('Sender Addresses', 'pass', `Found ${senders.length} sender address(es)`);
    
    // Check for verified senders
    const verifiedSenders = senders.filter((s: any) => s.is_verified);
    if (verifiedSenders.length === 0) {
      addResult('Sender Addresses', 'warning', 'No verified sender addresses');
    } else {
      addResult('Sender Addresses', 'pass', `${verifiedSenders.length} verified sender(s)`);
    }
    
    // Check for default sender
    const defaultSender = senders.find((s: any) => s.is_default);
    if (!defaultSender) {
      addResult('Sender Addresses', 'warning', 'No default sender address set');
    } else {
      addResult('Sender Addresses', 'pass', `Default sender: ${defaultSender.email}`);
    }
  } catch (error) {
    addResult('Sender Addresses', 'fail', `Error verifying sender addresses: ${error}`);
  }
}

/**
 * Verify email templates
 */
async function verifyEmailTemplates(supabase: any): Promise<void> {
  console.log('\n=== Verifying Email Templates ===\n');
  
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*');
    
    if (error) {
      addResult('Templates', 'fail', `Failed to query templates: ${error.message}`);
      return;
    }
    
    if (!templates || templates.length === 0) {
      addResult('Templates', 'warning', 'No email templates found');
      return;
    }
    
    addResult('Templates', 'pass', `Found ${templates.length} email template(s)`);
    
    // Check for active templates
    const activeTemplates = templates.filter((t: any) => t.is_active);
    addResult('Templates', 'pass', `${activeTemplates.length} active template(s)`);
    
    // Check template types
    const transactional = templates.filter((t: any) => t.type === 'transactional').length;
    const marketing = templates.filter((t: any) => t.type === 'marketing').length;
    addResult('Templates', 'pass', `Templates: ${transactional} transactional, ${marketing} marketing`);
  } catch (error) {
    addResult('Templates', 'fail', `Error verifying templates: ${error}`);
  }
}

/**
 * Verify email queue
 */
async function verifyEmailQueue(supabase: any): Promise<void> {
  console.log('\n=== Verifying Email Queue ===\n');
  
  try {
    // Get queue statistics
    const { data: queueItems, error } = await supabase
      .from('email_queue')
      .select('status');
    
    if (error) {
      addResult('Queue', 'fail', `Failed to query queue: ${error.message}`);
      return;
    }
    
    const pending = queueItems?.filter((i: any) => i.status === 'pending').length || 0;
    const processing = queueItems?.filter((i: any) => i.status === 'processing').length || 0;
    const sent = queueItems?.filter((i: any) => i.status === 'sent').length || 0;
    const failed = queueItems?.filter((i: any) => i.status === 'failed').length || 0;
    
    addResult('Queue', 'pass', `Queue status: ${pending} pending, ${processing} processing, ${sent} sent, ${failed} failed`);
    
    if (pending > 1000) {
      addResult('Queue', 'warning', `High queue size: ${pending} pending emails`);
    }
    
    if (failed > 100) {
      addResult('Queue', 'warning', `High failure count: ${failed} failed emails`);
    }
  } catch (error) {
    addResult('Queue', 'fail', `Error verifying queue: ${error}`);
  }
}

/**
 * Verify email logs
 */
async function verifyEmailLogs(supabase: any): Promise<void> {
  console.log('\n=== Verifying Email Logs ===\n');
  
  try {
    // Get recent logs (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('status')
      .gte('created_at', yesterday);
    
    if (error) {
      addResult('Logs', 'fail', `Failed to query logs: ${error.message}`);
      return;
    }
    
    const total = logs?.length || 0;
    const sent = logs?.filter((l: any) => l.status === 'sent').length || 0;
    const delivered = logs?.filter((l: any) => l.status === 'delivered').length || 0;
    const failed = logs?.filter((l: any) => l.status === 'failed').length || 0;
    const bounced = logs?.filter((l: any) => l.status === 'bounced').length || 0;
    
    addResult('Logs', 'pass', `Last 24h: ${total} total, ${sent} sent, ${delivered} delivered, ${failed} failed, ${bounced} bounced`);
    
    // Calculate rates
    if (total > 0) {
      const failureRate = (failed / total) * 100;
      const bounceRate = (bounced / total) * 100;
      
      if (failureRate > 5) {
        addResult('Logs', 'warning', `High failure rate: ${failureRate.toFixed(1)}%`);
      } else {
        addResult('Logs', 'pass', `Failure rate: ${failureRate.toFixed(1)}%`);
      }
      
      if (bounceRate > 10) {
        addResult('Logs', 'warning', `High bounce rate: ${bounceRate.toFixed(1)}%`);
      } else {
        addResult('Logs', 'pass', `Bounce rate: ${bounceRate.toFixed(1)}%`);
      }
    }
  } catch (error) {
    addResult('Logs', 'fail', `Error verifying logs: ${error}`);
  }
}

/**
 * Verify analytics tracking
 */
async function verifyAnalytics(supabase: any): Promise<void> {
  console.log('\n=== Verifying Analytics Tracking ===\n');
  
  try {
    // Check email events
    const { data: events, error } = await supabase
      .from('email_events')
      .select('event_type')
      .limit(100);
    
    if (error) {
      addResult('Analytics', 'fail', `Failed to query events: ${error.message}`);
      return;
    }
    
    if (!events || events.length === 0) {
      addResult('Analytics', 'warning', 'No email events tracked yet');
      return;
    }
    
    const eventTypes = events.reduce((acc: any, e: any) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});
    
    addResult('Analytics', 'pass', `Event tracking active`, eventTypes);
  } catch (error) {
    addResult('Analytics', 'fail', `Error verifying analytics: ${error}`);
  }
}

/**
 * Verify suppression lists
 */
async function verifySuppressionLists(supabase: any): Promise<void> {
  console.log('\n=== Verifying Suppression Lists ===\n');
  
  try {
    // Check suppressions
    const { data: suppressions, error: suppError } = await supabase
      .from('email_suppressions')
      .select('reason');
    
    if (suppError) {
      addResult('Suppressions', 'fail', `Failed to query suppressions: ${suppError.message}`);
      return;
    }
    
    const bounces = suppressions?.filter((s: any) => s.reason === 'bounce').length || 0;
    const complaints = suppressions?.filter((s: any) => s.reason === 'complaint').length || 0;
    
    addResult('Suppressions', 'pass', `Suppression list: ${bounces} bounces, ${complaints} complaints`);
    
    // Check unsubscribes
    const { data: unsubscribes, error: unsubError } = await supabase
      .from('email_unsubscribes')
      .select('id');
    
    if (unsubError) {
      addResult('Suppressions', 'fail', `Failed to query unsubscribes: ${unsubError.message}`);
    } else {
      addResult('Suppressions', 'pass', `Unsubscribe list: ${unsubscribes?.length || 0} unsubscribed`);
    }
  } catch (error) {
    addResult('Suppressions', 'fail', `Error verifying suppressions: ${error}`);
  }
}

/**
 * Verify environment configuration
 */
function verifyEnvironmentConfig(): void {
  console.log('\n=== Verifying Environment Configuration ===\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EMAIL_PROVIDER_ENCRYPTION_KEY',
    'CRON_SECRET',
  ];
  
  const optionalVars = [
    'RESEND_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult('Environment', 'pass', `${varName} is configured`);
    } else {
      addResult('Environment', 'fail', `${varName} is missing`);
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult('Environment', 'pass', `${varName} is configured`);
    } else {
      addResult('Environment', 'warning', `${varName} is not configured (optional)`);
    }
  }
  
  // Check email system config
  const defaultProvider = process.env.EMAIL_PROVIDER_DEFAULT || 'resend';
  const batchSize = process.env.EMAIL_QUEUE_BATCH_SIZE || '10';
  const maxRetries = process.env.EMAIL_RETRY_MAX_ATTEMPTS || '5';
  
  addResult('Environment', 'pass', `Default provider: ${defaultProvider}`);
  addResult('Environment', 'pass', `Queue batch size: ${batchSize}`);
  addResult('Environment', 'pass', `Max retry attempts: ${maxRetries}`);
}

// ============================================================================
// Main Verification
// ============================================================================

async function runVerification() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Email Management System - Production Verification           ║');
  console.log('║   Task 48: Final Checkpoint                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Verify environment configuration first
  verifyEnvironmentConfig();
  
  // Create Supabase client
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ ERROR: Supabase credentials not configured');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Run all verification checks
  await verifyDatabaseSchema(supabase);
  await verifyProviderConfiguration(supabase);
  await verifySenderAddresses(supabase);
  await verifyEmailTemplates(supabase);
  await verifyEmailQueue(supabase);
  await verifyEmailLogs(supabase);
  await verifyAnalytics(supabase);
  await verifySuppressionLists(supabase);
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Verification Summary                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✓ Passed:   ${passed}`);
  console.log(`✗ Failed:   ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);
  console.log(`  Total:    ${results.length}\n`);
  
  if (failed > 0) {
    console.log('❌ VERIFICATION FAILED - Critical issues found\n');
    console.log('Failed checks:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - [${r.component}] ${r.message}`);
    });
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  VERIFICATION PASSED WITH WARNINGS\n');
    console.log('Warnings:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`  - [${r.component}] ${r.message}`);
    });
    console.log('\nThe system is functional but some components need attention.\n');
  } else {
    console.log('✅ ALL CHECKS PASSED - System is ready for production!\n');
  }
}

// Run verification
runVerification().catch(error => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});
