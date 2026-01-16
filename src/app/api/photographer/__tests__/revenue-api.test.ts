/**
 * Revenue API Routes Tests
 * Tests for all revenue-related API endpoints
 * 
 * @module app/api/photographer/__tests__/revenue-api.test
 * 
 * Requirements covered:
 * - 4.1: Sales Overview (Total Revenue, Sales Count, Average Sale, Conversion Rate)
 * - 4.2: Revenue Chart (time ranges, aggregation)
 * - 4.3: Sales List (pagination, filtering, sorting)
 * - 4.4: Top Galleries (by revenue)
 * - 5.2: API Routes - Revenue (validation, pagination, filtering, authentication)
 * - 9.3: Export & Reports (CSV export)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock user data
const mockUser = { id: 'photographer-123', email: 'photographer@example.com' };
const mockAuthError = { message: 'Not authenticated' };

// Use vi.hoisted to define mocks that will be available during vi.mock hoisting
const { mockGetUser, mockRevenueService, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRevenueService: {
    getOverview: vi.fn(),
    getChartData: vi.fn(),
    getSales: vi.fn(),
    getSaleDetails: vi.fn(),
    getTopGalleries: vi.fn(),
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

// Mock Revenue Service
vi.mock('@/lib/services/revenue.service', () => ({
  createRevenueService: () => mockRevenueService,
}));


// Import routes AFTER mocks are set up
import { GET as revenueOverviewGET } from '../../photographer/revenue/overview/route';
import { GET as revenueChartGET } from '../../photographer/revenue/chart/route';
import { GET as salesGET } from '../../photographer/sales/route';
import { GET as saleDetailsGET } from '../../photographer/sales/[id]/route';
import { GET as salesExportGET } from '../../photographer/sales/export/route';
import { GET as topGalleriesGET } from '../../photographer/top-galleries/route';

/**
 * Helper to create a mock NextRequest with query params
 */
function createMockRequest(url: string): NextRequest {
  return new NextRequest(url, {
    method: 'GET',
  });
}

/**
 * Mock revenue overview data
 */
const mockOverviewData = {
  totalRevenue: 9997,
  totalSales: 3,
  averageOrderValue: 3332,
  platformFees: 1000,
  netRevenue: 8997,
  periodComparison: {
    revenueChange: 25,
    salesChange: 10,
  },
};

/**
 * Mock chart data
 */
const mockChartData = [
  { date: '2024-01-15', revenue: 4998, sales: 2 },
  { date: '2024-01-14', revenue: 4999, sales: 1 },
];

/**
 * Mock sales data
 */
