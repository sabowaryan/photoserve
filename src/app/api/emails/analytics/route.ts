/**
 * Email Analytics API Route
 * 
 * GET /api/emails/analytics - Get email analytics data
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';
import { AnalyticsService } from '@/lib/services/email-analytics.service';
import { analyticsQuerySchema } from '@/lib/validators/email.schemas';

/**
 * GET /api/emails/analytics
 * 
 * Get email analytics data with optional filters
 * 
 * Query parameters:
 * - from: string (ISO 8601 datetime - required)
 * - to: string (ISO 8601 datetime - required)
 * - templateId?: string (UUID - optional)
 * - senderEmail?: string (email address - optional)
 * - groupBy?: 'day' | 'week' | 'month' (optional)
 * 
 * Response:
 * - 200: Analytics data (format depends on filters)
 *   - If templateId provided: TemplateAnalytics
 *   - If senderEmail provided: SenderAnalytics
 *   - Otherwise: SystemAnalytics
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 429: Rate limit exceeded
 * - 500: Internal server error
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
    
    // Apply rate limiting (100 requests per minute)
    const rateLimitResponse = rateLimitMiddleware(request, {
      requestsPerMinute: 100,
      burstLimit: 10,
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      templateId: searchParams.get('templateId'),
      senderEmail: searchParams.get('senderEmail'),
      groupBy: searchParams.get('groupBy'),
    };
    
    const validatedQuery = analyticsQuerySchema.parse(queryParams);
    
    // Create analytics service
    const supabase = createAdminClient();
    const analyticsService = new AnalyticsService(supabase);
    
    // Build date range
    const dateRange = {
      from: new Date(validatedQuery.from),
      to: new Date(validatedQuery.to),
    };
    
    // Get analytics based on filters
    let analytics;
    
    if (validatedQuery.templateId) {
      // Get template-specific analytics
      analytics = await analyticsService.getTemplateAnalytics(
        validatedQuery.templateId,
        dateRange
      );
    } else if (validatedQuery.senderEmail) {
      // Get sender-specific analytics
      analytics = await analyticsService.getSenderAnalytics(
        validatedQuery.senderEmail,
        dateRange
      );
    } else {
      // Get system-wide analytics
      analytics = await analyticsService.getSystemAnalytics(dateRange);
    }
    
    return createApiResponse({
      analytics,
      dateRange: {
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      filters: {
        templateId: validatedQuery.templateId,
        senderEmail: validatedQuery.senderEmail,
        groupBy: validatedQuery.groupBy,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
