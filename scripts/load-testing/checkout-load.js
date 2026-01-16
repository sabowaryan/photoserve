/**
 * Checkout Flow Load Testing Script
 * 
 * Tests the checkout session creation endpoint under high load conditions.
 * Simulates concurrent checkout requests from multiple buyers.
 * 
 * @module scripts/load-testing/checkout-load
 * Requirements: 10.3.3 - Tester checkout flow load
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
const CONNECTIONS = parseInt(process.env.CONNECTIONS || process.env.LOAD_TEST_CONNECTIONS || '50', 10);
const PIPELINING = parseInt(process.env.PIPELINING || process.env.LOAD_TEST_PIPELINING || '1', 10);

// Test data - replace with actual test gallery IDs
const TEST_GALLERY_IDS = process.env.TEST_GALLERY_IDS 
  ? process.env.TEST_GALLERY_IDS.split(',') 
  : [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
    ];

/**
 * Generate a unique buyer email
 */
function generateBuyerEmail() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `loadtest_${timestamp}_${random}@example.com`;
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `session_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Get a random gallery ID from the test set
 */
function getRandomGalleryId() {
  return TEST_GALLERY_IDS[Math.floor(Math.random() * TEST_GALLERY_IDS.length)];
}

/**
 * Run load test for checkout session creation
 */
async function testCheckoutCreation() {
  console.log('\n' + '='.repeat(60));
  console.log('🛒 Testing Checkout Session Creation');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/checkout/gallery-purchase`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}`);
  console.log(`Test Gallery IDs: ${TEST_GALLERY_IDS.length}`);
  console.log('='.repeat(60) + '\n');

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/checkout/gallery-purchase`,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      const payload = JSON.stringify({
        galleryId: getRandomGalleryId(),
        buyerEmail: generateBuyerEmail(),
        buyerSessionId: generateSessionId(),
      });
      
      req.body = payload;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Checkout Creation Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Test checkout with validation errors
 */
