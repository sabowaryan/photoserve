# Services Architecture Documentation

This document describes the service layer architecture for the PikSend Stripe Connect monetization system.

## Table of Contents

1. [Overview](#overview)
2. [Service Layer Design](#service-layer-design)
3. [Core Services](#core-services)
4. [Service Dependencies](#service-dependencies)
5. [Caching Strategy](#caching-strategy)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Overview

The monetization system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      API Routes Layer                        │
│  (Next.js App Router - /api/stripe/*, /api/photographer/*)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │StripeConnect    │  │GalleryMonetiz.  │  │GalleryPurch.│  │
│  │Service          │  │Service          │  │Service      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │Revenue          │  │Payout           │  │Webhook      │  │
│  │Service          │  │Service          │  │Service      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │Supabase Client  │  │Stripe Client    │  │Cache Service│  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer Design

### Design Principles

1. **Single Responsibility**: Each service handles one domain area
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Interface-Based**: Services implement interfaces for testability
4. **Factory Pattern**: Factory functions create service instances
5. **Error Handling**: Consistent error types across services

### Service Structure

Each service follows this structure:

```typescript
// Interface definition
export interface IServiceName {
  methodA(param: Type): Promise<Result>;
  methodB(param: Type): Promise<Result>;
}

// Implementation
export class ServiceName implements IServiceName {
  constructor(
    private supabase: SupabaseClient<Database>,
    private cacheService?: ICacheService
  ) {}

  async methodA(param: Type): Promise<Result> {
    // Implementation
  }
}

// Factory function
export function createServiceName(
  supabase: SupabaseClient<Database>
): ServiceName {
  return new ServiceName(supabase);
}
```

---

## Core Services

### StripeConnectService

**Location:** `src/lib/services/stripe-connect.service.ts`

**Purpose:** Manages Stripe Connect account operations for photographers.

**Interface:**

```typescript
interface IStripeConnectService {
  createConnectAccount(userId: string): Promise<{ accountId: string; onboardingLink: string }>;
  getOnboardingLink(accountId: string): Promise<string>;
  refreshOnboardingLink(accountId: string): Promise<string>;
  getAccountStatus(accountId: string): Promise<ConnectAccountStatus>;
  updateAccountStatus(accountId: string): Promise<void>;
  createDashboardLink(accountId: string): Promise<string>;
  disconnectAccount(userId: string): Promise<void>;
}
```

**Key Types:**

```typescript
interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  onboardingCompleted: boolean;
}
```

**Usage:**

```typescript
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';

const service = createStripeConnectService(supabase);
const { accountId, onboardingLink } = await service.createConnectAccount(userId);
```

---

### GalleryMonetizationService

**Location:** `src/lib/services/gallery-monetization.service.ts`

**Purpose:** Manages gallery paywall configuration and monetization settings.

**Interface:**

```typescript
interface IGalleryMonetizationService {
  enablePaywall(galleryId: string, config: Partial<MonetizationConfig>): Promise<MonetizationConfig>;
  updatePaywall(galleryId: string, config: Partial<MonetizationConfig>): Promise<MonetizationConfig>;
  disablePaywall(galleryId: string): Promise<void>;
  getConfig(galleryId: string): Promise<MonetizationConfig | null>;
  createStripePrice(config: MonetizationConfig): Promise<string>;
  updateSalesStats(galleryId: string, salePriceCents: number): Promise<void>;
  getConversionRate(galleryId: string): Promise<number>;
}
```

**Key Types:**

```typescript
interface MonetizationConfig {
  galleryId: string;
  isEnabled: boolean;
  priceCents: number;
  currency: string;
  previewMode: 'full_paywall' | 'freemium';
  watermarkEnabled: boolean;
  accessDurationDays?: number | null;
  stripePriceId?: string | null;
  platformFeePercent?: number;
}
```

**Validation Rules:**
- Price: 500-50000 cents ($5-$500)
- Currency: `usd`, `eur`, `cad`
- Preview mode: `full_paywall`, `freemium`
- Platform fee: 0-100%

**Caching:** 5-minute cache for monetization config (see [Caching Strategy](#caching-strategy))

---

### GalleryPurchaseService

**Location:** `src/lib/services/gallery-purchase.service.ts`

**Purpose:** Handles gallery purchase operations including checkout, access verification, and refunds.

**Interface:**

```typescript
interface IGalleryPurchaseService {
  createCheckoutSession(galleryId: string, buyerEmail: string, buyerSessionId?: string): Promise<CheckoutSessionResult>;
  recordPurchase(paymentIntent: Stripe.PaymentIntent, session: Stripe.Checkout.Session): Promise<GalleryPurchase>;
  verifyPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null>;
  getPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null>;
  grantAccess(purchaseId: string): Promise<void>;
  revokeAccess(purchaseId: string): Promise<void>;
  checkAccess(galleryId: string, identifier: string): Promise<AccessCheckResult>;
  refundPurchase(purchaseId: string, reason?: string): Promise<GalleryPurchase>;
  getRefundableAmount(purchaseId: string): Promise<RefundableAmountResult>;
  processPartialRefund(purchaseId: string, amountCents: number, reason?: string): Promise<PartialRefundResult>;
}
```

**Key Types:**

```typescript
interface GalleryPurchase {
  id: string;
  galleryId: string;
  photographerId: string;
  buyerEmail: string;
  buyerName?: string | null;
  buyerSessionId?: string | null;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  photographerEarningsCents: number;
  status: 'succeeded' | 'refunded' | 'disputed' | 'failed';
  accessGrantedAt?: string | null;
  accessExpiresAt?: string | null;
  purchasedAt: string;
}

interface AccessCheckResult {
  hasAccess: boolean;
  purchase?: GalleryPurchase;
  expiresAt?: string | null;
}
```

**Platform Fee:** 10% of purchase amount

**Caching:** 5-minute cache for access verification

---

### RevenueService

**Location:** `src/lib/services/revenue.service.ts`

**Purpose:** Handles revenue analytics, sales data, and reporting for photographers.

**Interface:**

```typescript
interface IRevenueService {
  getOverview(photographerId: string, period: AnalyticsPeriod): Promise<RevenueOverview>;
  getChartData(photographerId: string, range: AnalyticsPeriod): Promise<ChartDataPoint[]>;
  getSales(photographerId: string, filters: SaleFilters): Promise<PaginatedSales>;
  getSaleDetails(saleId: string): Promise<Sale | null>;
  getTopGalleries(photographerId: string, limit?: number): Promise<TopGallery[]>;
  getConversionFunnel(photographerId: string): Promise<ConversionFunnel>;
  getRevenueByGallery(photographerId: string): Promise<GalleryRevenue[]>;
  getDetailedConversionFunnel(photographerId: string, filters?: ConversionFunnelFilters): Promise<DetailedConversionFunnel>;
  getCohortAnalysis(photographerId: string, filters?: CohortAnalysisFilters): Promise<CohortAnalysis>;
  getRevenueTrends(photographerId: string, period: AnalyticsPeriod): Promise<RevenueTrend[]>;
  getAdvancedAnalyticsSummary(photographerId: string): Promise<AdvancedAnalyticsSummary>;
}
```

**Key Types:**

```typescript
type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface RevenueOverview {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  platformFees: number;
  netRevenue: number;
  periodComparison: {
    revenueChange: number;
    salesChange: number;
  };
}

interface ConversionFunnel {
  views: number;
  paywallViews: number;
  checkoutStarts: number;
  purchases: number;
  conversionRate: number;
}
```

**Caching:** 15-minute cache for revenue statistics

---

### PayoutService

**Location:** `src/lib/services/payout.service.ts`

**Purpose:** Handles payout operations including balance, payout history, and sync with Stripe.

**Interface:**

```typescript
interface IPayoutService {
  getPayouts(photographerId: string, filters: PayoutFilters): Promise<PaginatedPayouts>;
  getPayoutDetails(payoutId: string): Promise<PayoutDetails | null>;
  getBalance(accountId: string): Promise<Balance>;
  getNextPayoutDate(accountId: string): Promise<Date | null>;
  syncPayouts(accountId: string): Promise<number>;
}
```

**Key Types:**

```typescript
type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';

interface Payout {
  id: string;
  photographerId: string;
  stripeAccountId: string;
  stripePayoutId: string | null;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  failureCode: string | null;
  failureMessage: string | null;
  arrivalDate: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface Balance {
  available: BalanceAmount[];
  pending: BalanceAmount[];
  totalAvailable: number;
  totalPending: number;
  currency: string;
}
```

**Caching:** 5-minute cache for balance data

---

### WebhookService

**Location:** `src/lib/services/webhook.service.ts`

**Purpose:** Handles Stripe webhook event processing with idempotency.

**Interface:**

```typescript
interface IWebhookService {
  processWebhook(event: Stripe.Event): Promise<WebhookProcessingResult>;
  retryFailedWebhook(eventId: string): Promise<WebhookProcessingResult>;
  logWebhookEvent(event: Stripe.Event): Promise<string>;
  updateWebhookStatus(eventId: string, status: WebhookEventStatus, errorMessage?: string): Promise<void>;
  getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | null>;
}
```

**Key Types:**

```typescript
type WebhookEventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  status: WebhookEventStatus;
  message?: string;
}
```

**Event Handlers:**
- `handleCheckoutCompleted` - Records purchase, grants access
- `handleAccountUpdated` - Updates Connect account status
- `handleChargeRefunded` - Updates purchase status, revokes access
- `handleDisputeCreated` - Marks purchase as disputed
- `handleDisputeClosed` - Updates based on dispute outcome
- `handlePayoutCreated` - Creates payout record
- `handlePayoutPaid` - Updates payout status
- `handlePayoutFailed` - Records failure details

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    WebhookService                            │
│  Dependencies:                                               │
│  - GalleryPurchaseService (checkout completed)              │
│  - StripeConnectService (account updated)                   │
│  - InAppNotificationService (all events)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              GalleryPurchaseService                          │
│  Dependencies:                                               │
│  - GalleryMonetizationService (get config)                  │
│  - CacheService (access verification)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            GalleryMonetizationService                        │
│  Dependencies:                                               │
│  - CacheService (config caching)                            │
│  - Stripe API (price creation)                              │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Injection

Services receive dependencies via constructor:

```typescript
export class GalleryMonetizationService {
  private stripe: Stripe;
  private cacheService: ICacheService;

  constructor(
    private supabase: SupabaseClient<Database>,
    cacheService?: ICacheService
  ) {
    this.stripe = getStripe();
    this.cacheService = cacheService || getCacheService();
  }
}
```

---

## Caching Strategy

### Cache Service

**Location:** `src/lib/services/cache.service.ts`

The cache service provides a unified interface for caching with Redis support:

```typescript
interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}
```

### Cache Prefixes

```typescript
const CACHE_PREFIX = {
  MONETIZATION_CONFIG: 'monetization:config:',
  PURCHASE_ACCESS: 'purchase:access:',
  REVENUE_OVERVIEW: 'revenue:overview:',
  REVENUE_CHART: 'revenue:chart:',
  REVENUE_TOP_GALLERIES: 'revenue:top:',
  REVENUE_FUNNEL: 'revenue:funnel:',
  REVENUE_BY_GALLERY: 'revenue:gallery:',
  REVENUE_DETAILED_FUNNEL: 'revenue:detailed-funnel:',
  REVENUE_COHORT: 'revenue:cohort:',
};
```

### Cache TTLs

```typescript
const CACHE_TTL = {
  MONETIZATION_CONFIG: 300,    // 5 minutes
  PURCHASE_VERIFICATION: 300,  // 5 minutes
  REVENUE_STATS: 900,          // 15 minutes
};
```

### Cache Invalidation

```typescript
const CacheInvalidation = {
  async monetizationConfig(cache: ICacheService, galleryId: string) {
    await cache.delete(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`);
  },
  
  async purchaseAccess(cache: ICacheService, galleryId: string, identifier: string) {
    const key = buildCacheKey(CACHE_PREFIX.PURCHASE_ACCESS, galleryId, identifier);
    await cache.delete(key);
  },
  
  async revenueStats(cache: ICacheService, photographerId: string) {
    await cache.deletePattern(`revenue:*:${photographerId}:*`);
  },
};
```

---

## Error Handling

### Error Types

**Location:** `src/lib/errors.ts`

```typescript
// Base error class
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

class AuthenticationError extends AppError {
  constructor() {
    super('Authentication required', 'UNAUTHORIZED', 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### Error Handling Pattern

```typescript
async someMethod(): Promise<Result> {
  try {
    // Business logic
    const result = await this.doSomething();
    return result;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof AppError) {
      throw error;
    }
    
    // Log and wrap unknown errors
    console.error('[ServiceName] Error in someMethod:', error);
    throw new AppError(
      'Failed to perform operation',
      'OPERATION_ERROR',
      500,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
```

---

## Testing

### Test File Location

Tests are located alongside service files:

```
src/lib/services/
├── stripe-connect.service.ts
├── __tests__/
│   └── stripe-connect.service.test.ts
```

### Testing Pattern

```typescript
import { createStripeConnectService } from '../stripe-connect.service';
import { createMockSupabaseClient } from '@/test/mocks/supabase';
import { createMockStripe } from '@/test/mocks/stripe';

describe('StripeConnectService', () => {
  let service: StripeConnectService;
  let mockSupabase: MockSupabaseClient;
  let mockStripe: MockStripe;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockStripe = createMockStripe();
    service = createStripeConnectService(mockSupabase);
  });

  describe('createConnectAccount', () => {
    it('should create a new Connect account', async () => {
      // Arrange
      mockSupabase.from('stripe_connect_accounts').select.mockResolvedValue({ data: null });
      mockSupabase.from('profiles').select.mockResolvedValue({ 
        data: { email: 'test@example.com' } 
      });
      mockStripe.accounts.create.mockResolvedValue({ id: 'acct_xxx' });
      mockStripe.accountLinks.create.mockResolvedValue({ url: 'https://...' });

      // Act
      const result = await service.createConnectAccount('user-id');

      // Assert
      expect(result.accountId).toBe('acct_xxx');
      expect(result.onboardingLink).toBeDefined();
    });

    it('should throw if user already has account', async () => {
      // Arrange
      mockSupabase.from('stripe_connect_accounts').select.mockResolvedValue({ 
        data: { stripe_account_id: 'acct_existing' } 
      });

      // Act & Assert
      await expect(service.createConnectAccount('user-id'))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Mocking Dependencies

```typescript
// Mock Supabase client
const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
});

// Mock Stripe client
const createMockStripe = () => ({
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    del: jest.fn(),
    createLoginLink: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  refunds: {
    create: jest.fn(),
    list: jest.fn(),
  },
});
```

---

## Related Documentation

- [API Documentation](../api/stripe-connect-api.md)
- [Webhook Documentation](../api/webhooks.md)
- [Database Schema](./database-schema.md)
- [Testing Guide](./testing-guide.md)
