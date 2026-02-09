/**
 * Sender Address Repository
 * Data access layer for managing verified sender email addresses
 * 
 * Requirements: 2.8, 2.9
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError } from '@/lib/errors';

type SenderAddressRow = Database['public']['Tables']['sender_addresses']['Row'];
type SenderAddressInsert = Database['public']['Tables']['sender_addresses']['Insert'];
type SenderAddressUpdate = Database['public']['Tables']['sender_addresses']['Update'];

export interface DomainRecords {
  dkim: {
    name: string;
    value: string;
    type: string;
  }[];
  spf?: {
    name: string;
    value: string;
    type: string;
  };
  dmarc?: {
    name: string;
    value: string;
    type: string;
  };
}

export interface ISenderAddressRepository {
  // Basic CRUD operations
  create(data: SenderAddressInsert): Promise<SenderAddressRow>;
  update(id: string, data: SenderAddressUpdate): Promise<SenderAddressRow>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<SenderAddressRow | null>;
  findByEmail(email: string): Promise<SenderAddressRow | null>;
  
  // Specialized queries
  findAll(): Promise<SenderAddressRow[]>;
  updateVerificationStatus(id: string, isVerified: boolean, domainRecords?: DomainRecords): Promise<void>;
  setDefault(id: string): Promise<void>;
  getDefault(): Promise<SenderAddressRow | null>;
}

export class SenderAddressRepository implements ISenderAddressRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new sender address
   * Requirements: 2.8
   */
  async create(data: SenderAddressInsert): Promise<SenderAddressRow> {
    const { data: senderAddress, error } = await this.supabase
      .from('sender_addresses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return senderAddress;
  }

  /**
   * Update an existing sender address
   * Requirements: 2.8
   */
  async update(id: string, data: SenderAddressUpdate): Promise<SenderAddressRow> {
    const { data: senderAddress, error } = await this.supabase
      .from('sender_addresses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Sender address');
      }
      throw error;
    }

    return senderAddress;
  }

  /**
   * Delete a sender address
   * Requirements: 2.8
   */
  async delete(id: string): Promise<void> {
    // Check if this is the only verified sender
    const { count: verifiedCount, error: countError } = await this.supabase
      .from('sender_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    if (countError) throw countError;

    // Check if the sender to delete is verified
    const { data: senderToDelete, error: fetchError } = await this.supabase
      .from('sender_addresses')
      .select('is_verified')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Sender address');
      }
      throw fetchError;
    }

    // Prevent deletion if it's the only verified sender
    if (senderToDelete.is_verified && (verifiedCount || 0) <= 1) {
      throw new Error('Cannot delete the only verified sender address');
    }

    const { error } = await this.supabase
      .from('sender_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Find sender address by ID
   * Requirements: 2.8
   */
  async findById(id: string): Promise<SenderAddressRow | null> {
    const { data, error } = await this.supabase
      .from('sender_addresses')
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
   * Find sender address by email
   * Requirements: 2.8
   */
  async findByEmail(email: string): Promise<SenderAddressRow | null> {
    const { data, error } = await this.supabase
      .from('sender_addresses')
      .select('*')
      .eq('email', email)
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
   * Get all sender addresses
   * Requirements: 2.8
   */
  async findAll(): Promise<SenderAddressRow[]> {
    const { data, error } = await this.supabase
      .from('sender_addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update verification status of a sender address
   * Requirements: 2.9
   */
  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
    domainRecords?: DomainRecords
  ): Promise<void> {
    const updateData: SenderAddressUpdate = {
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
    };

    if (domainRecords) {
      updateData.domain_records = domainRecords as any;
    }

    const { error } = await this.supabase
      .from('sender_addresses')
      .update(updateData)
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Sender address');
      }
      throw error;
    }
  }

  /**
   * Set a sender address as the default
   * This will automatically unset any other default sender (handled by database trigger)
   * Requirements: 2.9
   */
  async setDefault(id: string): Promise<void> {
    // Verify the sender exists and is verified
    const sender = await this.findById(id);
    if (!sender) {
      throw new NotFoundError('Sender address');
    }

    if (!sender.is_verified) {
      throw new Error('Cannot set unverified sender as default');
    }

    // Set as default (database trigger will handle unsetting others)
    const { error } = await this.supabase
      .from('sender_addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get the default sender address
   * Requirements: 2.9
   */
  async getDefault(): Promise<SenderAddressRow | null> {
    const { data, error } = await this.supabase
      .from('sender_addresses')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }
}

/**
 * Factory function to create a SenderAddressRepository instance
 */
export function createSenderAddressRepository(
  supabase: SupabaseClient<Database>
): ISenderAddressRepository {
  return new SenderAddressRepository(supabase);
}
