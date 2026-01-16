/**
 * Gallery Purchase Service Tests
 * Tests for gallery purchase operations including checkout, access verification, and refunds
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GalleryPurchaseService, clearAccessCache } from '../gallery-purchase.service';
import { ValidationError, NotFoundError, AppError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  refunds: {
    create: vi.fn(),
  },
} as unknown as Stripe;

// Mock Stripe client
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

// Mock Supabase client
const createMockSupabase = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  // Chain methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, select: mockSelect });
  mockSingle.mockResolvedValue({ data: null, error: null });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: any };
};

describe('GalleryPurchaseService', () => {
  let service: GalleryPurchaseService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  // Test data
  const mockGallery = {
    id: 'gallery-123',
    title: 'Test Gallery',
    user_id: 'photographer-123',
    slug: 'test-gallery',
  };

  const mockMonetization = {
    gallery_id: 'gallery-123',
    is_enabled: true,
    price_cents: 2999,
    currency: 'usd',
    preview_mode: 'full_paywall',
    access_duration_days: null,
    platform_fee_percent: 10.0,
  };

  const mockConnectAccount = {
    stripe_account_id: 'acct_123',
    charges_enabled: true,
  };

  const mockPurchase = {
    id: 'purchase-123',
    gallery_id: 'gallery-123',
    photographer_id: 'photographer-123',
    buyer_email: 'buyer@example.com',
    buyer_name: 'Test Buyer',
    buyer_session_id: 'session-123',
    stripe_payment_intent_id: 'pi_123',
    stripe_charge_id: 'ch_123',
    stripe_customer_id: 'cus_123',
    amount_cents: 2999,
    currency: 'usd',
    platform_fee_cents: 300,
    photographer_earnings_cents: 2699,
    status: 'succeeded',
    refund_reason: null,
    access_granted_at: '2024-01-15T10:00:00Z',
    access_expires_at: null,
    purchased_at: '2024-01-15T10:00:00Z',
    refunded_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new GalleryPurchaseService(mockSupabase as any);
    vi.clearAllMocks();
    clearAccessCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock connect account lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockConnectAccount,
        error: null,
      });

      // Mock existing purchase check (not found - by email)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock existing purchase check (not found - by session)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create = vi.fn().mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/cs_123',
      });

      const result = await service.createCheckoutSession(
        'gallery-123',
        'buyer@example.com',
        'session-123'
      );

      expect(result).toEqual({
        sessionId: 'cs_123',
        url: 'https://checkout.stripe.com/cs_123',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'buyer@example.com',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              quantity: 1,
            }),
          ]),
          payment_intent_data: expect.objectContaining({
            application_fee_amount: 300, // 10% of 2999
            transfer_data: {
              destination: 'acct_123',
            },
          }),
        })
      );
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(
        service.createCheckoutSession('gallery-123', 'invalid-email')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if monetization not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.createCheckoutSession('gallery-123', 'buyer@example.com')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if gallery not found', async () => {
      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      // Mock gallery lookup (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.createCheckoutSession('gallery-123', 'buyer@example.com')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if photographer has no Connect account', async () => {
      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock connect account lookup (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.createCheckoutSession('gallery-123', 'buyer@example.com')
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError if charges not enabled', async () => {
      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock connect account lookup (charges not enabled)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { ...mockConnectAccount, charges_enabled: false },
        error: null,
      });

      await expect(
        service.createCheckoutSession('gallery-123', 'buyer@example.com')
      ).rejects.toThrow(AppError);
    });

    it('should throw ValidationError if buyer already has access', async () => {
      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock connect account lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockConnectAccount,
        error: null,
      });

      // Mock existing purchase check (found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      await expect(
        service.createCheckoutSession('gallery-123', 'buyer@example.com')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('recordPurchase', () => {
    const mockPaymentIntent: Stripe.PaymentIntent = {
      id: 'pi_123',
      amount: 2999,
      currency: 'usd',
      latest_charge: 'ch_123',
      metadata: {
        gallery_id: 'gallery-123',
        buyer_email: 'buyer@example.com',
        photographer_id: 'photographer-123',
        buyer_session_id: 'session-123',
      },
    } as any;

    const mockSession: Stripe.Checkout.Session = {
      id: 'cs_123',
      customer: 'cus_123',
      customer_email: 'buyer@example.com',
      customer_details: {
        name: 'Test Buyer',
        email: 'buyer@example.com',
      },
      metadata: {
        gallery_id: 'gallery-123',
        buyer_email: 'buyer@example.com',
        photographer_id: 'photographer-123',
        buyer_session_id: 'session-123',
      },
    } as any;

    it('should record purchase successfully', async () => {
      // Mock duplicate check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { access_duration_days: null },
        error: null,
      });

      // Mock insert
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock stats update - get current
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { total_sales: 0, total_revenue_cents: 0 },
        error: null,
      });

      // Mock stats update - update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await service.recordPurchase(mockPaymentIntent, mockSession);

      expect(result.id).toBe('purchase-123');
      expect(result.galleryId).toBe('gallery-123');
      expect(result.buyerEmail).toBe('buyer@example.com');
      expect(result.status).toBe('succeeded');
    });

    it('should handle duplicate purchase (idempotency)', async () => {
      // Mock duplicate check (found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { id: 'purchase-123' },
        error: null,
      });

      // Mock get purchase by ID
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.recordPurchase(mockPaymentIntent, mockSession);

      expect(result.id).toBe('purchase-123');
    });

    it('should throw ValidationError if missing metadata', async () => {
      const invalidPaymentIntent = {
        ...mockPaymentIntent,
        metadata: {},
      } as any;

      const invalidSession = {
        ...mockSession,
        metadata: {},
        customer_email: null,
      } as any;

      // Mock duplicate check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.recordPurchase(invalidPaymentIntent, invalidSession)
      ).rejects.toThrow(ValidationError);
    });

    it('should calculate access expiration when duration is set', async () => {
      // Mock duplicate check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock monetization lookup with duration
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { access_duration_days: 30 },
        error: null,
      });

      // Mock insert
      const purchaseWithExpiration = {
        ...mockPurchase,
        access_expires_at: '2024-02-14T10:00:00Z',
      };
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: purchaseWithExpiration,
        error: null,
      });

      // Mock stats update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { total_sales: 0, total_revenue_cents: 0 },
        error: null,
      });
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await service.recordPurchase(mockPaymentIntent, mockSession);

      expect(result.accessExpiresAt).toBe('2024-02-14T10:00:00Z');
    });
  });

  describe('verifyPurchase', () => {
    it('should find purchase by email', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.verifyPurchase('gallery-123', 'buyer@example.com');

      expect(result).not.toBeNull();
      expect(result?.buyerEmail).toBe('buyer@example.com');
    });

    it('should find purchase by session ID', async () => {
      // First query by email (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Second query by session ID (found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.verifyPurchase('gallery-123', 'session-123');

      expect(result).not.toBeNull();
      expect(result?.buyerSessionId).toBe('session-123');
    });

    it('should return null if purchase not found', async () => {
      // Query by email (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Query by session ID (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.verifyPurchase('gallery-123', 'unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('grantAccess', () => {
    it('should grant access successfully', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          gallery_id: 'gallery-123',
          buyer_email: 'buyer@example.com',
          buyer_session_id: 'session-123',
        },
        error: null,
      });

      // Mock monetization lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { access_duration_days: null },
        error: null,
      });

      // Mock update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.grantAccess('purchase-123')).resolves.not.toThrow();
    });

    it('should throw NotFoundError if purchase not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.grantAccess('purchase-123')).rejects.toThrow(NotFoundError);
    });

    it('should set access expiration when duration is configured', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          gallery_id: 'gallery-123',
          buyer_email: 'buyer@example.com',
          buyer_session_id: null,
        },
        error: null,
      });

      // Mock monetization lookup with duration
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { access_duration_days: 30 },
        error: null,
      });

      // Mock update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.grantAccess('purchase-123')).resolves.not.toThrow();
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access successfully', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          gallery_id: 'gallery-123',
          buyer_email: 'buyer@example.com',
          buyer_session_id: 'session-123',
        },
        error: null,
      });

      // Mock update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.revokeAccess('purchase-123')).resolves.not.toThrow();
    });

    it('should throw NotFoundError if purchase not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.revokeAccess('purchase-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkAccess', () => {
    it('should return hasAccess true for valid purchase', async () => {
      // Mock verify purchase (by email)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.checkAccess('gallery-123', 'buyer@example.com');

      expect(result.hasAccess).toBe(true);
      expect(result.purchase).toBeDefined();
    });

    it('should return hasAccess false if no purchase', async () => {
      // Mock verify purchase (not found by email)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock verify purchase (not found by session)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.checkAccess('gallery-123', 'unknown@example.com');

      expect(result.hasAccess).toBe(false);
    });

    it('should return hasAccess false if access not granted', async () => {
      const purchaseWithoutAccess = {
        ...mockPurchase,
        access_granted_at: null,
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: purchaseWithoutAccess,
        error: null,
      });

      const result = await service.checkAccess('gallery-123', 'buyer@example.com');

      expect(result.hasAccess).toBe(false);
      expect(result.purchase).toBeDefined();
    });

    it('should return hasAccess false if access expired', async () => {
      const expiredPurchase = {
        ...mockPurchase,
        access_expires_at: '2020-01-01T00:00:00Z', // Past date
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: expiredPurchase,
        error: null,
      });

      const result = await service.checkAccess('gallery-123', 'buyer@example.com');

      expect(result.hasAccess).toBe(false);
      expect(result.expiresAt).toBe('2020-01-01T00:00:00Z');
    });

    it('should use cache for repeated checks', async () => {
      // First call - hits database
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result1 = await service.checkAccess('gallery-123', 'buyer@example.com');
      expect(result1.hasAccess).toBe(true);

      // Second call - should use cache (no additional DB call)
      const result2 = await service.checkAccess('gallery-123', 'buyer@example.com');
      expect(result2.hasAccess).toBe(true);

      // Verify only one DB call was made
      expect(mockSupabase._mocks.single).toHaveBeenCalledTimes(1);
    });
  });

  describe('refundPurchase', () => {
    it('should process refund successfully', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refund
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_123',
        status: 'succeeded',
      });

      // Mock update purchase
      const refundedPurchase = {
        ...mockPurchase,
        status: 'refunded',
        refund_reason: 'Customer requested refund',
        refunded_at: '2024-01-16T10:00:00Z',
        access_granted_at: null,
        access_expires_at: null,
      };
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: refundedPurchase,
        error: null,
      });

      const result = await service.refundPurchase('purchase-123', 'Customer requested refund');

      expect(result.status).toBe('refunded');
      expect(result.refundReason).toBe('Customer requested refund');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_123',
          reason: 'requested_by_customer',
        })
      );
    });

    it('should throw NotFoundError if purchase not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.refundPurchase('purchase-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if already refunded', async () => {
      const refundedPurchase = {
        ...mockPurchase,
        status: 'refunded',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: refundedPurchase,
        error: null,
      });

      await expect(
        service.refundPurchase('purchase-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if purchase not succeeded', async () => {
      const failedPurchase = {
        ...mockPurchase,
        status: 'failed',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: failedPurchase,
        error: null,
      });

      await expect(
        service.refundPurchase('purchase-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw AppError if Stripe refund fails', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refund failure
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_123',
        status: 'failed',
      });

      await expect(
        service.refundPurchase('purchase-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getPurchase', () => {
    it('should return purchase if found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.getPurchase('gallery-123', 'buyer@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('purchase-123');
    });

    it('should return null if not found', async () => {
      // Query by email (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Query by session ID (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getPurchase('gallery-123', 'unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getRefundableAmount', () => {
    it('should return full amount as refundable for succeeded purchase with no prior refunds', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list (empty)
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [],
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.purchaseId).toBe('purchase-123');
      expect(result.originalAmountCents).toBe(2999);
      expect(result.refundedAmountCents).toBe(0);
      expect(result.refundableAmountCents).toBe(2999);
      expect(result.currency).toBe('usd');
      expect(result.isFullyRefunded).toBe(false);
      expect(result.canRefund).toBe(true);
    });

    it('should return partial refundable amount when some refunds exist', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list with existing refund
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [
          { id: 're_1', amount: 1000, status: 'succeeded' },
        ],
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.originalAmountCents).toBe(2999);
      expect(result.refundedAmountCents).toBe(1000);
      expect(result.refundableAmountCents).toBe(1999);
      expect(result.isFullyRefunded).toBe(false);
      expect(result.canRefund).toBe(true);
    });

    it('should return zero refundable for fully refunded purchase', async () => {
      const refundedPurchase = {
        ...mockPurchase,
        status: 'refunded',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: refundedPurchase,
        error: null,
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.refundableAmountCents).toBe(0);
      expect(result.isFullyRefunded).toBe(true);
      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Purchase has already been fully refunded');
    });

    it('should return canRefund false for failed purchase', async () => {
      const failedPurchase = {
        ...mockPurchase,
        status: 'failed',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: failedPurchase,
        error: null,
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toContain('Cannot refund purchase with status');
    });

    it('should throw NotFoundError if purchase not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.getRefundableAmount('purchase-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle Stripe API errors gracefully', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list error
      mockStripe.refunds.list = vi.fn().mockRejectedValue(new Error('Stripe API error'));

      // Should still return result with 0 refunded amount
      const result = await service.getRefundableAmount('purchase-123');

      expect(result.refundedAmountCents).toBe(0);
      expect(result.refundableAmountCents).toBe(2999);
      expect(result.canRefund).toBe(true);
    });

    it('should include pending refunds in refunded amount', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list with pending refund
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [
          { id: 're_1', amount: 500, status: 'pending' },
          { id: 're_2', amount: 500, status: 'succeeded' },
        ],
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.refundedAmountCents).toBe(1000);
      expect(result.refundableAmountCents).toBe(1999);
    });

    it('should exclude failed refunds from refunded amount', async () => {
      // Mock get purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list with failed refund
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [
          { id: 're_1', amount: 500, status: 'failed' },
          { id: 're_2', amount: 500, status: 'succeeded' },
        ],
      });

      const result = await service.getRefundableAmount('purchase-123');

      expect(result.refundedAmountCents).toBe(500); // Only succeeded refund
      expect(result.refundableAmountCents).toBe(2499);
    });
  });

  describe('processPartialRefund', () => {
    it('should process partial refund successfully', async () => {
      // Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list (empty)
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [],
      });

      // Mock get purchase for processPartialRefund
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe partial refund
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_partial_123',
        status: 'succeeded',
        amount: 1000,
      });

      // Mock update purchase (partial refund doesn't change status)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          ...mockPurchase,
          refund_reason: 'Partial refund: 1000 cents',
        },
        error: null,
      });

      const result = await service.processPartialRefund('purchase-123', 1000, 'Partial refund requested');

      expect(result.refundId).toBe('re_partial_123');
      expect(result.refundedAmountCents).toBe(1000);
      expect(result.remainingAmountCents).toBe(1999);
      expect(result.isFullyRefunded).toBe(false);
      expect(result.purchase.status).toBe('succeeded');
    });

    it('should mark purchase as refunded when partial refund completes full amount', async () => {
      // Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list (empty)
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [],
      });

      // Mock get purchase for processPartialRefund
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe partial refund for full amount
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_full_123',
        status: 'succeeded',
        amount: 2999,
      });

      // Mock update purchase (full refund changes status)
      const refundedPurchase = {
        ...mockPurchase,
        status: 'refunded',
        refund_reason: 'Partial refunds completed full refund',
        refunded_at: '2024-01-16T10:00:00Z',
        access_granted_at: null,
        access_expires_at: null,
      };
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: refundedPurchase,
        error: null,
      });

      const result = await service.processPartialRefund('purchase-123', 2999);

      expect(result.isFullyRefunded).toBe(true);
      expect(result.remainingAmountCents).toBe(0);
      expect(result.purchase.status).toBe('refunded');
    });

    it('should throw ValidationError for zero amount', async () => {
      await expect(
        service.processPartialRefund('purchase-123', 0)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative amount', async () => {
      await expect(
        service.processPartialRefund('purchase-123', -100)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when amount exceeds refundable amount', async () => {
      // Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list with existing refund
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [
          { id: 're_1', amount: 2000, status: 'succeeded' },
        ],
      });

      // Try to refund more than remaining
      await expect(
        service.processPartialRefund('purchase-123', 1500)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for already refunded purchase', async () => {
      const refundedPurchase = {
        ...mockPurchase,
        status: 'refunded',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: refundedPurchase,
        error: null,
      });

      await expect(
        service.processPartialRefund('purchase-123', 1000)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if purchase not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.processPartialRefund('purchase-123', 1000)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if Stripe partial refund fails', async () => {
      // Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list (empty)
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [],
      });

      // Mock get purchase for processPartialRefund
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe partial refund failure
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_failed_123',
        status: 'failed',
      });

      await expect(
        service.processPartialRefund('purchase-123', 1000)
      ).rejects.toThrow(AppError);
    });

    it('should include reason in Stripe metadata', async () => {
      // Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list (empty)
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [],
      });

      // Mock get purchase for processPartialRefund
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe partial refund
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_partial_123',
        status: 'succeeded',
        amount: 1000,
      });

      // Mock update purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      await service.processPartialRefund('purchase-123', 1000, 'Customer complaint');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          metadata: expect.objectContaining({
            refund_reason: 'Customer complaint',
            refund_type: 'partial',
          }),
        })
      );
    });

    it('should handle multiple partial refunds correctly', async () => {
      // First partial refund - Mock get purchase for getRefundableAmount
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe refunds list with existing partial refund
      mockStripe.refunds.list = vi.fn().mockResolvedValue({
        data: [
          { id: 're_1', amount: 1000, status: 'succeeded' },
        ],
      });

      // Mock get purchase for processPartialRefund
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      // Mock Stripe partial refund
      mockStripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_partial_2',
        status: 'succeeded',
        amount: 500,
      });

      // Mock update purchase
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPurchase,
        error: null,
      });

      const result = await service.processPartialRefund('purchase-123', 500);

      expect(result.refundedAmountCents).toBe(500);
      expect(result.remainingAmountCents).toBe(1499); // 2999 - 1000 - 500
      expect(result.isFullyRefunded).toBe(false);
    });
  });

  describe('email validation', () => {
    it('should reject empty email', async () => {
      await expect(
        service.createCheckoutSession('gallery-123', '')
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid email format', async () => {
      await expect(
        service.createCheckoutSession('gallery-123', 'not-an-email')
      ).rejects.toThrow(ValidationError);
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
      ];

      for (const email of validEmails) {
        // Mock monetization lookup (not found to trigger early exit)
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

        // Should not throw ValidationError for email, but NotFoundError for monetization
        await expect(
          service.createCheckoutSession('gallery-123', email)
        ).rejects.toThrow(NotFoundError);
      }
    });
  });

  describe('platform fee calculation', () => {
    it('should calculate 10% platform fee correctly', async () => {
      // Mock monetization lookup with different prices
      const testCases = [
        { price: 1000, expectedFee: 100 },
        { price: 2999, expectedFee: 300 },
        { price: 5000, expectedFee: 500 },
        { price: 9999, expectedFee: 1000 },
      ];

      for (const { price, expectedFee } of testCases) {
        vi.clearAllMocks();
        clearAccessCache();

        // Mock monetization lookup
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: { ...mockMonetization, price_cents: price },
          error: null,
        });

        // Mock gallery lookup
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: mockGallery,
          error: null,
        });

        // Mock connect account lookup
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: mockConnectAccount,
          error: null,
        });

        // Mock existing purchase check (not found)
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

        // Mock Stripe checkout session creation
        mockStripe.checkout.sessions.create = vi.fn().mockResolvedValue({
          id: 'cs_123',
          url: 'https://checkout.stripe.com/cs_123',
        });

        await service.createCheckoutSession('gallery-123', 'buyer@example.com');

        expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_intent_data: expect.objectContaining({
              application_fee_amount: expectedFee,
            }),
          })
        );
      }
    });
  });
});
