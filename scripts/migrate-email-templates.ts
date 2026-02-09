/**
 * Email Template Migration Script
 * Migrates existing React Email templates to the email management system
 * 
 * This script:
 * 1. Creates template records in the database for each React Email template
 * 2. Adds metadata (variables, type, category, description)
 * 3. Creates initial version records
 * 
 * Requirements: 3.9, 3.10
 * 
 * Usage:
 *   npx tsx scripts/migrate-email-templates.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Template metadata definitions
interface TemplateMetadata {
  name: string;
  slug: string;
  type: 'transactional' | 'marketing';
  subject: string;
  description: string;
  category: string;
  componentPath: string;
  variables: string[];
  requiredVariables: string[];
}

const templates: TemplateMetadata[] = [
  {
    name: 'Purchase Confirmation',
    slug: 'purchase-confirmation',
    type: 'transactional',
    subject: 'Your purchase of "{galleryName}" is confirmed!',
    description: 'Sent to clients when they successfully purchase gallery access',
    category: 'Purchases',
    componentPath: 'src/emails/purchase-confirmation.tsx',
    variables: [
      'buyerName',
      'buyerEmail',
      'galleryName',
      'photoCount',
      'amountPaid',
      'transactionId',
      'purchaseDate',
      'accessLink',
      'accessExpiresAt',
      'photographerName',
      'photographerEmail',
      'photographerLogo',
      'receiptUrl',
    ],
    requiredVariables: [
      'buyerEmail',
      'galleryName',
      'photoCount',
      'amountPaid',
      'transactionId',
      'purchaseDate',
      'accessLink',
      'photographerName',
    ],
  },
  {
    name: 'Sale Notification',
    slug: 'sale-notification',
    type: 'transactional',
    subject: '🎉 New sale! You earned {netEarnings} from "{galleryName}"',
    description: 'Sent to photographers when a client purchases their gallery',
    category: 'Sales',
    componentPath: 'src/emails/sale-notification.tsx',
    variables: [
      'photographerName',
      'galleryName',
      'photoCount',
      'clientEmail',
      'clientName',
      'grossAmount',
      'platformFee',
      'netEarnings',
      'transactionId',
      'saleDate',
      'dashboardLink',
      'saleDetailsLink',
      'totalSalesCount',
      'totalRevenue',
    ],
    requiredVariables: [
      'photographerName',
      'galleryName',
      'photoCount',
      'clientEmail',
      'grossAmount',
      'platformFee',
      'netEarnings',
      'transactionId',
      'saleDate',
      'dashboardLink',
      'saleDetailsLink',
    ],
  },
  {
    name: 'Payout Notification',
    slug: 'payout-notification',
    type: 'transactional',
    subject: '{status} Payout: {amount} {currency}',
    description: 'Sent to photographers when payouts are created, paid, or failed',
    category: 'Payouts',
    componentPath: 'src/emails/payout-notification.tsx',
    variables: [
      'photographerName',
      'payoutId',
      'amount',
      'currency',
      'status',
      'bankName',
      'bankAccountLast4',
      'createdDate',
      'arrivalDate',
      'failureReason',
      'failureCode',
      'dashboardLink',
      'payoutDetailsLink',
      'stripeDashboardLink',
      'remainingBalance',
    ],
    requiredVariables: [
      'photographerName',
      'payoutId',
      'amount',
      'currency',
      'status',
      'bankAccountLast4',
      'createdDate',
      'dashboardLink',
      'payoutDetailsLink',
    ],
  },
  {
    name: 'Dispute Alert',
    slug: 'dispute-alert',
    type: 'transactional',
    subject: '⚠️ URGENT: Dispute received for {amount} - Action required',
    description: 'Sent to photographers when a dispute/chargeback is created',
    category: 'Disputes',
    componentPath: 'src/emails/dispute-alert.tsx',
    variables: [
      'photographerName',
      'amount',
      'reason',
      'reasonDescription',
      'galleryName',
      'clientEmail',
      'purchaseDate',
      'transactionId',
      'responseDeadline',
      'daysRemaining',
      'evidenceRequired',
      'dashboardLink',
      'disputeDetailsLink',
      'stripeDashboardLink',
    ],
    requiredVariables: [
      'photographerName',
      'amount',
      'reason',
      'galleryName',
      'clientEmail',
      'purchaseDate',
      'transactionId',
      'responseDeadline',
      'daysRemaining',
      'evidenceRequired',
      'disputeDetailsLink',
      'stripeDashboardLink',
    ],
  },
  {
    name: 'Refund Confirmation',
    slug: 'refund-confirmation',
    type: 'transactional',
    subject: 'Your refund of {refundAmount} for "{galleryName}" has been processed',
    description: 'Sent to clients when a refund is processed for their purchase',
    category: 'Refunds',
    componentPath: 'src/emails/refund-confirmation.tsx',
    variables: [
      'buyerName',
      'buyerEmail',
      'galleryName',
      'refundId',
      'refundType',
      'refundAmount',
      'originalAmount',
      'refundReason',
      'purchaseDate',
      'refundDate',
      'estimatedArrival',
      'photographerName',
      'photographerEmail',
      'photographerLogo',
      'supportLink',
    ],
    requiredVariables: [
      'buyerEmail',
      'galleryName',
      'refundId',
      'refundType',
      'refundAmount',
      'originalAmount',
      'purchaseDate',
      'refundDate',
      'estimatedArrival',
      'photographerName',
    ],
  },
];

/**
 * Migrate a single template to the database
 */
