/**
 * Revenue Service
 * Handles revenue analytics, sales data, and reporting for photographers
 * 
 * @module lib/services/revenue.service
 * Requirements: 5.1 - Revenue Service
 * Requirements: 11.1 - Caching Strategy (15 minute cache for revenue stats)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import {
  getCacheService,
  ICacheService,
  CACHE_TTL as CACHE_TTL_CONSTANTS,
  CACHE_PREFIX,
  buildCacheKey,
} from './cache.service';

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
 * Filters for detailed conversion funnel
 */
export interface ConversionFunnelFilters {
  galleryId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Filters for cohort analysis
 */
export interface CohortAnalysisFilters {
  startMonth?: string;
  endMonth?: string;
  monthsToAnalyze?: number;
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
  // Advanced Analytics Methods (Requirement 9.1, 9.2)
  getDetailedConversionFunnel(photographerId: string, filters?: ConversionFunnelFilters): Promise<DetailedConversionFunnel>;
  getCohortAnalysis(photographerId: string, filters?: CohortAnalysisFilters): Promise<CohortAnalysis>;
  getRevenueTrends(photographerId: string, period: AnalyticsPeriod): Promise<RevenueTrend[]>;
  getAdvancedAnalyticsSummary(photographerId: string): Promise<AdvancedAnalyticsSummary>;
}

/**
 * Revenue Service Implementation
 */
export class RevenueService implements IRevenueService {
  private cacheService: ICacheService;

  constructor(
    private supabase: SupabaseClient,
    cacheService?: ICacheService
  ) {
    this.cacheService = cacheService || getCacheService();
  }

  /**
   * Get revenue overview for a photographer
   * Requirements: 11.1 - Cache revenue statistics (15 minutes)
   */
  async getOverview(photographerId: string, period: AnalyticsPeriod): Promise<RevenueOverview> {
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_OVERVIEW, photographerId, period);
    const cached = await this.cacheService.get<RevenueOverview>(cacheKey);
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

      await this.cacheService.set(cacheKey, overview, CACHE_TTL_CONSTANTS.REVENUE_STATS);
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
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_CHART, photographerId, range);
    const cached = await this.cacheService.get<ChartDataPoint[]>(cacheKey);
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
      
