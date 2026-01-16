/**
 * Audit Log Repository
 * Data access layer for audit logs
 * 
 * Requirements: 7.1, 7.3
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { 
  AuditLog, 
  AuditLogWithAdmin, 
  AuditLogFilters,
  PaginatedResult,
  AuditActionType,
  AuditEntityType
} from '@/types/admin';

// Type for inserting audit logs
type AuditLogInsert = {
  admin_id: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string | null;
  details: any; // Use any for JSON compatibility with Supabase
  ip_address: string | null;
};

export interface IAuditLogRepository {
  create(log: AuditLogInsert): Promise<AuditLog>;
  list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLogWithAdmin>>;
  getByEntityId(entityId: string): Promise<AuditLogWithAdmin[]>;
}

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new audit log entry
   * Requirements: 7.1
   */
  async create(log: AuditLogInsert): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      admin_id: data.admin_id,
      action_type: data.action_type,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      details: data.details as Record<string, unknown>,
      ip_address: data.ip_address,
      created_at: data.created_at || new Date().toISOString(),
    };
  }

  /**
   * List audit logs with filtering and pagination
   * Requirements: 7.3
   */
  async list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLogWithAdmin>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build query with joins to get admin info
    let query = this.supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!audit_logs_admin_id_fkey (
          email,
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }

    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const logs: AuditLogWithAdmin[] = (data || []).map((row) => ({
      id: row.id,
      admin_id: row.admin_id,
      action_type: row.action_type,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      details: row.details as Record<string, unknown>,
      ip_address: row.ip_address,
      created_at: row.created_at || new Date().toISOString(),
      admin_email: (row.profiles as { email: string; name: string | null } | null)?.email,
      admin_name: (row.profiles as { email: string; name: string | null } | null)?.name,
    }));

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs for a specific entity
   * Requirements: 7.1
   */
  async getByEntityId(entityId: string): Promise<AuditLogWithAdmin[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!audit_logs_admin_id_fkey (
          email,
          name
        )
      `)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      admin_id: row.admin_id,
      action_type: row.action_type,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      details: row.details as Record<string, unknown>,
      ip_address: row.ip_address,
      created_at: row.created_at || new Date().toISOString(),
      admin_email: (row.profiles as { email: string; name: string | null } | null)?.email,
      admin_name: (row.profiles as { email: string; name: string | null } | null)?.name,
    }));
  }
}

/**
 * Factory function to create an AuditLogRepository instance
 */
export function createAuditLogRepository(
  supabase: SupabaseClient<Database>
): IAuditLogRepository {
  return new AuditLogRepository(supabase);
}
