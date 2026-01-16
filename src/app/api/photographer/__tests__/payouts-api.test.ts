/**
 * Payouts API Routes Tests
 * Tests for all payout-related API endpoints
 * 
 * @module app/api/photographer/__tests__/payouts-api.test
 * 
 * Requirements covered:
 * - 5.1: Automatic Payouts (Stripe Connect)
 * - 5.2: Payout History (list, details, filtering)
 * - 5.3: Balance Display (available, pending, next payout date)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock user data
const mockUser = { id: 'photographer-123', email: 'photographer@example.com' };
const mockAuthError = { message: 'Not authenticated' };

// Mock Connect account data
const mockConnectAccount = {
  stripe_account_id: 'acct_test123',
  charges_enabled: true,
  payouts_enabled: true,
};

// Use vi.hoisted to define mocks that will be available during vi.mock hoisting
const { mockGetUser, mockPayoutService, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockPayoutService: {
    getPayouts: vi.fn(),
    getPayoutDetails: vi.fn(),
    getBalance: vi.fn(),
    getNextPayoutDate: vi.fn(),
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

// Mock Payout Service
vi.mock('@/lib/services/payout.service', () => ({
  createPayoutService: () => mockPayoutService,
}));


// Import routes AFTER mocks are set up
import { GET as payoutsGET } from '../../photographer/payouts/route';
import { GET as payoutDetailsGET } from '../../photographer/payouts/[id]/route';
import { GET as balanceGET } from '../../photographer/balance/route';

/**
 * Helper to create a mock NextRequest with query params
 */
function createMockRequest(url: string): NextRequest {
  return new NextRequest(url, {
    method: 'GET',
  });
}

/**
 * Helper to setup mock for Connect account lookup
 */
function setupConnectAccountMock(account: typeof mockConnectAccount | null, error: unknown = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: account,
          error: error,
        }),
      }),
    }),
  });
}

/**
 * Mock payouts data
 */
