/**
 * Email Provider Configuration Service
 * 
 * This service manages email provider configuration, including:
 * - Provider instantiation and management
 * - Credentials encryption/decryption
 * - Provider switching
 * - Connection testing
 * 
 * Requirements: 2.2, 2.3, 2.7
 */

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import {
  EmailProvider,
  ProviderConfig,
  ResendProviderConfig,
  SESProviderConfig,
  EmailProviderName,
  ConfigurationError,
} from '@/lib/email/providers/types';
import { ResendProvider } from '@/lib/email/providers/resend.provider';
import { SESProvider } from '@/lib/email/providers/ses.provider';

/**
 * Encryption algorithm for provider credentials
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Provider configuration stored in database
 */
interface StoredProviderConfig {
  id: string;
  name: EmailProviderName;
  is_active: boolean;
  config: string; // Encrypted JSON
  created_at: string;
  updated_at: string;
}

/**
 * Email Provider Service
 * 
 * Manages email provider configuration and instantiation.
 * Handles encryption of sensitive credentials.
 */
export class EmailProviderService {
  private supabase: SupabaseClient<Database>;
  private encryptionKey: Buffer;
  private providerCache: Map<EmailProviderName, EmailProvider> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    
    // Get encryption key from environment
    const key = process.env.EMAIL_PROVIDER_ENCRYPTION_KEY;
    if (!key) {
      throw new ConfigurationError(
        'EMAIL_PROVIDER_ENCRYPTION_KEY environment variable is required',
        'resend',
        'MISSING_ENCRYPTION_KEY'
      );
    }
    
