/**
 * Webhook Service Tests
 * Tests for Stripe webhook event processing with idempotency
 * 
 * Requirements covered:
 * - 6.1: Webhook endpoint verification and logging
 * - 6.2: Gallery purchase events (checkout.session.completed)
 * - 6.3: Connect account events (account.updated)
 * - 6.4: Payout events (payout.created, payout.paid, payout.failed)
 * - 6.5: Refund events (charge.refunded, dispute events)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookService, WebhookEventStatus } from '../webhook.service';
import { AppError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    retrieve: vi.fn(),
  },
} as unknown as Stripe;

// Mock Stripe client
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

// Mock gallery purchase service
const mockRecordPurchase = vi.fn();
vi.mock('../gallery-purchase.service', () => ({
  createGalleryPurchaseService: vi.fn(() => ({
    recordPurchase: mockRecordPurchase,
  })),
}));

// Mock stripe connect service
const mockUpdateAccountStatus = vi.fn();
vi.mock('../stripe-connect.service', () => ({
  createStripeConnectService: vi.fn(() => ({
    updateAccountStatus: mockUpdateAccountStatus,
  })),
}));

// Create a more robust mock Supabase client
const createMockSupabase = () => {
  // Store mock responses for different operations
  const responses: { data: unknown; error: unknown }[] = [];
  let responseIndex = 0;

  const getNextResponse = () => {
    const response = responses[responseIndex] || { data: null, error: null };
    responseIndex++;
    return response;
  };

  const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(getNextResponse()));
  
  const mockEq = vi.fn().mockImplementation(() => ({
    single: mockSingle,
    eq: mockEq,
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  }));

  const mockSelect = vi.fn().mockImplementation(() => ({
    eq: mockEq,
    single: mockSingle,
  }));

  const mockInsert = vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  }));

  const mockUpdate = vi.fn().mockImplementation(() => ({
    eq: mockEq,
  }));

  const mockFrom = vi.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }));

  return {
    from: mockFrom,
    _addResponse: (data: unknown, error: unknown = null) => {
      responses.push({ data, error });
    },
    _resetResponses: () => {
      responses.length = 0;
      responseIndex = 0;
    },
    _mocks: { from: mockFrom, select: mockSelect, insert: mockInsert, update: mockUpdate, eq: mockEq, single: mockSingle },
  } as unknown as SupabaseClient & {
    _addResponse: (data: unknown, error?: unknown) => void;
    _resetResponses: () => void;
    _mocks: Record<string, ReturnType<typeof vi.fn>>;
  };
};

describe('WebhookService', () => {
  let service: WebhookService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  // Test data
  const mockWebhookEvent = {
    id: 'webhook-123',
    stripe_event_id: 'evt_123',
    event_type: 'checkout.session.completed',
    api_version: '2023-10-16',
    status: 'pending' as WebhookEventStatus,
    payload: {},
    processed_at: null,
    error_message: null,
    retry_count: 0,
    last_retry_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const createStripeEvent = (type: string, data: Record<string, unknown>): Stripe.Event => ({
    id: 'evt_123',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: type as Stripe.Event['type'],
    data: { object: data } as Stripe.Event.Data,
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as Stripe.Event);

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new WebhookService(mockSupabase as unknown as SupabaseClient);
    vi.clearAllMocks();
    mockSupabase._resetResponses();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processWebhook', () => {
    it('should process a new webhook event successfully', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        payment_intent: 'pi_123',
        metadata: { type: 'gallery_purchase', gallery_id: 'gallery-123' },
      });

      // Mock responses in order:
      // 1. Check existing event (not found)
      mockSupabase._addResponse(null, { code: 'PGRST116' });
      // 2. Log event (insert)
      mockSupabase._addResponse({ id: 'webhook-123' });
      // 3. Update status to processing
      mockSupabase._addResponse(null);
      // 4. Update status to completed
      mockSupabase._addResponse(null);

      // Mock payment intent retrieval
      mockStripe.paymentIntents.retrieve = vi.fn().mockResolvedValue({
        id: 'pi_123',
        metadata: { gallery_id: 'gallery-123' },
      });

      // Mock record purchase
      mockRecordPurchase.mockResolvedValue({ id: 'purchase-123' });

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.eventId).toBe('webhook-123');
    });

    it('should skip already processed events (idempotency)', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      // Mock: Existing completed event
      mockSupabase._addResponse({ ...mockWebhookEvent, status: 'completed' });

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Event already processed');
    });

    it('should return failed status when max retries exceeded', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      // Mock: Existing failed event with max retries
      mockSupabase._addResponse({ ...mockWebhookEvent, status: 'failed', retry_count: 3 });

      const result = await service.processWebhook(event);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.message).toBe('Max retry attempts exceeded');
    });
  });

  describe('retryFailedWebhook', () => {
    it('should retry a failed webhook successfully', async () => {
      const stripeEvent = createStripeEvent('account.updated', {
        id: 'acct_123',
        charges_enabled: true,
      });

      // Mock: Get failed event
      mockSupabase._addResponse({
        ...mockWebhookEvent,
        event_type: 'account.updated',
        status: 'failed',
        retry_count: 1,
        payload: stripeEvent,
      });
      // Mock: Update retry count
      mockSupabase._addResponse(null);
      // Mock: Update status to completed
      mockSupabase._addResponse(null);

      // Mock: Update account status
      mockUpdateAccountStatus.mockResolvedValue(undefined);

      const result = await service.retryFailedWebhook('webhook-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });

    it('should throw AppError if event not found', async () => {
      mockSupabase._addResponse(null, { code: 'PGRST116' });

      await expect(service.retryFailedWebhook('webhook-123')).rejects.toThrow(AppError);
    });

    it('should return error if event is not in failed status', async () => {
      mockSupabase._addResponse({ ...mockWebhookEvent, status: 'completed' });

      const result = await service.retryFailedWebhook('webhook-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Event is not in failed status');
    });

    it('should return error if max retries exceeded', async () => {
      mockSupabase._addResponse({ ...mockWebhookEvent, status: 'failed', retry_count: 3 });

      const result = await service.retryFailedWebhook('webhook-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Max retry attempts exceeded');
    });
  });

  describe('logWebhookEvent', () => {
    it('should log a webhook event successfully', async () => {
      const event = createStripeEvent('checkout.session.completed', { id: 'cs_123' });

      mockSupabase._addResponse({ id: 'webhook-123' });

      const eventId = await service.logWebhookEvent(event);

      expect(eventId).toBe('webhook-123');
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should throw AppError if logging fails', async () => {
      const event = createStripeEvent('checkout.session.completed', { id: 'cs_123' });

      mockSupabase._addResponse(null, { message: 'Database error' });

      await expect(service.logWebhookEvent(event)).rejects.toThrow(AppError);
    });
  });

  describe('updateWebhookStatus', () => {
    it('should update webhook status to completed', async () => {
      mockSupabase._addResponse(null);

      await service.updateWebhookStatus('webhook-123', 'completed');

      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });

    it('should update webhook status with error message', async () => {
      mockSupabase._addResponse(null);

      await service.updateWebhookStatus('webhook-123', 'failed', 'Processing error');

      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });
  });

  describe('getWebhookEvent', () => {
    it('should return webhook event if found', async () => {
      mockSupabase._addResponse(mockWebhookEvent);

      const result = await service.getWebhookEvent('evt_123');

      expect(result).not.toBeNull();
      expect(result?.stripeEventId).toBe('evt_123');
    });

    it('should return null if event not found', async () => {
      mockSupabase._addResponse(null, { code: 'PGRST116' });

      const result = await service.getWebhookEvent('evt_unknown');

      expect(result).toBeNull();
    });
  });

  describe('handleCheckoutCompleted', () => {
    it('should process gallery purchase checkout successfully', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        payment_intent: 'pi_123',
        metadata: { type: 'gallery_purchase', gallery_id: 'gallery-123', buyer_email: 'buyer@example.com' },
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update status to completed

      // Mock payment intent retrieval
      mockStripe.paymentIntents.retrieve = vi.fn().mockResolvedValue({
        id: 'pi_123',
        amount: 2999,
        currency: 'usd',
        metadata: { gallery_id: 'gallery-123', buyer_email: 'buyer@example.com' },
      });

      // Mock record purchase
      mockRecordPurchase.mockResolvedValue({ id: 'purchase-123', galleryId: 'gallery-123' });

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(mockRecordPurchase).toHaveBeenCalled();
    });

    it('should skip non-gallery purchase checkouts', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        payment_intent: 'pi_123',
        metadata: { type: 'subscription' }, // Not a gallery purchase
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(mockRecordPurchase).not.toHaveBeenCalled();
    });
  });

  describe('handleAccountUpdated', () => {
    it('should update Connect account status', async () => {
      const event = createStripeEvent('account.updated', {
        id: 'acct_123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update status to completed

      // Mock update account status
      mockUpdateAccountStatus.mockResolvedValue(undefined);

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(mockUpdateAccountStatus).toHaveBeenCalledWith('acct_123');
    });
  });

  describe('handleChargeRefunded', () => {
    it('should update purchase status to refunded', async () => {
      const event = createStripeEvent('charge.refunded', {
        id: 'ch_123',
        payment_intent: 'pi_123',
        refunded: true,
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse({ id: 'purchase-123', status: 'succeeded' }); // Find purchase
      mockSupabase._addResponse(null); // Update purchase status
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });

    it('should skip if purchase not found for charge', async () => {
      const event = createStripeEvent('charge.refunded', {
        id: 'ch_unknown',
        refunded: true,
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // Purchase not found
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('handleDisputeCreated', () => {
    it('should update purchase status to disputed', async () => {
      const event = createStripeEvent('charge.dispute.created', {
        id: 'dp_123',
        charge: 'ch_123',
        amount: 2999,
        reason: 'fraudulent',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse({ id: 'purchase-123' }); // Find purchase
      mockSupabase._addResponse(null); // Update purchase status
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('handleDisputeClosed', () => {
    it('should restore purchase status when dispute is won', async () => {
      const event = createStripeEvent('charge.dispute.closed', {
        id: 'dp_123',
        charge: 'ch_123',
        status: 'won',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse({ id: 'purchase-123' }); // Find purchase
      mockSupabase._addResponse(null); // Update purchase status
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });

    it('should refund purchase when dispute is lost', async () => {
      const event = createStripeEvent('charge.dispute.closed', {
        id: 'dp_123',
        charge: 'ch_123',
        status: 'lost',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse({ id: 'purchase-123' }); // Find purchase
      mockSupabase._addResponse(null); // Update purchase status
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('handlePayoutCreated', () => {
    it('should process payout.created event', async () => {
      const event = createStripeEvent('payout.created', {
        id: 'po_123',
        amount: 10000,
        currency: 'usd',
        arrival_date: Math.floor(Date.now() / 1000) + 86400,
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('handlePayoutPaid', () => {
    it('should process payout.paid event', async () => {
      const event = createStripeEvent('payout.paid', {
        id: 'po_123',
        amount: 10000,
        currency: 'usd',
        status: 'paid',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('handlePayoutFailed', () => {
    it('should process payout.failed event', async () => {
      const event = createStripeEvent('payout.failed', {
        id: 'po_123',
        amount: 10000,
        currency: 'usd',
        status: 'failed',
        failure_message: 'Bank account not found',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
    });
  });

  describe('unhandled event types', () => {
    it('should process unhandled event types without error', async () => {
      const event = createStripeEvent('customer.created', {
        id: 'cus_123',
        email: 'customer@example.com',
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update webhook status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });
  });

  describe('idempotency handling', () => {
    it('should handle duplicate events correctly', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      // Event already completed
      mockSupabase._addResponse({ ...mockWebhookEvent, status: 'completed' });

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Event already processed');
    });

    it('should allow retry of failed events within retry limit', async () => {
      const stripeEvent = createStripeEvent('account.updated', { id: 'acct_123' });

      // Existing failed event with retries remaining
      mockSupabase._addResponse({
        ...mockWebhookEvent,
        event_type: 'account.updated',
        status: 'failed',
        retry_count: 1,
        payload: stripeEvent,
      });
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update status to completed

      // Mock update account status
      mockUpdateAccountStatus.mockResolvedValue(undefined);

      const result = await service.processWebhook(stripeEvent);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });
  });

  describe('error handling', () => {
    it('should throw AppError when webhook processing fails completely', async () => {
      const event = createStripeEvent('checkout.session.completed', { id: 'cs_123' });

      // Simulate database error by not adding any responses
      // The mock will return { data: null, error: null } which triggers the error path

      await expect(service.processWebhook(event)).rejects.toThrow(AppError);
    });

    it('should handle missing payment intent gracefully', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        payment_intent: null, // No payment intent
        metadata: { type: 'gallery_purchase', gallery_id: 'gallery-123' },
      });

      // Mock responses
      mockSupabase._addResponse(null, { code: 'PGRST116' }); // No existing event
      mockSupabase._addResponse({ id: 'webhook-123' }); // Log event
      mockSupabase._addResponse(null); // Update status to processing
      mockSupabase._addResponse(null); // Update status to completed

      const result = await service.processWebhook(event);

      expect(result.success).toBe(true);
      expect(mockRecordPurchase).not.toHaveBeenCalled();
    });
  });

  describe('WebhookEvent mapping', () => {
    it('should correctly map database record to WebhookEvent interface', async () => {
      const dbRecord = {
        id: 'webhook-123',
        stripe_event_id: 'evt_123',
        event_type: 'checkout.session.completed',
        api_version: '2023-10-16',
        status: 'completed',
        payload: { id: 'evt_123', type: 'checkout.session.completed' },
        processed_at: '2024-01-15T10:00:00Z',
        error_message: null,
        retry_count: 0,
        last_retry_at: null,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase._addResponse(dbRecord);

      const result = await service.getWebhookEvent('evt_123');

      expect(result).toEqual({
        id: 'webhook-123',
        stripeEventId: 'evt_123',
        eventType: 'checkout.session.completed',
        apiVersion: '2023-10-16',
        status: 'completed',
        payload: { id: 'evt_123', type: 'checkout.session.completed' },
        processedAt: '2024-01-15T10:00:00Z',
        errorMessage: null,
        retryCount: 0,
        lastRetryAt: null,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      });
    });
  });
});
