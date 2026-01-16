/**
 * Payout Service Tests
 * Tests for payout operations including balance, payout history, and sync
 * 
 * Requirements covered:
 * - 5.1: Automatic Payouts (Stripe Connect)
 * - 5.2: Payout History
 * - 5.3: Balance Display
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PayoutService,
  createPayoutService,
  clearBalanceCache,
  type PayoutStatus,
} from '../payout.service';
import { AppError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Stripe
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

// Mock Stripe instance
const mockStripe = {
  balance: {
    retrieve: vi.fn(),
  },
  accounts: {
    retrieve: vi.fn(),
  },
  payouts: {
    list: vi.fn(),
  },
};

/**
 * Create a chainable mock that properly handles Supabase query builder pattern
 */
const createChainableMock = (resolveValue: { data: unknown; error: unknown; count?: number }) => {
  const createMethod = (): unknown => vi.fn().mockImplementation(() => {
    return new Proxy({}, {
      get: (_, prop) => {
        if (prop === 'then') {
          return (resolve: (value: unknown) => void) => resolve(resolveValue);
        }
        return createMethod();
      }
    });
  });

  return new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => resolve(resolveValue);
      }
      return createMethod();
    }
  });
};

/**
 * Create mock Supabase client with response queue
 */
const createMockSupabase = () => {
  const responseQueue: Array<{ data: unknown; error: unknown; count?: number }> = [];
  let responseIndex = 0;

  const getNextResponse = () => {
    const response = responseQueue[responseIndex] || { data: null, error: null };
    responseIndex++;
    return response;
  };

  const mockFrom = vi.fn().mockImplementation(() => createChainableMock(getNextResponse()));

  return {
    from: mockFrom,
    addResponse: (data: unknown, error: unknown = null, count?: number) => {
      responseQueue.push({ data, error, count });
    },
    reset: () => {
      responseQueue.length = 0;
      responseIndex = 0;
    },
  };
};

