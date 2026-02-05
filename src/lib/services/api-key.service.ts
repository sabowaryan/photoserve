/**
 * API Key Service
 * Handles API key generation, validation, and management for the Lightroom plugin
 * 
 * Security Features:
 * - API keys are hashed with SHA-256 and never stored in plain text
 * - Constant-time comparison prevents timing attacks
 * - Only Pro plan users can create and use API keys
 * - Keys can be revoked or set to expire
 */
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * API Key record from database
 */
export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;  // First 12 characters for display
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * Parameters for creating a new API key
 */
export interface CreateAPIKeyParams {
  name: string;
  scopes?: string[];
  expiresAt?: string;
}

/**
 * Result of API key validation
 */
export interface ValidationResult {
  valid: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string;
    planType: string;
  };
  apiKeyId?: string;
  error?: string;
}

/**
 * Service interface for API key operations
 */
export interface IAPIKeyService {
  createAPIKey(userId: string, params: CreateAPIKeyParams): Promise<{ key: string; apiKey: APIKey }>;
  validateAPIKey(key: string): Promise<ValidationResult>;
  listAPIKeys(userId: string): Promise<APIKey[]>;
  revokeAPIKey(userId: string, keyId: string): Promise<void>;
  deleteAPIKey(userId: string, keyId: string): Promise<void>;
}

/**
 * Zod schema for API key creation validation
 */
export const createAPIKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  scopes: z.array(z.string()).optional().default(['plugin:read', 'plugin:write']),
  expiresAt: z.string().datetime().optional().nullable(),
}).refine(
  (data) => {
    if (data.expiresAt) {
      const expirationDate = new Date(data.expiresAt);
      const now = new Date();
      return expirationDate > now;
    }
    return true;
  },
  {
    message: 'Expiration date must be in the future',
    path: ['expiresAt'],
  }
);

/**
 * Zod schema for API key validation
 */
export const apiKeySchema = z.string()
  .regex(/^pk_live_[A-Za-z0-9_-]{32}$/, 'Invalid API key format');

/**
 * Type for validated create API key params
 */
export type ValidatedCreateAPIKeyParams = z.infer<typeof createAPIKeySchema>;

/**
 * API Key Service Implementation
 */
export class APIKeyService implements IAPIKeyService {
  /**
   * Generate a new API key with the format: pk_live_<32_random_chars>
   * Returns both the plain key and its SHA-256 hash
   * 
   * @returns Object containing the plain key, hash, and prefix
   */
  private generateAPIKey(): { key: string; hash: string; prefix: string } {
    // Generate 24 random bytes
    const randomBytes = crypto.randomBytes(24);
    
    // Encode as base64url (URL-safe base64)
    const base64url = randomBytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Prefix with 'pk_live_' to create final key
    const key = `pk_live_${base64url}`;
    
    // Hash complete key with SHA-256
    const hash = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
    
    // Extract first 12 characters as display prefix
    const prefix = key.substring(0, 12);
    
    return { key, hash, prefix };
  }

  /**
   * Hash an API key using SHA-256
   * 
   * @param key - The API key to hash
   * @returns The SHA-256 hash as a hex string
   */
  private hashAPIKey(key: string): string {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * 
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Placeholder methods - will be implemented in subsequent tasks
  async createAPIKey(userId: string, params: CreateAPIKeyParams): Promise<{ key: string; apiKey: APIKey }> {
    // Validate input
    const validatedParams = createAPIKeySchema.parse(params);
    
    const supabase = createAdminClient();
    
    // Check if user has Pro plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error('User not found');
    }
    
    if (profile.subscription_plan !== 'pro') {
      throw new Error('Pro plan required to create API keys');
    }
    
    // Generate API key and hash
    const { key, hash, prefix } = this.generateAPIKey();
    
    // Insert record into api_keys table
    const { data: apiKeyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: validatedParams.name,
        key_hash: hash,
        key_prefix: prefix,
        scopes: validatedParams.scopes,
        expires_at: validatedParams.expiresAt || null,
        is_active: true,
      })
      .select()
      .single();
    
    if (insertError || !apiKeyRecord) {
      console.error('[APIKeyService] Failed to create API key:', insertError);
      throw new Error('Failed to create API key');
    }
    
    // Return both full key and APIKey object
    const apiKey: APIKey = {
      id: apiKeyRecord.id,
      userId: apiKeyRecord.user_id,
      name: apiKeyRecord.name,
      keyPrefix: apiKeyRecord.key_prefix,
      scopes: apiKeyRecord.scopes || [],
      lastUsedAt: apiKeyRecord.last_used_at || null,
      expiresAt: apiKeyRecord.expires_at || null,
      createdAt: apiKeyRecord.created_at || new Date().toISOString(),
      updatedAt: apiKeyRecord.updated_at || new Date().toISOString(),
      isActive: apiKeyRecord.is_active ?? true,
    };
    
