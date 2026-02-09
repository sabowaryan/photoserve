/**
 * Email Log Repository
 * Data access layer for managing email logs with filtering and pagination
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type EmailLogRow = Database['public']['Tables']['email_logs']['Row'];
type EmailEventRow = Database['public']['Tables']['email_events']['Row'];

export interface EmailLogFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  recipient?: string;
  sender?: string;
  templateId?: string;
}

export interface EmailLogWithEvents extends EmailLogRow {
  events?: EmailEventRow[];
}

export interface PaginatedEmailLogs {
  logs: EmailLogWithEvents[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IEmailLogRepository {
  // Query operations
  listLogs(
    filters?: EmailLogFilters,
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedEmailLogs>;
  
  getLogById(id: string): Promise<EmailLogWithEvents | null>;
  
  getLogEvents(logId: string): Promise<EmailEventRow[]>;
  
  // Statistics
  getLogStats(filters?: EmailLogFilters): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  }>;
}

export class EmailLogRepository implements IEmailLogRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List email logs with filtering, pagination, and sorting
   * Requirements: 8.1, 8.2
   */
  async listLogs(
    filters?: EmailLogFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedEmailLogs> {
    // Build the query
    let query = this.supabase
      .from('email_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    if (filters?.recipient) {
      query = query.ilike('to_address', `%${filters.recipient}%`);
    }

    if (filters?.sender) {
      query = query.ilike('from_address', `%${filters.sender}%`);
    }

    if (filters?.templateId) {
      query = query.eq('template_id', filters.templateId);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      logs: data || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get a single email log by ID with its events
   * Requirements: 8.3
   */
  async getLogById(id: string): Promise<EmailLogWithEvents | null> {
    const { data: log, error: logError } = await this.supabase
      .from('email_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (logError) {
      if (logError.code === 'PGRST116') {
        return null;
      }
      throw logError;
    }

    // Fetch events for this log
    const events = await this.getLogEvents(id);

    return {
      ...log,
      events,
    };
  }

  /**
   * Get all events for a specific email log
   * Requirements: 8.3
   */
  async getLogEvents(logId: string): Promise<EmailEventRow[]> {
    const { data, error } = await this.supabase
      .from('email_events')
      .select('*')
      .eq('log_id', logId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get statistics for email logs
   * Requirements: 8.2
   */
  async getLogStats(filters?: EmailLogFilters): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  }> {
    let query = this.supabase
      .from('email_logs')
      .select('status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, failed_at');

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    if (filters?.recipient) {
      query = query.ilike('to_address', `%${filters.recipient}%`);
    }

    if (filters?.sender) {
      query = query.ilike('from_address', `%${filters.sender}%`);
    }

    if (filters?.templateId) {
      query = query.eq('template_id', filters.templateId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const logs = data || [];
    
    return {
      total: logs.length,
      sent: logs.filter(l => l.sent_at !== null).length,
      delivered: logs.filter(l => l.delivered_at !== null).length,
      opened: logs.filter(l => l.opened_at !== null).length,
      clicked: logs.filter(l => l.clicked_at !== null).length,
      bounced: logs.filter(l => l.bounced_at !== null).length,
      failed: logs.filter(l => l.failed_at !== null).length,
    };
  }
}

/**
 * Factory function to create an EmailLogRepository instance
 */
export function createEmailLogRepository(
  supabase: SupabaseClient<Database>
): IEmailLogRepository {
  return new EmailLogRepository(supabase);
}
