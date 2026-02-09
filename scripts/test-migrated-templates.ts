/**
 * Test Migrated Email Templates
 * 
 * This script tests that all migrated React Email templates render correctly
 * using the new template system.
 * 
 * Requirements: 3.9, 3.10
 * 
 * Usage:
 *   npx tsx scripts/test-migrated-templates.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createTemplateRenderer } from '@/lib/email/template-renderer';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
const renderer = createTemplateRenderer(supabase);

// Test data for each template
const testData = {
  'purchase-confirmation': {
    buyerName: 'John Doe',
    buyerEmail: 'john@example.com',
    galleryName: 'Wedding Photography - Sarah & Michael',
    photoCount: 250,
    amountPaid: '$49.99',
    transactionId: 'pi_3NxYz1234567890',
    purchaseDate: 'January 15, 2026',
    accessLink: 'https://piksend.com/g/sarah-michael-wedding',
    photographerName: 'Jane Smith Photography',
    photographerEmail: 'jane@photography.com',
    photographerLogo: 'https://piksend.com/demo-logo.png',
    receiptUrl: 'https://pay.stripe.com/receipts/xxx',
  },
  'sale-notification': {
    photographerName: 'Jane',
    galleryName: 'Wedding Photography - Sarah & Michael',
    photoCount: 250,
    clientEmail: 'john@example.com',
    clientName: 'John Doe',
    grossAmount: '$49.99',
    platformFee: '$5.00',
    netEarnings: '$44.99',
    transactionId: 'pi_3NxYz1234567890',
    saleDate: 'January 15, 2026 at 2:30 PM',
    dashboardLink: 'https://piksend.com/revenue',
    saleDetailsLink: 'https://piksend.com/revenue/sales/sale-123',
    totalSalesCount: 42,
    totalRevenue: '$1,847.50',
  },
  'payout-notification': {
    photographerName: 'Jane',
    payoutId: 'po_1NxYz1234567890',
    amount: '$1,234.56',
    currency: 'USD',
    status: 'paid',
    bankName: 'Chase',
    bankAccountLast4: '4242',
    createdDate: 'January 15, 2026',
    arrivalDate: 'January 17, 2026',
    dashboardLink: 'https://piksend.com/revenue',
    payoutDetailsLink: 'https://piksend.com/revenue/payouts/po_1NxYz1234567890',
    stripeDashboardLink: 'https://dashboard.stripe.com/payouts',
    remainingBalance: '$567.89',
  },
  'dispute-alert': {
    photographerName: 'Jane',
    amount: '$49.99',
    reason: 'product_not_received',
    reasonDescription: 'I never received access to the photos after payment.',
    galleryName: 'Wedding Photography - Sarah & Michael',
    clientEmail: 'john@example.com',
    purchaseDate: 'January 10, 2026',
    transactionId: 'pi_3NxYz1234567890',
    responseDeadline: 'January 25, 2026',
    daysRemaining: 7,
    evidenceRequired: [
      'Proof of delivery (access logs showing client viewed gallery)',
      'Purchase confirmation email sent to client',
      'Terms of service / refund policy',
      'Any communication with the client',
    ],
    disputeDetailsLink: 'https://piksend.com/revenue/disputes/dp_1NxYz1234567890',
    stripeDashboardLink: 'https://dashboard.stripe.com/disputes/dp_1NxYz1234567890',
  },
  'refund-confirmation': {
    buyerName: 'John Doe',
    buyerEmail: 'john@example.com',
    galleryName: 'Wedding Photography - Sarah & Michael',
    refundId: 're_1NxYz1234567890',
    refundType: 'full',
    refundAmount: '$49.99',
    originalAmount: '$49.99',
    refundReason: 'Customer requested refund',
    purchaseDate: 'January 10, 2026',
    refundDate: 'January 15, 2026',
    estimatedArrival: '5-10 business days',
    photographerName: 'Jane Smith Photography',
    photographerEmail: 'jane@photography.com',
    photographerLogo: 'https://piksend.com/demo-logo.png',
    supportLink: 'https://piksend.com/help',
  },
};

/**
 * Test rendering a single template
 */
async function testTemplate(slug: string): Promise<boolean> {
  console.log(`\n📧 Testing template: ${slug}`);

  try {
    const variables = testData[slug as keyof typeof testData];
    
    if (!variables) {
      console.error(`   ❌ No test data defined for ${slug}`);
      return false;
    }

    // Render the template
    const rendered = await renderer.renderBySlug(slug, variables);

    // Validate output
    if (!rendered.html || rendered.html.length === 0) {
      console.error(`   ❌ HTML output is empty`);
      return false;
    }

    if (!rendered.text || rendered.text.length === 0) {
      console.error(`   ❌ Text output is empty`);
      return false;
    }

    if (!rendered.subject || rendered.subject.length === 0) {
      console.error(`   ❌ Subject is empty`);
      return false;
    }

    // Check that variables were substituted
    const hasPlaceholders = rendered.subject.includes('{') || rendered.subject.includes('}');
    if (hasPlaceholders) {
      console.error(`   ⚠️  Subject still contains placeholders: ${rendered.subject}`);
    }

    console.log(`   ✅ Rendered successfully`);
    console.log(`   📝 Subject: ${rendered.subject}`);
    console.log(`   📄 HTML length: ${rendered.html.length} chars`);
    console.log(`   📄 Text length: ${rendered.text.length} chars`);

    return true;
  } catch (error) {
    console.error(`   ❌ Error rendering template:`, error);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing migrated email templates...\n');
  console.log(`📋 Templates to test: ${Object.keys(testData).length}`);

  const results: Record<string, boolean> = {};

  for (const slug of Object.keys(testData)) {
    const success = await testTemplate(slug);
    results[slug] = success;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  
  const passed = Object.values(results).filter(Boolean).length;
  const failed = Object.values(results).filter((v) => !v).length;
  
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('='.repeat(60));

  // Print detailed results
  console.log('\n📋 Detailed Results:');
  for (const [slug, success] of Object.entries(results)) {
    console.log(`   ${success ? '✅' : '❌'} ${slug}`);
  }

  if (failed > 0) {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  console.error('\n💥 Fatal error during testing:', error);
  process.exit(1);
});
