/**
 * Admin Analytics API Route
 * GET - Get analytics data with date range filtering
 * 
 * @module app/api/admin/analytics/route
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import { ValidationError } from '@/lib/errors';

/**
 * GET /api/admin/analytics
 * Get analytics data with date range filtering
 * 
 * Query Parameters:
 * - dateFrom: Start date (ISO format, required)
 * - dateTo: End date (ISO format, required)
 * 
 * Returns:
 * - userGrowth: User growth over time
 * - storageGrowth: Storage consumption trends
 * - subscriptionConversions: Conversion rates between plans
 * - topUsers: Most active users by gallery count and storage
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

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Validate date parameters
    if (!dateFrom || !dateTo) {
      throw new ValidationError('dateFrom and dateTo are required');
    }

    // Validate date format
    const dateFromParsed = new Date(dateFrom);
    const dateToParsed = new Date(dateTo);

    if (isNaN(dateFromParsed.getTime()) || isNaN(dateToParsed.getTime())) {
      throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)');
    }

    if (dateFromParsed > dateToParsed) {
      throw new ValidationError('dateFrom must be before dateTo');
    }

    const analytics = await adminService.getAnalytics(dateFrom, dateTo);

    return createApiResponse({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
