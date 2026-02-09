/**
 * Update Template Metadata
 * 
 * Updates the content field of migrated templates to include requiredVariables
 * 
 * Usage:
 *   npx tsx scripts/update-template-metadata.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Required variables for each template
const requiredVariables: Record<string, string[]> = {
  'purchase-confirmation': [
    'buyerEmail',
    'galleryName',
    'photoCount',
    'amountPaid',
    'transactionId',
    'purchaseDate',
    'accessLink',
    'photographerName',
  ],
  'sale-notification': [
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
  'payout-notification': [
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
  'dispute-alert': [
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
  'refund-confirmation': [
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
};

async function updateTemplate(slug: string) {
  console.log(`\n📧 Updating template: ${slug}`);

  // Get the template
  const { data: template, error: fetchError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .single();

  if (fetchError || !template) {
    console.error(`   ❌ Template not found: ${slug}`);
    return false;
  }

  // Update the content to include requiredVariables
  const content = template.content as any;
  content.requiredVariables = requiredVariables[slug];

  // Update the template
  const { error: updateError } = await supabase
    .from('email_templates')
    .update({ content })
    .eq('id', template.id);

  if (updateError) {
    console.error(`   ❌ Failed to update: ${updateError.message}`);
    return false;
  }

  console.log(`   ✅ Updated successfully`);
  console.log(`   📝 Required variables: ${requiredVariables[slug]?.length ?? 0}`);
  return true;
}

async function main() {
  console.log('🔄 Updating template metadata...\n');

  let successCount = 0;
  let failCount = 0;

  for (const slug of Object.keys(requiredVariables)) {
    const success = await updateTemplate(slug);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Update Summary:');
  console.log(`   ✅ Updated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.error('\n❌ Some updates failed');
    process.exit(1);
  } else {
    console.log('\n✅ All templates updated!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