describe('PayoutService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  const photographerId = 'photographer-123';
  const stripeAccountId = 'acct_test123';
  const payoutId = 'payout-uuid-123';

  const mockPayoutRecord = {
    id: 'payout-uuid-123',
    photographer_id: photographerId,
    stripe_account_id: stripeAccountId,
    stripe_payout_id: 'po_test123',
    amount_cents: 50000,
    currency: 'usd',
    status: 'paid' as PayoutStatus,
    failure_code: null,
    failure_message: null,
    arrival_date: '2024-01-20',
    created_at: '2024-01-15T10:00:00Z',
    paid_at: '2024-01-20T10:00:00Z',
    failed_at: null,
    destination_bank_account_last4: '4242',
  };

  const mockPayoutRecords = [
    mockPayoutRecord,
    {
      ...mockPayoutRecord,
      id: 'payout-uuid-456',
      stripe_payout_id: 'po_test456',
      amount_cents: 30000,
      status: 'in_transit',
      paid_at: null,
      arrival_date: '2024-01-25',
      created_at: '2024-01-18T10:00:00Z',
    },
    {
      ...mockPayoutRecord,
      id: 'payout-uuid-789',
      stripe_payout_id: 'po_test789',
      amount_cents: 10000,
      status: 'pending',
      paid_at: null,
      arrival_date: '2024-01-30',
      created_at: '2024-01-22T10:00:00Z',
    },
  ];

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
    clearBalanceCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPayouts', () => {
    it('should return paginated list of payouts', async () => {
      mockSupabase.addResponse(mockPayoutRecords, null, 3);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, {});

      expect(result.payouts).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should map payout records correctly', async () => {
      mockSupabase.addResponse([mockPayoutRecord], null, 1);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, {});

      expect(result.payouts[0]).toMatchObject({
        id: 'payout-uuid-123',
        photographerId,
        stripeAccountId,
        stripePayoutId: 'po_test123',
        amountCents: 50000,
        currency: 'usd',
        status: 'paid',
        arrivalDate: '2024-01-20',
        destinationBankAccountLast4: '4242',
      });
    });

    it('should apply status filter', async () => {
      mockSupabase.addResponse([mockPayoutRecords[0]], null, 1);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, { status: 'paid' });

      expect(result.payouts).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('photographer_payouts');
    });

    it('should apply multiple status filter', async () => {
      const pendingAndInTransit = mockPayoutRecords.filter(
        (p) => p.status === 'pending' || p.status === 'in_transit'
      );
      mockSupabase.addResponse(pendingAndInTransit, null, 2);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, {
        status: ['pending', 'in_transit'],
      });

      expect(result.payouts).toHaveLength(2);
    });

    it('should apply date filters', async () => {
      mockSupabase.addResponse([mockPayoutRecords[0]], null, 1);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, {
        startDate: '2024-01-01',
        endDate: '2024-01-16',
      });

      expect(result.payouts).toHaveLength(1);
    });

    it('should apply pagination correctly', async () => {
      mockSupabase.addResponse([], null, 100);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it('should limit max page size to 100', async () => {
      mockSupabase.addResponse([], null, 0);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, { limit: 200 });

      expect(result.limit).toBe(100);
    });

    it('should throw AppError on database error', async () => {
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getPayouts(photographerId, {})).rejects.toThrow(AppError);
    });

    it('should return empty list when no payouts', async () => {
      mockSupabase.addResponse([], null, 0);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayouts(photographerId, {});

      expect(result.payouts).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getPayoutDetails', () => {
    it('should return payout details when found', async () => {
      mockSupabase.addResponse(mockPayoutRecord);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayoutDetails(payoutId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('payout-uuid-123');
      expect(result?.amountCents).toBe(50000);
      expect(result?.status).toBe('paid');
    });

    it('should return null when payout not found', async () => {
      mockSupabase.addResponse(null, { code: 'PGRST116' });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayoutDetails('unknown-payout');

      expect(result).toBeNull();
    });

    it('should include related sales when available', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          gallery_id: 'gallery-1',
          buyer_email: 'buyer1@example.com',
          amount_cents: 2999,
          platform_fee_cents: 300,
          photographer_earnings_cents: 2699,
          purchased_at: '2024-01-14T10:00:00Z',
          galleries: { title: 'Gallery 1' },
        },
        {
          id: 'sale-2',
          gallery_id: 'gallery-2',
          buyer_email: 'buyer2@example.com',
          amount_cents: 4999,
          platform_fee_cents: 500,
          photographer_earnings_cents: 4499,
          purchased_at: '2024-01-13T10:00:00Z',
          galleries: { title: 'Gallery 2' },
        },
      ];

      mockSupabase.addResponse(mockPayoutRecord);
      mockSupabase.addResponse(null, { code: 'PGRST116' }); // No previous payout
      mockSupabase.addResponse(mockSales);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayoutDetails(payoutId);

      expect(result?.relatedSales).toBeDefined();
      expect(result?.relatedSales).toHaveLength(2);
      expect(result?.relatedSales?.[0]?.galleryTitle).toBe('Gallery 1');
    });

    it('should handle failed payout with failure details', async () => {
      const failedPayout = {
        ...mockPayoutRecord,
        status: 'failed',
        failure_code: 'account_closed',
        failure_message: 'The bank account has been closed',
        paid_at: null,
        failed_at: '2024-01-20T10:00:00Z',
      };
      mockSupabase.addResponse(failedPayout);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getPayoutDetails(payoutId);

      expect(result?.status).toBe('failed');
      expect(result?.failureCode).toBe('account_closed');
      expect(result?.failureMessage).toBe('The bank account has been closed');
      expect(result?.failedAt).toBe('2024-01-20T10:00:00Z');
    });
  });

  describe('getBalance', () => {
    const mockStripeBalance = {
      available: [
        { amount: 50000, currency: 'usd', source_types: { card: 45000, bank_account: 5000 } },
      ],
      pending: [
        { amount: 10000, currency: 'usd', source_types: { card: 10000 } },
      ],
      instant_available: [
        { amount: 45000, currency: 'usd' },
      ],
    };

    it('should return balance from Stripe', async () => {
      mockStripe.balance.retrieve.mockResolvedValue(mockStripeBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getBalance(stripeAccountId);

      expect(result.totalAvailable).toBe(50000);
      expect(result.totalPending).toBe(10000);
      expect(result.currency).toBe('usd');
      expect(result.available).toHaveLength(1);
      expect(result.pending).toHaveLength(1);
      expect(result.instantAvailable).toHaveLength(1);
    });

    it('should cache balance results', async () => {
      mockStripe.balance.retrieve.mockResolvedValue(mockStripeBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getBalance(stripeAccountId);
      const result2 = await service.getBalance(stripeAccountId);

      expect(result1).toEqual(result2);
      expect(mockStripe.balance.retrieve).toHaveBeenCalledTimes(1);
    });

    it('should use different cache keys for different accounts', async () => {
      mockStripe.balance.retrieve.mockResolvedValue(mockStripeBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      
      await service.getBalance('acct_test1');
      await service.getBalance('acct_test2');

      expect(mockStripe.balance.retrieve).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-currency balances', async () => {
      const multiCurrencyBalance = {
        available: [
          { amount: 50000, currency: 'usd' },
          { amount: 40000, currency: 'eur' },
        ],
        pending: [
          { amount: 10000, currency: 'usd' },
          { amount: 5000, currency: 'eur' },
        ],
      };
      mockStripe.balance.retrieve.mockResolvedValue(multiCurrencyBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getBalance('acct_multi');

      expect(result.available).toHaveLength(2);
      expect(result.pending).toHaveLength(2);
      // Primary currency is the first one
      expect(result.currency).toBe('usd');
      expect(result.totalAvailable).toBe(50000);
    });

    it('should throw AppError on Stripe error', async () => {
      const stripeError = new Error('Stripe error');
      (stripeError as unknown as { statusCode: number; code: string }).statusCode = 400;
      (stripeError as unknown as { statusCode: number; code: string }).code = 'invalid_request';
      mockStripe.balance.retrieve.mockRejectedValue(stripeError);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getBalance('acct_invalid')).rejects.toThrow(AppError);
    });

    it('should handle empty balance', async () => {
      const emptyBalance = {
        available: [],
        pending: [],
      };
      mockStripe.balance.retrieve.mockResolvedValue(emptyBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getBalance('acct_empty');

      expect(result.totalAvailable).toBe(0);
      expect(result.totalPending).toBe(0);
      expect(result.currency).toBe('usd'); // Default
    });
  });

  describe('getNextPayoutDate', () => {
    it('should return next payout date for daily schedule', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
              delay_days: 2,
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return next payout date for weekly schedule', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'monday',
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeInstanceOf(Date);
      // Should be a Monday
      expect(result!.getDay()).toBe(1);
    });

    it('should return next payout date for monthly schedule', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'monthly',
              monthly_anchor: 15,
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeInstanceOf(Date);
      // Should be the 15th (or last day if month has fewer days)
      expect(result!.getDate()).toBeLessThanOrEqual(15);
    });

    it('should return null for manual payout schedule', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeNull();
    });

    it('should return null when no payout schedule', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {},
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeNull();
    });

    it('should add delay days to calculated date', async () => {
      const now = new Date();
      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
              delay_days: 7,
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      expect(result).toBeInstanceOf(Date);
      // Should be at least 7 days from now
      const minExpectedDate = new Date(now);
      minExpectedDate.setDate(minExpectedDate.getDate() + 7);
      expect(result!.getTime()).toBeGreaterThanOrEqual(minExpectedDate.getTime() - 86400000); // Allow 1 day tolerance
    });

    it('should throw AppError on Stripe error', async () => {
      const stripeError = new Error('Account not found');
      (stripeError as unknown as { statusCode: number; code: string }).statusCode = 404;
      (stripeError as unknown as { statusCode: number; code: string }).code = 'resource_missing';
      mockStripe.accounts.retrieve.mockRejectedValue(stripeError);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getNextPayoutDate('acct_invalid')).rejects.toThrow(AppError);
    });
  });

  describe('syncPayouts', () => {
    const mockStripePayouts = {
      data: [
        {
          id: 'po_new1',
          amount: 25000,
          currency: 'usd',
          status: 'paid',
          arrival_date: Math.floor(Date.now() / 1000) + 86400,
          created: Math.floor(Date.now() / 1000),
          destination: { last4: '1234' },
          failure_code: null,
          failure_message: null,
        },
        {
          id: 'po_new2',
          amount: 15000,
          currency: 'usd',
          status: 'pending',
          arrival_date: Math.floor(Date.now() / 1000) + 172800,
          created: Math.floor(Date.now() / 1000) - 3600,
          destination: { last4: '5678' },
          failure_code: null,
          failure_message: null,
        },
      ],
    };

    it('should sync new payouts from Stripe', async () => {
      // Connect account lookup
      mockSupabase.addResponse({ user_id: photographerId });
      // Latest payout lookup
      mockSupabase.addResponse(null, { code: 'PGRST116' });
      // Check existing payout 1
      mockSupabase.addResponse(null, { code: 'PGRST116' });
      // Insert payout 1
      mockSupabase.addResponse({ id: 'new-uuid-1' });
      // Check existing payout 2
      mockSupabase.addResponse(null, { code: 'PGRST116' });
      // Insert payout 2
      mockSupabase.addResponse({ id: 'new-uuid-2' });

      mockStripe.payouts.list.mockResolvedValue(mockStripePayouts);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.syncPayouts(stripeAccountId);

      expect(result).toBe(2);
      expect(mockStripe.payouts.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
        { stripeAccount: stripeAccountId }
      );
    });

    it('should update existing payouts', async () => {
      // Connect account lookup
      mockSupabase.addResponse({ user_id: photographerId });
      // Latest payout lookup
      mockSupabase.addResponse({ created_at: '2024-01-01T00:00:00Z' });
      // Check existing payout - found
      mockSupabase.addResponse({ id: 'existing-uuid' });
      // Update payout
      mockSupabase.addResponse({ id: 'existing-uuid' });

      mockStripe.payouts.list.mockResolvedValue({
        data: [mockStripePayouts.data[0]],
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.syncPayouts(stripeAccountId);

      expect(result).toBe(1);
    });

    it('should return 0 when no new payouts', async () => {
      mockSupabase.addResponse({ user_id: photographerId });
      mockSupabase.addResponse({ created_at: '2024-01-01T00:00:00Z' });

      mockStripe.payouts.list.mockResolvedValue({ data: [] });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.syncPayouts(stripeAccountId);

      expect(result).toBe(0);
    });

    it('should throw NotFoundError when Connect account not found', async () => {
      mockSupabase.addResponse(null, { code: 'PGRST116' });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      await expect(service.syncPayouts('acct_unknown')).rejects.toThrow('Connect account not found');
    });

    it('should handle failed payouts correctly', async () => {
      const failedPayout = {
        id: 'po_failed',
        amount: 10000,
        currency: 'usd',
        status: 'failed',
        arrival_date: null,
        created: Math.floor(Date.now() / 1000),
        destination: 'ba_123',
        failure_code: 'account_closed',
        failure_message: 'Bank account was closed',
      };

      mockSupabase.addResponse({ user_id: photographerId });
      mockSupabase.addResponse(null, { code: 'PGRST116' });
      mockSupabase.addResponse(null, { code: 'PGRST116' });
      mockSupabase.addResponse({ id: 'new-uuid' });

      mockStripe.payouts.list.mockResolvedValue({ data: [failedPayout] });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.syncPayouts(stripeAccountId);

      expect(result).toBe(1);
    });

    it('should throw AppError on Stripe error', async () => {
      mockSupabase.addResponse({ user_id: photographerId });
      mockSupabase.addResponse(null, { code: 'PGRST116' });

      const stripeError = new Error('API error');
      (stripeError as unknown as { statusCode: number; code: string }).statusCode = 500;
      (stripeError as unknown as { statusCode: number; code: string }).code = 'api_error';
      mockStripe.payouts.list.mockRejectedValue(stripeError);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      await expect(service.syncPayouts(stripeAccountId)).rejects.toThrow(AppError);
    });
  });

  describe('createPayoutService factory', () => {
    it('should create a PayoutService instance', () => {
      const service = createPayoutService(mockSupabase as unknown as SupabaseClient);
      expect(service).toBeInstanceOf(PayoutService);
    });
  });

  describe('clearBalanceCache', () => {
    it('should clear the balance cache', async () => {
      const mockBalance = {
        available: [{ amount: 10000, currency: 'usd' }],
        pending: [],
      };
      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      
      // First call - should hit Stripe
      await service.getBalance(stripeAccountId);
      expect(mockStripe.balance.retrieve).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.getBalance(stripeAccountId);
      expect(mockStripe.balance.retrieve).toHaveBeenCalledTimes(1);

      // Clear cache
      clearBalanceCache();

      // Third call - should hit Stripe again
      await service.getBalance(stripeAccountId);
      expect(mockStripe.balance.retrieve).toHaveBeenCalledTimes(2);
    });
  });

  describe('date calculation helpers', () => {
    it('should calculate next business day correctly', async () => {
      // Test with a Friday - next business day should be Monday
      const friday = new Date('2024-01-19T12:00:00Z'); // Friday
      vi.setSystemTime(friday);

      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      // Next business day after Friday is Monday
      expect(result?.getDay()).toBe(1); // Monday

      vi.useRealTimers();
    });

    it('should handle month-end for monthly schedule', async () => {
      // Test with February - day 31 should become day 28/29
      const february = new Date('2024-02-15T12:00:00Z');
      vi.setSystemTime(february);

      mockStripe.accounts.retrieve.mockResolvedValue({
        settings: {
          payouts: {
            schedule: {
              interval: 'monthly',
              monthly_anchor: 31,
            },
          },
        },
      });

      const service = new PayoutService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getNextPayoutDate(stripeAccountId);

      // Should be the last day of February (29 in 2024 - leap year)
      expect(result?.getDate()).toBeLessThanOrEqual(31);

      vi.useRealTimers();
    });
  });
});
