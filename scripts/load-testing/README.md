# Load Testing Scripts for PikSend Stripe Connect Monetization

This directory contains load testing scripts for the Stripe Connect monetization system. The scripts use [autocannon](https://github.com/mcollina/autocannon), a fast HTTP/1.1 benchmarking tool written in Node.js.

## Overview

The load testing suite covers three main areas:

1. **Webhook Endpoints** - Tests the Stripe webhook handlers under high load
2. **Checkout Flow** - Tests the checkout session creation endpoint
3. **Dashboard Queries** - Tests the revenue analytics and dashboard API endpoints

## Prerequisites

1. **Node.js 18+** - Required for running the scripts
2. **Running Application** - The Next.js application must be running locally or on a staging server
3. **Test Data** - Some tests require valid test data (gallery IDs, user sessions, etc.)

## Installation

```bash
cd scripts/load-testing
npm install
```

## Configuration

Create a `.env` file in this directory (or use the root `.env`):

```env
# Base URL for the application
BASE_URL=http://localhost:3000

# Test configuration
LOAD_TEST_DURATION=30
LOAD_TEST_CONNECTIONS=100
LOAD_TEST_PIPELINING=10

# Test data (optional - for authenticated endpoints)
TEST_AUTH_TOKEN=your-test-auth-token
TEST_GALLERY_ID=your-test-gallery-id
TEST_USER_ID=your-test-user-id

# Stripe test webhook secret (for webhook signature generation)
STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_test_xxx
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_test_xxx
```

## Running Tests

### Individual Tests

```bash
# Test webhook endpoints
npm run test:webhook

# Test checkout flow
npm run test:checkout

# Test dashboard queries
npm run test:dashboard
```

### All Tests

```bash
# Run all load tests sequentially
npm run test:all

# Quick test (10 seconds, 10 connections)
npm run test:quick
```

### Custom Configuration

You can override default settings using environment variables:

```bash
# Custom duration and connections
DURATION=60 CONNECTIONS=200 npm run test:webhook

# Test against staging
BASE_URL=https://staging.piksend.com npm run test:all
```

## Test Scenarios

### 1. Webhook Load Test (`webhook-load.js`)

Tests the webhook endpoints that receive events from Stripe:

- **Endpoint**: `/api/stripe/webhook/gallery-purchase`
- **Endpoint**: `/api/stripe/connect/webhook`
- **Scenarios**:
  - High volume of `checkout.session.completed` events
  - Concurrent webhook deliveries
  - Rate limiting behavior
  - Signature verification under load

**Expected Results**:
- Response time < 3 seconds (Stripe requirement)
- 200 OK for valid webhooks
- 429 for rate-limited requests
- No dropped events

### 2. Checkout Flow Load Test (`checkout-load.js`)

Tests the checkout session creation endpoint:

- **Endpoint**: `/api/stripe/checkout/gallery-purchase`
- **Scenarios**:
  - Concurrent checkout session creation
  - Validation under load
  - Error handling for invalid requests

**Expected Results**:
- Response time < 2 seconds
- 201 Created for valid requests
- Proper error responses for invalid data

### 3. Dashboard Queries Load Test (`dashboard-load.js`)

Tests the revenue dashboard API endpoints:

- **Endpoints**:
  - `/api/photographer/revenue/overview`
  - `/api/photographer/revenue/chart`
  - `/api/photographer/sales`
  - `/api/photographer/payouts`
  - `/api/photographer/top-galleries`

**Expected Results**:
- Response time < 1 second for cached data
- Response time < 3 seconds for uncached queries
- Proper pagination handling
- No memory leaks under sustained load

## Interpreting Results

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Latency (avg)** | Average response time | < 500ms |
| **Latency (p99)** | 99th percentile response time | < 2000ms |
| **Requests/sec** | Throughput | > 100 req/s |
| **Errors** | Failed requests | < 1% |
| **Timeouts** | Timed out requests | 0 |

### Sample Output

```
Running 30s test @ http://localhost:3000/api/stripe/webhook/gallery-purchase
100 connections with 10 pipelining factor

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max      │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────────┤
│ Latency │ 12ms │ 45ms │ 156ms │ 234ms│ 52.3ms  │ 34.2ms  │ 456ms    │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 1,234   │ 1,456   │ 1,890   │ 2,123   │ 1,876   │ 234     │ 1,234   │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 30

56k requests in 30.02s, 12.3 MB read
```

## Bottleneck Identification

### Common Bottlenecks

1. **Database Queries**
   - Symptom: High latency on dashboard endpoints
   - Solution: Add indexes, implement caching

2. **Stripe API Calls**
   - Symptom: High latency on checkout creation
   - Solution: Implement connection pooling, async processing

3. **Rate Limiting**
   - Symptom: Many 429 responses
   - Solution: Adjust rate limits, implement queuing

4. **Memory Leaks**
   - Symptom: Increasing latency over time
   - Solution: Profile memory usage, fix leaks

### Monitoring During Tests

```bash
# Monitor Node.js process
node --inspect scripts/load-testing/webhook-load.js

# Monitor database connections (PostgreSQL)
SELECT count(*) FROM pg_stat_activity;

# Monitor Redis connections
redis-cli info clients
```

## Optimization Recommendations

Based on load testing results, consider:

1. **Caching**
   - Redis caching for revenue stats (already implemented)
   - Cache invalidation on webhook events

2. **Database**
   - Add composite indexes for common queries
   - Implement connection pooling
   - Use read replicas for analytics

3. **API Design**
   - Implement pagination for large datasets
   - Add ETags for conditional requests
   - Use compression for large responses

4. **Infrastructure**
   - Horizontal scaling for webhook handlers
   - CDN for static assets
   - Load balancer health checks

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3000
   ```
   Solution: Ensure the application is running

2. **Too Many Open Files**
   ```
   Error: EMFILE: too many open files
   ```
   Solution: Increase ulimit (`ulimit -n 65535`)

3. **Socket Hang Up**
   ```
   Error: socket hang up
   ```
   Solution: Increase server timeout, check for crashes

## CI/CD Integration

Add to your CI pipeline:

```yaml
load-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Install dependencies
      run: cd scripts/load-testing && npm install
    - name: Run load tests
      run: cd scripts/load-testing && npm run test:quick
      env:
        BASE_URL: ${{ secrets.STAGING_URL }}
```

## Security Notes

- Never run load tests against production without approval
- Use test/staging environments for load testing
- Ensure webhook secrets are test secrets, not production
- Monitor for any security alerts during testing

## Related Documentation

- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Next.js API Routes Performance](https://nextjs.org/docs/api-routes/introduction)
- [Autocannon Documentation](https://github.com/mcollina/autocannon)