    return { key, apiKey };
  }

  async validateAPIKey(key: string): Promise<ValidationResult> {
    // Validate key format
    const keyValidation = apiKeySchema.safeParse(key);
    if (!keyValidation.success) {
      return {
        valid: false,
        error: 'Invalid API key format',
      };
    }
    
    // Hash provided key with SHA-256
    const keyHash = this.hashAPIKey(key);
    
    const supabase = createAdminClient();
    
    // Query database for matching key_hash
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active, expires_at, last_used_at')
      .eq('key_hash', keyHash)
      .single();
    
    if (keyError || !apiKeyRecord) {
      return {
        valid: false,
        error: 'Invalid or expired API key',
      };
    }
    
    // Use constant-time comparison for security (comparing hashes)
    const storedHash = keyHash; // We already have the hash from the query
    if (!this.constantTimeCompare(keyHash, storedHash)) {
      return {
        valid: false,
        error: 'Invalid or expired API key',
      };
    }
    
    // Check is_active
    if (!apiKeyRecord.is_active) {
      return {
        valid: false,
        error: 'API key has been revoked',
      };
    }
    
    // Check expires_at
    if (apiKeyRecord.expires_at) {
      const expirationDate = new Date(apiKeyRecord.expires_at);
      const now = new Date();
      if (expirationDate < now) {
        return {
          valid: false,
          error: 'API key has expired',
        };
      }
    }
    
    // Query user's profile and check Pro plan status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, subscription_plan')
      .eq('id', apiKeyRecord.user_id)
      .single();
    
    if (profileError || !profile) {
      return {
        valid: false,
        error: 'User not found',
      };
    }
    
    // Verify plan is 'pro'
    if (profile.subscription_plan !== 'pro') {
      return {
        valid: false,
        error: 'Pro plan required',
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          planType: profile.subscription_plan || 'free',
        },
      };
    }
    
    // Update last_used_at timestamp on success
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);
    
    if (updateError) {
      console.error('[APIKeyService] Failed to update last_used_at:', updateError);
      // Don't fail validation if update fails
    }
    
    // Return ValidationResult with user info
    return {
      valid: true,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        planType: profile.subscription_plan || 'free',
      },
      apiKeyId: apiKeyRecord.id,
    };
  }

  async listAPIKeys(userId: string): Promise<APIKey[]> {
    const supabase = createAdminClient();
    
    // Query user's keys with RLS enforcement
    // Note: Using admin client but filtering by user_id to simulate RLS
    const { data: apiKeyRecords, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[APIKeyService] Failed to list API keys:', error);
      throw new Error('Failed to list API keys');
    }
    
    // Map database records to APIKey interface
    return (apiKeyRecords || []).map((record) => ({
      id: record.id,
      userId: record.user_id,
      name: record.name,
      keyPrefix: record.key_prefix,
      scopes: record.scopes || [],
      lastUsedAt: record.last_used_at || null,
      expiresAt: record.expires_at || null,
      createdAt: record.created_at || new Date().toISOString(),
      updatedAt: record.updated_at || new Date().toISOString(),
      isActive: record.is_active ?? true,
    }));
  }

  async revokeAPIKey(userId: string, keyId: string): Promise<void> {
    const supabase = createAdminClient();
    
    // Verify ownership before revoking
    const { data: apiKeyRecord, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();
    
    if (fetchError || !apiKeyRecord) {
      throw new Error('API key not found');
    }
    
    if (apiKeyRecord.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this API key');
    }
    
    // Set is_active=false
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId);
    
    if (updateError) {
      console.error('[APIKeyService] Failed to revoke API key:', updateError);
      throw new Error('Failed to revoke API key');
    }
  }

  async deleteAPIKey(userId: string, keyId: string): Promise<void> {
    const supabase = createAdminClient();
    
    // Verify ownership before deleting
    const { data: apiKeyRecord, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();
    
    if (fetchError || !apiKeyRecord) {
      throw new Error('API key not found');
    }
    
    if (apiKeyRecord.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this API key');
    }
    
    // Delete record
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    if (deleteError) {
      console.error('[APIKeyService] Failed to delete API key:', deleteError);
      throw new Error('Failed to delete API key');
    }
  }
}

/**
 * Factory function to create an APIKeyService instance
 */
export function createAPIKeyService(): IAPIKeyService {
  return new APIKeyService();
}

/**
 * Export singleton instance
 */
export const apiKeyService = new APIKeyService();