      await this.cacheService.set(cacheKey, grouped, CACHE_TTL_CONSTANTS.REVENUE_STATS);
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
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_TOP_GALLERIES, photographerId, String(limit));
    const cached = await this.cacheService.get<TopGallery[]>(cacheKey);
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

      await this.cacheService.set(cacheKey, topGalleries, CACHE_TTL_CONSTANTS.REVENUE_STATS);
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
    const cacheKey = `${CACHE_PREFIX.REVENUE_FUNNEL}${photographerId}`;
    const cached = await this.cacheService.get<ConversionFunnel>(cacheKey);
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

      await this.cacheService.set(cacheKey, funnel, CACHE_TTL_CONSTANTS.REVENUE_STATS);
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
    const cacheKey = `${CACHE_PREFIX.REVENUE_BY_GALLERY}${photographerId}`;
    const cached = await this.cacheService.get<GalleryRevenue[]>(cacheKey);
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

      await this.cacheService.set(cacheKey, revenueByGallery, CACHE_TTL_CONSTANTS.REVENUE_STATS);
      return revenueByGallery;
    } catch (error) {
      console.error('[RevenueService] Error getting revenue by gallery:', error);
      throw error;
    }
  }

  /**
   * Get detailed conversion funnel with step-by-step metrics and drop-off analysis
   * Requirement 9.2: Sales Funnel (Views → Paywall → Checkout → Purchase)
   */
  async getDetailedConversionFunnel(
    photographerId: string,
    filters?: ConversionFunnelFilters
  ): Promise<DetailedConversionFunnel> {
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_DETAILED_FUNNEL, photographerId, JSON.stringify(filters || {}));
    const cached = await this.cacheService.get<DetailedConversionFunnel>(cacheKey);
    if (cached) return cached;

    try {
      // Build date filter
      const startDate = filters?.startDate || this.getDefaultStartDate();
      const endDate = filters?.endDate || new Date().toISOString();

      // Get gallery views - optimized with index hint on (photographer_id, event_type, created_at)
      let viewsQuery = this.supabase
        .from('gallery_events')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('event_type', 'view')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (filters?.galleryId) {
        viewsQuery = viewsQuery.eq('gallery_id', filters.galleryId);
      }

      const { count: views } = await viewsQuery;

      // Get paywall views
      let paywallQuery = this.supabase
        .from('gallery_events')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('event_type', 'paywall_view')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (filters?.galleryId) {
        paywallQuery = paywallQuery.eq('gallery_id', filters.galleryId);
      }

      const { count: paywallViews } = await paywallQuery;

      // Get checkout starts
      let checkoutQuery = this.supabase
        .from('gallery_events')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('event_type', 'checkout_start')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (filters?.galleryId) {
        checkoutQuery = checkoutQuery.eq('gallery_id', filters.galleryId);
      }

      const { count: checkoutStarts } = await checkoutQuery;

      // Get purchases
      let purchaseQuery = this.supabase
        .from('gallery_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (filters?.galleryId) {
        purchaseQuery = purchaseQuery.eq('gallery_id', filters.galleryId);
      }

      const { count: purchases } = await purchaseQuery;

      // Calculate conversion rates
      const viewCount = views || 0;
      const paywallCount = paywallViews || 0;
      const checkoutCount = checkoutStarts || 0;
      const purchaseCount = purchases || 0;

      const viewToPaywall = viewCount > 0 ? (paywallCount / viewCount) * 100 : 0;
      const paywallToCheckout = paywallCount > 0 ? (checkoutCount / paywallCount) * 100 : 0;
      const checkoutToPurchase = checkoutCount > 0 ? (purchaseCount / checkoutCount) * 100 : 0;
      const overall = viewCount > 0 ? (purchaseCount / viewCount) * 100 : 0;

      // Calculate drop-off points
      const dropOffPoints = [
        {
          step: 'View → Paywall',
          dropOffRate: this.roundToTwoDecimals(100 - viewToPaywall),
          count: viewCount - paywallCount,
        },
        {
          step: 'Paywall → Checkout',
          dropOffRate: this.roundToTwoDecimals(100 - paywallToCheckout),
          count: paywallCount - checkoutCount,
        },
        {
          step: 'Checkout → Purchase',
          dropOffRate: this.roundToTwoDecimals(100 - checkoutToPurchase),
          count: checkoutCount - purchaseCount,
        },
      ];

      const result: DetailedConversionFunnel = {
        views: viewCount,
        paywallViews: paywallCount,
        checkoutStarts: checkoutCount,
        purchases: purchaseCount,
        conversionRates: {
          viewToPaywall: this.roundToTwoDecimals(viewToPaywall),
          paywallToCheckout: this.roundToTwoDecimals(paywallToCheckout),
          checkoutToPurchase: this.roundToTwoDecimals(checkoutToPurchase),
          overall: this.roundToTwoDecimals(overall),
        },
        dropOffPoints,
        period: {
          startDate,
          endDate,
        },
      };

      await this.cacheService.set(cacheKey, result, CACHE_TTL_CONSTANTS.REVENUE_STATS);
      return result;
    } catch (error) {
      console.error('[RevenueService] Error getting detailed conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get cohort analysis for customer retention
   * Requirement 9.1: Revenue Analytics - detailed analytics for pricing optimization
   */
  async getCohortAnalysis(
    photographerId: string,
    filters?: CohortAnalysisFilters
  ): Promise<CohortAnalysis> {
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_COHORT, photographerId, JSON.stringify(filters || {}));
    const cached = await this.cacheService.get<CohortAnalysis>(cacheKey);
    if (cached) return cached;

    try {
      const monthsToAnalyze = filters?.monthsToAnalyze || 6;
      const endMonth = filters?.endMonth || new Date().toISOString().slice(0, 7);
      const startMonth = filters?.startMonth || this.getMonthsAgo(monthsToAnalyze);

      // Get all purchases within the date range - optimized with index on (photographer_id, status, created_at)
      const { data: purchases, error } = await this.supabase
        .from('gallery_purchases')
        .select('buyer_email, amount_cents, created_at')
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded')
        .gte('created_at', `${startMonth}-01`)
        .order('created_at', { ascending: true });

      if (error) {
        throw new AppError('Failed to fetch cohort data', 'COHORT_ANALYSIS_ERROR', 500);
      }

      // Group customers by their first purchase month (cohort)
      const customerCohorts = new Map<string, { firstPurchaseMonth: string; purchases: Array<{ month: string; amount: number }> }>();

      for (const purchase of purchases || []) {
        const email = purchase.buyer_email;
        const purchaseMonth = purchase.created_at.slice(0, 7);
        const amount = purchase.amount_cents || 0;

        if (!customerCohorts.has(email)) {
          customerCohorts.set(email, {
            firstPurchaseMonth: purchaseMonth,
            purchases: [],
          });
        }

        const customer = customerCohorts.get(email)!;
        customer.purchases.push({ month: purchaseMonth, amount });
      }

      // Build cohort data
      const cohortMap = new Map<string, CohortData>();

      for (const [, customer] of customerCohorts) {
        const cohortMonth = customer.firstPurchaseMonth;

        if (!cohortMap.has(cohortMonth)) {
          cohortMap.set(cohortMonth, {
            cohortMonth,
            totalCustomers: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            retentionByMonth: [],
          });
        }

        const cohort = cohortMap.get(cohortMonth)!;
        cohort.totalCustomers += 1;

        // Calculate retention by month offset
        const retentionMap = new Map<number, { customers: Set<string>; revenue: number }>();

        for (const purchase of customer.purchases) {
          const monthOffset = this.getMonthDifference(cohortMonth, purchase.month);
          cohort.totalRevenue += purchase.amount;

          if (!retentionMap.has(monthOffset)) {
            retentionMap.set(monthOffset, { customers: new Set(), revenue: 0 });
          }

          const retention = retentionMap.get(monthOffset)!;
          retention.customers.add(customer.firstPurchaseMonth + purchase.month);
          retention.revenue += purchase.amount;
        }
      }

      // Calculate retention rates for each cohort
      const cohorts: CohortData[] = [];
      let totalRetention = 0;
      let totalLifetimeValue = 0;
      let bestCohort = { month: '', revenue: 0 };

      for (const [cohortMonth, cohort] of cohortMap) {
        // Calculate average order value
        const totalPurchases = (purchases || []).filter(
          p => customerCohorts.get(p.buyer_email)?.firstPurchaseMonth === cohortMonth
        ).length;
        cohort.averageOrderValue = totalPurchases > 0 ? Math.round(cohort.totalRevenue / totalPurchases) : 0;

        // Build retention by month
        const maxMonths = Math.min(monthsToAnalyze, this.getMonthDifference(cohortMonth, endMonth) + 1);
        const retentionByMonth: CohortData['retentionByMonth'] = [];

        for (let month = 0; month < maxMonths; month++) {
          const monthPurchases = (purchases || []).filter(p => {
            const customer = customerCohorts.get(p.buyer_email);
            if (customer?.firstPurchaseMonth !== cohortMonth) return false;
            return this.getMonthDifference(cohortMonth, p.created_at.slice(0, 7)) === month;
          });

          const uniqueCustomers = new Set(monthPurchases.map(p => p.buyer_email)).size;
          const monthRevenue = monthPurchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
          const retentionRate = cohort.totalCustomers > 0 ? (uniqueCustomers / cohort.totalCustomers) * 100 : 0;

          retentionByMonth.push({
            month,
            customers: uniqueCustomers,
            revenue: monthRevenue,
            retentionRate: this.roundToTwoDecimals(retentionRate),
          });

          if (month > 0) {
            totalRetention += retentionRate;
          }
        }

        cohort.retentionByMonth = retentionByMonth;
        cohorts.push(cohort);

        // Track best performing cohort
        if (cohort.totalRevenue > bestCohort.revenue) {
          bestCohort = { month: cohortMonth, revenue: cohort.totalRevenue };
        }

        // Calculate lifetime value
        if (cohort.totalCustomers > 0) {
          totalLifetimeValue += cohort.totalRevenue / cohort.totalCustomers;
        }
      }

      // Sort cohorts by month
      cohorts.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));

      // Calculate summary
      const cohortCount = cohorts.length;
      const retentionPeriods = cohorts.reduce((sum, c) => sum + Math.max(0, c.retentionByMonth.length - 1), 0);

      const result: CohortAnalysis = {
        cohorts,
        summary: {
          averageRetention: retentionPeriods > 0 ? this.roundToTwoDecimals(totalRetention / retentionPeriods) : 0,
          averageLifetimeValue: cohortCount > 0 ? Math.round(totalLifetimeValue / cohortCount) : 0,
          bestPerformingCohort: bestCohort.month || 'N/A',
        },
      };

      await this.cacheService.set(cacheKey, result, CACHE_TTL_CONSTANTS.REVENUE_STATS);
      return result;
    } catch (error) {
      console.error('[RevenueService] Error getting cohort analysis:', error);
      throw error;
    }
  }

  /**
   * Get revenue trends with growth rates
   * Requirement 9.1: Revenue Analytics - trends, conversion rate
   */
  async getRevenueTrends(photographerId: string, period: AnalyticsPeriod): Promise<RevenueTrend[]> {
    const cacheKey = buildCacheKey(CACHE_PREFIX.REVENUE_TRENDS, photographerId, period);
    const cached = await this.cacheService.get<RevenueTrend[]>(cacheKey);
    if (cached) return cached;

    try {
      const { startDate } = this.getPeriodDates(period);
      const groupBy = this.getGroupByInterval(period);

      // Fetch purchases - optimized with index on (photographer_id, status, created_at)
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
        throw new AppError('Failed to fetch revenue trends', 'REVENUE_TRENDS_ERROR', 500);
      }

      // Group data by interval
      const grouped = new Map<string, { revenue: number; sales: number }>();

      for (const item of data || []) {
        const date = new Date(item.created_at);
        const key = this.getIntervalKey(date, groupBy);

        const existing = grouped.get(key) || { revenue: 0, sales: 0 };
        existing.revenue += item.amount_cents || 0;
        existing.sales += 1;
        grouped.set(key, existing);
      }

      // Convert to array and calculate growth rates
      const sortedKeys = Array.from(grouped.keys()).sort();
      const trends: RevenueTrend[] = [];

      for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i]!;
        const current = grouped.get(key)!;
        const previous = i > 0 ? grouped.get(sortedKeys[i - 1]!) : null;

        const growthRate = previous && previous.revenue > 0
          ? ((current.revenue - previous.revenue) / previous.revenue) * 100
          : 0;

        trends.push({
          period: key,
          revenue: current.revenue,
          sales: current.sales,
          averageOrderValue: current.sales > 0 ? Math.round(current.revenue / current.sales) : 0,
          growthRate: this.roundToTwoDecimals(growthRate),
        });
      }

      await this.cacheService.set(cacheKey, trends, CACHE_TTL_CONSTANTS.REVENUE_STATS);
      return trends;
    } catch (error) {
      console.error('[RevenueService] Error getting revenue trends:', error);
      throw error;
    }
  }

  /**
   * Get advanced analytics summary
   * Requirement 9.1: Revenue Analytics - Revenue per gallery, avg time to conversion, peak hours
   */
  async getAdvancedAnalyticsSummary(photographerId: string): Promise<AdvancedAnalyticsSummary> {
    const cacheKey = `${CACHE_PREFIX.REVENUE_ADVANCED_SUMMARY}${photographerId}`;
    const cached = await this.cacheService.get<AdvancedAnalyticsSummary>(cacheKey);
    if (cached) return cached;

    try {
      // Get total revenue and gallery count for revenue per gallery
      const { data: monetizationData } = await this.supabase
        .from('gallery_monetization')
        .select(`
          total_revenue_cents,
          galleries!inner(user_id)
        `)
        .eq('galleries.user_id', photographerId)
        .eq('is_enabled', true);

      const totalRevenue = (monetizationData || []).reduce(
        (sum, row) => sum + ((row.total_revenue_cents as number) || 0),
        0
      );
      const galleryCount = monetizationData?.length || 0;
      const revenuePerGallery = galleryCount > 0 ? Math.round(totalRevenue / galleryCount) : 0;

      // Get conversion rate from funnel
      const funnel = await this.getConversionFunnel(photographerId);
      const conversionRate = funnel.conversionRate;

      // Get average time to conversion (from first view to purchase)
      const { data: conversionTimeData } = await this.supabase
        .from('gallery_purchases')
        .select(`
          created_at,
          buyer_email,
          gallery_id
        `)
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(100);

      let totalConversionTime = 0;
      let conversionCount = 0;

      for (const purchase of conversionTimeData || []) {
        // Get first view for this buyer and gallery
        const { data: firstView } = await this.supabase
          .from('gallery_events')
          .select('created_at')
          .eq('gallery_id', purchase.gallery_id)
          .eq('event_type', 'view')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (firstView) {
          const viewTime = new Date(firstView.created_at).getTime();
          const purchaseTime = new Date(purchase.created_at).getTime();
          const timeDiff = purchaseTime - viewTime;

          if (timeDiff > 0) {
            totalConversionTime += timeDiff;
            conversionCount++;
          }
        }
      }

      // Convert to hours
      const averageTimeToConversion = conversionCount > 0
        ? Math.round((totalConversionTime / conversionCount) / (1000 * 60 * 60))
        : 0;

      // Get peak hour and top performing day
      const { data: purchasesByHour } = await this.supabase
        .from('gallery_purchases')
        .select('created_at')
        .eq('photographer_id', photographerId)
        .eq('status', 'succeeded');

      const hourCounts = new Map<number, number>();
      const dayCounts = new Map<string, number>();

      for (const purchase of purchasesByHour || []) {
        const date = new Date(purchase.created_at);
        const hour = date.getUTCHours();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];

        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        dayCounts.set(dayName!, (dayCounts.get(dayName!) || 0) + 1);
      }

      // Find peak hour
      let peakHour = 12; // Default to noon
      let maxHourCount = 0;
      for (const [hour, count] of hourCounts) {
        if (count > maxHourCount) {
          maxHourCount = count;
          peakHour = hour;
        }
      }

      // Find top performing day
      let topPerformingDay = 'Saturday'; // Default
      let maxDayCount = 0;
      for (const [day, count] of dayCounts) {
        if (count > maxDayCount) {
          maxDayCount = count;
          topPerformingDay = day;
        }
      }

      const result: AdvancedAnalyticsSummary = {
        revenuePerGallery,
        conversionRate,
        averageTimeToConversion,
        topPerformingDay,
        peakHour,
      };

      await this.cacheService.set(cacheKey, result, CACHE_TTL_CONSTANTS.REVENUE_STATS);
      return result;
    } catch (error) {
      console.error('[RevenueService] Error getting advanced analytics summary:', error);
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

  /**
   * Round number to two decimal places
   * @private
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Get default start date (30 days ago)
   * @private
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  /**
   * Get date string for N months ago
   * @private
   */
  private getMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().slice(0, 7);
  }

  /**
   * Calculate month difference between two YYYY-MM strings
   * @private
   */
  private getMonthDifference(startMonth: string, endMonth: string): number {
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    return (endYear! - startYear!) * 12 + (endMonthNum! - startMonthNum!);
  }

  /**
   * Get interval key for a date based on grouping
   * @private
   */
  private getIntervalKey(date: Date, interval: 'hour' | 'day' | 'week' | 'month'): string {
    switch (interval) {
      case 'hour':
        return `${date.toISOString().slice(0, 13)}:00`;
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'month':
        return date.toISOString().slice(0, 7);
    }
  }
}

/**
 * Factory function to create a RevenueService instance
 /**
 * Factory function to create a RevenueService instance
 */
export function createRevenueService(
  supabase: SupabaseClient,
  cacheService?: ICacheService
): RevenueService {
  return new RevenueService(supabase, cacheService);
}