async function migrateTemplate(template: TemplateMetadata): Promise<void> {
  console.log(`\n📧 Migrating template: ${template.name}`);
  console.log(`   Slug: ${template.slug}`);
  console.log(`   Type: ${template.type}`);
  console.log(`   Variables: ${template.variables.length} total, ${template.requiredVariables.length} required`);

  // Check if template already exists
  const { data: existing } = await supabase
    .from('email_templates')
    .select('id, slug')
    .eq('slug', template.slug)
    .single();

  if (existing) {
    console.log(`   ⚠️  Template already exists (ID: ${existing.id})`);
    console.log(`   Skipping migration for ${template.slug}`);
    return;
  }

  // Create template content object
  const content = {
    componentPath: template.componentPath,
    description: template.description,
    category: template.category,
    requiredVariables: template.requiredVariables,
  };

  // Insert template
  const { data: newTemplate, error: templateError } = await supabase
    .from('email_templates')
    .insert({
      name: template.name,
      slug: template.slug,
      type: template.type,
      source: 'react-email',
      subject: template.subject,
      content,
      variables: template.variables,
      active_version: 1,
      is_active: true,
    })
    .select()
    .single();

  if (templateError) {
    console.error(`   ❌ Failed to create template: ${templateError.message}`);
    throw templateError;
  }

  console.log(`   ✅ Template created (ID: ${newTemplate.id})`);

  // Create initial version
  const { error: versionError } = await supabase
    .from('template_versions')
    .insert({
      template_id: newTemplate.id,
      version: 1,
      subject: template.subject,
      content,
      variables: template.variables,
      created_by: null, // System migration
    });

  if (versionError) {
    console.error(`   ❌ Failed to create version: ${versionError.message}`);
    // Rollback: delete the template
    await supabase.from('email_templates').delete().eq('id', newTemplate.id);
    throw versionError;
  }

  console.log(`   ✅ Version 1 created`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting email template migration...\n');
  console.log(`📋 Templates to migrate: ${templates.length}`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      await migrateTemplate(template);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error migrating ${template.slug}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successfully migrated: ${successCount}`);
  console.log(`   ⚠️  Skipped (already exist): ${skipCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.error('\n❌ Migration completed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  }
}

// Run migration
main().catch((error) => {
  console.error('\n💥 Fatal error during migration:', error);
  process.exit(1);
});
