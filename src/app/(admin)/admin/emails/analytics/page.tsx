import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/email-analytics.service";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsContent } from "./analytics-content";

/**
 * Loading skeleton for analytics page
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Date range selector skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
      
      {/* Tables skeleton */}
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/**
 * Fetch initial analytics data
 */
async function getInitialAnalytics() {
  const supabase = createAdminClient();
  const analyticsService = new AnalyticsService(supabase);

  try {
    // Default to last 7 days
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);

    const dateRange = { from, to };

    // Fetch system analytics
    const systemAnalytics = await analyticsService.getSystemAnalytics(dateRange);

    return {
      systemAnalytics,
      dateRange,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      systemAnalytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        deliveryRate: 0,
        uniqueTemplates: 0,
        uniqueSenders: 0,
        averagePerDay: 0,
      },
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    };
  }
}

/**
 * Analytics content wrapper
 */
async function AnalyticsWrapper() {
  const initialData = await getInitialAnalytics();

  return <AnalyticsContent initialData={initialData} />;
}

/**
 * Email Analytics Page
 * 
 * Provides comprehensive email performance analytics including:
 * - Summary cards (sent, delivered, opened, clicked, bounced)
 * - Email volume chart (time series)
 * - Open rate and click rate charts
 * - Template performance comparison table
 * - Sender performance metrics
 * - Date range selector (last 7 days, 30 days, 90 days, custom)
 * - Export functionality (CSV, JSON)
 * 
 * Requirements: 8.4, 8.5, 8.6
 */
export default function EmailAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsWrapper />
    </Suspense>
  );
}
