/**
 * Admin Plugin Usage Logs API Route
 * GET - Get plugin usage logs with filtering (admin only)
 * 
 * @module app/api/admin/plugin/usage-logs/route
 * Requirements: 10.9
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Query parameter validation schema
 */
const queryParamsSchema = z.object({
  startDate: z.string().datetime('Start date must be in ISO 8601 format').optional(),
  endDate: z.string().datetime('End date must be in ISO 8601 format').optional(),
  userId: z.string().uuid('User ID must be a valid UUID').optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * GET /api/admin/plugin/usage-logs
 * Get plugin usage logs with filtering (admin only)
 * 
 * Query Parameters:
 * - startDate: ISO 8601 date string (optional)
 * - endDate: ISO 8601 date string (optional)
 * - userId: UUID string (optional)
 * - action: Action type string (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * 
 * Returns:
 * - logs: Array of usage log objects
 * - total: Total number of logs matching filters
 * - page: Current page number
 * - limit: Items per page
 * - totalPages: Total number of pages
 * 
 * Requirements:
 * - 10.9: Provide filtering by date range, user, and action type
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
    const params = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    };

    // Validate query parameters
    const validationResult = queryParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return createApiResponse(
        { error: firstError?.message || 'Invalid query parameters' },
        400
      );
    }

    const { startDate, endDate, userId, action, page, limit } = validationResult.data;

    // Create Supabase admin client
    const supabase = await createAdminClient();

    // Build query - Try to join with profiles, but handle if relationship doesn't exist
    let query = supabase
      .from('plugin_usage_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: logs, error: queryError, count } = await query;

    if (queryError) {
      console.error('[UsageLogs] Query error:', queryError);
      throw new Error('Failed to fetch usage logs');
    }

    // Fetch user profiles separately if logs exist
    let enrichedLogs = logs || [];
    if (logs && logs.length > 0) {
      const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        // Create a map of user profiles
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Enrich logs with profile data
        enrichedLogs = logs.map(log => ({
          ...log,
          profiles: log.user_id ? profileMap.get(log.user_id) || null : null,
        }));
      }
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return createApiResponse({
      logs: enrichedLogs,
      total: count || 0,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
