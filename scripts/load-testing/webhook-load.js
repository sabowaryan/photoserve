/**
 * Webhook Load Testing Script
 * 
 * Tests the Stripe webhook endpoints under high load conditions.
 * Simulates high volume of webhook events from Stripe.
 * 
 * @module scripts/load-testing/webhook-load
 * Requirements: 10.3.2 - Tester webhook endpoint load
 */

import autocannon from 'autocannon';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../../.env' });
config(); // Also load from current directory

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.DURATION || process.env.LOAD_TEST_DURATION || '30', 10);
const CONNECTIONS = parseInt(process.env.CONNECTIONS || process.env.LOAD_TEST_CONNECTIONS || '100', 10);
const PIPELINING = parseInt(process.env.PIPELINING || process.env.LOAD_TEST_PIPELINING || '10', 10);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE || 'whsec_test_secret';
const CONNECT_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_CONNECT || 'whsec_test_connect_secret';

/**
 * Generate a Stripe webhook signature
 * @param {string} payload - The webhook payload
 * @param {string} secret - The webhook secret
 * @returns {string} The signature header value
 */
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Create a mock checkout.session.completed event
 */
function createCheckoutCompletedEvent() {
  const eventId = `evt_test_${crypto.randomBytes(12).toString('hex')}`;
  const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
  const paymentIntentId = `pi_test_${crypto.randomBytes(12).toString('hex')}`;
  
  return {
    id: eventId,
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        amount_total: 2999,
        currency: 'usd',
        customer_email: `test_${Date.now()}@example.com`,
        metadata: {
          gallery_id: 'test-gallery-id',
          photographer_id: 'test-photographer-id',
          buyer_session_id: `session_${Date.now()}`,
        },
        mode: 'payment',
        payment_intent: paymentIntentId,
        payment_status: 'paid',
        status: 'complete',
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${crypto.randomBytes(8).toString('hex')}`,
      idempotency_key: null,
    },
  };
}

/**
 * Create a mock charge.refunded event
 */
function createChargeRefundedEvent() {
  const eventId = `evt_test_${crypto.randomBytes(12).toString('hex')}`;
  const chargeId = `ch_test_${crypto.randomBytes(12).toString('hex')}`;
  
  return {
    id: eventId,
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: 'charge.refunded',
    data: {
      object: {
        id: chargeId,
        object: 'charge',
        amount: 2999,
        amount_refunded: 2999,
        currency: 'usd',
        metadata: {
          gallery_id: 'test-gallery-id',
          purchase_id: 'test-purchase-id',
        },
        refunded: true,
        status: 'succeeded',
      },
    },
    livemode: false,
    pending_webhooks: 1,
  };
}

/**
 * Create a mock account.updated event (Connect)
 */
function createAccountUpdatedEvent() {
  const eventId = `evt_test_${crypto.randomBytes(12).toString('hex')}`;
  const accountId = `acct_test_${crypto.randomBytes(12).toString('hex')}`;
  
  return {
    id: eventId,
    object: 'event',
    account: accountId,
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: 'account.updated',
    data: {
      object: {
        id: accountId,
        object: 'account',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        capabilities: {
          card_payments: 'active',
          transfers: 'active',
        },
      },
    },
    livemode: false,
    pending_webhooks: 1,
  };
}

/**
 * Create a mock payout.paid event (Connect)
 */
function createPayoutPaidEvent() {
  const eventId = `evt_test_${crypto.randomBytes(12).toString('hex')}`;
  const payoutId = `po_test_${crypto.randomBytes(12).toString('hex')}`;
  const accountId = `acct_test_${crypto.randomBytes(12).toString('hex')}`;
  
  return {
    id: eventId,
    object: 'event',
    account: accountId,
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: 'payout.paid',
    data: {
      object: {
        id: payoutId,
        object: 'payout',
        amount: 10000,
        currency: 'usd',
        arrival_date: Math.floor(Date.now() / 1000) + 86400,
        status: 'paid',
      },
    },
    livemode: false,
    pending_webhooks: 1,
  };
}

/**
 * Run load test for gallery purchase webhook
 */
async function testGalleryPurchaseWebhook() {
  console.log('\n' + '='.repeat(60));
  console.log('🔔 Testing Gallery Purchase Webhook Endpoint');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/webhook/gallery-purchase`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}`);
  console.log('='.repeat(60) + '\n');

  // Event types to test
  const eventGenerators = [
    { name: 'checkout.session.completed', generator: createCheckoutCompletedEvent, weight: 70 },
    { name: 'charge.refunded', generator: createChargeRefundedEvent, weight: 30 },
  ];

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/webhook/gallery-purchase`,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      // Randomly select event type based on weight
      const rand = Math.random() * 100;
      let cumulative = 0;
      let selectedGenerator = eventGenerators[0];
      
      for (const eg of eventGenerators) {
        cumulative += eg.weight;
        if (rand <= cumulative) {
          selectedGenerator = eg;
          break;
        }
      }
      
      const event = selectedGenerator.generator();
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
      
      req.headers['stripe-signature'] = signature;
      req.body = payload;
      
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Gallery Purchase Webhook Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Run load test for Connect webhook
 */
async function testConnectWebhook() {
  console.log('\n' + '='.repeat(60));
  console.log('🔗 Testing Connect Webhook Endpoint');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/connect/webhook`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}`);
  console.log('='.repeat(60) + '\n');

  // Event types to test
  const eventGenerators = [
    { name: 'account.updated', generator: createAccountUpdatedEvent, weight: 60 },
    { name: 'payout.paid', generator: createPayoutPaidEvent, weight: 40 },
  ];

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/connect/webhook`,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      // Randomly select event type based on weight
      const rand = Math.random() * 100;
      let cumulative = 0;
      let selectedGenerator = eventGenerators[0];
      
      for (const eg of eventGenerators) {
        cumulative += eg.weight;
        if (rand <= cumulative) {
          selectedGenerator = eg;
          break;
        }
      }
      
      const event = selectedGenerator.generator();
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, CONNECT_WEBHOOK_SECRET);
      
      req.headers['stripe-signature'] = signature;
      req.body = payload;
      
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Connect Webhook Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Test rate limiting behavior
 */
async function testRateLimiting() {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ Testing Rate Limiting Behavior');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/webhook/gallery-purchase`);
  console.log('High burst: 500 connections, 1 pipelining, 10s');
  console.log('='.repeat(60) + '\n');

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/webhook/gallery-purchase`,
    connections: 500,
    pipelining: 1,
    duration: 10,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      const event = createCheckoutCompletedEvent();
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
      
      req.headers['stripe-signature'] = signature;
      req.body = payload;
      
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Rate Limiting Test Results:');
      console.log('-'.repeat(40));
      printResults(result);
      
      // Check for 429 responses
      const rateLimited = result['4xx'] || 0;
      if (rateLimited > 0) {
        console.log(`\n⚠️  Rate limited requests: ${rateLimited}`);
        console.log('   This is expected behavior under high load.');
      }
      
      resolve(result);
    });
  });
}

/**
 * Print formatted results
 */
function printResults(result) {
  console.log(`  Total Requests: ${result.requests.total}`);
  console.log(`  Requests/sec:   ${result.requests.average.toFixed(2)}`);
  console.log(`  Latency (avg):  ${result.latency.average.toFixed(2)}ms`);
  console.log(`  Latency (p50):  ${result.latency.p50}ms`);
  console.log(`  Latency (p99):  ${result.latency.p99}ms`);
  console.log(`  Latency (max):  ${result.latency.max}ms`);
  console.log(`  Throughput:     ${(result.throughput.average / 1024).toFixed(2)} KB/s`);
  console.log(`  Errors:         ${result.errors}`);
  console.log(`  Timeouts:       ${result.timeouts}`);
  console.log(`  2xx responses:  ${result['2xx'] || 0}`);
  console.log(`  4xx responses:  ${result['4xx'] || 0}`);
  console.log(`  5xx responses:  ${result['5xx'] || 0}`);
  
  // Performance assessment
  console.log('\n📈 Performance Assessment:');
  if (result.latency.p99 < 3000) {
    console.log('  ✅ P99 latency is under 3s (Stripe requirement met)');
  } else {
    console.log('  ❌ P99 latency exceeds 3s (Stripe requirement NOT met)');
  }
  
  if (result.errors === 0 && result.timeouts === 0) {
    console.log('  ✅ No errors or timeouts');
  } else {
    console.log(`  ⚠️  ${result.errors} errors, ${result.timeouts} timeouts`);
  }
  
  const errorRate = ((result['4xx'] || 0) + (result['5xx'] || 0)) / result.requests.total * 100;
  if (errorRate < 1) {
    console.log(`  ✅ Error rate: ${errorRate.toFixed(2)}% (< 1%)`);
  } else {
    console.log(`  ⚠️  Error rate: ${errorRate.toFixed(2)}% (> 1%)`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '🚀'.repeat(30));
  console.log('\n  WEBHOOK LOAD TESTING SUITE');
  console.log('  PikSend Stripe Connect Monetization\n');
  console.log('🚀'.repeat(30) + '\n');

  const results = {
    galleryPurchase: null,
    connect: null,
    rateLimiting: null,
  };

  try {
    // Test gallery purchase webhook
    results.galleryPurchase = await testGalleryPurchaseWebhook();
    
    // Test connect webhook
    results.connect = await testConnectWebhook();
    
    // Test rate limiting
    results.rateLimiting = await testRateLimiting();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 WEBHOOK LOAD TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n1. Gallery Purchase Webhook:');
    console.log(`   - Avg Latency: ${results.galleryPurchase.latency.average.toFixed(2)}ms`);
    console.log(`   - Throughput: ${results.galleryPurchase.requests.average.toFixed(0)} req/s`);
    
    console.log('\n2. Connect Webhook:');
    console.log(`   - Avg Latency: ${results.connect.latency.average.toFixed(2)}ms`);
    console.log(`   - Throughput: ${results.connect.requests.average.toFixed(0)} req/s`);
    
    console.log('\n3. Rate Limiting Test:');
    console.log(`   - 429 Responses: ${results.rateLimiting['4xx'] || 0}`);
    console.log(`   - Rate limiting ${(results.rateLimiting['4xx'] || 0) > 0 ? 'is working' : 'not triggered'}`);
    
    // Bottleneck identification
    console.log('\n' + '='.repeat(60));
    console.log('🔍 BOTTLENECK ANALYSIS');
    console.log('='.repeat(60));
    
    const avgLatency = (results.galleryPurchase.latency.average + results.connect.latency.average) / 2;
    
    if (avgLatency > 1000) {
      console.log('\n⚠️  High average latency detected (> 1s)');
      console.log('   Possible causes:');
      console.log('   - Database query performance');
      console.log('   - Stripe API call latency');
      console.log('   - Insufficient server resources');
      console.log('   Recommendations:');
      console.log('   - Add database indexes');
      console.log('   - Implement async webhook processing');
      console.log('   - Scale horizontally');
    } else if (avgLatency > 500) {
      console.log('\n⚠️  Moderate latency detected (500ms - 1s)');
      console.log('   Consider:');
      console.log('   - Optimizing database queries');
      console.log('   - Adding caching for repeated lookups');
    } else {
      console.log('\n✅ Latency is within acceptable range (< 500ms)');
    }
    
    const totalErrors = results.galleryPurchase.errors + results.connect.errors;
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} errors detected during testing`);
      console.log('   Check server logs for details');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Webhook load testing complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Load test failed:', error.message);
    process.exit(1);
  }
}

main();
