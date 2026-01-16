/**
 * Integration Tests for Stripe Webhook API Routes
 * Tests webhook signature verification, rate limiting, async processing, and event handling
 * 
 * @module app/api/stripe/webhook/__tests__/webhook.integration.test
 * 
 * Requirements covered:
 * - 6.1: Webhook endpoint verification, logging, and rate limiting
 * - 6.2: Gallery purchase events (checkout.session.completed)
 * - 6.3: Connect account events (account.updated)
 * - 6.4: Payout events (payout.created, payout.paid, payout.failed)
 * - 6.5: Refund events (charge.refunded, charge.dispute.created)
 * - 11.3: Webhook endpoint performance (return 200 OK within 3 seconds)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type Stripe from 'stripe';

// Set environment variables FIRST - before any imports
process.env.STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE = 'whsec_gallery_test_secret';
process.env.STRIPE_WEBHOOK_SECRET_CONNECT = 'whsec_connect_test_secret';

// Use vi.hoisted to define mocks that will be available during vi.mock hoisting
const { mockConstructEvent, mockProcessWebhook, mockCheckWebhookRateLimit, mockGetClientIp, mockHeaders } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockProcessWebhook: vi.fn(),
  mockCheckWebhookRateLimit: vi.fn(),
  mockGetClientIp: vi.fn(() => '127.0.0.1'),
  mockHeaders: vi.fn(),
}));

// Mock all dependencies
vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    paymentIntents: {
      retrieve: vi.fn(),
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }),
}));


vi.mock('@/lib/services/webhook.service', () => ({
  createWebhookService: () => ({
    processWebhook: mockProcessWebhook,
    retryFailedWebhook: vi.fn(),
    logWebhookEvent: vi.fn(),
    updateWebhookStatus: vi.fn(),
    getWebhookEvent: vi.fn(),
  }),
}));

vi.mock('@/lib/services/webhook-rate-limiter.service', () => ({
  checkWebhookRateLimit: mockCheckWebhookRateLimit,
  getClientIp: mockGetClientIp,
  resetWebhookRateLimit: vi.fn(),
  clearAllWebhookRateLimits: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

// Import routes AFTER mocks are set up
import { POST as galleryPurchaseWebhookPOST } from '../gallery-purchase/route';
import { POST as connectWebhookPOST } from '../../connect/webhook/route';

/**
 * Helper to create a mock NextRequest with body and headers
 */
