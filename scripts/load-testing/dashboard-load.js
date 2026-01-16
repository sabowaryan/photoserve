/**
 * Dashboard Queries Load Testing Script
 * 
 * Tests the revenue dashboard API endpoints under high load conditions.
 * Simulates multiple photographers accessing their dashboards simultaneously.
 * 
 * @module scripts/load-testing/dashboard-load
 * Requirements: 10.3.4 - Tester dashboard queries load
 */

import autocannon from 'autocannon';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../../.env' });
config(); // Also load from current directory

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.DURATION || process.env.LOAD_TEST_DURATION || '30', 10);
const CONNECTIONS = parseInt(process.env.CONNECTIONS || process.env.LOAD_TEST_CONNECTIONS || '50', 10);
const PIPELINING = parseInt(process.env.PIPELINING || process.env.LOAD_TEST_PIPELINING || '1', 10);

// Test authentication token (if available)
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const TEST_AUTH_COOKIE = process.env.TEST_AUTH_COOKIE || '';

/**
 * Get authentication headers
 */
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (TEST_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${TEST_AUTH_TOKEN}`;
  }
  
  if (TEST_AUTH_COOKIE) {
    headers['Cookie'] = TEST_AUTH_COOKIE;
  }
  
  return headers;
}

/**
 * Dashboard endpoints to test
 */
const DASHBOARD_ENDPOINTS = [
  {
    name: 'Revenue Overview',
    path: '/api/photographer/revenue/overview',
    params: ['period=month', 'period=week', 'period=year'],
    weight: 25,
  },
  {
    name: 'Revenue Chart',
    path: '/api/photographer/revenue/chart',
    params: ['range=month', 'range=week', 'range=year'],
    weight: 20,
  },
  {
    name: 'Sales List',
    path: '/api/photographer/sales',
    params: ['page=1&limit=20', 'page=1&limit=50', 'status=succeeded'],
    weight: 20,
  },
  {
    name: 'Payouts List',
    path: '/api/photographer/payouts',
    params: ['page=1&limit=20', 'status=paid'],
    weight: 15,
  },
  {
    name: 'Top Galleries',
    path: '/api/photographer/top-galleries',
    params: ['limit=5', 'limit=10'],
    weight: 10,
  },
  {
    name: 'Revenue Trends',
    path: '/api/photographer/revenue/trends',
    params: ['period=month', 'period=week'],
    weight: 5,
  },
  {
    name: 'Conversion Funnel',
    path: '/api/photographer/revenue/funnel',
    params: [''],
    weight: 5,
  },
];

/**
 * Get a random endpoint based on weights
 */
function getRandomEndpoint() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const endpoint of DASHBOARD_ENDPOINTS) {
    cumulative += endpoint.weight;
    if (rand <= cumulative) {
      const param = endpoint.params[Math.floor(Math.random() * endpoint.params.length)];
      return {
        ...endpoint,
        fullPath: param ? `${endpoint.path}?${param}` : endpoint.path,
      };
    }
  }
  
  return {
    ...DASHBOARD_ENDPOINTS[0],
    fullPath: DASHBOARD_ENDPOINTS[0].path,
  };
}

/**
 * Test individual endpoint
 */
async function testEndpoint(endpoint, duration = 15, connections = 30) {
  console.log(`\n  Testing: ${endpoint.name}`);
  console.log(`  Path: ${endpoint.path}`);
  
  const instance = autocannon({
    url: `${BASE_URL}${endpoint.path}`,
    connections,
    pipelining: 1,
    duration,
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      resolve({
        name: endpoint.name,
        path: endpoint.path,
        ...result,
      });
    });
  });
}

/**
 * Run load test for all dashboard endpoints
 */
async function testAllEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Testing All Dashboard Endpoints');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Duration per endpoint: 15s | Connections: 30`);
  console.log('='.repeat(60));

  const results = [];
  
  for (const endpoint of DASHBOARD_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    console.log(`    Avg Latency: ${result.latency.average.toFixed(2)}ms`);
    console.log(`    Throughput: ${result.requests.average.toFixed(0)} req/s`);
    console.log(`    Errors: ${result.errors}`);
  }
  
  return results;
}

/**
 * Run mixed workload test
 */
