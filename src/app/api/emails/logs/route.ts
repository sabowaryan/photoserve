/**
 * Email Logs API Route
 * 
 * GET /api/emails/logs - List email logs with filters
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { listLogsSchema } from '@/lib/validators/email.schemas';

/**
 * GET /api/emails/logs
 * 
 * List email logs with optional filters
 * 
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - status?: 'queued' | 'pending' | 'processing' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed' | 'cancelled'
 * - from?: string (ISO 8601 datetime - date range start)
 * - to?: string (ISO 8601 datetime - date range end)
 * - recipient?: string (email address)
 * - templateId?: string (UUID)
 * 
 * Response:
 * - 200: { logs: EmailLog[], total: number, page: number, limit: number }
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
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit') || searchParams.get('pageSize'), // Support both limit and pageSize
      status: searchParams.get('status'),
      from: searchParams.get('from') || searchParams.get('dateFrom'), // Support both from and dateFrom
      to: searchParams.get('to') || searchParams.get('dateTo'), // Support both to and dateTo
      recipient: searchParams.get('recipient'),
      templateId: searchParams.get('templateId'),
    };
    
    const validatedQuery = listLogsSchema.parse(queryParams);
    
    // Create Supabase client
    const supabase = createAdminClient();
    
    // Build query with filters
    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status);
    }
    
    if (validatedQuery.from) {
      // Convert Date to ISO string for Supabase
      const fromDate = validatedQuery.from instanceof Date 
        ? validatedQuery.from.toISOString() 
        : validatedQuery.from;
      query = query.gte('created_at', fromDate);
    }
    
    if (validatedQuery.to) {
      // Convert Date to ISO string for Supabase
      const toDate = validatedQuery.to instanceof Date 
        ? validatedQuery.to.toISOString() 
        : validatedQuery.to;
      query = query.lte('created_at', toDate);
    }
    
    if (validatedQuery.recipient) {
      query = query.eq('to_address', validatedQuery.recipient);
    }
    
    if (validatedQuery.templateId) {
      query = query.eq('template_id', validatedQuery.templateId);
    }
    
    // Apply pagination
    const start = (validatedQuery.page - 1) * validatedQuery.limit;
    const end = start + validatedQuery.limit - 1;
    query = query.range(start, end);
    
    // Execute query
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return createApiResponse({
      logs: logs || [],
      total: count || 0,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages: Math.ceil((count || 0) / validatedQuery.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
