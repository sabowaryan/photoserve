/**
 * Audit Log Service
 * Business logic for audit logging operations
 * 
 * Requirements: 7.1, 7.2, 7.3
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AuditActionType, AuditEntityType } from '@/lib/supabase/types';
import {
  createAuditLogRepository,
  type IAuditLogRepository,
} from '@/lib/repositories/audit-log.repository';
import type {
  AuditLog,
  AuditLogWithAdmin,
  AuditLogFilters,
  PaginatedResult,
} from '@/types/admin';

export interface IAuditLogService {
  log(
    adminId: string,
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityId: string | null,
    details: Record<string, unknown>,
    ipAddress?: string | null
  ): Promise<AuditLog>;
  list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLogWithAdmin>>;
  getByEntityId(entityId: string): Promise<AuditLogWithAdmin[]>;
}

export class AuditLogService implements IAuditLogService {
  private auditLogRepository: IAuditLogRepository;

  constructor(
    supabase: SupabaseClient<Database>,
    auditLogRepo?: IAuditLogRepository
  ) {
    this.auditLogRepository = auditLogRepo || createAuditLogRepository(supabase);
  }

  /**
   * Create a new audit log entry
   * Requirements: 7.1, 7.2
   * 
   * @param adminId - The ID of the admin performing the action
   * @param actionType - The type of action being performed
   * @param entityType - The type of entity being affected
   * @param entityId - The ID of the affected entity (null for system-wide actions)
   * @param details - Additional details about the action
   * @param ipAddress - The IP address of the admin (optional)
   */
  async log(
    adminId: string,
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityId: string | null,
    details: Record<string, unknown>,
    ipAddress?: string | null
  ): Promise<AuditLog> {
    return this.auditLogRepository.create({
      admin_id: adminId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      details: details as any,
      ip_address: ipAddress ?? null,
    });
  }

  /**
   * List audit logs with filtering and pagination
   * Requirements: 7.1, 7.2, 7.3
   * 
   * @param filters - Filtering and pagination options
   */
  async list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLogWithAdmin>> {
    // Set default pagination values
    const normalizedFilters: AuditLogFilters = {
      ...filters,
      page: filters.page || 1,
      limit: Math.min(filters.limit || 20, 100), // Cap at 100 items per page
    };

    return this.auditLogRepository.list(normalizedFilters);
  }

  /**
   * Get all audit logs for a specific entity
   * Requirements: 7.1
   * 
   * @param entityId - The ID of the entity to get logs for
   */
  async getByEntityId(entityId: string): Promise<AuditLogWithAdmin[]> {
    return this.auditLogRepository.getByEntityId(entityId);
  }
}

/**
 * Factory function to create an AuditLogService instance
 */
export function createAuditLogService(
  supabase: SupabaseClient<Database>,
  auditLogRepo?: IAuditLogRepository
): IAuditLogService {
  return new AuditLogService(supabase, auditLogRepo);
}
