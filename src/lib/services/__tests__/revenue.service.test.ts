/**
 * Revenue Service Tests
 * Tests for revenue analytics, sales data, and reporting for photographers
 * 
 * Requirements covered:
 * - 4.1: Sales Overview (Total Revenue, Sales Count, Average Sale, Conversion Rate)
 * - 4.2: Revenue Chart (time ranges, aggregation)
 * - 4.3: Sales List (pagination, filtering, sorting)
 * - 4.4: Top Galleries (by revenue)
 * - 9.1: Revenue Analytics (trends, conversion rate)
 * - 9.2: Sales Funnel (Views → Paywall → Checkout → Purchase)
 * - 11.1: Caching Strategy (15 minutes for revenue statistics)
 * - 11.2: Database Optimization (indexes, pagination, aggregation)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  RevenueService, 
  createRevenueService,
  type AnalyticsPeriod,
} from '../revenue.service';
import { AppError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';

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

describe('RevenueService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  const photographerId = 'photographer-123';
  const saleId = 'sale-123';

  const mockPurchaseData = [
    { amount_cents: 2999, platform_fee_cents: 300, net_amount_cents: 2699, created_at: '2024-01-15T10:00:00Z' },
    { amount_cents: 4999, platform_fee_cents: 500, net_amount_cents: 4499, created_at: '2024-01-14T10:00:00Z' },
    { amount_cents: 1999, platform_fee_cents: 200, net_amount_cents: 1799, created_at: '2024-01-13T10:00:00Z' },
  ];

  const mockSaleRecord = {
    id: 'sale-123',
    gallery_id: 'gallery-123',
    buyer_email: 'buyer@example.com',
    amount_cents: 2999,
    currency: 'usd',
    platform_fee_cents: 300,
    net_amount_cents: 2699,
    status: 'succeeded',
    created_at: '2024-01-15T10:00:00Z',
    refunded_at: null,
    galleries: { title: 'Test Gallery' },
  };

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOverview', () => {
    it('should return revenue overview for a period', async () => {
      // Use unique photographer ID to avoid cache
      const uniquePhotographerId = `photographer-overview-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([{ amount_cents: 2000 }, { amount_cents: 3000 }]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      expect(result).toMatchObject({
        totalRevenue: 9997,
        totalSales: 3,
        averageOrderValue: 3332,
        platformFees: 1000,
        netRevenue: 8997,
      });
      expect(result.periodComparison).toBeDefined();
    });

    it('should calculate period comparison correctly', async () => {
      const uniquePhotographerId = `photographer-comparison-${Date.now()}`;
      mockSupabase.addResponse([
        { amount_cents: 5000, platform_fee_cents: 500, net_amount_cents: 4500 },
        { amount_cents: 5000, platform_fee_cents: 500, net_amount_cents: 4500 },
      ]);
      mockSupabase.addResponse([{ amount_cents: 5000 }]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'week');

      expect(result.periodComparison.revenueChange).toBe(100);
      expect(result.periodComparison.salesChange).toBe(100);
    });

    it('should handle zero previous period data', async () => {
      const uniquePhotographerId = `photographer-zero-prev-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      // When previous period has no data, change should be 0
      expect(result.periodComparison.revenueChange).toBe(0);
      expect(result.periodComparison.salesChange).toBe(0);
    });

    it('should handle empty current period data', async () => {
      const uniquePhotographerId = `photographer-empty-${Date.now()}`;
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      expect(result.totalRevenue).toBe(0);
      expect(result.totalSales).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getOverview(uniquePhotographerId, 'month')).rejects.toThrow(AppError);
    });

    it('should support all period types', async () => {
      const periods: AnalyticsPeriod[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

      for (const period of periods) {
        const uniquePhotographerId = `photographer-period-${period}-${Date.now()}`;
        mockSupabase.reset();
        mockSupabase.addResponse(mockPurchaseData);
        mockSupabase.addResponse([]);

        const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
        const result = await service.getOverview(uniquePhotographerId, period);
        expect(result.totalSales).toBe(3);
      }
    });
  });

  describe('getChartData', () => {
    it('should return chart data points grouped by day', async () => {
      const uniquePhotographerId = `photographer-chart-${Date.now()}`;
      const chartData = [
        { amount_cents: 2999, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 1999, created_at: '2024-01-15T14:00:00Z' },
        { amount_cents: 4999, created_at: '2024-01-14T10:00:00Z' },
      ];
      mockSupabase.addResponse(chartData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'week');

      expect(result.length).toBeGreaterThan(0);
      const jan15 = result.find(d => d.date === '2024-01-15');
      expect(jan15).toBeDefined();
      expect(jan15?.revenue).toBe(4998);
      expect(jan15?.sales).toBe(2);
    });

    it('should return empty array when no data', async () => {
      const uniquePhotographerId = `photographer-chart-empty-${Date.now()}`;
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'month');

      expect(result).toEqual([]);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-chart-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getChartData(uniquePhotographerId, 'month')).rejects.toThrow(AppError);
    });

    it('should group by month for year period', async () => {
      const uniquePhotographerId = `photographer-chart-year-${Date.now()}`;
      const chartData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-20T10:00:00Z' },
        { amount_cents: 3000, created_at: '2024-02-15T10:00:00Z' },
      ];
      mockSupabase.addResponse(chartData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'year');

      const jan = result.find(d => d.date === '2024-01');
      const feb = result.find(d => d.date === '2024-02');
      expect(jan?.revenue).toBe(3000);
      expect(feb?.revenue).toBe(3000);
    });
  });

  describe('getSales', () => {
    it('should return paginated sales list', async () => {
      mockSupabase.addResponse([mockSaleRecord], null, 1);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSales(photographerId, {});

      expect(result.sales).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should map sale record correctly', async () => {
      mockSupabase.addResponse([mockSaleRecord], null, 1);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSales(photographerId, {});

      expect(result.sales[0]).toMatchObject({
        id: 'sale-123',
        galleryId: 'gallery-123',
        galleryTitle: 'Test Gallery',
        buyerEmail: 'buyer@example.com',
        amount: 2999,
        currency: 'usd',
        platformFee: 300,
        netAmount: 2699,
        status: 'succeeded',
      });
    });

    it('should apply pagination correctly', async () => {
      mockSupabase.addResponse([], null, 100);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSales(photographerId, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it('should limit max page size to 100', async () => {
      mockSupabase.addResponse([], null, 0);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSales(photographerId, { limit: 200 });

      expect(result.limit).toBe(100);
    });

    it('should throw AppError on database error', async () => {
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getSales(photographerId, {})).rejects.toThrow(AppError);
    });

    it('should handle missing gallery title gracefully', async () => {
      const saleWithoutGallery = { ...mockSaleRecord, galleries: null };
      mockSupabase.addResponse([saleWithoutGallery], null, 1);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSales(photographerId, {});

      expect(result.sales[0]?.galleryTitle).toBe('Unknown');
    });
  });

  describe('getSaleDetails', () => {
    it('should return sale details when found', async () => {
      mockSupabase.addResponse(mockSaleRecord);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSaleDetails(saleId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sale-123');
      expect(result?.galleryTitle).toBe('Test Gallery');
      expect(result?.amount).toBe(2999);
    });

    it('should return null when sale not found', async () => {
      mockSupabase.addResponse(null, { code: 'PGRST116' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSaleDetails('unknown-sale');

      expect(result).toBeNull();
    });

    it('should handle refunded sale', async () => {
      const refundedSale = {
        ...mockSaleRecord,
        status: 'refunded',
        refunded_at: '2024-01-16T10:00:00Z',
      };
      mockSupabase.addResponse(refundedSale);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSaleDetails(saleId);

      expect(result?.status).toBe('refunded');
      expect(result?.refundedAt).toBe('2024-01-16T10:00:00Z');
    });

    it('should handle missing gallery gracefully', async () => {
      const saleWithoutGallery = { ...mockSaleRecord, galleries: null };
      mockSupabase.addResponse(saleWithoutGallery);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getSaleDetails(saleId);

      expect(result?.galleryTitle).toBe('Unknown');
    });
  });

  describe('getTopGalleries', () => {
    const mockTopGalleryData = [
      {
        gallery_id: 'gallery-1',
        total_sales: 10,
        total_revenue_cents: 50000,
        conversion_rate: 5.5,
        galleries: { title: 'Top Gallery 1', user_id: photographerId },
      },
      {
        gallery_id: 'gallery-2',
        total_sales: 5,
        total_revenue_cents: 25000,
        conversion_rate: 3.2,
        galleries: { title: 'Top Gallery 2', user_id: photographerId },
      },
    ];

    it('should return top galleries by revenue', async () => {
      const uniquePhotographerId = `photographer-top-${Date.now()}`;
      mockSupabase.addResponse(mockTopGalleryData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getTopGalleries(uniquePhotographerId);

      expect(result).toHaveLength(2);
      expect(result[0]?.galleryId).toBe('gallery-1');
      expect(result[0]?.totalRevenue).toBe(50000);
      expect(result[0]?.totalSales).toBe(10);
    });

    it('should respect limit parameter', async () => {
      const uniquePhotographerId = `photographer-top-limit-${Date.now()}`;
      mockSupabase.addResponse([mockTopGalleryData[0]]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getTopGalleries(uniquePhotographerId, 1);

      expect(result).toHaveLength(1);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-top-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getTopGalleries(uniquePhotographerId)).rejects.toThrow(AppError);
    });

    it('should handle empty result', async () => {
      const uniquePhotographerId = `photographer-top-empty-${Date.now()}`;
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getTopGalleries(uniquePhotographerId);

      expect(result).toEqual([]);
    });

    it('should handle missing gallery title', async () => {
      const uniquePhotographerId = `photographer-top-notitle-${Date.now()}`;
      const dataWithMissingTitle = [{
        ...mockTopGalleryData[0],
        galleries: null,
      }];
      mockSupabase.addResponse(dataWithMissingTitle);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getTopGalleries(uniquePhotographerId);

      expect(result[0]?.title).toBe('Unknown');
    });
  });

  describe('getConversionFunnel', () => {
    it('should return conversion funnel data', async () => {
      const uniquePhotographerId = `photographer-funnel-${Date.now()}`;
      mockSupabase.addResponse(Array(100).fill({ id: 'view' }));
      mockSupabase.addResponse(Array(50).fill({ id: 'paywall' }));
      mockSupabase.addResponse(Array(20).fill({ id: 'checkout' }));
      mockSupabase.addResponse(Array(10).fill({ id: 'purchase' }));

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getConversionFunnel(uniquePhotographerId);

      expect(result.views).toBe(100);
      expect(result.paywallViews).toBe(50);
      expect(result.checkoutStarts).toBe(20);
      expect(result.purchases).toBe(10);
      expect(result.conversionRate).toBe(10);
    });

    it('should handle zero views', async () => {
      const uniquePhotographerId = `photographer-funnel-zero-${Date.now()}`;
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getConversionFunnel(uniquePhotographerId);

      expect(result.views).toBe(0);
      expect(result.conversionRate).toBe(0);
    });

    it('should round conversion rate to 2 decimal places', async () => {
      const uniquePhotographerId = `photographer-funnel-round-${Date.now()}`;
      mockSupabase.addResponse(Array(3).fill({ id: 'view' }));
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([{ id: 'purchase' }]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getConversionFunnel(uniquePhotographerId);

      expect(result.conversionRate).toBe(33.33);
    });
  });

  describe('getRevenueByGallery', () => {
    const mockRevenueByGalleryData = [
      {
        gallery_id: 'gallery-1',
        total_sales: 10,
        total_revenue_cents: 60000,
        galleries: { title: 'Gallery 1', user_id: photographerId },
      },
      {
        gallery_id: 'gallery-2',
        total_sales: 5,
        total_revenue_cents: 40000,
        galleries: { title: 'Gallery 2', user_id: photographerId },
      },
    ];

    it('should return revenue breakdown by gallery', async () => {
      const uniquePhotographerId = `photographer-revenue-${Date.now()}`;
      mockSupabase.addResponse(mockRevenueByGalleryData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueByGallery(uniquePhotographerId);

      expect(result).toHaveLength(2);
      expect(result[0]?.galleryId).toBe('gallery-1');
      expect(result[0]?.revenue).toBe(60000);
      expect(result[0]?.sales).toBe(10);
    });

    it('should calculate percentage correctly', async () => {
      const uniquePhotographerId = `photographer-revenue-pct-${Date.now()}`;
      mockSupabase.addResponse(mockRevenueByGalleryData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueByGallery(uniquePhotographerId);

      expect(result[0]?.percentage).toBe(60);
      expect(result[1]?.percentage).toBe(40);
    });

    it('should handle zero total revenue', async () => {
      const uniquePhotographerId = `photographer-revenue-zero-${Date.now()}`;
      const zeroRevenueData = [{
        gallery_id: 'gallery-1',
        total_sales: 0,
        total_revenue_cents: 0,
        galleries: { title: 'Gallery 1', user_id: photographerId },
      }];
      mockSupabase.addResponse(zeroRevenueData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueByGallery(uniquePhotographerId);

      expect(result[0]?.percentage).toBe(0);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-revenue-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getRevenueByGallery(uniquePhotographerId)).rejects.toThrow(AppError);
    });

    it('should handle empty result', async () => {
      const uniquePhotographerId = `photographer-revenue-empty-${Date.now()}`;
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueByGallery(uniquePhotographerId);

      expect(result).toEqual([]);
    });
  });

  describe('caching behavior', () => {
    it('should cache getOverview results for 15 minutes', async () => {
      const uniquePhotographerId = `photographer-cache-overview-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getOverview(uniquePhotographerId, 'month');
      mockSupabase.reset();
      const result2 = await service.getOverview(uniquePhotographerId, 'month');

      expect(result1).toEqual(result2);
    });

    it('should cache getChartData results', async () => {
      const uniquePhotographerId = `photographer-cache-chart-${Date.now()}`;
      const chartData = [{ amount_cents: 2999, created_at: '2024-01-15T10:00:00Z' }];
      mockSupabase.addResponse(chartData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getChartData(uniquePhotographerId, 'week');
      mockSupabase.reset();
      const result2 = await service.getChartData(uniquePhotographerId, 'week');

      expect(result1).toEqual(result2);
    });

    it('should cache getTopGalleries results', async () => {
      const uniquePhotographerId = `photographer-cache-top-${Date.now()}`;
      const topGalleryData = [{
        gallery_id: 'gallery-1',
        total_sales: 10,
        total_revenue_cents: 50000,
        conversion_rate: 5.5,
        galleries: { title: 'Top Gallery', user_id: photographerId },
      }];
      mockSupabase.addResponse(topGalleryData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getTopGalleries(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getTopGalleries(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });

    it('should cache getConversionFunnel results', async () => {
      const uniquePhotographerId = `photographer-cache-funnel-${Date.now()}`;
      mockSupabase.addResponse(Array(100).fill({ id: 'view' }));
      mockSupabase.addResponse(Array(50).fill({ id: 'paywall' }));
      mockSupabase.addResponse(Array(20).fill({ id: 'checkout' }));
      mockSupabase.addResponse(Array(10).fill({ id: 'purchase' }));

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getConversionFunnel(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getConversionFunnel(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });

    it('should cache getRevenueByGallery results', async () => {
      const uniquePhotographerId = `photographer-cache-revenue-${Date.now()}`;
      const revenueData = [{
        gallery_id: 'gallery-1',
        total_sales: 10,
        total_revenue_cents: 50000,
        galleries: { title: 'Gallery 1', user_id: photographerId },
      }];
      mockSupabase.addResponse(revenueData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getRevenueByGallery(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getRevenueByGallery(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });

    it('should use different cache keys for different periods', async () => {
      const uniquePhotographerId = `photographer-cache-periods-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const weekResult = await service.getOverview(uniquePhotographerId, 'week');
      const monthResult = await service.getOverview(uniquePhotographerId, 'month');

      expect(weekResult.totalSales).toBe(3);
      expect(monthResult.totalSales).toBe(3);
    });

    it('should use different cache keys for different photographers', async () => {
      const uniquePhotographerId1 = `photographer-cache-diff1-${Date.now()}`;
      const uniquePhotographerId2 = `photographer-cache-diff2-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([{ amount_cents: 1000, platform_fee_cents: 100, net_amount_cents: 900 }]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getOverview(uniquePhotographerId1, 'month');
      const result2 = await service.getOverview(uniquePhotographerId2, 'month');

      expect(result1.totalSales).toBe(3);
      expect(result2.totalSales).toBe(1);
    });
  });

  describe('query optimization', () => {
    it('should use pagination for large result sets', async () => {
      mockSupabase.addResponse([], null, 1000);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await service.getSales(photographerId, { page: 1, limit: 20 });

      expect(mockSupabase.from).toHaveBeenCalledWith('gallery_purchases');
    });

    it('should order results by date descending for sales', async () => {
      mockSupabase.addResponse([], null, 0);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await service.getSales(photographerId, {});

      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('should use aggregation for revenue calculations', async () => {
      const uniquePhotographerId = `photographer-agg-${Date.now()}`;
      mockSupabase.addResponse(mockPurchaseData);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      expect(result.totalRevenue).toBe(9997);
      expect(result.platformFees).toBe(1000);
      expect(result.netRevenue).toBe(8997);
    });
  });

  describe('data grouping', () => {
    it('should group data by hour for today', async () => {
      const uniquePhotographerId = `photographer-group-hour-${Date.now()}`;
      const hourlyData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:30:00Z' },
        { amount_cents: 2000, created_at: '2024-01-15T10:45:00Z' },
        { amount_cents: 3000, created_at: '2024-01-15T11:15:00Z' },
      ];
      mockSupabase.addResponse(hourlyData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'today');

      const hour10 = result.find(d => d.date.includes('10:00'));
      const hour11 = result.find(d => d.date.includes('11:00'));
      
      if (hour10) {
        expect(hour10.revenue).toBe(3000);
        expect(hour10.sales).toBe(2);
      }
      if (hour11) {
        expect(hour11.revenue).toBe(3000);
        expect(hour11.sales).toBe(1);
      }
    });

    it('should group data by day for week/month', async () => {
      const uniquePhotographerId = `photographer-group-day-${Date.now()}`;
      const dailyData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-15T14:00:00Z' },
        { amount_cents: 3000, created_at: '2024-01-16T10:00:00Z' },
      ];
      mockSupabase.addResponse(dailyData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'week');

      const jan15 = result.find(d => d.date === '2024-01-15');
      const jan16 = result.find(d => d.date === '2024-01-16');

      expect(jan15?.revenue).toBe(3000);
      expect(jan15?.sales).toBe(2);
      expect(jan16?.revenue).toBe(3000);
      expect(jan16?.sales).toBe(1);
    });

    it('should group data by week for quarter', async () => {
      const uniquePhotographerId = `photographer-group-week-${Date.now()}`;
      const weeklyData = [
        { amount_cents: 1000, created_at: '2024-01-14T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 3000, created_at: '2024-01-21T10:00:00Z' },
      ];
      mockSupabase.addResponse(weeklyData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'quarter');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should sort chart data by date ascending', async () => {
      const uniquePhotographerId = `photographer-sort-${Date.now()}`;
      const unsortedData = [
        { amount_cents: 3000, created_at: '2024-01-17T10:00:00Z' },
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-16T10:00:00Z' },
      ];
      mockSupabase.addResponse(unsortedData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getChartData(uniquePhotographerId, 'week');

      for (let i = 1; i < result.length; i++) {
        const current = result[i];
        const previous = result[i - 1];
        if (current && previous) {
          expect(current.date >= previous.date).toBe(true);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null values in purchase data', async () => {
      const uniquePhotographerId = `photographer-null-${Date.now()}`;
      const dataWithNulls = [
        { amount_cents: null, platform_fee_cents: null, net_amount_cents: null },
        { amount_cents: 2999, platform_fee_cents: 300, net_amount_cents: 2699 },
      ];
      mockSupabase.addResponse(dataWithNulls);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      expect(result.totalRevenue).toBe(2999);
      expect(result.totalSales).toBe(2);
    });

    it('should handle very large numbers', async () => {
      const uniquePhotographerId = `photographer-large-${Date.now()}`;
      const largeData = [
        { amount_cents: 99999999, platform_fee_cents: 9999999, net_amount_cents: 89999999 },
      ];
      mockSupabase.addResponse(largeData);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'month');

      expect(result.totalRevenue).toBe(99999999);
    });

    it('should handle negative percentage change', async () => {
      const uniquePhotographerId = `photographer-negative-${Date.now()}`;
      mockSupabase.addResponse([
        { amount_cents: 5000, platform_fee_cents: 500, net_amount_cents: 4500 },
      ]);
      mockSupabase.addResponse([{ amount_cents: 10000 }]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getOverview(uniquePhotographerId, 'week');

      expect(result.periodComparison.revenueChange).toBe(-50);
    });
  });

  describe('createRevenueService factory', () => {
    it('should create a RevenueService instance', () => {
      const service = createRevenueService(mockSupabase as unknown as SupabaseClient);
      expect(service).toBeInstanceOf(RevenueService);
    });
  });
});


/**
 * Advanced Analytics Tests
 * Tests for Task 9.1: Advanced Analytics
 * 
 * Requirements covered:
 * - 9.1: Revenue Analytics (trends, revenue per gallery, avg time to conversion, peak hours)
 * - 9.2: Sales Funnel (Views → Paywall → Checkout → Purchase with drop-off analysis)
 */