async function testCheckoutValidation() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Testing Checkout Validation Under Load');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/checkout/gallery-purchase`);
  console.log('Testing with invalid data to verify error handling');
  console.log('='.repeat(60) + '\n');

  const invalidPayloads = [
    // Invalid email
    { galleryId: getRandomGalleryId(), buyerEmail: 'invalid-email', buyerSessionId: generateSessionId() },
    // Invalid gallery ID
    { galleryId: 'not-a-uuid', buyerEmail: generateBuyerEmail(), buyerSessionId: generateSessionId() },
    // Missing required fields
    { galleryId: getRandomGalleryId() },
    // Empty object
    {},
  ];

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/checkout/gallery-purchase`,
    connections: 20,
    pipelining: 1,
    duration: 15,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      // Randomly select an invalid payload
      const payload = invalidPayloads[Math.floor(Math.random() * invalidPayloads.length)];
      req.body = JSON.stringify(payload);
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Validation Test Results:');
      console.log('-'.repeat(40));
      printResults(result);
      
      // We expect 4xx responses for invalid data
      const expectedErrors = result['4xx'] || 0;
      console.log(`\n✅ Expected 4xx responses: ${expectedErrors}`);
      console.log('   (These are expected for invalid input validation)');
      
      resolve(result);
    });
  });
}

/**
 * Test concurrent checkouts for the same gallery
 */
async function testConcurrentSameGallery() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Testing Concurrent Checkouts for Same Gallery');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/checkout/gallery-purchase`);
  console.log('Simulating multiple buyers purchasing the same gallery');
  console.log('='.repeat(60) + '\n');

  const targetGalleryId = TEST_GALLERY_IDS[0];

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/checkout/gallery-purchase`,
    connections: 100,
    pipelining: 1,
    duration: 20,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      const payload = JSON.stringify({
        galleryId: targetGalleryId,
        buyerEmail: generateBuyerEmail(),
        buyerSessionId: generateSessionId(),
      });
      
      req.body = payload;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Concurrent Same Gallery Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Test checkout with burst traffic
 */
async function testBurstTraffic() {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ Testing Burst Traffic Pattern');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/stripe/checkout/gallery-purchase`);
  console.log('Simulating sudden spike in checkout requests');
  console.log('='.repeat(60) + '\n');

  const instance = autocannon({
    url: `${BASE_URL}/api/stripe/checkout/gallery-purchase`,
    connections: 200,
    pipelining: 1,
    duration: 10,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req, context) => {
      const payload = JSON.stringify({
        galleryId: getRandomGalleryId(),
        buyerEmail: generateBuyerEmail(),
        buyerSessionId: generateSessionId(),
      });
      
      req.body = payload;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Burst Traffic Results:');
      console.log('-'.repeat(40));
      printResults(result);
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
  if (result.latency.p99 < 2000) {
    console.log('  ✅ P99 latency is under 2s (good user experience)');
  } else {
    console.log('  ⚠️  P99 latency exceeds 2s (may impact user experience)');
  }
  
  if (result.errors === 0 && result.timeouts === 0) {
    console.log('  ✅ No connection errors or timeouts');
  } else {
    console.log(`  ⚠️  ${result.errors} errors, ${result.timeouts} timeouts`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '🛒'.repeat(30));
  console.log('\n  CHECKOUT FLOW LOAD TESTING SUITE');
  console.log('  PikSend Stripe Connect Monetization\n');
  console.log('🛒'.repeat(30) + '\n');

  const results = {
    creation: null,
    validation: null,
    concurrent: null,
    burst: null,
  };

  try {
    // Test checkout creation
    results.creation = await testCheckoutCreation();
    
    // Test validation handling
    results.validation = await testCheckoutValidation();
    
    // Test concurrent same gallery
    results.concurrent = await testConcurrentSameGallery();
    
    // Test burst traffic
    results.burst = await testBurstTraffic();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 CHECKOUT LOAD TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n1. Normal Checkout Creation:');
    console.log(`   - Avg Latency: ${results.creation.latency.average.toFixed(2)}ms`);
    console.log(`   - Throughput: ${results.creation.requests.average.toFixed(0)} req/s`);
    console.log(`   - Success Rate: ${((results.creation['2xx'] || 0) / results.creation.requests.total * 100).toFixed(1)}%`);
    
    console.log('\n2. Validation Handling:');
    console.log(`   - Avg Latency: ${results.validation.latency.average.toFixed(2)}ms`);
    console.log(`   - 4xx Responses: ${results.validation['4xx'] || 0} (expected)`);
    
    console.log('\n3. Concurrent Same Gallery:');
    console.log(`   - Avg Latency: ${results.concurrent.latency.average.toFixed(2)}ms`);
    console.log(`   - Throughput: ${results.concurrent.requests.average.toFixed(0)} req/s`);
    
    console.log('\n4. Burst Traffic:');
    console.log(`   - Avg Latency: ${results.burst.latency.average.toFixed(2)}ms`);
    console.log(`   - Max Latency: ${results.burst.latency.max}ms`);
    console.log(`   - Errors: ${results.burst.errors}`);
    
    // Bottleneck identification
    console.log('\n' + '='.repeat(60));
    console.log('🔍 BOTTLENECK ANALYSIS');
    console.log('='.repeat(60));
    
    // Check for Stripe API bottleneck
    if (results.creation.latency.average > 1000) {
      console.log('\n⚠️  High latency in checkout creation (> 1s)');
      console.log('   Likely bottleneck: Stripe API calls');
      console.log('   Recommendations:');
      console.log('   - Implement connection pooling for Stripe client');
      console.log('   - Consider async checkout session creation');
      console.log('   - Cache Stripe price objects');
    }
    
    // Check for database bottleneck
    if (results.concurrent.latency.average > results.creation.latency.average * 1.5) {
      console.log('\n⚠️  Concurrent access causing slowdown');
      console.log('   Likely bottleneck: Database contention');
      console.log('   Recommendations:');
      console.log('   - Add database connection pooling');
      console.log('   - Optimize gallery/monetization queries');
      console.log('   - Consider read replicas');
    }
    
    // Check for burst handling
    if (results.burst.errors > 0 || results.burst.timeouts > 0) {
      console.log('\n⚠️  Errors during burst traffic');
      console.log('   Recommendations:');
      console.log('   - Implement request queuing');
      console.log('   - Add rate limiting with graceful degradation');
      console.log('   - Scale horizontally for peak loads');
    }
    
    // Overall assessment
    const avgLatency = (
      results.creation.latency.average + 
      results.concurrent.latency.average + 
      results.burst.latency.average
    ) / 3;
    
    if (avgLatency < 500) {
      console.log('\n✅ Overall checkout performance is excellent (< 500ms avg)');
    } else if (avgLatency < 1000) {
      console.log('\n✅ Overall checkout performance is good (< 1s avg)');
    } else if (avgLatency < 2000) {
      console.log('\n⚠️  Checkout performance is acceptable but could be improved');
    } else {
      console.log('\n❌ Checkout performance needs optimization (> 2s avg)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Checkout load testing complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Load test failed:', error.message);
    process.exit(1);
  }
}

main();
