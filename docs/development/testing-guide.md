# Testing Guide for Stripe Connect Monetization

This guide provides comprehensive instructions for testing the PikSend Stripe Connect monetization system.

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Webhook Testing](#webhook-testing)
7. [Manual Testing Checklist](#manual-testing-checklist)
8. [Test Data & Fixtures](#test-data--fixtures)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The monetization system uses a multi-layered testing approach:

| Layer | Framework | Purpose |
|-------|-----------|---------|
| Unit Tests | Jest | Test individual services and utilities |
| Integration Tests | Jest + Supabase | Test API routes with database |
| E2E Tests | Playwright | Test complete user flows |
| Webhook Tests | Stripe CLI | Test webhook handling |

### Test File Locations

```
src/
├── lib/
│   └── services/
│       └── __tests__/
│           ├── stripe-connect.service.test.ts
│           ├── gallery-monetization.service.test.ts
│           ├── gallery-purchase.service.test.ts
│           ├── revenue.service.test.ts
│           ├── payout.service.test.ts
│           └── webhook.service.test.ts
├── app/
│   └── api/
│       ├── stripe/
│       │   ├── connect/__tests__/
│       │   │   └── routes.integration.test.ts
│       │   ├── checkout/__tests__/
│       │   │   └── gallery-purchase.integration.test.ts
│       │   └── webhook/__tests__/
│       │       └── webhook.integration.test.ts
│       └── photographer/__tests__/
│           ├── revenue-api.test.ts
│           ├── payouts-api.test.ts
│           └── refunds-api.test.ts
└── e2e/
    └── monetization/
        ├── stripe-connect.spec.ts
        ├── gallery-paywall.spec.ts
        └── checkout-flow.spec.ts
```

---

## Test Environment Setup

### Prerequisites

1. **Node.js 18+**
2. **Stripe CLI** for webhook testing
3. **Supabase CLI** for local database
4. **Test Stripe Account** (test mode)

### Environment Variables

Create a `.env.test` file:

```bash
# Supabase (local or test project)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_test_...
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Starting Local Services

```bash
# Start Supabase
supabase start

# Start Next.js dev server
npm run dev

# Start Stripe webhook listener (in separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook/gallery-purchase
```

---

## Unit Testing

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run specific service tests
npm run test -- stripe-connect.service

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### Service Test Structure

```typescript
// src/lib/services/__tests__/stripe-connect.service.test.ts

import { StripeConnectService, createStripeConnectService } from '../stripe-connect.service';
import { createMockSupabaseClient } from '@/test/mocks/supabase';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock Stripe
jest.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      del: jest.fn(),
      createLoginLink: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
  }),
}));

describe('StripeConnectService', () => {
  let service: StripeConnectService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = createStripeConnectService(mockSupabase as any);
    jest.clearAllMocks();
  });

  describe('createConnectAccount', () => {
    it('should create a new Connect account for a user', async () => {
      // Arrange
      const userId = 'user-123';
      mockSupabase.mockQuery('stripe_connect_accounts', 'select', { data: null });
      mockSupabase.mockQuery('profiles', 'select', { 
        data: { email: 'test@example.com', name: 'Test User' } 
      });
      mockSupabase.mockQuery('stripe_connect_accounts', 'insert', { data: { id: 'record-id' } });

      const mockStripe = require('@/lib/stripe/client').getStripe();
      mockStripe.accounts.create.mockResolvedValue({ 
        id: 'acct_test123',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: { currently_due: [], eventually_due: [], past_due: [] },
      });
      mockStripe.accountLinks.create.mockResolvedValue({
        url: 'https://connect.stripe.com/setup/...',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      // Act
      const result = await service.createConnectAccount(userId);

      // Assert
      expect(result.accountId).toBe('acct_test123');
      expect(result.onboardingLink).toContain('https://connect.stripe.com');
      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          email: 'test@example.com',
        })
      );
    });

    it('should throw ValidationError if user already has account', async () => {
      // Arrange
      const userId = 'user-123';
      mockSupabase.mockQuery('stripe_connect_accounts', 'select', { 
        data: { stripe_account_id: 'acct_existing' } 
      });

      // Act & Assert
      await expect(service.createConnectAccount(userId))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw NotFoundError if user profile not found', async () => {
      // Arrange
      const userId = 'user-123';
      mockSupabase.mockQuery('stripe_connect_accounts', 'select', { data: null });
      mockSupabase.mockQuery('profiles', 'select', { data: null, error: { code: 'PGRST116' } });

      // Act & Assert
      await expect(service.createConnectAccount(userId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('getAccountStatus', () => {
    it('should return account status from Stripe', async () => {
      // Arrange
      const accountId = 'acct_test123';
      const mockStripe = require('@/lib/stripe/client').getStripe();
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          disabled_reason: null,
        },
      });

      // Act
      const status = await service.getAccountStatus(accountId);

      // Assert
      expect(status.accountId).toBe(accountId);
      expect(status.chargesEnabled).toBe(true);
      expect(status.payoutsEnabled).toBe(true);
      expect(status.onboardingCompleted).toBe(true);
    });
  });
});
```

### Mock Utilities

```typescript
// src/test/mocks/supabase.ts

