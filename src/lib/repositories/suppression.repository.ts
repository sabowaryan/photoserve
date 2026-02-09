/**
 * Suppression Repository
 * Data access layer for managing email suppressions (bounces and complaints)
 * 
 * Requirements: 8.7, 8.8
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type SuppressionRow = Database['public']['Tables']['email_suppressions']['Row'];
type SuppressionInsert = Database['public']['Tables']['email_suppressions']['Insert'];

export interface SuppressionFilters {
  reason?: 'bounce' | 'complaint' | 'all';
  bounceType?: 'hard' | 'soft' | 'all';
  search?: string;
}

export interface PaginatedSuppressions {
  suppressions: SuppressionRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SuppressionStats {
  total: number;
  bounces: number;
  hardBounces: number;
  softBounces: number;
  complaints: number;
}

export interface ISuppressionRepository {
  // Query operations
  listSuppressions(
    filters?: SuppressionFilters,
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedSuppressions>;
  
  getSuppressionById(id: string): Promise<SuppressionRow | null>;
  
  getSuppressionByEmail(email: string): Promise<SuppressionRow | null>;
  
  // Mutation operations
  addSuppression(data: SuppressionInsert): Promise<SuppressionRow>;
  
  removeSuppression(id: string): Promise<void>;
  
  removeSuppressions(ids: string[]): Promise<void>;
  
  // Statistics
  getStats(): Promise<SuppressionStats>;
}

export class SuppressionRepository implements ISuppressionRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List suppressions with filtering, pagination, and sorting
   * Requirements: 8.7
   */
  async listSuppressions(
    filters?: SuppressionFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'last_occurred_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedSuppressions> {
    // Build the query
    let query = this.supabase
      .from('email_suppressions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.reason && filters.reason !== 'all') {
      query = query.eq('reason', filters.reason);
    }

    if (filters?.bounceType && filters.bounceType !== 'all') {
      query = query.eq('bounce_type', filters.bounceType);
    }

    if (filters?.search) {
      query = query.ilike('email', `%${filters.search}%`);
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
      suppressions: data || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get a single suppression by ID
   * Requirements: 8.7
   */
  async getSuppressionById(id: string): Promise<SuppressionRow | null> {
    const { data, error } = await this.supabase
      .from('email_suppressions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get a suppression by email address
   * Requirements: 8.7
   */
  async getSuppressionByEmail(email: string): Promise<SuppressionRow | null> {
    const { data, error } = await this.supabase
      .from('email_suppressions')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Add a new suppression
   * Requirements: 8.8
   */
  async addSuppression(data: SuppressionInsert): Promise<SuppressionRow> {
    const { data: suppression, error } = await this.supabase
      .from('email_suppressions')
      .insert({
        ...data,
        email: data.email.toLowerCase(),
      })
      .select()
      .single();

    if (error) throw error;
    return suppression;
  }

  /**
   * Remove a suppression by ID
   * Requirements: 8.8
   */
  async removeSuppression(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_suppressions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Remove multiple suppressions by IDs (bulk action)
   * Requirements: 8.8
   */
  async removeSuppressions(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('email_suppressions')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Get suppression statistics
   * Requirements: 8.7
   */
  async getStats(): Promise<SuppressionStats> {
    const { data, error } = await this.supabase
      .from('email_suppressions')
      .select('reason, bounce_type');

    if (error) throw error;

    const suppressions = data || [];
    
    const bounces = suppressions.filter(s => s.reason === 'bounce');
    const hardBounces = bounces.filter(s => s.bounce_type === 'hard');
    const softBounces = bounces.filter(s => s.bounce_type === 'soft');
    const complaints = suppressions.filter(s => s.reason === 'complaint');

    return {
      total: suppressions.length,
      bounces: bounces.length,
      hardBounces: hardBounces.length,
      softBounces: softBounces.length,
      complaints: complaints.length,
    };
  }
}

/**
 * Factory function to create a SuppressionRepository instance
 */
export function createSuppressionRepository(
  supabase: SupabaseClient<Database>
): ISuppressionRepository {
  return new SuppressionRepository(supabase);
}