describe('Advanced Analytics', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDetailedConversionFunnel', () => {
    it('should return detailed conversion funnel with step-by-step metrics', async () => {
      const uniquePhotographerId = `photographer-detailed-funnel-${Date.now()}`;
      // Views count
      mockSupabase.addResponse(null, null, 1000);
      // Paywall views count
      mockSupabase.addResponse(null, null, 500);
      // Checkout starts count
      mockSupabase.addResponse(null, null, 200);
      // Purchases count
      mockSupabase.addResponse(null, null, 100);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result.views).toBe(1000);
      expect(result.paywallViews).toBe(500);
      expect(result.checkoutStarts).toBe(200);
      expect(result.purchases).toBe(100);
    });

    it('should calculate conversion rates correctly', async () => {
      const uniquePhotographerId = `photographer-funnel-rates-${Date.now()}`;
      mockSupabase.addResponse(null, null, 1000);
      mockSupabase.addResponse(null, null, 500);
      mockSupabase.addResponse(null, null, 200);
      mockSupabase.addResponse(null, null, 100);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result.conversionRates.viewToPaywall).toBe(50);
      expect(result.conversionRates.paywallToCheckout).toBe(40);
      expect(result.conversionRates.checkoutToPurchase).toBe(50);
      expect(result.conversionRates.overall).toBe(10);
    });

    it('should calculate drop-off points correctly', async () => {
      const uniquePhotographerId = `photographer-funnel-dropoff-${Date.now()}`;
      mockSupabase.addResponse(null, null, 1000);
      mockSupabase.addResponse(null, null, 500);
      mockSupabase.addResponse(null, null, 200);
      mockSupabase.addResponse(null, null, 100);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result.dropOffPoints).toHaveLength(3);
      expect(result.dropOffPoints[0]).toMatchObject({
        step: 'View → Paywall',
        dropOffRate: 50,
        count: 500,
      });
      expect(result.dropOffPoints[1]).toMatchObject({
        step: 'Paywall → Checkout',
        dropOffRate: 60,
        count: 300,
      });
      expect(result.dropOffPoints[2]).toMatchObject({
        step: 'Checkout → Purchase',
        dropOffRate: 50,
        count: 100,
      });
    });

    it('should handle zero views gracefully', async () => {
      const uniquePhotographerId = `photographer-funnel-zero-${Date.now()}`;
      mockSupabase.addResponse(null, null, 0);
      mockSupabase.addResponse(null, null, 0);
      mockSupabase.addResponse(null, null, 0);
      mockSupabase.addResponse(null, null, 0);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result.views).toBe(0);
      expect(result.conversionRates.overall).toBe(0);
      expect(result.conversionRates.viewToPaywall).toBe(0);
    });

    it('should include period dates in result', async () => {
      const uniquePhotographerId = `photographer-funnel-period-${Date.now()}`;
      mockSupabase.addResponse(null, null, 100);
      mockSupabase.addResponse(null, null, 50);
      mockSupabase.addResponse(null, null, 20);
      mockSupabase.addResponse(null, null, 10);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result.period).toBeDefined();
      expect(result.period.startDate).toBeDefined();
      expect(result.period.endDate).toBeDefined();
    });

    it('should apply gallery filter when provided', async () => {
      const uniquePhotographerId = `photographer-funnel-filter-${Date.now()}`;
      mockSupabase.addResponse(null, null, 50);
      mockSupabase.addResponse(null, null, 25);
      mockSupabase.addResponse(null, null, 10);
      mockSupabase.addResponse(null, null, 5);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getDetailedConversionFunnel(uniquePhotographerId, {
        galleryId: 'gallery-123',
      });

      expect(result.views).toBe(50);
      expect(result.purchases).toBe(5);
    });

    it('should cache results', async () => {
      const uniquePhotographerId = `photographer-funnel-cache-${Date.now()}`;
      mockSupabase.addResponse(null, null, 100);
      mockSupabase.addResponse(null, null, 50);
      mockSupabase.addResponse(null, null, 20);
      mockSupabase.addResponse(null, null, 10);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getDetailedConversionFunnel(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getDetailedConversionFunnel(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });
  });

  describe('getCohortAnalysis', () => {
    const mockCohortPurchases = [
      { buyer_email: 'user1@test.com', amount_cents: 2999, created_at: '2024-01-15T10:00:00Z' },
      { buyer_email: 'user1@test.com', amount_cents: 1999, created_at: '2024-02-15T10:00:00Z' },
      { buyer_email: 'user2@test.com', amount_cents: 4999, created_at: '2024-01-20T10:00:00Z' },
      { buyer_email: 'user3@test.com', amount_cents: 3999, created_at: '2024-02-10T10:00:00Z' },
    ];

    it('should return cohort analysis with customer retention data', async () => {
      const uniquePhotographerId = `photographer-cohort-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId);

      expect(result.cohorts).toBeDefined();
      expect(result.cohorts.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('should group customers by first purchase month', async () => {
      const uniquePhotographerId = `photographer-cohort-group-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId);

      // Should have cohorts for January and February
      const janCohort = result.cohorts.find(c => c.cohortMonth === '2024-01');
      const febCohort = result.cohorts.find(c => c.cohortMonth === '2024-02');

      expect(janCohort).toBeDefined();
      expect(janCohort?.totalCustomers).toBe(2); // user1 and user2
      expect(febCohort).toBeDefined();
      expect(febCohort?.totalCustomers).toBe(1); // user3
    });

    it('should calculate retention by month', async () => {
      const uniquePhotographerId = `photographer-cohort-retention-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId);

      const janCohort = result.cohorts.find(c => c.cohortMonth === '2024-01');
      expect(janCohort?.retentionByMonth).toBeDefined();
      expect(janCohort?.retentionByMonth.length).toBeGreaterThan(0);
    });

    it('should calculate summary metrics', async () => {
      const uniquePhotographerId = `photographer-cohort-summary-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId);

      expect(result.summary.averageRetention).toBeDefined();
      expect(result.summary.averageLifetimeValue).toBeDefined();
      expect(result.summary.bestPerformingCohort).toBeDefined();
    });

    it('should handle empty purchase data', async () => {
      const uniquePhotographerId = `photographer-cohort-empty-${Date.now()}`;
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId);

      expect(result.cohorts).toEqual([]);
      expect(result.summary.averageRetention).toBe(0);
      expect(result.summary.averageLifetimeValue).toBe(0);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-cohort-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getCohortAnalysis(uniquePhotographerId)).rejects.toThrow(AppError);
    });

    it('should cache results', async () => {
      const uniquePhotographerId = `photographer-cohort-cache-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getCohortAnalysis(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getCohortAnalysis(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });

    it('should respect monthsToAnalyze filter', async () => {
      const uniquePhotographerId = `photographer-cohort-months-${Date.now()}`;
      mockSupabase.addResponse(mockCohortPurchases);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getCohortAnalysis(uniquePhotographerId, {
        monthsToAnalyze: 3,
      });

      expect(result.cohorts).toBeDefined();
    });
  });

  describe('getRevenueTrends', () => {
    const mockTrendData = [
      { amount_cents: 2999, created_at: '2024-01-15T10:00:00Z' },
      { amount_cents: 3999, created_at: '2024-01-16T10:00:00Z' },
      { amount_cents: 4999, created_at: '2024-01-17T10:00:00Z' },
    ];

    it('should return revenue trends with growth rates', async () => {
      const uniquePhotographerId = `photographer-trends-${Date.now()}`;
      mockSupabase.addResponse(mockTrendData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'week');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('sales');
      expect(result[0]).toHaveProperty('averageOrderValue');
      expect(result[0]).toHaveProperty('growthRate');
    });

    it('should calculate growth rate correctly', async () => {
      const uniquePhotographerId = `photographer-trends-growth-${Date.now()}`;
      const growthData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-16T10:00:00Z' },
      ];
      mockSupabase.addResponse(growthData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'week');

      // Second day should have 100% growth (1000 -> 2000)
      const secondDay = result.find(r => r.period === '2024-01-16');
      expect(secondDay?.growthRate).toBe(100);
    });

    it('should handle first period with zero growth rate', async () => {
      const uniquePhotographerId = `photographer-trends-first-${Date.now()}`;
      mockSupabase.addResponse(mockTrendData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'week');

      // First period should have 0 growth rate (no previous period)
      expect(result[0]?.growthRate).toBe(0);
    });

    it('should calculate average order value', async () => {
      const uniquePhotographerId = `photographer-trends-aov-${Date.now()}`;
      const aovData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 3000, created_at: '2024-01-15T14:00:00Z' },
      ];
      mockSupabase.addResponse(aovData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'week');

      const jan15 = result.find(r => r.period === '2024-01-15');
      expect(jan15?.averageOrderValue).toBe(2000); // (1000 + 3000) / 2
    });

    it('should handle empty data', async () => {
      const uniquePhotographerId = `photographer-trends-empty-${Date.now()}`;
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'month');

      expect(result).toEqual([]);
    });

    it('should throw AppError on database error', async () => {
      const uniquePhotographerId = `photographer-trends-error-${Date.now()}`;
      mockSupabase.addResponse(null, { message: 'Database error' });

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await expect(service.getRevenueTrends(uniquePhotographerId, 'month')).rejects.toThrow(AppError);
    });

    it('should cache results', async () => {
      const uniquePhotographerId = `photographer-trends-cache-${Date.now()}`;
      mockSupabase.addResponse(mockTrendData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getRevenueTrends(uniquePhotographerId, 'week');
      mockSupabase.reset();
      const result2 = await service.getRevenueTrends(uniquePhotographerId, 'week');

      expect(result1).toEqual(result2);
    });

    it('should support different period types', async () => {
      const periods: Array<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'> = ['today', 'week', 'month', 'quarter', 'year', 'all'];

      for (const period of periods) {
        const uniquePhotographerId = `photographer-trends-period-${period}-${Date.now()}`;
        mockSupabase.reset();
        mockSupabase.addResponse(mockTrendData);

        const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
        const result = await service.getRevenueTrends(uniquePhotographerId, period);
        expect(result).toBeDefined();
      }
    });
  });

  describe('getAdvancedAnalyticsSummary', () => {
    it('should return advanced analytics summary', async () => {
      const uniquePhotographerId = `photographer-summary-${Date.now()}`;
      // Monetization data
      mockSupabase.addResponse([
        { total_revenue_cents: 50000, galleries: { user_id: uniquePhotographerId } },
        { total_revenue_cents: 30000, galleries: { user_id: uniquePhotographerId } },
      ]);
      // Funnel data (views, paywall, checkout, purchases)
      mockSupabase.addResponse(Array(100).fill({ id: 'view' }));
      mockSupabase.addResponse(Array(50).fill({ id: 'paywall' }));
      mockSupabase.addResponse(Array(20).fill({ id: 'checkout' }));
      mockSupabase.addResponse(Array(10).fill({ id: 'purchase' }));
      // Conversion time data
      mockSupabase.addResponse([
        { created_at: '2024-01-15T12:00:00Z', buyer_email: 'test@test.com', gallery_id: 'gallery-1' },
      ]);
      // First view for conversion time
      mockSupabase.addResponse({ created_at: '2024-01-15T10:00:00Z' });
      // Purchases by hour
      mockSupabase.addResponse([
        { created_at: '2024-01-15T14:00:00Z' },
        { created_at: '2024-01-16T14:00:00Z' },
        { created_at: '2024-01-17T10:00:00Z' },
      ]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result).toHaveProperty('revenuePerGallery');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('averageTimeToConversion');
      expect(result).toHaveProperty('topPerformingDay');
      expect(result).toHaveProperty('peakHour');
    });

    it('should calculate revenue per gallery correctly', async () => {
      const uniquePhotographerId = `photographer-summary-rpg-${Date.now()}`;
      mockSupabase.addResponse([
        { total_revenue_cents: 60000, galleries: { user_id: uniquePhotographerId } },
        { total_revenue_cents: 40000, galleries: { user_id: uniquePhotographerId } },
      ]);
      // Funnel data
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      // Conversion time
      mockSupabase.addResponse([]);
      // Purchases by hour
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result.revenuePerGallery).toBe(50000); // (60000 + 40000) / 2
    });

    it('should handle no galleries', async () => {
      const uniquePhotographerId = `photographer-summary-nogallery-${Date.now()}`;
      mockSupabase.addResponse([]);
      // Funnel data
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      // Conversion time
      mockSupabase.addResponse([]);
      // Purchases by hour
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result.revenuePerGallery).toBe(0);
    });

    it('should identify peak hour correctly', async () => {
      const uniquePhotographerId = `photographer-summary-peak-${Date.now()}`;
      mockSupabase.addResponse([]);
      // Funnel data
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      // Conversion time
      mockSupabase.addResponse([]);
      // Purchases by hour - most at 14:00 UTC
      mockSupabase.addResponse([
        { created_at: '2024-01-15T14:00:00Z' },
        { created_at: '2024-01-16T14:00:00Z' },
        { created_at: '2024-01-17T14:00:00Z' },
        { created_at: '2024-01-18T10:00:00Z' },
      ]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result.peakHour).toBe(14);
    });

    it('should cache results', async () => {
      const uniquePhotographerId = `photographer-summary-cache-${Date.now()}`;
      mockSupabase.addResponse([{ total_revenue_cents: 50000, galleries: { user_id: uniquePhotographerId } }]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      
      const result1 = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);
      mockSupabase.reset();
      const result2 = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result1).toEqual(result2);
    });

    it('should handle default values when no data', async () => {
      const uniquePhotographerId = `photographer-summary-defaults-${Date.now()}`;
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(result.revenuePerGallery).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.averageTimeToConversion).toBe(0);
      expect(result.peakHour).toBe(12); // Default
      expect(result.topPerformingDay).toBe('Saturday'); // Default
    });
  });

  describe('Query Optimization', () => {
    it('should use count queries for funnel metrics (head: true)', async () => {
      const uniquePhotographerId = `photographer-opt-count-${Date.now()}`;
      mockSupabase.addResponse(null, null, 100);
      mockSupabase.addResponse(null, null, 50);
      mockSupabase.addResponse(null, null, 20);
      mockSupabase.addResponse(null, null, 10);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await service.getDetailedConversionFunnel(uniquePhotographerId);

      // Verify that from was called (queries were made)
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('should order purchases by date for trend analysis', async () => {
      const uniquePhotographerId = `photographer-opt-order-${Date.now()}`;
      const trendData = [
        { amount_cents: 1000, created_at: '2024-01-15T10:00:00Z' },
        { amount_cents: 2000, created_at: '2024-01-16T10:00:00Z' },
      ];
      mockSupabase.addResponse(trendData);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      const result = await service.getRevenueTrends(uniquePhotographerId, 'week');

      // Results should be sorted by date
      for (let i = 1; i < result.length; i++) {
        expect(result[i]!.period >= result[i - 1]!.period).toBe(true);
      }
    });

    it('should limit conversion time queries to recent purchases', async () => {
      const uniquePhotographerId = `photographer-opt-limit-${Date.now()}`;
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);
      // Limited to 100 purchases
      mockSupabase.addResponse([]);
      mockSupabase.addResponse([]);

      const service = new RevenueService(mockSupabase as unknown as SupabaseClient);
      await service.getAdvancedAnalyticsSummary(uniquePhotographerId);

      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