export function createMockSupabaseClient() {
  const queryResults = new Map<string, any>();

  const mockClient = {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => {
        const key = `${table}:single`;
        return Promise.resolve(queryResults.get(key) || { data: null, error: null });
      }),
    })),

    mockQuery: (table: string, operation: string, result: any) => {
      queryResults.set(`${table}:${operation}`, result);
    },

    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  };

  return mockClient;
}
```

---

## Integration Testing

### API Route Integration Tests

```typescript
// src/app/api/stripe/connect/__tests__/routes.integration.test.ts

import { createClient } from '@supabase/supabase-js';
import { POST as onboardHandler } from '../onboard/route';
import { GET as statusHandler } from '../status/route';

describe('Stripe Connect API Routes', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-connect@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });
    testUserId = user.user!.id;

    // Create test profile with Pro plan
    await supabase.from('profiles').insert({
      id: testUserId,
      email: 'test-connect@example.com',
      name: 'Test User',
      subscription_plan: 'pro',
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('stripe_connect_accounts').delete().eq('user_id', testUserId);
    await supabase.from('profiles').delete().eq('id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('POST /api/stripe/connect/onboard', () => {
    it('should create Connect account and return onboarding link', async () => {
      // Mock authentication
      jest.spyOn(require('@/lib/auth'), 'requireSupabaseClient').mockResolvedValue({
        supabase,
        userId: testUserId,
      });

      // Call handler
      const response = await onboardHandler();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.accountId).toMatch(/^acct_/);
      expect(data.onboardingUrl).toContain('stripe.com');
    });

    it('should return 403 for non-Pro users', async () => {
      // Update user to free plan
      await supabase.from('profiles').update({ subscription_plan: 'free' }).eq('id', testUserId);

      const response = await onboardHandler();
      
      expect(response.status).toBe(403);

      // Restore Pro plan
      await supabase.from('profiles').update({ subscription_plan: 'pro' }).eq('id', testUserId);
    });
  });
});
```

### Database Integration Tests

```typescript
// src/lib/services/__tests__/gallery-purchase.integration.test.ts

import { createClient } from '@supabase/supabase-js';
import { GalleryPurchaseService } from '../gallery-purchase.service';

describe('GalleryPurchaseService Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let service: GalleryPurchaseService;
  let testGalleryId: string;
  let testPhotographerId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    service = new GalleryPurchaseService(supabase);

    // Setup test data
    // ... create test photographer, gallery, monetization config
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('checkAccess', () => {
    it('should return hasAccess: false for non-purchasers', async () => {
      const result = await service.checkAccess(testGalleryId, 'nonbuyer@example.com');
      
      expect(result.hasAccess).toBe(false);
      expect(result.purchase).toBeUndefined();
    });

    it('should return hasAccess: true for valid purchasers', async () => {
      // Create test purchase
      await supabase.from('gallery_purchases').insert({
        gallery_id: testGalleryId,
        photographer_id: testPhotographerId,
        buyer_email: 'buyer@example.com',
        stripe_payment_intent_id: 'pi_test_123',
        amount_cents: 2999,
        platform_fee_cents: 300,
        photographer_earnings_cents: 2699,
        status: 'succeeded',
        access_granted_at: new Date().toISOString(),
      });

      const result = await service.checkAccess(testGalleryId, 'buyer@example.com');
      
      expect(result.hasAccess).toBe(true);
      expect(result.purchase).toBeDefined();
    });
  });
});
```

---

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/monetization/stripe-connect.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Stripe Connect Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Pro user
    await page.goto('/login');
    await page.fill('[name="email"]', 'pro-user@example.com');
    await page.fill('[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display Connect Stripe button for Pro users', async ({ page }) => {
    await page.goto('/settings');
    
    const connectButton = page.locator('button:has-text("Connect Stripe")');
    await expect(connectButton).toBeVisible();
  });

  test('should redirect to Stripe onboarding', async ({ page }) => {
    await page.goto('/settings');
    
    const connectButton = page.locator('button:has-text("Connect Stripe")');
    await connectButton.click();

    // Should redirect to Stripe
    await page.waitForURL(/connect\.stripe\.com/);
  });

  test('should show account status after connecting', async ({ page }) => {
    // Assuming account is already connected
    await page.goto('/settings');
    
    const statusBadge = page.locator('[data-testid="connect-status"]');
    await expect(statusBadge).toContainText(/Connected|Pending/);
  });
});
```

