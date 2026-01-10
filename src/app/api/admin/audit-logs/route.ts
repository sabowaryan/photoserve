/**
 * Admin Audit Logs API Route
 * GET - List audit logs with filtering
 * 
 * @module app/api/admin/audit-logs/route
 * Requirements: 7.1, 7.2, 7.3
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAuditLogService } from '@/lib/services/audit-log.service';
import type { AuditLogFilters, AuditActionType, AuditEntityType } from '@/types/admin';

const VALID_ACTION_TYPES: AuditActionType[] = [
  'user_view',
  'user_update',
  'user_suspend',
  'user_reactivate',
  'gallery_view',
  'gallery_deactivate',
  'gallery_delete',
  'subscription_update',
  'subscription_cancel',
  'admin_login',
];

const VALID_ENTITY_TYPES: AuditEntityType[] = ['user', 'gallery', 'subscription', 'system'];

/**
 * GET /api/admin/audit-logs
 * List audit logs with filtering and pagination
 * 
 * Query Parameters:
 * - adminId: Filter by admin user ID
 * - actionType: Filter by action type
 * - entityType: Filter by entity type
 * - entityId: Filter by entity ID
 * - dateFrom: Filter by date (from)
 * - dateTo: Filter by date (to)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
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
    const auditLogService = createAuditLogService(supabase);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const actionType = searchParams.get('actionType') as AuditActionType | null;
    const entityType = searchParams.get('entityType') as AuditEntityType | null;

    // Validate action type if provided
    if (actionType && !VALID_ACTION_TYPES.includes(actionType)) {
      return createApiResponse(
        { error: 'Invalid action type' },
        400
      );
    }

    // Validate entity type if provided
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      return createApiResponse(
        { error: 'Invalid entity type' },
        400
      );
    }

    const filters: AuditLogFilters = {
      adminId: searchParams.get('adminId') || undefined,
      actionType: actionType || undefined,
      entityType: entityType || undefined,
      entityId: searchParams.get('entityId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
    };

    const result = await auditLogService.list(filters);

    return createApiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
