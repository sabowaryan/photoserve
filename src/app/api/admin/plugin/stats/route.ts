/**
 * Admin Plugin Statistics API Route
 * GET - Get plugin usage statistics (admin only)
 * 
 * @module app/api/admin/plugin/stats/route
 * Requirements: 10.8, 10.9, 11.5, 11.6, 11.7, 11.8
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { usageTrackingService, type DateRange } from '@/lib/services/usage-tracking.service';
import { dateRangeQuerySchema } from '@/lib/validators/plugin.schemas';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';

/**
 * GET /api/admin/plugin/stats
 * Get plugin usage statistics (admin only)
 * 
 * Query Parameters:
 * - startDate: ISO 8601 date string (optional)
 * - endDate: ISO 8601 date string (optional)
 * 
 * Returns:
 * - totalActions: Total number of plugin actions
 * - uniqueUsers: Number of unique users who used the plugin
 * - actionBreakdown: Object with action types as keys and counts as values
 * - versionDistribution: Object with plugin versions as keys and counts as values
 * 
 * Requirements:
 * - 10.8: Display usage statistics including active users and popular actions
 * - 10.9: Provide date range filtering for usage logs
 * - 11.5: Display number of active users in the last 30 days
 * - 11.6: Display most common actions performed
 * - 11.7: Display distribution of plugin versions in use
 * - 11.8: Display distribution of Lightroom versions
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate query parameters
    const validationResult = dateRangeQuerySchema.safeParse({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return createApiResponse(
        { error: firstError?.message || 'Invalid query parameters' },
        400
      );
    }

    // Build date range if provided
    let dateRange: DateRange | undefined;
    if (startDate && endDate) {
      dateRange = {
        startDate,
        endDate,
      };
    }

    // Get global statistics from usage tracking service
    const stats = await usageTrackingService.getGlobalStats(dateRange);
    
    // Log admin action
    const requestMetadata = extractRequestMetadata(request);
    SecurityLogger.logAdminAction('stats_accessed', authResult.userId!, {
      ...requestMetadata,
      details: {
        dateRange: dateRange || 'all_time',
      },
    });

    return createApiResponse({
      totalActions: stats.totalActions,
      uniqueUsers: stats.uniqueUsers,
      actionBreakdown: stats.actionBreakdown,
      versionDistribution: stats.versionDistribution,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