```typescript
// e2e/monetization/checkout-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Gallery Purchase Flow', () => {
  test('should complete gallery purchase', async ({ page }) => {
    // Navigate to monetized gallery
    await page.goto('/g/test-gallery-slug');

    // Should see paywall
    const paywall = page.locator('[data-testid="gallery-paywall"]');
    await expect(paywall).toBeVisible();

    // Click purchase button
    await page.click('button:has-text("Purchase Access")');

    // Fill email
    await page.fill('[name="email"]', 'buyer@example.com');
    await page.click('button:has-text("Continue to Payment")');

    // Should redirect to Stripe Checkout
    await page.waitForURL(/checkout\.stripe\.com/);

    // Fill test card details (Stripe test mode)
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="cardExpiry"]', '12/30');
    await page.fill('[name="cardCvc"]', '123');
    await page.fill('[name="billingName"]', 'Test Buyer');

    // Submit payment
    await page.click('button:has-text("Pay")');

    // Should redirect back to gallery with success
    await page.waitForURL(/\/g\/test-gallery-slug\?purchase=success/);

    // Should have access to gallery
    const galleryContent = page.locator('[data-testid="gallery-content"]');
    await expect(galleryContent).toBeVisible();
  });
});
```

---

## Webhook Testing

### Using Stripe CLI

```bash
# Start webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook/gallery-purchase

# In another terminal, trigger events
stripe trigger checkout.session.completed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
stripe trigger account.updated
stripe trigger payout.paid
```

### Webhook Test Script

```typescript
// scripts/test-webhooks.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function testCheckoutWebhook() {
  console.log('Testing checkout.session.completed webhook...');

  // Create a test checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: 2999,
        product_data: {
          name: 'Test Gallery Access',
        },
      },
      quantity: 1,
    }],
    metadata: {
      type: 'gallery_purchase',
      gallery_id: 'test-gallery-id',
      buyer_email: 'test@example.com',
      photographer_id: 'test-photographer-id',
    },
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
  });

  console.log('Created session:', session.id);
  console.log('Complete payment at:', session.url);
}

async function testRefundWebhook() {
  console.log('Testing charge.refunded webhook...');

  // Get a recent charge
  const charges = await stripe.charges.list({ limit: 1 });
  if (charges.data.length === 0) {
    console.log('No charges found to refund');
    return;
  }

  const charge = charges.data[0];
  
  // Create refund
  const refund = await stripe.refunds.create({
    charge: charge.id,
    reason: 'requested_by_customer',
  });

  console.log('Created refund:', refund.id);
}

// Run tests
testCheckoutWebhook().catch(console.error);
```

### Webhook Integration Test

```typescript
// src/app/api/stripe/webhook/__tests__/webhook.integration.test.ts

import { POST } from '../gallery-purchase/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

describe('Gallery Purchase Webhook', () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  it('should process checkout.session.completed event', async () => {
    // Create test event payload
    const event: Stripe.Event = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_123',
          payment_intent: 'pi_test_123',
          customer_email: 'buyer@example.com',
          amount_total: 2999,
          currency: 'usd',
          metadata: {
            type: 'gallery_purchase',
            gallery_id: 'test-gallery-id',
            photographer_id: 'test-photographer-id',
            buyer_email: 'buyer@example.com',
          },
        } as any,
      },
      livemode: false,
      object: 'event',
      pending_webhooks: 0,
      request: null,
    };

    // Sign the payload
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE!,
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook/gallery-purchase', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
    });

    // Call handler
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should reject invalid signatures', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
      headers: {
        'stripe-signature': 'invalid_signature',
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});
```

---

## Manual Testing Checklist

### Stripe Connect Flow

- [ ] **Onboarding**
  - [ ] Pro user can initiate Connect onboarding
  - [ ] Free user sees upgrade prompt
  - [ ] Onboarding link redirects to Stripe
  - [ ] Return URL shows success message
  - [ ] Account status updates after onboarding