const mockPayoutsData = {
  payouts: [
    {
      id: 'payout-uuid-123',
      photographerId: 'photographer-123',
      stripeAccountId: 'acct_test123',
      stripePayoutId: 'po_test123',
      amountCents: 50000,
      currency: 'usd',
      status: 'paid',
      failureCode: null,
      failureMessage: null,
      arrivalDate: '2024-01-20',
      createdAt: '2024-01-15T10:00:00Z',
      paidAt: '2024-01-20T10:00:00Z',
      failedAt: null,
      destinationBankAccountLast4: '4242',
    },
    {
      id: 'payout-uuid-456',
      photographerId: 'photographer-123',
      stripeAccountId: 'acct_test123',
      stripePayoutId: 'po_test456',
      amountCents: 30000,
      currency: 'usd',
      status: 'in_transit',
      failureCode: null,
      failureMessage: null,
      arrivalDate: '2024-01-25',
      createdAt: '2024-01-18T10:00:00Z',
      paidAt: null,
      failedAt: null,
      destinationBankAccountLast4: '4242',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};


/**
 * Mock payout details with related sales
 */
const mockPayoutDetails = {
  id: 'payout-uuid-123',
  photographerId: 'photographer-123',
  stripeAccountId: 'acct_test123',
  stripePayoutId: 'po_test123',
  amountCents: 50000,
  currency: 'usd',
  status: 'paid',
  failureCode: null,
  failureMessage: null,
  arrivalDate: '2024-01-20',
  createdAt: '2024-01-15T10:00:00Z',
  paidAt: '2024-01-20T10:00:00Z',
  failedAt: null,
  destinationBankAccountLast4: '4242',
  relatedSales: [
    {
      id: 'sale-1',
      galleryId: 'gallery-1',
      galleryTitle: 'Gallery 1',
      buyerEmail: 'buyer1@example.com',
      amountCents: 2999,
      platformFeeCents: 300,
      netAmountCents: 2699,
      purchasedAt: '2024-01-14T10:00:00Z',
    },
    {
      id: 'sale-2',
      galleryId: 'gallery-2',
      galleryTitle: 'Gallery 2',
      buyerEmail: 'buyer2@example.com',
      amountCents: 4999,
      platformFeeCents: 500,
      netAmountCents: 4499,
      purchasedAt: '2024-01-13T10:00:00Z',
    },
  ],
};

/**
 * Mock balance data
 */
const mockBalanceData = {
  available: [
    { amount: 50000, currency: 'usd', sourceTypes: { card: 45000, bank_account: 5000 } },
  ],
  pending: [
    { amount: 10000, currency: 'usd', sourceTypes: { card: 10000 } },
  ],
  instantAvailable: [
    { amount: 45000, currency: 'usd' },
  ],
  totalAvailable: 50000,
  totalPending: 10000,
  currency: 'usd',
};


describe('Payouts API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // Payouts List API Tests
  // ============================================
  describe('GET /api/photographer/payouts', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 when auth error occurs', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Connect Account Validation', () => {
      it('should return 404 when Connect account not found', async () => {
        setupConnectAccountMock(null, { code: 'PGRST116' });

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('CONNECT_NOT_FOUND');
        expect(data.error).toContain('Stripe Connect account not found');
      });


      it('should return 403 when payouts not enabled', async () => {
        setupConnectAccountMock({ ...mockConnectAccount, payouts_enabled: false });

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.code).toBe('PAYOUTS_NOT_ENABLED');
        expect(data.error).toContain('Payouts are not enabled');
      });

      it('should return data when Connect account is valid', async () => {
        setupConnectAccountMock(mockConnectAccount);
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.payouts).toHaveLength(2);
        expect(data.total).toBe(2);
      });
    });

    describe('Pagination', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should use default pagination values', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 1, limit: 20 })
        );
      });

      it('should accept custom page and limit', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?page=2&limit=50');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 2, limit: 50 })
        );
      });


      it('should cap limit at 100', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?limit=200');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ limit: 100 })
        );
      });

      it('should set minimum page to 1 for negative values', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?page=-1');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 1 })
        );
      });

      it('should set minimum limit to 1 for negative values', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?limit=-5');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ limit: 1 })
        );
      });
    });

    describe('Status Filtering', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should filter by single status', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?status=paid');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ status: 'paid' })
        );
      });


      it('should filter by multiple statuses (comma-separated)', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?status=pending,in_transit');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ status: ['pending', 'in_transit'] })
        );
      });

      it('should return 400 for invalid status', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?status=invalid');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_STATUS');
        expect(data.error).toContain('Invalid status');
      });

      it('should return 400 for invalid status in comma-separated list', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?status=paid,invalid');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_STATUS');
        expect(data.error).toContain('invalid');
      });

      it('should accept all valid status values', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);
        const validStatuses = ['pending', 'in_transit', 'paid', 'failed', 'canceled'];

        for (const status of validStatuses) {
          const request = createMockRequest(`http://localhost:3000/api/photographer/payouts?status=${status}`);
          const response = await payoutsGET(request);
          expect(response.status).toBe(200);
        }
      });
    });


    describe('Date Filtering', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should filter by date range', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?startDate=2024-01-01&endDate=2024-01-31');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-01-31' })
        );
      });

      it('should return 400 for invalid startDate format', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?startDate=invalid-date');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_DATE');
        expect(data.error).toContain('startDate');
      });

      it('should return 400 for invalid endDate format', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?endDate=not-a-date');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_DATE');
        expect(data.error).toContain('endDate');
      });

      it('should accept ISO 8601 date format', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?startDate=2024-01-15T00:00:00Z');
        const response = await payoutsGET(request);

        expect(response.status).toBe(200);
      });
    });


    describe('Combined Filters', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should combine multiple filters', async () => {
        mockPayoutService.getPayouts.mockResolvedValue(mockPayoutsData);

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts?status=paid&startDate=2024-01-01&endDate=2024-01-31&page=2&limit=10');
        await payoutsGET(request);

        expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            status: 'paid',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            page: 2,
            limit: 10,
          })
        );
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should return 500 when service throws error', async () => {
        mockPayoutService.getPayouts.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts');
        const response = await payoutsGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('PAYOUTS_ERROR');
      });
    });
  });


  // ============================================
  // Payout Details API Tests
  // ============================================
  describe('GET /api/photographer/payouts/[id]', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/payouts/payout-uuid-123');
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: 'payout-uuid-123' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      it('should return 400 for invalid UUID format', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/payouts/invalid-id');
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_ID');
        expect(data.error).toContain('Invalid payout ID format');
      });

      it('should accept valid UUID format', async () => {
        mockPayoutService.getPayoutDetails.mockResolvedValue(mockPayoutDetails);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });

        expect(response.status).toBe(200);
      });
    });


    describe('Authorization', () => {
      it('should return payout details when user owns the payout', async () => {
        mockPayoutService.getPayoutDetails.mockResolvedValue(mockPayoutDetails);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('payout-uuid-123');
        expect(data.amountCents).toBe(50000);
        expect(data.relatedSales).toHaveLength(2);
      });

      it('should return 404 when user does not own the payout', async () => {
        mockPayoutService.getPayoutDetails.mockResolvedValue({
          ...mockPayoutDetails,
          photographerId: 'other-user-id',
        });

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });

      it('should return 404 when payout does not exist', async () => {
        mockPayoutService.getPayoutDetails.mockResolvedValue(null);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });
    });


    describe('Response Data', () => {
      it('should include related sales in response', async () => {
        mockPayoutService.getPayoutDetails.mockResolvedValue(mockPayoutDetails);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(data.relatedSales).toBeDefined();
        expect(data.relatedSales[0].galleryTitle).toBe('Gallery 1');
        expect(data.relatedSales[0].buyerEmail).toBe('buyer1@example.com');
      });

      it('should handle payout without related sales', async () => {
        const payoutWithoutSales = { ...mockPayoutDetails, relatedSales: undefined };
        mockPayoutService.getPayoutDetails.mockResolvedValue(payoutWithoutSales);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.relatedSales).toBeUndefined();
      });

      it('should include failure details for failed payouts', async () => {
        const failedPayout = {
          ...mockPayoutDetails,
          status: 'failed',
          failureCode: 'account_closed',
          failureMessage: 'The bank account has been closed',
          failedAt: '2024-01-20T10:00:00Z',
        };
        mockPayoutService.getPayoutDetails.mockResolvedValue(failedPayout);

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(data.status).toBe('failed');
        expect(data.failureCode).toBe('account_closed');
        expect(data.failureMessage).toBe('The bank account has been closed');
      });
    });


    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockPayoutService.getPayoutDetails.mockRejectedValue(new Error('Database error'));

        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`http://localhost:3000/api/photographer/payouts/${validUuid}`);
        const response = await payoutDetailsGET(request, { params: Promise.resolve({ id: validUuid }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('PAYOUT_ERROR');
      });
    });
  });

  // ============================================
  // Balance API Tests
  // ============================================
  describe('GET /api/photographer/balance', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 when auth error occurs', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });


    describe('Connect Account Validation', () => {
      it('should return 404 when Connect account not found', async () => {
        setupConnectAccountMock(null, { code: 'PGRST116' });

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('CONNECT_NOT_FOUND');
        expect(data.error).toContain('Stripe Connect account not found');
      });

      it('should return 403 when charges not enabled', async () => {
        setupConnectAccountMock({ ...mockConnectAccount, charges_enabled: false });

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.code).toBe('ACCOUNT_NOT_VERIFIED');
        expect(data.error).toContain('not fully set up');
      });

      it('should return balance when Connect account is valid', async () => {
        setupConnectAccountMock(mockConnectAccount);
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockResolvedValue(new Date('2024-01-25T00:00:00Z'));

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalAvailable).toBe(50000);
        expect(data.totalPending).toBe(10000);
      });
    });


    describe('Response Data', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should include all balance fields', async () => {
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockResolvedValue(new Date('2024-01-25T00:00:00Z'));

        const response = await balanceGET();
        const data = await response.json();

        expect(data.available).toBeDefined();
        expect(data.pending).toBeDefined();
        expect(data.instantAvailable).toBeDefined();
        expect(data.totalAvailable).toBe(50000);
        expect(data.totalPending).toBe(10000);
        expect(data.currency).toBe('usd');
      });

      it('should include next payout date when available', async () => {
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockResolvedValue(new Date('2024-01-25T00:00:00Z'));

        const response = await balanceGET();
        const data = await response.json();

        expect(data.nextPayoutDate).toBe('2024-01-25T00:00:00.000Z');
      });

      it('should return null for next payout date when not available', async () => {
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockResolvedValue(null);

        const response = await balanceGET();
        const data = await response.json();

        expect(data.nextPayoutDate).toBeNull();
      });

      it('should include source types in balance breakdown', async () => {
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockResolvedValue(null);

        const response = await balanceGET();
        const data = await response.json();

        expect(data.available[0].sourceTypes).toBeDefined();
        expect(data.available[0].sourceTypes.card).toBe(45000);
        expect(data.available[0].sourceTypes.bank_account).toBe(5000);
      });
    });


    describe('Error Handling', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should return 500 when balance service throws error', async () => {
        mockPayoutService.getBalance.mockRejectedValue(new Error('Stripe error'));

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('BALANCE_ERROR');
      });

      it('should return 500 when next payout date service throws error', async () => {
        mockPayoutService.getBalance.mockResolvedValue(mockBalanceData);
        mockPayoutService.getNextPayoutDate.mockRejectedValue(new Error('Stripe error'));

        const response = await balanceGET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('BALANCE_ERROR');
      });
    });

    describe('Parallel Fetching', () => {
      beforeEach(() => {
        setupConnectAccountMock(mockConnectAccount);
      });

      it('should fetch balance and next payout date in parallel', async () => {
        let balanceCallTime = 0;
        let nextPayoutCallTime = 0;

        mockPayoutService.getBalance.mockImplementation(async () => {
          balanceCallTime = Date.now();
          await new Promise(resolve => setTimeout(resolve, 10));
          return mockBalanceData;
        });

        mockPayoutService.getNextPayoutDate.mockImplementation(async () => {
          nextPayoutCallTime = Date.now();
          await new Promise(resolve => setTimeout(resolve, 10));
          return new Date('2024-01-25T00:00:00Z');
        });

        await balanceGET();

        // Both calls should start at approximately the same time (within 5ms)
        expect(Math.abs(balanceCallTime - nextPayoutCallTime)).toBeLessThan(5);
      });
    });
  });
});
