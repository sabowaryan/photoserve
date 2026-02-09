/**
 * Email Provider Factory
 * 
 * This module implements the factory pattern for creating email provider instances.
 * It allows dynamic provider instantiation based on configuration.
 * 
 * Requirements: 2.1, 2.4
 */

import type {
  EmailProvider,
  ProviderConfig,
  ProviderFactory,
  ProviderRegistry,
  EmailProviderName,
} from './types';
import { ConfigurationError } from './types';

/**
 * Provider registry storing factory functions for each provider
 */
const providerRegistry: ProviderRegistry = {};

/**
 * Register a provider factory
 * 
 * @param name - Provider name
 * @param factory - Factory function to create provider instance
 */
export function registerProvider(
  name: EmailProviderName,
  factory: ProviderFactory
): void {
  providerRegistry[name] = factory;
}

/**
 * Check if a provider is registered
 * 
 * @param name - Provider name
 * @returns True if provider is registered
 */
export function isProviderRegistered(name: EmailProviderName): boolean {
  return name in providerRegistry;
}

/**
 * Get list of all registered provider names
 * 
 * @returns Array of registered provider names
 */
export function getRegisteredProviders(): EmailProviderName[] {
  return Object.keys(providerRegistry) as EmailProviderName[];
}

/**
 * Create an email provider instance
 * 
 * @param config - Provider configuration
 * @returns Email provider instance
 * @throws {ConfigurationError} If provider is not registered or config is invalid
 */
export function createEmailProvider(config: ProviderConfig): EmailProvider {
  const { provider } = config;
  
  // Check if provider is registered
  if (!isProviderRegistered(provider)) {
    throw new ConfigurationError(
      `Email provider '${provider}' is not registered. Available providers: ${getRegisteredProviders().join(', ')}`,
      provider,
      'PROVIDER_NOT_REGISTERED'
    );
  }
  
  // Validate configuration
  validateProviderConfig(config);
  
  // Create provider instance using factory
  const factory = providerRegistry[provider];
  
  // TypeScript guard: factory should exist due to isProviderRegistered check above
  if (!factory) {
    throw new ConfigurationError(
      `Email provider '${provider}' factory not found in registry`,
      provider,
      'PROVIDER_FACTORY_NOT_FOUND'
    );
  }
  
  try {
    return factory(config);
  } catch (error) {
    throw new ConfigurationError(
      `Failed to create email provider '${provider}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      provider,
      'PROVIDER_CREATION_FAILED',
      { originalError: error }
    );
  }
}

/**
 * Validate provider configuration
 * 
 * @param config - Provider configuration to validate
 * @throws {ConfigurationError} If configuration is invalid
 */
function validateProviderConfig(config: ProviderConfig): void {
  const { provider } = config;
  
  // Validate based on provider type
  switch (provider) {
    case 'resend':
      validateResendConfig(config);
      break;
    case 'aws-ses':
      validateSESConfig(config);
      break;
    default:
      throw new ConfigurationError(
        `Unknown provider type: ${provider}`,
        provider,
        'INVALID_PROVIDER_TYPE'
      );
  }
}

/**
 * Validate Resend provider configuration
 */
function validateResendConfig(config: ProviderConfig): void {
  if (config.provider !== 'resend') {
    throw new ConfigurationError(
      'Invalid provider type for Resend configuration',
      config.provider,
      'INVALID_CONFIG_TYPE'
    );
  }
  
  const { apiKey } = config.config;
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new ConfigurationError(
      'Resend API key is required and must be a non-empty string',
      'resend',
      'MISSING_API_KEY'
    );
  }
  
  // Validate API key format (Resend keys start with 're_')
  if (!apiKey.startsWith('re_')) {
    throw new ConfigurationError(
      'Invalid Resend API key format. API key should start with "re_"',
      'resend',
      'INVALID_API_KEY_FORMAT'
    );
  }
}

/**
 * Validate AWS SES provider configuration
 */
function validateSESConfig(config: ProviderConfig): void {
  if (config.provider !== 'aws-ses') {
    throw new ConfigurationError(
      'Invalid provider type for AWS SES configuration',
      config.provider,
      'INVALID_CONFIG_TYPE'
    );
  }
  
  const { accessKeyId, secretAccessKey, region } = config.config;
  
  // Validate access key ID
  if (!accessKeyId || typeof accessKeyId !== 'string' || accessKeyId.trim().length === 0) {
    throw new ConfigurationError(
      'AWS access key ID is required and must be a non-empty string',
      'aws-ses',
      'MISSING_ACCESS_KEY_ID'
    );
  }
  
  // Validate secret access key
  if (!secretAccessKey || typeof secretAccessKey !== 'string' || secretAccessKey.trim().length === 0) {
    throw new ConfigurationError(
      'AWS secret access key is required and must be a non-empty string',
      'aws-ses',
      'MISSING_SECRET_ACCESS_KEY'
    );
  }
  
  // Validate region
  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    throw new ConfigurationError(
      'AWS region is required and must be a non-empty string',
      'aws-ses',
      'MISSING_REGION'
    );
  }
  
  // Validate region format (e.g., us-east-1, eu-west-1)
  const regionRegex = /^[a-z]{2}-[a-z]+-\d+$/;
  if (!regionRegex.test(region)) {
    throw new ConfigurationError(
      `Invalid AWS region format: ${region}. Expected format: us-east-1, eu-west-1, etc.`,
      'aws-ses',
      'INVALID_REGION_FORMAT'
    );
  }
}

/**
 * Create a provider instance with automatic error handling
 * 
 * This is a convenience wrapper around createEmailProvider that provides
 * better error messages and logging.
 * 
 * @param config - Provider configuration
 * @returns Email provider instance or null if creation fails
 */
export async function createEmailProviderSafe(
  config: ProviderConfig
): Promise<EmailProvider | null> {
  try {
    const provider = createEmailProvider(config);
    
    // Test connection to ensure provider is working
    const isConnected = await provider.testConnection();
    if (!isConnected) {
      console.error(`[EmailProvider] Failed to connect to ${config.provider}`);
      return null;
    }
    
    return provider;
  } catch (error) {
    console.error(
      `[EmailProvider] Failed to create provider ${config.provider}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

/**
 * Unregister a provider (useful for testing)
 * 
 * @param name - Provider name to unregister
 */
export function unregisterProvider(name: EmailProviderName): void {
  delete providerRegistry[name];
}

/**
 * Clear all registered providers (useful for testing)
 */
export function clearProviderRegistry(): void {
  Object.keys(providerRegistry).forEach((key) => {
    delete providerRegistry[key];
  });
}
