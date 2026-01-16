/**
 * Refunds API Routes Tests
 * Tests for refund-related API endpoints
 * 
 * @module app/api/photographer/__tests__/refunds-api.test
 * 
 * Requirements covered:
 * - 7.1: Refund Management (full and partial refunds)
 * - 7.2: Dispute Handling (list and details)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock user data
const mockUser = { id: 'photographer-123', email: 'photographer@example.com' };
const mockAuthError = { message: 'Not authenticated' };

// Use vi.hoisted to define mocks that will be available during vi.mock hoisting
const { mockGetUser, mockPurchaseService, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockPurchaseService: {
    getRefundableAmount: vi.fn(),
    refundPurchase: vi.fn(),
    processPartialRefund: vi.fn(),
  },
  mockFrom: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

// Mock Gallery Purchase Service
vi.mock('@/lib/services/gallery-purchase.service', () => ({
  createGalleryPurchaseService: () => mockPurchaseService,
}));


// Import routes AFTER mocks are set up
import { GET as refundGET, POST as refundPOST } from '../../photographer/sales/[id]/refund/route';

/**
 * Helper to create a mock NextRequest with body
 */
function createMockRequest(url: string, body?: object): NextRequest {
  if (body) {
    return new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new NextRequest(url, { method: 'GET' });
}

/**
 * Helper to setup mock for purchase lookup
 */
function setupPurchaseMock(purchase: object | null, error: unknown = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: purchase,
          error: error,
        }),
      }),
    }),
  });
}

/**
 * Mock purchase data
 */
const mockPurchase = {
  id: 'purchase-uuid-123',
  photographer_id: 'photographer-123',
  status: 'succeeded',
  amount_cents: 5000,
  gallery_id: 'gallery-123',
  buyer_email: 'buyer@example.com',
};

/**
 * Mock refundable amount response
 */
const mockRefundableAmount = {
  purchaseId: 'purchase-uuid-123',
  originalAmountCents: 5000,
  refundedAmountCents: 0,
  refundableAmountCents: 5000,
  currency: 'usd',
  isFullyRefunded: false,
  canRefund: true,
};

/**
 * Mock refunded purchase
 */
const mockRefundedPurchase = {
  id: 'purchase-uuid-123',
  galleryId: 'gallery-123',
  photographerId: 'photographer-123',
  buyerEmail: 'buyer@example.com',
  status: 'refunded',
  amountCents: 5000,
  currency: 'usd',
  platformFeeCents: 500,
  photographerEarningsCents: 4500,
  refundReason: 'Customer requested refund',
  refundedAt: '2024-01-20T10:00:00Z',
};

/**
 * Mock partial refund result
 */
const mockPartialRefundResult = {
  purchase: mockRefundedPurchase,
  refundId: 'refund-123',
  refundedAmountCents: 2500,
  remainingAmountCents: 2500,
  isFullyRefunded: false,
};