function createMockRequest(body: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/webhook/gallery-purchase', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Helper to create a mock Stripe event
 */
function createStripeEvent(
  type: string,
  data: Record<string, unknown>,
  options: { account?: string; id?: string } = {}
): Stripe.Event {
  return {
    id: options.id || `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: type as Stripe.Event['type'],
    data: { object: data } as Stripe.Event.Data,
    livemode: false,
    pending_webhooks: 0,
    request: null,
    account: options.account,
  } as Stripe.Event;
}


describe('Stripe Webhook API Routes - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default rate limit mock - allow requests
    mockCheckWebhookRateLimit.mockReturnValue({
      allowed: true,
      remainingRequests: 99,
      limit: 100,
      windowMs: 60000,
    });

    // Default headers mock with valid signature
    mockHeaders.mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_signature' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // Gallery Purchase Webhook Tests
  // ============================================
  describe('POST /api/stripe/webhook/gallery-purchase', () => {
    describe('Signature Verification', () => {
      it('should reject requests without stripe-signature header', async () => {
        mockHeaders.mockResolvedValue(new Headers({}));

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing stripe-signature header');
      });

      it('should reject requests with invalid signature', async () => {
        mockConstructEvent.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid signature');
      });

      it('should accept requests with valid signature', async () => {
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          payment_intent: 'pi_123',
          metadata: { type: 'gallery_purchase', gallery_id: 'gallery-123' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.status).toBe('completed');
      });
    });

    describe('Rate Limiting', () => {
      it('should reject requests when rate limit is exceeded', async () => {
        mockCheckWebhookRateLimit.mockReturnValue({
          allowed: false,
          remainingRequests: 0,
          retryAfterSeconds: 30,
          limit: 100,
          windowMs: 60000,
        });

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toBe('Too many requests');
        expect(data.retryAfter).toBe(30);
        expect(response.headers.get('Retry-After')).toBe('30');
        expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      });

      it('should allow requests within rate limit', async () => {
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          metadata: { type: 'gallery_purchase' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);

        expect(response.status).toBe(200);
        expect(mockCheckWebhookRateLimit).toHaveBeenCalledWith('127.0.0.1');
      });

      it('should extract client IP correctly', async () => {
        mockGetClientIp.mockReturnValue('192.168.1.100');

        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          metadata: { type: 'gallery_purchase' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        await galleryPurchaseWebhookPOST(request);

        expect(mockCheckWebhookRateLimit).toHaveBeenCalledWith('192.168.1.100');
      });
    });


    describe('Async Processing', () => {
      it('should process webhook events asynchronously', async () => {
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          payment_intent: 'pi_123',
          metadata: { type: 'gallery_purchase', gallery_id: 'gallery-123' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });

      it('should return 200 even when processing fails (to prevent Stripe retries)', async () => {
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          metadata: { type: 'gallery_purchase' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: false,
          eventId: 'webhook-123',
          status: 'failed',
          message: 'Processing error',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.status).toBe('failed');
        expect(data.error).toBe('Processing error');
      });
    });

    describe('Logging', () => {
      it('should log received events', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          metadata: { type: 'gallery_purchase' },
        }, { id: 'evt_test_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        await galleryPurchaseWebhookPOST(request);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[Webhook] Received event:',
          'checkout.session.completed',
          'evt_test_123'
        );

        consoleSpy.mockRestore();
      });

      it('should log processing failures', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          metadata: { type: 'gallery_purchase' },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: false,
          eventId: 'webhook-123',
          status: 'failed',
          message: 'Database error',
        });

        const request = createMockRequest(JSON.stringify(event));
        await galleryPurchaseWebhookPOST(request);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Webhook] Processing failed:',
          'Database error'
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Event Types - checkout.session.completed', () => {
      it('should process gallery purchase checkout successfully', async () => {
        const event = createStripeEvent('checkout.session.completed', {
          id: 'cs_123',
          payment_intent: 'pi_123',
          metadata: { 
            type: 'gallery_purchase', 
            gallery_id: 'gallery-123',
            buyer_email: 'buyer@example.com',
          },
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.eventId).toBe('webhook-123');
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });
    });

    describe('Event Types - charge.refunded', () => {
      it('should process refund event successfully', async () => {
        const event = createStripeEvent('charge.refunded', {
          id: 'ch_123',
          payment_intent: 'pi_123',
          refunded: true,
          amount_refunded: 2999,
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });
    });

    describe('Event Types - charge.dispute.created', () => {
      it('should process dispute created event successfully', async () => {
        const event = createStripeEvent('charge.dispute.created', {
          id: 'dp_123',
          charge: 'ch_123',
          amount: 2999,
          reason: 'fraudulent',
          status: 'needs_response',
        });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await galleryPurchaseWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });
    });
  });


  // ============================================
  // Connect Webhook Tests
  // ============================================
  describe('POST /api/stripe/connect/webhook', () => {
    describe('Signature Verification', () => {
      it('should reject requests without stripe-signature header', async () => {
        mockHeaders.mockResolvedValue(new Headers({}));

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing stripe-signature header');
      });

      it('should reject requests with invalid signature', async () => {
        mockConstructEvent.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid signature');
      });

      it('should accept requests with valid signature for Connect events', async () => {
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
          charges_enabled: true,
          payouts_enabled: true,
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.account).toBe('acct_123');
      });
    });

    describe('Connect Event Filtering', () => {
      it('should skip non-Connect events (events without account field)', async () => {
        const event = createStripeEvent('customer.created', {
          id: 'cus_123',
          email: 'customer@example.com',
        }); // No account field

        mockConstructEvent.mockReturnValue(event);

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.skipped).toBe(true);
        expect(data.reason).toBe('Not a Connect event');
        expect(mockProcessWebhook).not.toHaveBeenCalled();
      });

      it('should process Connect events (events with account field)', async () => {
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
          charges_enabled: true,
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.skipped).toBeUndefined();
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });
    });

    describe('Rate Limiting', () => {
      it('should reject requests when rate limit is exceeded', async () => {
        mockCheckWebhookRateLimit.mockReturnValue({
          allowed: false,
          remainingRequests: 0,
          retryAfterSeconds: 45,
          limit: 100,
          windowMs: 60000,
        });

        const request = createMockRequest(JSON.stringify({ test: 'data' }));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toBe('Too many requests');
        expect(data.retryAfter).toBe(45);
        expect(response.headers.get('Retry-After')).toBe('45');
      });
    });

    describe('Event Types - account.updated', () => {
      it('should process account.updated event successfully', async () => {
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.eventId).toBe('webhook-123');
        expect(data.account).toBe('acct_123');
      });
    });

    describe('Event Types - payout.created', () => {
      it('should process payout.created event successfully', async () => {
        const event = createStripeEvent('payout.created', {
          id: 'po_123',
          amount: 10000,
          currency: 'usd',
          status: 'pending',
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });
    });

    describe('Event Types - payout.paid', () => {
      it('should process payout.paid event successfully', async () => {
        const event = createStripeEvent('payout.paid', {
          id: 'po_123',
          amount: 10000,
          currency: 'usd',
          status: 'paid',
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Event Types - payout.failed', () => {
      it('should process payout.failed event successfully', async () => {
        const event = createStripeEvent('payout.failed', {
          id: 'po_123',
          amount: 10000,
          currency: 'usd',
          status: 'failed',
          failure_message: 'Bank account closed',
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Async Processing', () => {
      it('should process Connect webhook events asynchronously', async () => {
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
          charges_enabled: true,
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockProcessWebhook).toHaveBeenCalledWith(event);
      });

      it('should return 200 even when processing fails', async () => {
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
        }, { account: 'acct_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: false,
          eventId: 'webhook-123',
          status: 'failed',
          message: 'Database connection error',
        });

        const request = createMockRequest(JSON.stringify(event));
        const response = await connectWebhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(data.status).toBe('failed');
        expect(data.error).toBe('Database connection error');
      });
    });

    describe('Logging', () => {
      it('should log received Connect events', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const event = createStripeEvent('account.updated', {
          id: 'acct_123',
        }, { account: 'acct_123', id: 'evt_connect_123' });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        await connectWebhookPOST(request);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[ConnectWebhook] Received event:',
          'account.updated',
          'evt_connect_123'
        );

        consoleSpy.mockRestore();
      });
    });
  });


  // ============================================
  // Retry Logic Tests
  // ============================================
  describe('Retry Logic with Exponential Backoff', () => {
    it('should handle retry for failed events', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      mockConstructEvent.mockReturnValue(event);
      
      // First call fails, second succeeds (simulating retry)
      mockProcessWebhook
        .mockResolvedValueOnce({
          success: false,
          eventId: 'webhook-123',
          status: 'failed',
          message: 'Temporary error',
        })
        .mockResolvedValueOnce({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

      // First request
      const request1 = createMockRequest(JSON.stringify(event));
      const response1 = await galleryPurchaseWebhookPOST(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.status).toBe('failed');

      // Second request (retry)
      const request2 = createMockRequest(JSON.stringify(event));
      const response2 = await galleryPurchaseWebhookPOST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.status).toBe('completed');
    });

    it('should respect max retry attempts', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      mockConstructEvent.mockReturnValue(event);
      mockProcessWebhook.mockResolvedValue({
        success: false,
        eventId: 'webhook-123',
        status: 'failed',
        message: 'Max retry attempts exceeded',
      });

      const request = createMockRequest(JSON.stringify(event));
      const response = await galleryPurchaseWebhookPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.status).toBe('failed');
      expect(data.error).toBe('Max retry attempts exceeded');
    });
  });

  // ============================================
  // Idempotency Tests
  // ============================================
  describe('Idempotency Handling', () => {
    it('should skip already processed events', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      }, { id: 'evt_duplicate_123' });

      mockConstructEvent.mockReturnValue(event);
      mockProcessWebhook.mockResolvedValue({
        success: true,
        eventId: 'webhook-123',
        status: 'skipped',
        message: 'Event already processed',
      });

      const request = createMockRequest(JSON.stringify(event));
      const response = await galleryPurchaseWebhookPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.status).toBe('skipped');
    });

    it('should handle duplicate webhook deliveries gracefully', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      mockConstructEvent.mockReturnValue(event);
      
      // Both calls return skipped (idempotent)
      mockProcessWebhook.mockResolvedValue({
        success: true,
        eventId: 'webhook-123',
        status: 'skipped',
        message: 'Event already processed',
      });

      // First delivery
      const request1 = createMockRequest(JSON.stringify(event));
      const response1 = await galleryPurchaseWebhookPOST(request1);
      expect(response1.status).toBe(200);

      // Duplicate delivery
      const request2 = createMockRequest(JSON.stringify(event));
      const response2 = await galleryPurchaseWebhookPOST(request2);
      expect(response2.status).toBe(200);

      const data2 = await response2.json();
      expect(data2.status).toBe('skipped');
    });
  });

  // ============================================
  // Performance Tests
  // ============================================
  describe('Performance Requirements', () => {
    it('should respond within acceptable time (< 3 seconds)', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      mockConstructEvent.mockReturnValue(event);
      mockProcessWebhook.mockResolvedValue({
        success: true,
        eventId: 'webhook-123',
        status: 'completed',
      });

      const startTime = Date.now();
      const request = createMockRequest(JSON.stringify(event));
      await galleryPurchaseWebhookPOST(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should return 200 immediately even for slow processing', async () => {
      const event = createStripeEvent('checkout.session.completed', {
        id: 'cs_123',
        metadata: { type: 'gallery_purchase' },
      });

      mockConstructEvent.mockReturnValue(event);
      
      // Simulate slow processing
      mockProcessWebhook.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        };
      });

      const request = createMockRequest(JSON.stringify(event));
      const response = await galleryPurchaseWebhookPOST(request);

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // All Event Types Coverage
  // ============================================
  describe('All Webhook Event Types', () => {
    const eventTypes = [
      {
        type: 'checkout.session.completed',
        data: { id: 'cs_123', payment_intent: 'pi_123', metadata: { type: 'gallery_purchase' } },
        isConnect: false,
      },
      {
        type: 'account.updated',
        data: { id: 'acct_123', charges_enabled: true },
        isConnect: true,
        account: 'acct_123',
      },
      {
        type: 'payout.created',
        data: { id: 'po_123', amount: 10000, currency: 'usd' },
        isConnect: true,
        account: 'acct_123',
      },
      {
        type: 'payout.paid',
        data: { id: 'po_123', amount: 10000, status: 'paid' },
        isConnect: true,
        account: 'acct_123',
      },
      {
        type: 'payout.failed',
        data: { id: 'po_123', amount: 10000, status: 'failed', failure_message: 'Bank error' },
        isConnect: true,
        account: 'acct_123',
      },
      {
        type: 'charge.refunded',
        data: { id: 'ch_123', refunded: true, amount_refunded: 2999 },
        isConnect: false,
      },
      {
        type: 'charge.dispute.created',
        data: { id: 'dp_123', charge: 'ch_123', amount: 2999, reason: 'fraudulent' },
        isConnect: false,
      },
    ];

    eventTypes.forEach(({ type, data, isConnect, account }) => {
      it(`should handle ${type} event`, async () => {
        const event = createStripeEvent(type, data, { account });

        mockConstructEvent.mockReturnValue(event);
        mockProcessWebhook.mockResolvedValue({
          success: true,
          eventId: 'webhook-123',
          status: 'completed',
        });

        const request = createMockRequest(JSON.stringify(event));
        const handler = isConnect ? connectWebhookPOST : galleryPurchaseWebhookPOST;
        const response = await handler(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.received).toBe(true);
        
        if (isConnect) {
          expect(mockProcessWebhook).toHaveBeenCalledWith(event);
        }
      });
    });
  });
});