    // Derive encryption key from environment variable
    this.encryptionKey = crypto.scryptSync(key, 'email-provider-salt', 32);
  }

  /**
   * Get the currently active email provider instance
   * 
   * @returns Promise resolving to active provider instance
   * @throws ConfigurationError if no active provider is configured
   */
  async getActiveProvider(): Promise<EmailProvider> {
    try {
      // Check cache first
      const { getActiveProvider: getCachedProvider, setActiveProvider: setCachedProvider } = await import('@/lib/cache/email-cache');
      const cached = getCachedProvider();
      if (cached) {
        return cached;
      }
      
      // Query for active provider
      const { data, error } = await this.supabase
        .from('email_providers')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        throw new ConfigurationError(
          'Failed to retrieve active provider',
          'resend',
          'QUERY_FAILED',
          { error }
        );
      }

      if (!data) {
        throw new ConfigurationError(
          'No active email provider configured',
          'resend',
          'NO_ACTIVE_PROVIDER'
        );
      }

      // Check cache first
      const cachedProvider = this.providerCache.get(data.name as EmailProviderName);
      if (cachedProvider) {
        return cachedProvider;
      }

      // Decrypt and instantiate provider
      const config = this.decryptConfig(data.config);
      const provider = this.instantiateProvider({
        provider: data.name as EmailProviderName,
        isActive: data.is_active,
        config,
      });

      // Cache the provider
      this.providerCache.set(data.name as EmailProviderName, provider);
      setCachedProvider(provider);

      return provider;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigurationError(
        'Failed to get active provider',
        'resend',
        'GET_PROVIDER_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Set the active email provider
   * 
   * @param providerName - Name of the provider to activate
   * @throws ConfigurationError if provider is not configured
   */
  async setActiveProvider(providerName: EmailProviderName): Promise<void> {
    try {
      // Verify provider exists
      const { data: provider, error: fetchError } = await this.supabase
        .from('email_providers')
        .select('*')
        .eq('name', providerName)
        .single();

      if (fetchError || !provider) {
        throw new ConfigurationError(
          `Provider ${providerName} is not configured`,
          providerName,
          'PROVIDER_NOT_FOUND'
        );
      }

      // Test provider connection before activating
      const config = this.decryptConfig(provider.config);
      const providerInstance = this.instantiateProvider({
        provider: providerName,
        isActive: true,
        config,
      });

      const isConnected = await providerInstance.testConnection();
      if (!isConnected) {
        throw new ConfigurationError(
          `Failed to connect to ${providerName}. Please verify credentials.`,
          providerName,
          'CONNECTION_TEST_FAILED'
        );
      }

      // Deactivate all providers
      const { error: deactivateError } = await this.supabase
        .from('email_providers')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (deactivateError) {
        throw new ConfigurationError(
          'Failed to deactivate existing providers',
          providerName,
          'DEACTIVATE_FAILED',
          { error: deactivateError }
        );
      }

      // Activate selected provider
      const { error: activateError } = await this.supabase
        .from('email_providers')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('name', providerName);

      if (activateError) {
        throw new ConfigurationError(
          'Failed to activate provider',
          providerName,
          'ACTIVATE_FAILED',
          { error: activateError }
        );
      }

      // Clear cache to force reload
      this.providerCache.clear();
      
      // Invalidate cache
      const { invalidateActiveProvider } = await import('@/lib/cache/email-cache');
      invalidateActiveProvider();
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigurationError(
        'Failed to set active provider',
        providerName,
        'SET_ACTIVE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Save provider configuration with encrypted credentials
   * 
   * @param config - Provider configuration
   * @returns Promise resolving to saved provider ID
   */
  async saveProviderConfig(config: ProviderConfig): Promise<string> {
    try {
      // Validate configuration
      this.validateProviderConfig(config);

      // Test connection before saving
      const provider = this.instantiateProvider(config);
      const isConnected = await provider.testConnection();
      
      if (!isConnected) {
        throw new ConfigurationError(
          `Failed to connect to ${config.provider}. Please verify credentials.`,
          config.provider,
          'CONNECTION_TEST_FAILED'
        );
      }

      // Encrypt configuration
      const encryptedConfig = this.encryptConfig(config.config);

      // Check if provider already exists
      const { data: existing } = await this.supabase
        .from('email_providers')
        .select('id')
        .eq('name', config.provider)
        .single();

      if (existing) {
        // Update existing provider
        const { error } = await this.supabase
          .from('email_providers')
          .update({
            config: encryptedConfig,
            is_active: config.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          throw new ConfigurationError(
            'Failed to update provider configuration',
            config.provider,
            'UPDATE_FAILED',
            { error }
          );
        }

        // Clear cache
        this.providerCache.delete(config.provider);

        return existing.id;
      } else {
        // Insert new provider
        const { data, error } = await this.supabase
          .from('email_providers')
          .insert({
            name: config.provider,
            is_active: config.isActive,
            config: encryptedConfig,
          })
          .select('id')
          .single();

        if (error || !data) {
          throw new ConfigurationError(
            'Failed to save provider configuration',
            config.provider,
            'INSERT_FAILED',
            { error }
          );
        }

        return data.id;
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigurationError(
        'Failed to save provider configuration',
        config.provider,
        'SAVE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test provider connection
   * 
   * @param providerName - Name of the provider to test
   * @returns Promise resolving to true if connection is successful
   */
  async testProviderConnection(providerName: EmailProviderName): Promise<boolean> {
    try {
      // Get provider configuration
      const { data, error } = await this.supabase
        .from('email_providers')
        .select('*')
        .eq('name', providerName)
        .single();

      if (error || !data) {
        throw new ConfigurationError(
          `Provider ${providerName} is not configured`,
          providerName,
          'PROVIDER_NOT_FOUND'
        );
      }

      // Decrypt and instantiate provider
      const config = this.decryptConfig(data.config);
      const provider = this.instantiateProvider({
        provider: providerName,
        isActive: data.is_active,
        config,
      });

      // Test connection
      return await provider.testConnection();
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      return false;
    }
  }

  /**
   * List all configured providers
   * 
   * @returns Promise resolving to array of provider configurations (without decrypted credentials)
   */
  async listProviders(): Promise<Array<{
    id: string;
    name: EmailProviderName;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('email_providers')
        .select('id, name, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new ConfigurationError(
          'Failed to list providers',
          'resend',
          'LIST_FAILED',
          { error }
        );
      }

      return (data || []).map(provider => ({
        id: provider.id,
        name: provider.name as EmailProviderName,
        isActive: provider.is_active,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at,
      }));
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigurationError(
        'Failed to list providers',
        'resend',
        'LIST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get provider configuration (decrypted)
   * 
   * @param providerName - Name of the provider
   * @returns Promise resolving to decrypted configuration
   */
  async getProviderConfig(providerName: EmailProviderName): Promise<Record<string, any> | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_providers')
        .select('*')
        .eq('name', providerName)
        .single();

      if (error || !data) {
        return null;
      }

      return this.decryptConfig(data.config);
    } catch (error) {
      console.error(`Error getting provider config for ${providerName}:`, error);
      return null;
    }
  }

  /**
   * Encrypt provider configuration
   * 
   * @param config - Configuration object to encrypt
   * @returns Encrypted configuration string
   */
  private encryptConfig(config: Record<string, any>): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(
        ENCRYPTION_ALGORITHM,
        this.encryptionKey,
        iv
      );

      // Encrypt data
      const configJson = JSON.stringify(config);
      let encrypted = cipher.update(configJson, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine IV + auth tag + encrypted data
      const result = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      return result.toString('base64');
    } catch (error) {
      throw new ConfigurationError(
        'Failed to encrypt configuration',
        'resend',
        'ENCRYPTION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Decrypt provider configuration
   * 
   * @param encryptedConfig - Encrypted configuration string
   * @returns Decrypted configuration object
   */
  private decryptConfig(encryptedConfig: string): Record<string, any> {
    try {
      // Decode from base64
      const buffer = Buffer.from(encryptedConfig, 'base64');

      // Extract IV, auth tag, and encrypted data
      const iv = buffer.subarray(0, IV_LENGTH);
      const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        this.encryptionKey,
        iv
      );
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new ConfigurationError(
        'Failed to decrypt configuration',
        'resend',
        'DECRYPTION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Validate provider configuration
   * 
   * @param config - Provider configuration to validate
   * @throws ConfigurationError if configuration is invalid
   */
  private validateProviderConfig(config: ProviderConfig): void {
    if (!config.provider) {
      throw new ConfigurationError(
        'Provider name is required',
        'resend',
        'INVALID_CONFIG'
      );
    }

    if (config.provider === 'resend') {
      const resendConfig = config as ResendProviderConfig;
      if (!resendConfig.config.apiKey) {
        throw new ConfigurationError(
          'Resend API key is required',
          'resend',
          'MISSING_API_KEY'
        );
      }
    } else if (config.provider === 'aws-ses') {
      const sesConfig = config as SESProviderConfig;
      if (!sesConfig.config.accessKeyId || !sesConfig.config.secretAccessKey) {
        throw new ConfigurationError(
          'AWS credentials (accessKeyId and secretAccessKey) are required',
          'aws-ses',
          'MISSING_CREDENTIALS'
        );
      }
      if (!sesConfig.config.region) {
        throw new ConfigurationError(
          'AWS region is required',
          'aws-ses',
          'MISSING_REGION'
        );
      }
    } else {
      throw new ConfigurationError(
        `Unknown provider: ${config.provider}`,
        config.provider as EmailProviderName,
        'UNKNOWN_PROVIDER'
      );
    }
  }

  /**
   * Instantiate provider from configuration
   * 
   * @param config - Provider configuration
   * @returns Provider instance
   */
  private instantiateProvider(config: ProviderConfig): EmailProvider {
    switch (config.provider) {
      case 'resend':
        return new ResendProvider(config as ResendProviderConfig);
      case 'aws-ses':
        return new SESProvider(config as SESProviderConfig);
      default:
        throw new ConfigurationError(
          `Unknown provider: ${config.provider}`,
          config.provider,
          'UNKNOWN_PROVIDER'
        );
    }
  }
}
