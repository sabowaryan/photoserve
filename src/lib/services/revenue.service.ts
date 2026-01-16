/**
 * Revenue Service
 * Handles revenue analytics, sales data, and reporting for photographers
 * 
 * @module lib/services/revenue.service
 * Requirements: 5.1 - Revenue Service
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';

/**
 * Time period for analytics
 */
export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Revenue overview data
 */
export interface RevenueOverview {
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

/**
 * Chart data point
 */
export interface ChartDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

/**
 * Sale record
 */
export interface Sale {
  id: string;
  galleryId: string;
  galleryTitle: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  platformFee: number;
  netAmount: number;
  status: string;
  purchasedAt: string;
  refundedAt?: string;
}

/**
 * Sale filters
 */
export interface SaleFilters {
  galleryId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated sales result
 */
export interface PaginatedSales {
  sales: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Top gallery by revenue
 */
export interface TopGallery {
  galleryId: string;
  title: string;
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
}

/**
 * Conversion funnel data
 */
export interface ConversionFunnel {
  views: number;
  paywallViews: number;
  checkoutStarts: number;
  purchases: number;
  conversionRate: number;
}

/**
 * Revenue by gallery
 */
export interface GalleryRevenue {
  galleryId: string;
  title: string;
  revenue: number;
  sales: number;
  percentage: number;
}

/**
 * Detailed conversion funnel with step-by-step metrics
 * Requirement 9.2: Sales Funnel (Views → Paywall → Checkout → Purchase)
 */
export interface DetailedConversionFunnel {
  views: number;
  paywallViews: number;
  checkoutStarts: number;
  purchases: number;
  conversionRates: {
    viewToPaywall: number;
    paywallToCheckout: number;
    checkoutToPurchase: number;
    overall: number;
  };
  dropOffPoints: {
    step: string;
    dropOffRate: number;
    count: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Cohort data for a single month
 */
export interface CohortData {
  cohortMonth: string;
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  retentionByMonth: {
    month: number;
    customers: number;
    revenue: number;
    retentionRate: number;
  }[];
}

/**
 * Cohort analysis result
 */
export interface CohortAnalysis {
  cohorts: CohortData[];
  summary: {
    averageRetention: number;
    averageLifetimeValue: number;
    bestPerformingCohort: string;
  };
}

/**
 * Revenue trend data point
 */
export interface RevenueTrend {
  period: string;
  revenue: number;
  sales: number;
  averageOrderValue: number;
  growthRate: number;
}

/**
 * Advanced analytics summary
 */
export interface AdvancedAnalyticsSummary {
  revenuePerGallery: number;
  conversionRate: number;
  averageTimeToConversion: number;
  topPerformingDay: string;
  peakHour: number;
}

/**
 * Revenue Service Interface
 */
export interface IRevenueService {
  getOverview(photographerId: string, period: AnalyticsPeriod): Promise<RevenueOverview>;
  getChartData(photographerId: string, range: AnalyticsPeriod): Promise<ChartDataPoint[]>;
  getSales(photographerId: string, filters: SaleFilters): Promise<PaginatedSales>;
  getSaleDetails(saleId: string): Promise<Sale | null>;
  getTopGalleries(photographerId: string, limit?: number): Promise<TopGallery[]>;
  getConversionFunnel(photographerId: string): Promise<ConversionFunnel>;
  getRevenueByGallery(photographerId: string): Promise<GalleryRevenue[]>;
}

/**
 * Cache TTL in milliseconds (15 minutes)
 */
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Simple in-memory cache
 */
const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Get cached data or null if expired
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Set cache entry
 */
function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Revenue Service Implementation
 */
export class RevenueService implements IRevenueService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get revenue overview for a photographer
   */
  async getOverview(photographerId: string, period: AnalyticsPeriod): Promise<RevenueOverview> {
    const cacheKey = `overview:${photographerId}:${period}`;
    const cached = getCached<RevenueOverview>(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, previousStartDate, previousEndDate } = this.getPeriodDates(period);

      // Get current period stats
      const currentQuery = this.supabase
        .from('gallery_purchases')
        .select('amount_cents, platform_fee_cents, net_amount_cents')
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded');

      if (startDate) {
        currentQuery.gte('created_at', startDate);
      }

      const { data: currentData, error: currentError } = await currentQuery;

      if (currentError) {
        throw new AppError('Failed to fetch revenue data', 'REVENUE_FETCH_ERROR', 500);
      }

      // Calculate current period metrics
      const totalRevenue = currentData?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
      const totalSales = currentData?.length || 0;
      const platformFees = currentData?.reduce((sum, p) => sum + (p.platform_fee_cents || 0), 0) || 0;
      const netRevenue = currentData?.reduce((sum, p) => sum + (p.net_amount_cents || 0), 0) || 0;
      const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

      // Get previous period stats for comparison
      let revenueChange = 0;
      let salesChange = 0;

      if (previousStartDate && previousEndDate) {
        const { data: previousData } = await this.supabase
          .from('gallery_purchases')
          .select('amount_cents')
          .eq('photographer_id', photographerId)
          .eq('status', 'succeeded')
          .gte('created_at', previousStartDate)
          .lt('created_at', previousEndDate);

        const previousRevenue = previousData?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
        const previousSales = previousData?.length || 0;

        if (previousRevenue > 0) {
          revenueChange = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
        }
        if (previousSales > 0) {
          salesChange = ((totalSales - previousSales) / previousSales) * 100;
        }
      }

      const overview: RevenueOverview = {
        totalRevenue,
        totalSales,
        averageOrderValue,
        platformFees,
        netRevenue,
        periodComparison: {
          revenueChange: Math.round(revenueChange * 10) / 10,
          salesChange: Math.round(salesChange * 10) / 10,
        },
      };

      setCache(cacheKey, overview);
      return overview;
    } catch (error) {
      console.error('[RevenueService] Error getting overview:', error);
      throw error;
    }
  }