async function testMixedWorkload() {
  console.log('\n' + '='.repeat(60));
  console.log('🔀 Testing Mixed Dashboard Workload');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/photographer/*`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS}`);
  console.log('Simulating realistic dashboard usage patterns');
  console.log('='.repeat(60) + '\n');

  // Track endpoint distribution
  const endpointCounts = {};
  DASHBOARD_ENDPOINTS.forEach(e => endpointCounts[e.name] = 0);

  const instance = autocannon({
    url: BASE_URL,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    method: 'GET',
    headers: getAuthHeaders(),
    setupRequest: (req, context) => {
      const endpoint = getRandomEndpoint();
      endpointCounts[endpoint.name]++;
      req.path = endpoint.fullPath;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Mixed Workload Results:');
      console.log('-'.repeat(40));
      printResults(result);
      
      console.log('\n📈 Endpoint Distribution:');
      Object.entries(endpointCounts).forEach(([name, count]) => {
        const percentage = (count / result.requests.total * 100).toFixed(1);
        console.log(`   ${name}: ${count} (${percentage}%)`);
      });
      
      resolve({ ...result, endpointCounts });
    });
  });
}

/**
 * Test dashboard with pagination stress
 */
async function testPaginationStress() {
  console.log('\n' + '='.repeat(60));
  console.log('📄 Testing Pagination Under Load');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/photographer/sales`);
  console.log('Testing various page sizes and page numbers');
  console.log('='.repeat(60) + '\n');

  const paginationParams = [
    'page=1&limit=10',
    'page=1&limit=50',
    'page=1&limit=100',
    'page=2&limit=20',
    'page=5&limit=20',
    'page=10&limit=20',
  ];

  const instance = autocannon({
    url: BASE_URL,
    connections: 50,
    pipelining: 1,
    duration: 20,
    method: 'GET',
    headers: getAuthHeaders(),
    setupRequest: (req, context) => {
      const params = paginationParams[Math.floor(Math.random() * paginationParams.length)];
      req.path = `/api/photographer/sales?${params}`;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Pagination Stress Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Test dashboard with date range filters
 */
async function testDateRangeFilters() {
  console.log('\n' + '='.repeat(60));
  console.log('📅 Testing Date Range Filters Under Load');
  console.log('='.repeat(60));
  console.log(`URL: ${BASE_URL}/api/photographer/sales`);
  console.log('Testing various date range combinations');
  console.log('='.repeat(60) + '\n');

  const now = new Date();
  const dateRanges = [
    // Last 7 days
    `startDate=${new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
    // Last 30 days
    `startDate=${new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
    // Last 90 days
    `startDate=${new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
    // Specific range
    `startDate=${new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&endDate=${new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
  ];

  const instance = autocannon({
    url: BASE_URL,
    connections: 40,
    pipelining: 1,
    duration: 20,
    method: 'GET',
    headers: getAuthHeaders(),
    setupRequest: (req, context) => {
      const dateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];
      req.path = `/api/photographer/sales?${dateRange}&page=1&limit=20`;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Date Range Filter Results:');
      console.log('-'.repeat(40));
      printResults(result);
      resolve(result);
    });
  });
}

/**
 * Test concurrent dashboard access
 */
async function testConcurrentAccess() {
  console.log('\n' + '='.repeat(60));
  console.log('👥 Testing Concurrent Dashboard Access');
  console.log('='.repeat(60));
  console.log('Simulating 200 photographers accessing dashboards simultaneously');
  console.log('='.repeat(60) + '\n');

  const instance = autocannon({
    url: BASE_URL,
    connections: 200,
    pipelining: 1,
    duration: 30,
    method: 'GET',
    headers: getAuthHeaders(),
    setupRequest: (req, context) => {
      const endpoint = getRandomEndpoint();
      req.path = endpoint.fullPath;
      return req;
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n📊 Concurrent Access Results:');
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
  
  // Check if caching is effective
  if (result.latency.average < 100) {
    console.log('  ✅ Excellent latency - caching appears effective');
  } else if (result.latency.average < 500) {
    console.log('  ✅ Good latency (< 500ms)');
  } else if (result.latency.average < 1000) {
    console.log('  ⚠️  Moderate latency - consider additional caching');
  } else {
    console.log('  ❌ High latency - optimization needed');
  }
  
  if (result.errors === 0 && result.timeouts === 0) {
    console.log('  ✅ No errors or timeouts');
  } else {
    console.log(`  ⚠️  ${result.errors} errors, ${result.timeouts} timeouts`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '📊'.repeat(30));
  console.log('\n  DASHBOARD QUERIES LOAD TESTING SUITE');
  console.log('  PikSend Stripe Connect Monetization\n');
  console.log('📊'.repeat(30) + '\n');

  // Check for authentication
  if (!TEST_AUTH_TOKEN && !TEST_AUTH_COOKIE) {
    console.log('⚠️  Warning: No authentication token provided.');
    console.log('   Dashboard endpoints require authentication.');
    console.log('   Set TEST_AUTH_TOKEN or TEST_AUTH_COOKIE in .env');
    console.log('   Tests will likely return 401 Unauthorized.\n');
  }

  const results = {
    individual: null,
    mixed: null,
    pagination: null,
    dateRange: null,
    concurrent: null,
  };

  try {
    // Test individual endpoints
    results.individual = await testAllEndpoints();
    
    // Test mixed workload
    results.mixed = await testMixedWorkload();
    
    // Test pagination stress
    results.pagination = await testPaginationStress();
    
    // Test date range filters
    results.dateRange = await testDateRangeFilters();
    
    // Test concurrent access
    results.concurrent = await testConcurrentAccess();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DASHBOARD LOAD TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n1. Individual Endpoint Performance:');
    results.individual.forEach(r => {
      const status = r.latency.average < 500 ? '✅' : r.latency.average < 1000 ? '⚠️' : '❌';
      console.log(`   ${status} ${r.name}: ${r.latency.average.toFixed(0)}ms avg`);
    });
    
    console.log('\n2. Mixed Workload:');
    console.log(`   - Avg Latency: ${results.mixed.latency.average.toFixed(2)}ms`);
    console.log(`   - Throughput: ${results.mixed.requests.average.toFixed(0)} req/s`);
    
    console.log('\n3. Pagination Stress:');
    console.log(`   - Avg Latency: ${results.pagination.latency.average.toFixed(2)}ms`);
    console.log(`   - P99 Latency: ${results.pagination.latency.p99}ms`);
    
    console.log('\n4. Date Range Filters:');
    console.log(`   - Avg Latency: ${results.dateRange.latency.average.toFixed(2)}ms`);
    console.log(`   - P99 Latency: ${results.dateRange.latency.p99}ms`);
    
    console.log('\n5. Concurrent Access (200 users):');
    console.log(`   - Avg Latency: ${results.concurrent.latency.average.toFixed(2)}ms`);
    console.log(`   - Max Latency: ${results.concurrent.latency.max}ms`);
    console.log(`   - Errors: ${results.concurrent.errors}`);
    
    // Bottleneck identification
    console.log('\n' + '='.repeat(60));
    console.log('🔍 BOTTLENECK ANALYSIS');
    console.log('='.repeat(60));
    
    // Find slowest endpoints
    const sortedEndpoints = [...results.individual].sort((a, b) => b.latency.average - a.latency.average);
    const slowest = sortedEndpoints[0];
    
    if (slowest.latency.average > 500) {
      console.log(`\n⚠️  Slowest endpoint: ${slowest.name}`);
      console.log(`   Average latency: ${slowest.latency.average.toFixed(0)}ms`);
      console.log('   Recommendations:');
      
      if (slowest.name.includes('Chart') || slowest.name.includes('Funnel')) {
        console.log('   - Optimize aggregation queries');
        console.log('   - Pre-compute chart data on write');
        console.log('   - Increase cache TTL for analytics');
      } else if (slowest.name.includes('Sales') || slowest.name.includes('Payouts')) {
        console.log('   - Add composite indexes for filtering');
        console.log('   - Implement cursor-based pagination');
        console.log('   - Cache frequently accessed pages');
      } else {
        console.log('   - Review database query plans');
        console.log('   - Add appropriate indexes');
        console.log('   - Implement caching');
      }
    }
    
    // Check for database bottleneck
    if (results.pagination.latency.p99 > results.pagination.latency.average * 3) {
      console.log('\n⚠️  High latency variance in pagination');
      console.log('   Possible database contention');
      console.log('   Recommendations:');
      console.log('   - Add indexes on pagination columns');
      console.log('   - Use keyset pagination instead of offset');
      console.log('   - Implement connection pooling');
    }
    
    // Check for caching effectiveness
    if (results.mixed.latency.average > 200) {
      console.log('\n⚠️  Caching may not be effective');
      console.log('   Recommendations:');
      console.log('   - Verify Redis caching is working');
      console.log('   - Increase cache hit rate');
      console.log('   - Pre-warm cache for common queries');
    }
    
    // Check for scaling issues
    if (results.concurrent.latency.average > results.mixed.latency.average * 2) {
      console.log('\n⚠️  Performance degrades under high concurrency');
      console.log('   Recommendations:');
      console.log('   - Increase database connection pool');
      console.log('   - Add read replicas');
      console.log('   - Consider horizontal scaling');
    }
    
    // Overall assessment
    const avgLatency = results.individual.reduce((sum, r) => sum + r.latency.average, 0) / results.individual.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 OVERALL ASSESSMENT');
    console.log('='.repeat(60));
    
    if (avgLatency < 200) {
      console.log('\n✅ Dashboard performance is EXCELLENT');
      console.log('   Average endpoint latency: ' + avgLatency.toFixed(0) + 'ms');
    } else if (avgLatency < 500) {
      console.log('\n✅ Dashboard performance is GOOD');
      console.log('   Average endpoint latency: ' + avgLatency.toFixed(0) + 'ms');
    } else if (avgLatency < 1000) {
      console.log('\n⚠️  Dashboard performance is ACCEPTABLE');
      console.log('   Average endpoint latency: ' + avgLatency.toFixed(0) + 'ms');
      console.log('   Consider implementing optimizations');
    } else {
      console.log('\n❌ Dashboard performance NEEDS IMPROVEMENT');
      console.log('   Average endpoint latency: ' + avgLatency.toFixed(0) + 'ms');
      console.log('   Immediate optimization recommended');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Dashboard load testing complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Load test failed:', error.message);
    process.exit(1);
  }
}

main();