describe('Refunds API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // GET /api/photographer/sales/[id]/refund Tests
  // ============================================
  describe('GET /api/photographer/sales/[id]/refund', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });
    });

    describe('Authorization', () => {
      it('should return 404 when purchase not found', async () => {
        setupPurchaseMock(null, { code: 'PGRST116' });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });

      it('should return 404 when purchase belongs to another photographer', async () => {
        setupPurchaseMock({ ...mockPurchase, photographer_id: 'other-photographer' });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });
    });


    describe('Success Cases', () => {
      it('should return refundable amount for valid purchase', async () => {
        setupPurchaseMock(mockPurchase);
        mockPurchaseService.getRefundableAmount.mockResolvedValue(mockRefundableAmount);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.purchaseId).toBe('purchase-uuid-123');
        expect(data.originalAmountCents).toBe(5000);
        expect(data.refundableAmountCents).toBe(5000);
        expect(data.canRefund).toBe(true);
      });

      it('should return correct data for partially refunded purchase', async () => {
        setupPurchaseMock(mockPurchase);
        mockPurchaseService.getRefundableAmount.mockResolvedValue({
          ...mockRefundableAmount,
          refundedAmountCents: 2500,
          refundableAmountCents: 2500,
        });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.refundedAmountCents).toBe(2500);
        expect(data.refundableAmountCents).toBe(2500);
      });

      it('should return canRefund false for fully refunded purchase', async () => {
        setupPurchaseMock(mockPurchase);
        mockPurchaseService.getRefundableAmount.mockResolvedValue({
          ...mockRefundableAmount,
          refundedAmountCents: 5000,
          refundableAmountCents: 0,
          isFullyRefunded: true,
          canRefund: false,
          reason: 'Purchase has already been fully refunded',
        });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund');
        const response = await refundGET(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.canRefund).toBe(false);
        expect(data.isFullyRefunded).toBe(true);
      });
    });
  });


  // ============================================
  // POST /api/photographer/sales/[id]/refund Tests
  // ============================================
  describe('POST /api/photographer/sales/[id]/refund', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        setupPurchaseMock(mockPurchase);
      });

      it('should accept empty body and default to full refund', async () => {
        mockPurchaseService.refundPurchase.mockResolvedValue(mockRefundedPurchase);

        const request = new NextRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { method: 'POST' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockPurchaseService.refundPurchase).toHaveBeenCalled();
      });

      it('should return 400 for invalid refund type', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'invalid' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for partial refund without amount', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'partial' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for negative amount', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'partial', amountCents: -100 }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
      });

      it('should accept reason up to 500 characters', async () => {
        mockPurchaseService.refundPurchase.mockResolvedValue(mockRefundedPurchase);

        const longReason = 'a'.repeat(500);
        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full', reason: longReason }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(response.status).toBe(200);
      });

      it('should return 400 for reason exceeding 500 characters', async () => {
        const tooLongReason = 'a'.repeat(501);
        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full', reason: tooLongReason }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
      });
    });


    describe('Authorization', () => {
      it('should return 404 when purchase not found', async () => {
        setupPurchaseMock(null, { code: 'PGRST116' });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(response.status).toBe(404);
      });

      it('should return 404 when purchase belongs to another photographer', async () => {
        setupPurchaseMock({ ...mockPurchase, photographer_id: 'other-photographer' });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(response.status).toBe(404);
      });
    });

    describe('Purchase Status Validation', () => {
      it('should return 400 when purchase is already refunded', async () => {
        setupPurchaseMock({ ...mockPurchase, status: 'refunded' });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('already been refunded');
      });

      it('should return 400 when purchase status is not succeeded', async () => {
        setupPurchaseMock({ ...mockPurchase, status: 'disputed' });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Cannot refund');
      });
    });


    describe('Full Refund', () => {
      beforeEach(() => {
        setupPurchaseMock(mockPurchase);
      });

      it('should process full refund successfully', async () => {
        mockPurchaseService.refundPurchase.mockResolvedValue(mockRefundedPurchase);

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full', reason: 'Customer requested refund' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Full refund');
        expect(data.isFullyRefunded).toBe(true);
        expect(data.refundedAmountCents).toBe(5000);
      });

      it('should call refundPurchase with correct parameters', async () => {
        mockPurchaseService.refundPurchase.mockResolvedValue(mockRefundedPurchase);

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full', reason: 'Test reason' }
        );
        await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(mockPurchaseService.refundPurchase).toHaveBeenCalledWith('purchase-uuid-123', 'Test reason');
      });
    });

    describe('Partial Refund', () => {
      beforeEach(() => {
        setupPurchaseMock(mockPurchase);
      });

      it('should process partial refund successfully', async () => {
        mockPurchaseService.processPartialRefund.mockResolvedValue(mockPartialRefundResult);

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'partial', amountCents: 2500, reason: 'Partial refund' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Partial refund');
        expect(data.refundedAmountCents).toBe(2500);
        expect(data.remainingAmountCents).toBe(2500);
        expect(data.isFullyRefunded).toBe(false);
      });

      it('should call processPartialRefund with correct parameters', async () => {
        mockPurchaseService.processPartialRefund.mockResolvedValue(mockPartialRefundResult);

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'partial', amountCents: 2500, reason: 'Test partial' }
        );
        await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(mockPurchaseService.processPartialRefund).toHaveBeenCalledWith(
          'purchase-uuid-123',
          2500,
          'Test partial'
        );
      });

      it('should indicate when partial refund completes full refund', async () => {
        mockPurchaseService.processPartialRefund.mockResolvedValue({
          ...mockPartialRefundResult,
          remainingAmountCents: 0,
          isFullyRefunded: true,
        });

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'partial', amountCents: 5000 }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isFullyRefunded).toBe(true);
        expect(data.message).toContain('completed the full refund');
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        setupPurchaseMock(mockPurchase);
      });

      it('should return 500 when refund service throws error', async () => {
        mockPurchaseService.refundPurchase.mockRejectedValue(new Error('Stripe error'));

        const request = createMockRequest(
          'http://localhost:3000/api/photographer/sales/purchase-uuid-123/refund',
          { type: 'full' }
        );
        const response = await refundPOST(request, { params: Promise.resolve({ id: 'purchase-uuid-123' }) });

        expect(response.status).toBe(500);
      });
    });
  });
});