- [ ] **Account Management**
  - [ ] Dashboard link opens Stripe Express Dashboard
  - [ ] Disconnect removes account
  - [ ] Status badge shows correct state

### Gallery Monetization

- [ ] **Paywall Setup**
  - [ ] Can enable paywall with valid price
  - [ ] Price validation (min $5, max $500)
  - [ ] Currency selection works
  - [ ] Preview mode selection works
  - [ ] Can update paywall settings
  - [ ] Can disable paywall

- [ ] **Paywall Display**
  - [ ] Full paywall shows blurred preview
  - [ ] Freemium shows watermarked images
  - [ ] Purchase button visible
  - [ ] Price displayed correctly

### Purchase Flow

- [ ] **Checkout**
  - [ ] Email validation works
  - [ ] Checkout session created
  - [ ] Redirect to Stripe Checkout
  - [ ] Success redirect works
  - [ ] Cancel redirect works

- [ ] **Access**
  - [ ] Access granted after purchase
  - [ ] Full resolution images available
  - [ ] Download enabled
  - [ ] Access persists across sessions

### Revenue Dashboard

- [ ] **Overview**
  - [ ] Metrics display correctly
  - [ ] Period filter works
  - [ ] Comparison percentages accurate

- [ ] **Sales**
  - [ ] Sales list loads
  - [ ] Pagination works
  - [ ] Filters work
  - [ ] Export works

- [ ] **Payouts**
  - [ ] Balance displays correctly
  - [ ] Payout history loads
  - [ ] Next payout date shown

### Refunds & Disputes

- [ ] **Refunds**
  - [ ] Can process full refund
  - [ ] Can process partial refund
  - [ ] Access revoked after refund
  - [ ] Notification sent

- [ ] **Disputes**
  - [ ] Disputes list loads
  - [ ] Dispute details shown
  - [ ] Link to Stripe Dashboard works

---

## Test Data & Fixtures

### Test Users

```typescript
// test/fixtures/users.ts

export const testUsers = {
  proPhotographer: {
    email: 'pro-photographer@test.com',
    password: 'test-password-123',
    name: 'Pro Photographer',
    subscription_plan: 'pro',
  },
  freePhotographer: {
    email: 'free-photographer@test.com',
    password: 'test-password-123',
    name: 'Free Photographer',
    subscription_plan: 'free',
  },
  buyer: {
    email: 'buyer@test.com',
    password: 'test-password-123',
    name: 'Test Buyer',
  },
};
```

### Test Galleries

```typescript
// test/fixtures/galleries.ts

export const testGalleries = {
  monetizedGallery: {
    title: 'Test Monetized Gallery',
    unique_slug: 'test-monetized-gallery',
    is_active: true,
    is_public: true,
  },
  freeGallery: {
    title: 'Test Free Gallery',
    unique_slug: 'test-free-gallery',
    is_active: true,
    is_public: true,
  },
};

export const testMonetization = {
  standard: {
    is_enabled: true,
    price_cents: 2999,
    currency: 'usd',
    preview_mode: 'full_paywall',
    watermark_enabled: true,
    platform_fee_percent: 10.0,
  },
  freemium: {
    is_enabled: true,
    price_cents: 1999,
    currency: 'usd',
    preview_mode: 'freemium',
    watermark_enabled: true,
    platform_fee_percent: 10.0,
  },
};
```

### Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 0259` | Dispute (fraudulent) |

---

## Troubleshooting

### Common Test Issues

#### Tests Failing with Authentication Errors

```bash
# Ensure test environment variables are set
cp .env.test.example .env.test

# Verify Supabase is running
supabase status
```

#### Webhook Tests Not Receiving Events

```bash
# Check Stripe CLI is running
stripe listen --print-json

# Verify webhook secret matches
echo $STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE
```

#### Database State Issues

```bash
# Reset test database
supabase db reset

# Run migrations
supabase db push
```

#### Flaky E2E Tests

```typescript
// Add explicit waits
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });

// Use test isolation
test.beforeEach(async () => {
  // Reset state before each test
});
```

### Debug Commands

```bash
# Run single test with verbose output
npm run test -- --verbose stripe-connect.service.test.ts

# Run E2E tests with debug
npx playwright test --debug

# View Stripe webhook logs
stripe logs tail

# Check database state
supabase db dump --data-only
```

---

## Related Documentation

- [API Documentation](../api/stripe-connect-api.md)
- [Webhook Documentation](../api/webhooks.md)
- [Services Architecture](./services-architecture.md)
- [Database Schema](./database-schema.md)
