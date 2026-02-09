/**
 * Email System Load Test
 * 
 * K6 load testing script for the email management system.
 * Tests queue processing, template rendering, and API endpoints under load.
 * 
 * Usage:
 *   k6 run tests/performance/email-system-load-test.js
 *   k6 run --vus 10 --duration 30s tests/performance/email-system-load-test.js
 * 
 * Requirements: 11.5, 11.6
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const emailSendRate = new Rate('email_send_success_rate');
const emailSendDuration = new Trend('email_send_duration');
const queueEnqueueRate = new Rate('queue_enqueue_success_rate');
const queueEnqueueDuration = new Trend('queue_enqueue_duration');
const templateRenderRate = new Rate('template_render_success_rate');
const templateRenderDuration = new Trend('template_render_duration');
const apiErrors = new Counter('api_errors');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 10 virtual users over 30 seconds
    { duration: '30s', target: 10 },
    // Stay at 10 users for 1 minute
    { duration: '1m', target: 10 },
    // Ramp up to 50 users over 30 seconds
    { duration: '30s', target: 50 },
    // Stay at 50 users for 2 minutes
    { duration: '2m', target: 50 },
    // Ramp down to 0 users over 30 seconds
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests should complete within 2 seconds
    http_req_duration: ['p(95)<2000'],
    // Error rate should be less than 5%
    http_req_failed: ['rate<0.05'],
    // Email send success rate should be above 95%
    email_send_success_rate: ['rate>0.95'],
    // Queue enqueue success rate should be above 99%
    queue_enqueue_success_rate: ['rate>0.99'],
    // Template render success rate should be above 99%
    template_render_success_rate: ['rate>0.99'],
  },
};

// Base URL (can be overridden with environment variable)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const TEST_TEMPLATES = [
  'purchase-confirmation',
  'sale-notification',
  'payout-notification',
  'dispute-alert',
  'refund-confirmation',
];

const TEST_VARIABLES = {
  'purchase-confirmation': {
    buyerName: 'Test User',
    galleryName: 'Test Gallery',
    photoCount: 10,
    amountPaid: '$99.99',
    transactionId: 'test-txn-123',
    purchaseDate: new Date().toISOString(),
    accessLink: 'https://example.com/gallery/test',
    photographerName: 'Test Photographer',
  },
  'sale-notification': {
    photographerName: 'Test Photographer',
    galleryName: 'Test Gallery',
    photoCount: 10,
    clientEmail: 'client@example.com',
    grossAmount: '$99.99',
    platformFee: '$9.99',
    netEarnings: '$90.00',
    transactionId: 'test-txn-123',
    saleDate: new Date().toISOString(),
    dashboardLink: 'https://example.com/dashboard',
    saleDetailsLink: 'https://example.com/sales/test',
  },
};

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('Starting email system load test...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    console.error('API health check failed. Aborting test.');
    return null;
  }
  
  return {
    baseUrl: BASE_URL,
    startTime: Date.now(),
  };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
  if (!data) {
    console.error('Setup failed. Skipping test.');
    return;
  }
  
  // Test 1: Queue email (most common operation)
  testQueueEmail(data.baseUrl);
  sleep(1);
  
  // Test 2: Send immediate email (less common)
  if (Math.random() < 0.3) {
    testSendEmail(data.baseUrl);
    sleep(1);
  }
  
  // Test 3: Render template preview (admin operation)
  if (Math.random() < 0.2) {
    testRenderTemplate(data.baseUrl);
    sleep(1);
  }
  
  // Test 4: Get queue stats (monitoring operation)
  if (Math.random() < 0.1) {
    testGetQueueStats(data.baseUrl);
    sleep(1);
  }
  
  // Test 5: Get email logs (admin operation)
  if (Math.random() < 0.15) {
    testGetEmailLogs(data.baseUrl);
    sleep(1);
  }
}

/**
 * Test queueing an email
 */