  /**
   * Get chart data for revenue visualization
   */
  async getChartData(photographerId: string, range: AnalyticsPeriod): Promise<ChartDataPoint[]> {
    const cacheKey = `chart:${photographerId}:${range}`;
    const cached = getCached<ChartDataPoint[]>(cacheKey);
    if (cached) return cached;

    try {
      const { startDate } = this.getPeriodDates(range);
      const groupBy = this.getGroupByInterval(range);

      // Fetch purchases
      const query = this.supabase
        .from('gallery_purchases')
        .select('amount_cents, created_at')
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: true });

      if (startDate) {
        query.gte('created_at', startDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new AppError('Failed to fetch chart data', 'CHART_FETCH_ERROR', 500);
      }

      // Group data by interval
      const grouped = this.groupDataByInterval(data || [], groupBy);
      
      setCache(cacheKey, grouped);
      return grouped;
    } catch (error) {
      console.error('[RevenueService] Error getting chart data:', error);
      throw error;
    }
  }

  /**
   * Get paginated sales list
   */
  async getSales(photographerId: string, filters: SaleFilters): Promise<PaginatedSales> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('gallery_purchases')
        .select(`
          id,
          gallery_id,
          buyer_email,
          amount_cents,
          currency,
          platform_fee_cents,
          net_amount_cents,
          status,
          created_at,
          refunded_at,
          galleries!inner(title)
        `, { count: 'exact' })
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.galleryId) {
        query = query.eq('gallery_id', filters.galleryId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.search) {
        query = query.ilike('buyer_email', `%${filters.search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new AppError('Failed to fetch sales', 'SALES_FETCH_ERROR', 500);
      }

      const sales: Sale[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        galleryId: row.gallery_id as string,
        galleryTitle: (row.galleries as { title: string })?.title || 'Unknown',
        buyerEmail: row.buyer_email as string,
        amount: row.amount_cents as number,
        currency: row.currency as string,
        platformFee: row.platform_fee_cents as number,
        netAmount: row.net_amount_cents as number,
        status: row.status as string,
        purchasedAt: row.created_at as string,
        refundedAt: row.refunded_at as string | undefined,
      }));

      return {
        sales,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('[RevenueService] Error getting sales:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific sale
   */
  async getSaleDetails(saleId: string): Promise<Sale | null> {
    try {
      const { data, error } = await this.supabase
        .from('gallery_purchases')
        .select(`
          id,
          gallery_id,
          buyer_email,
          amount_cents,
          currency,
          platform_fee_cents,
          net_amount_cents,
          status,
          created_at,
          refunded_at,
          galleries!inner(title)
        `)
        .eq('id', saleId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        galleryId: data.gallery_id,
        galleryTitle: (data.galleries as unknown as { title: string })?.title || 'Unknown',
        buyerEmail: data.buyer_email,
        amount: data.amount_cents,
        currency: data.currency,
        platformFee: data.platform_fee_cents,
        netAmount: data.net_amount_cents,
        status: data.status,
        purchasedAt: data.created_at,
        refundedAt: data.refunded_at,
      };
    } catch (error) {
      console.error('[RevenueService] Error getting sale details:', error);
      throw error;
    }
  }

  /**
   * Get top performing galleries by revenue
   */
  async getTopGalleries(photographerId: string, limit: number = 5): Promise<TopGallery[]> {
    const cacheKey = `topGalleries:${photographerId}:${limit}`;
    const cached = getCached<TopGallery[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get gallery monetization stats
      const { data, error } = await this.supabase
        .from('gallery_monetization')
        .select(`
          gallery_id,
          total_sales,
          total_revenue_cents,
          conversion_rate,
          galleries!inner(title, user_id)
        `)
        .eq('galleries.user_id', photographerId)
        .eq('is_enabled', true)
        .order('total_revenue_cents', { ascending: false })
        .limit(limit);

      if (error) {
        throw new AppError('Failed to fetch top galleries', 'TOP_GALLERIES_ERROR', 500);
      }

      const topGalleries: TopGallery[] = (data || []).map((row: Record<string, unknown>) => ({
        galleryId: row.gallery_id as string,
        title: (row.galleries as { title: string })?.title || 'Unknown',
        totalRevenue: row.total_revenue_cents as number,
        totalSales: row.total_sales as number,
        conversionRate: row.conversion_rate as number,
      }));

      setCache(cacheKey, topGalleries);
      return topGalleries;
    } catch (error) {
      console.error('[RevenueService] Error getting top galleries:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(photographerId: string): Promise<ConversionFunnel> {
    const cacheKey = `funnel:${photographerId}`;
    const cached = getCached<ConversionFunnel>(cacheKey);
    if (cached) return cached;

    try {
      // Get gallery views from analytics
      const { data: viewsData } = await this.supabase
        .from('gallery_events')
        .select('id')
        .eq('photographer_id', photographerId)
        .eq('event_type', 'view');

      const views = viewsData?.length || 0;

      // Get paywall views
      const { data: paywallData } = await this.supabase
        .from('gallery_events')
        .select('id')
        .eq('photographer_id', photographerId)
        .eq('event_type', 'paywall_view');

      const paywallViews = paywallData?.length || 0;

      // Get checkout starts
      const { data: checkoutData } = await this.supabase
        .from('gallery_events')
        .select('id')
        .eq('photographer_id', photographerId)
        .eq('event_type', 'checkout_start');

      const checkoutStarts = checkoutData?.length || 0;

      // Get purchases
      const { data: purchaseData } = await this.supabase
        .from('gallery_purchases')
        .select('id')
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded');

      const purchases = purchaseData?.length || 0;

      const conversionRate = views > 0 ? (purchases / views) * 100 : 0;

      const funnel: ConversionFunnel = {
        views,
        paywallViews,
        checkoutStarts,
        purchases,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };

      setCache(cacheKey, funnel);
      return funnel;
    } catch (error) {
      console.error('[RevenueService] Error getting conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by gallery
   */
  async getRevenueByGallery(photographerId: string): Promise<GalleryRevenue[]> {
    const cacheKey = `revenueByGallery:${photographerId}`;
    const cached = getCached<GalleryRevenue[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('gallery_monetization')
        .select(`
          gallery_id,
          total_sales,
          total_revenue_cents,
          galleries!inner(title, user_id)
        `)
        .eq('galleries.user_id', photographerId)
        .eq('is_enabled', true)
        .order('total_revenue_cents', { ascending: false });

      if (error) {
        throw new AppError('Failed to fetch revenue by gallery', 'REVENUE_BY_GALLERY_ERROR', 500);
      }

      const totalRevenue = (data || []).reduce(
        (sum: number, row: Record<string, unknown>) => sum + ((row.total_revenue_cents as number) || 0),
        0
      );

      const revenueByGallery: GalleryRevenue[] = (data || []).map((row: Record<string, unknown>) => {
        const revenue = (row.total_revenue_cents as number) || 0;
        return {
          galleryId: row.gallery_id as string,
          title: (row.galleries as { title: string })?.title || 'Unknown',
          revenue,
          sales: (row.total_sales as number) || 0,
          percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0,
        };
      });

      setCache(cacheKey, revenueByGallery);
      return revenueByGallery;
    } catch (error) {
      console.error('[RevenueService] Error getting revenue by gallery:', error);
      throw error;
    }
  }

  /**
   * Get period date boundaries
   * @private
   */
  private getPeriodDates(period: AnalyticsPeriod): {
    startDate: string | null;
    previousStartDate: string | null;
    previousEndDate: string | null;
  } {
    const now = new Date();
    let startDate: Date | null = null;
    let previousStartDate: Date | null = null;
    let previousEndDate: Date | null = null;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate = new Date(startDate);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        previousEndDate = new Date(startDate);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate = new Date(startDate);
        break;
      case 'all':
        // No date filter
        break;
    }

    return {
      startDate: startDate?.toISOString() || null,
      previousStartDate: previousStartDate?.toISOString() || null,
      previousEndDate: previousEndDate?.toISOString() || null,
    };
  }

  /**
   * Get grouping interval based on period
   * @private
   */
  private getGroupByInterval(range: AnalyticsPeriod): 'hour' | 'day' | 'week' | 'month' {
    switch (range) {
      case 'today':
        return 'hour';
      case 'week':
        return 'day';
      case 'month':
        return 'day';
      case 'quarter':
        return 'week';
      case 'year':
      case 'all':
        return 'month';
    }
  }

  /**
   * Group purchase data by time interval
   * @private
   */
  private groupDataByInterval(
    data: Array<{ amount_cents: number; created_at: string }>,
    interval: 'hour' | 'day' | 'week' | 'month'
  ): ChartDataPoint[] {
    const grouped = new Map<string, { revenue: number; sales: number }>();

    for (const item of data) {
      const date = new Date(item.created_at);
      let key: string;

      switch (interval) {
        case 'hour':
          key = `${date.toISOString().slice(0, 13)}:00`;
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          // Get start of week (Sunday)
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
      }

      const existing = grouped.get(key) || { revenue: 0, sales: 0 };
      existing.revenue += item.amount_cents;
      existing.sales += 1;
      grouped.set(key, existing);
    }

    // Convert to array and sort by date
    return Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        sales: stats.sales,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

/**
 * Factory function to create a RevenueService instance
 */
export function createRevenueService(supabase: SupabaseClient): RevenueService {
  return new RevenueService(supabase);
}