const mockSalesData = {
  sales: [
    {
      id: 'sale-123',
      galleryId: 'gallery-123',
      galleryTitle: 'Test Gallery',
      buyerEmail: 'buyer@example.com',
      amount: 2999,
      currency: 'usd',
      platformFee: 300,
      netAmount: 2699,
      status: 'succeeded',
      purchasedAt: '2024-01-15T10:00:00Z',
      refundedAt: null,
    },
    {
      id: 'sale-456',
      galleryId: 'gallery-456',
      galleryTitle: 'Another Gallery',
      buyerEmail: 'buyer2@example.com',
      amount: 4999,
      currency: 'usd',
      platformFee: 500,
      netAmount: 4499,
      status: 'succeeded',
      purchasedAt: '2024-01-14T10:00:00Z',
      refundedAt: null,
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};


/**
 * Mock sale details
 */
const mockSaleDetails = {
  id: 'sale-123',
  galleryId: 'gallery-123',
  galleryTitle: 'Test Gallery',
  buyerEmail: 'buyer@example.com',
  amount: 2999,
  currency: 'usd',
  platformFee: 300,
  netAmount: 2699,
  status: 'succeeded',
  purchasedAt: '2024-01-15T10:00:00Z',
  refundedAt: null,
};

/**
 * Mock top galleries data
 */
const mockTopGalleriesData = [
  {
    galleryId: 'gallery-1',
    title: 'Top Gallery 1',
    totalRevenue: 50000,
    totalSales: 10,
    conversionRate: 5.5,
  },
  {
    galleryId: 'gallery-2',
    title: 'Top Gallery 2',
    totalRevenue: 25000,
    totalSales: 5,
    conversionRate: 3.2,
  },
];

describe('Revenue API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });


  // ============================================
  // Revenue Overview API Tests
  // ============================================
  describe('GET /api/photographer/revenue/overview', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview');
        const response = await revenueOverviewGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 when auth error occurs', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview');
        const response = await revenueOverviewGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return data when user is authenticated', async () => {
        mockRevenueService.getOverview.mockResolvedValue(mockOverviewData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview');
        const response = await revenueOverviewGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(9997);
        expect(data.totalSales).toBe(3);
      });
    });

    describe('Validation', () => {
      it('should use default period (month) when not specified', async () => {
        mockRevenueService.getOverview.mockResolvedValue(mockOverviewData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview');
        await revenueOverviewGET(request);

        expect(mockRevenueService.getOverview).toHaveBeenCalledWith(mockUser.id, 'month');
      });

      it('should accept valid period parameter', async () => {
        mockRevenueService.getOverview.mockResolvedValue(mockOverviewData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview?period=week');
        await revenueOverviewGET(request);

        expect(mockRevenueService.getOverview).toHaveBeenCalledWith(mockUser.id, 'week');
      });


      it('should return 400 for invalid period parameter', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview?period=invalid');
        const response = await revenueOverviewGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_PERIOD');
        expect(data.error).toContain('Invalid period');
      });

      it('should accept all valid period values', async () => {
        const validPeriods = ['today', 'week', 'month', 'quarter', 'year', 'all'];
        mockRevenueService.getOverview.mockResolvedValue(mockOverviewData);

        for (const period of validPeriods) {
          const request = createMockRequest(`http://localhost:3000/api/photographer/revenue/overview?period=${period}`);
          const response = await revenueOverviewGET(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getOverview.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/overview');
        const response = await revenueOverviewGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('REVENUE_ERROR');
      });
    });
  });


  // ============================================
  // Revenue Chart API Tests
  // ============================================
  describe('GET /api/photographer/revenue/chart', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart');
        const response = await revenueChartGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return data when user is authenticated', async () => {
        mockRevenueService.getChartData.mockResolvedValue(mockChartData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart');
        const response = await revenueChartGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0].date).toBe('2024-01-15');
      });
    });

    describe('Validation', () => {
      it('should use default range (month) when not specified', async () => {
        mockRevenueService.getChartData.mockResolvedValue(mockChartData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart');
        await revenueChartGET(request);

        expect(mockRevenueService.getChartData).toHaveBeenCalledWith(mockUser.id, 'month');
      });

      it('should accept valid range parameter', async () => {
        mockRevenueService.getChartData.mockResolvedValue(mockChartData);

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart?range=week');
        await revenueChartGET(request);

        expect(mockRevenueService.getChartData).toHaveBeenCalledWith(mockUser.id, 'week');
      });


      it('should return 400 for invalid range parameter', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart?range=invalid');
        const response = await revenueChartGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_RANGE');
        expect(data.error).toContain('Invalid range');
      });

      it('should accept all valid range values', async () => {
        const validRanges = ['today', 'week', 'month', 'quarter', 'year', 'all'];
        mockRevenueService.getChartData.mockResolvedValue(mockChartData);

        for (const range of validRanges) {
          const request = createMockRequest(`http://localhost:3000/api/photographer/revenue/chart?range=${range}`);
          const response = await revenueChartGET(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getChartData.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/revenue/chart');
        const response = await revenueChartGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('CHART_ERROR');
      });
    });
  });


  // ============================================
  // Sales List API Tests
  // ============================================
  describe('GET /api/photographer/sales', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales');
        const response = await salesGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });

      it('should return data when user is authenticated', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales');
        const response = await salesGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.sales).toHaveLength(2);
        expect(data.total).toBe(2);
      });
    });

    describe('Pagination', () => {
      it('should use default pagination values', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 1, limit: 20 })
        );
      });

      it('should accept custom page and limit', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?page=2&limit=50');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 2, limit: 50 })
        );
      });


      it('should cap limit at 100', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?limit=200');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ limit: 100 })
        );
      });

      it('should set minimum page to 1 for negative values', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?page=-1');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ page: 1 })
        );
      });

      it('should set minimum limit to 1 for negative values', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?limit=-5');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ limit: 1 })
        );
      });
    });

    describe('Filtering', () => {
      it('should filter by galleryId', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?galleryId=gallery-123');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ galleryId: 'gallery-123' })
        );
      });


      it('should filter by status', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?status=succeeded');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ status: 'succeeded' })
        );
      });

      it('should filter by date range', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?startDate=2024-01-01&endDate=2024-01-31');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-01-31' })
        );
      });

      it('should filter by search term', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?search=buyer@example.com');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ search: 'buyer@example.com' })
        );
      });

      it('should combine multiple filters', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales?galleryId=gallery-123&status=succeeded&page=2&limit=10');
        await salesGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            galleryId: 'gallery-123',
            status: 'succeeded',
            page: 2,
            limit: 10,
          })
        );
      });
    });


    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getSales.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/sales');
        const response = await salesGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('SALES_ERROR');
      });
    });
  });

  // ============================================
  // Sale Details API Tests
  // ============================================
  describe('GET /api/photographer/sales/[id]', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/sale-123');
        const response = await saleDetailsGET(request, { params: Promise.resolve({ id: 'sale-123' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });
    });

    describe('Authorization', () => {
      it('should return sale details when user owns the sale', async () => {
        mockRevenueService.getSaleDetails.mockResolvedValue(mockSaleDetails);
        mockFrom.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { photographer_id: mockUser.id },
                error: null,
              }),
            }),
          }),
        });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/sale-123');
        const response = await saleDetailsGET(request, { params: Promise.resolve({ id: 'sale-123' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('sale-123');
        expect(data.galleryTitle).toBe('Test Gallery');
      });


      it('should return 404 when user does not own the sale', async () => {
        mockRevenueService.getSaleDetails.mockResolvedValue(mockSaleDetails);
        mockFrom.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { photographer_id: 'other-user-id' },
                error: null,
              }),
            }),
          }),
        });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/sale-123');
        const response = await saleDetailsGET(request, { params: Promise.resolve({ id: 'sale-123' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });

      it('should return 404 when sale does not exist', async () => {
        mockRevenueService.getSaleDetails.mockResolvedValue(null);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/nonexistent');
        const response = await saleDetailsGET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('NOT_FOUND');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getSaleDetails.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/sale-123');
        const response = await saleDetailsGET(request, { params: Promise.resolve({ id: 'sale-123' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('SALE_ERROR');
      });
    });
  });


  // ============================================
  // Sales Export API Tests
  // ============================================
  describe('GET /api/photographer/sales/export', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export');
        const response = await salesExportGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });
    });

    describe('CSV Export', () => {
      it('should return CSV file with correct headers', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export');
        const response = await salesExportGET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
        expect(response.headers.get('Content-Disposition')).toContain('.csv');

        const csv = await response.text();
        expect(csv).toContain('ID');
        expect(csv).toContain('Gallery');
        expect(csv).toContain('Buyer Email');
        expect(csv).toContain('Amount');
        expect(csv).toContain('Currency');
        expect(csv).toContain('Platform Fee');
        expect(csv).toContain('Net Amount');
        expect(csv).toContain('Status');
      });

      it('should include sale data in CSV', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export');
        const response = await salesExportGET(request);
        const csv = await response.text();

        expect(csv).toContain('sale-123');
        expect(csv).toContain('Test Gallery');
        expect(csv).toContain('buyer@example.com');
        expect(csv).toContain('succeeded');
      });


      it('should apply filters to export', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export?galleryId=gallery-123&status=succeeded');
        await salesExportGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            galleryId: 'gallery-123',
            status: 'succeeded',
            limit: 1000,
          })
        );
      });

      it('should use max limit of 1000 for export', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export');
        await salesExportGET(request);

        expect(mockRevenueService.getSales).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({ limit: 1000 })
        );
      });
    });

    describe('Validation', () => {
      it('should return 400 for unsupported format', async () => {
        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export?format=pdf');
        const response = await salesExportGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_FORMAT');
        expect(data.error).toContain('CSV');
      });

      it('should accept csv format explicitly', async () => {
        mockRevenueService.getSales.mockResolvedValue(mockSalesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export?format=csv');
        const response = await salesExportGET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
      });
    });


    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getSales.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/sales/export');
        const response = await salesExportGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('EXPORT_ERROR');
      });
    });
  });

  // ============================================
  // Top Galleries API Tests
  // ============================================
  describe('GET /api/photographer/top-galleries', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries');
        const response = await topGalleriesGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(data.code).toBe('UNAUTHORIZED');
      });

      it('should return data when user is authenticated', async () => {
        mockRevenueService.getTopGalleries.mockResolvedValue(mockTopGalleriesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries');
        const response = await topGalleriesGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0].title).toBe('Top Gallery 1');
        expect(data[0].totalRevenue).toBe(50000);
      });
    });


    describe('Validation', () => {
      it('should use default limit of 5', async () => {
        mockRevenueService.getTopGalleries.mockResolvedValue(mockTopGalleriesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries');
        await topGalleriesGET(request);

        expect(mockRevenueService.getTopGalleries).toHaveBeenCalledWith(mockUser.id, 5);
      });

      it('should accept custom limit', async () => {
        mockRevenueService.getTopGalleries.mockResolvedValue(mockTopGalleriesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries?limit=10');
        await topGalleriesGET(request);

        expect(mockRevenueService.getTopGalleries).toHaveBeenCalledWith(mockUser.id, 10);
      });

      it('should cap limit at 20', async () => {
        mockRevenueService.getTopGalleries.mockResolvedValue(mockTopGalleriesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries?limit=50');
        await topGalleriesGET(request);

        expect(mockRevenueService.getTopGalleries).toHaveBeenCalledWith(mockUser.id, 20);
      });

      it('should set minimum limit to 1', async () => {
        mockRevenueService.getTopGalleries.mockResolvedValue(mockTopGalleriesData);

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries?limit=0');
        await topGalleriesGET(request);

        expect(mockRevenueService.getTopGalleries).toHaveBeenCalledWith(mockUser.id, 1);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when service throws error', async () => {
        mockRevenueService.getTopGalleries.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/photographer/top-galleries');
        const response = await topGalleriesGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('TOP_GALLERIES_ERROR');
      });
    });
  });
});