function testQueueEmail(baseUrl) {
  const templateSlug = TEST_TEMPLATES[Math.floor(Math.random() * TEST_TEMPLATES.length)];
  const variables = TEST_VARIABLES[templateSlug] || {};
  
  const payload = JSON.stringify({
    templateId: templateSlug,
    to: `test-${Date.now()}@example.com`,
    variables: variables,
    priority: Math.random() < 0.1 ? 'high' : 'normal',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'QueueEmail' },
  };
  
  const startTime = Date.now();
  const response = http.post(`${baseUrl}/api/emails/queue`, payload, params);
  const duration = Date.now() - startTime;
  
  const success = check(response, {
    'queue email status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'queue email has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  queueEnqueueRate.add(success);
  queueEnqueueDuration.add(duration);
  
  if (!success) {
    apiErrors.add(1);
    console.error(`Queue email failed: ${response.status} - ${response.body}`);
  }
}

/**
 * Test sending an immediate email
 */
function testSendEmail(baseUrl) {
  const templateSlug = TEST_TEMPLATES[Math.floor(Math.random() * TEST_TEMPLATES.length)];
  const variables = TEST_VARIABLES[templateSlug] || {};
  
  const payload = JSON.stringify({
    templateId: templateSlug,
    to: `test-${Date.now()}@example.com`,
    variables: variables,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'SendEmail' },
  };
  
  const startTime = Date.now();
  const response = http.post(`${baseUrl}/api/emails/send`, payload, params);
  const duration = Date.now() - startTime;
  
  const success = check(response, {
    'send email status is 200': (r) => r.status === 200,
    'send email has result': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  emailSendRate.add(success);
  emailSendDuration.add(duration);
  
  if (!success) {
    apiErrors.add(1);
    console.error(`Send email failed: ${response.status} - ${response.body}`);
  }
}

/**
 * Test rendering a template
 */
function testRenderTemplate(baseUrl) {
  const templateSlug = TEST_TEMPLATES[Math.floor(Math.random() * TEST_TEMPLATES.length)];
  const variables = TEST_VARIABLES[templateSlug] || {};
  
  const payload = JSON.stringify({
    variables: variables,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'RenderTemplate' },
  };
  
  const startTime = Date.now();
  const response = http.post(
    `${baseUrl}/api/emails/templates/${templateSlug}/preview`,
    payload,
    params
  );
  const duration = Date.now() - startTime;
  
  const success = check(response, {
    'render template status is 200': (r) => r.status === 200,
    'render template has html': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.html !== undefined && body.html.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  templateRenderRate.add(success);
  templateRenderDuration.add(duration);
  
  if (!success) {
    apiErrors.add(1);
    console.error(`Render template failed: ${response.status} - ${response.body}`);
  }
}

/**
 * Test getting queue statistics
 */
function testGetQueueStats(baseUrl) {
  const params = {
    tags: { name: 'GetQueueStats' },
  };
  
  const response = http.get(`${baseUrl}/api/emails/queue/stats`, params);
  
  const success = check(response, {
    'get queue stats status is 200': (r) => r.status === 200,
    'get queue stats has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.pending !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  if (!success) {
    apiErrors.add(1);
  }
}

/**
 * Test getting email logs
 */
function testGetEmailLogs(baseUrl) {
  const params = {
    tags: { name: 'GetEmailLogs' },
  };
  
  const response = http.get(`${baseUrl}/api/emails/logs?limit=20`, params);
  
  const success = check(response, {
    'get email logs status is 200': (r) => r.status === 200,
    'get email logs has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.logs);
      } catch {
        return false;
      }
    },
  });
  
  if (!success) {
    apiErrors.add(1);
  }
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  if (!data) {
    return;
  }
  
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nLoad test completed in ${duration.toFixed(2)} seconds`);
  console.log('Check the summary above for detailed metrics.');
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/performance/email-load-test-results.json': JSON.stringify(data),
  };
}

/**
 * Simple text summary helper
 */
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n' + indent + '='.repeat(60) + '\n';
  summary += indent + 'Email System Load Test Summary\n';
  summary += indent + '='.repeat(60) + '\n\n';
  
  // Add key metrics
  const metrics = data.metrics;
  
  if (metrics.http_req_duration) {
    summary += indent + `HTTP Request Duration:\n`;
    summary += indent + `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  if (metrics.email_send_success_rate) {
    summary += indent + `Email Send Success Rate: ${(metrics.email_send_success_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (metrics.queue_enqueue_success_rate) {
    summary += indent + `Queue Enqueue Success Rate: ${(metrics.queue_enqueue_success_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (metrics.template_render_success_rate) {
    summary += indent + `Template Render Success Rate: ${(metrics.template_render_success_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += '\n' + indent + '='.repeat(60) + '\n';
  
  return summary;
}
