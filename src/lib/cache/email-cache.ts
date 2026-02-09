/**
 * Email System Cache
 * 
 * In-memory cache for email templates, provider configuration, and frequently
 * accessed data to reduce database queries and improve performance.
 * 
 * Requirements: 11.5, 11.6
 */

import type { RenderedEmail } from '@/lib/email/template-engine';

/**
 * Cache entry structure with TTL
 */
interface CacheEntry<T> {
  data: T;
  cachedAt: number; // Unix timestamp in milliseconds
  ttl: number; // Time-to-live in milliseconds
}

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Template cache: 15 minutes (templates don't change frequently)
  TEMPLATE_TTL: 15 * 60 * 1000,
  
  // Provider config cache: 5 minutes (config changes are rare but important)
  PROVIDER_CONFIG_TTL: 5 * 60 * 1000,
  
  // Rendered template cache: 30 minutes (rendered output is expensive to generate)
  RENDERED_TEMPLATE_TTL: 30 * 60 * 1000,
  
  // Sender address cache: 10 minutes
  SENDER_ADDRESS_TTL: 10 * 60 * 1000,
  
  // Cleanup interval: 10 minutes
  CLEANUP_INTERVAL: 10 * 60 * 1000,
};

/**
 * Template metadata cache
 */
const templateCache = new Map<string, CacheEntry<any>>();

/**
 * Provider configuration cache
 */
const providerConfigCache = new Map<string, CacheEntry<any>>();

/**
 * Rendered template cache (keyed by template ID + variable hash)
 */
const renderedTemplateCache = new Map<string, CacheEntry<RenderedEmail>>();

/**
 * Sender address cache
 */
const senderAddressCache = new Map<string, CacheEntry<any>>();

/**
 * Active provider cache (single entry)
 */
let activeProviderCache: CacheEntry<any> | null = null;

/**
 * Check if a cache entry is expired
 */
function isExpired<T>(entry: CacheEntry<T>): boolean {
  const now = Date.now();
  return now - entry.cachedAt >= entry.ttl;
}

/**
 * Generate a cache key for rendered templates
 */
function generateRenderedTemplateKey(
  templateId: string,
  variables: Record<string, any>
): string {
  // Create a stable hash of the variables
  const variableHash = JSON.stringify(
    Object.keys(variables)
      .sort()
      .reduce((acc, key) => {
        acc[key] = variables[key];
        return acc;
      }, {} as Record<string, any>)
  );
  
  // Use a simple hash function
  let hash = 0;
  for (let i = 0; i < variableHash.length; i++) {
    const char = variableHash.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${templateId}:${hash}`;
}

// ============================================================================
// Template Cache Functions
// ============================================================================

/**
 * Get a cached template
 */
export function getTemplate(templateId: string): any | null {
  const entry = templateCache.get(templateId);
  
  if (!entry) {
    return null;
  }
  
  if (isExpired(entry)) {
    templateCache.delete(templateId);
    return null;
  }
  
  return entry.data;
}

/**
 * Set a template in the cache
 */
export function setTemplate(templateId: string, template: any): void {
  const entry: CacheEntry<any> = {
    data: template,
    cachedAt: Date.now(),
    ttl: CACHE_CONFIG.TEMPLATE_TTL,
  };
  
  templateCache.set(templateId, entry);
}

/**
 * Invalidate a template from the cache
 */
export function invalidateTemplate(templateId: string): void {
  templateCache.delete(templateId);
  
  // Also invalidate all rendered templates for this template ID
  for (const [key] of renderedTemplateCache.entries()) {
    if (key.startsWith(`${templateId}:`)) {
      renderedTemplateCache.delete(key);
    }
  }
}

/**
 * Invalidate all templates
 */
export function invalidateAllTemplates(): void {
  templateCache.clear();
  renderedTemplateCache.clear();
}

// ============================================================================
// Rendered Template Cache Functions
// ============================================================================

/**
 * Get a cached rendered template
 */
export function getRenderedTemplate(
  templateId: string,
  variables: Record<string, any>
): RenderedEmail | null {
  const key = generateRenderedTemplateKey(templateId, variables);
  const entry = renderedTemplateCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (isExpired(entry)) {
    renderedTemplateCache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set a rendered template in the cache
 */
export function setRenderedTemplate(
  templateId: string,
  variables: Record<string, any>,
  rendered: RenderedEmail
): void {
  const key = generateRenderedTemplateKey(templateId, variables);
  const entry: CacheEntry<RenderedEmail> = {
    data: rendered,
    cachedAt: Date.now(),
    ttl: CACHE_CONFIG.RENDERED_TEMPLATE_TTL,
  };
  
  renderedTemplateCache.set(key, entry);
}

// ============================================================================
// Provider Configuration Cache Functions
// ============================================================================

/**
 * Get cached provider configuration
 */
export function getProviderConfig(providerName: string): any | null {
  const entry = providerConfigCache.get(providerName);
  
  if (!entry) {
    return null;
  }
  
  if (isExpired(entry)) {
    providerConfigCache.delete(providerName);
    return null;
  }
  
  return entry.data;
}

/**
 * Set provider configuration in the cache
 */
export function setProviderConfig(providerName: string, config: any): void {
  const entry: CacheEntry<any> = {
    data: config,
    cachedAt: Date.now(),
    ttl: CACHE_CONFIG.PROVIDER_CONFIG_TTL,
  };
  
  providerConfigCache.set(providerName, entry);
}

/**
 * Invalidate provider configuration
 */
export function invalidateProviderConfig(providerName: string): void {
  providerConfigCache.delete(providerName);
  
  // Also invalidate active provider cache if it matches
  if (activeProviderCache && activeProviderCache.data?.name === providerName) {
    activeProviderCache = null;
  }
}

/**
 * Invalidate all provider configurations
 */
export function invalidateAllProviderConfigs(): void {
  providerConfigCache.clear();
  activeProviderCache = null;
}

// ============================================================================
// Active Provider Cache Functions
// ============================================================================

/**
 * Get cached active provider
 */
export function getActiveProvider(): any | null {
  if (!activeProviderCache) {
    return null;
  }
  
  if (isExpired(activeProviderCache)) {
    activeProviderCache = null;
    return null;
  }
  
  return activeProviderCache.data;
}

/**
 * Set active provider in the cache
 */
export function setActiveProvider(provider: any): void {
  activeProviderCache = {
    data: provider,
    cachedAt: Date.now(),
    ttl: CACHE_CONFIG.PROVIDER_CONFIG_TTL,
  };
}

/**
 * Invalidate active provider cache
 */
export function invalidateActiveProvider(): void {
  activeProviderCache = null;
}

// ============================================================================
// Sender Address Cache Functions
// ============================================================================

/**
 * Get cached sender address
 */
export function getSenderAddress(email: string): any | null {
  const entry = senderAddressCache.get(email);
  
  if (!entry) {
    return null;
  }
  
  if (isExpired(entry)) {
    senderAddressCache.delete(email);
    return null;
  }
  
  return entry.data;
}

/**
 * Set sender address in the cache
 */
export function setSenderAddress(email: string, address: any): void {
  const entry: CacheEntry<any> = {
    data: address,
    cachedAt: Date.now(),
    ttl: CACHE_CONFIG.SENDER_ADDRESS_TTL,
  };
  
  senderAddressCache.set(email, entry);
}

/**
 * Invalidate sender address
 */
export function invalidateSenderAddress(email: string): void {
  senderAddressCache.delete(email);
}

/**
 * Invalidate all sender addresses
 */
export function invalidateAllSenderAddresses(): void {
  senderAddressCache.clear();
}

// ============================================================================
// Cache Management Functions
// ============================================================================

/**
 * Clean up expired entries from all caches
 */
export function cleanupExpired(): void {
  const now = Date.now();
  
  // Clean template cache
  for (const [key, entry] of templateCache.entries()) {
    if (now - entry.cachedAt >= entry.ttl) {
      templateCache.delete(key);
    }
  }
  
  // Clean rendered template cache
  for (const [key, entry] of renderedTemplateCache.entries()) {
    if (now - entry.cachedAt >= entry.ttl) {
      renderedTemplateCache.delete(key);
    }
  }
  
  // Clean provider config cache
  for (const [key, entry] of providerConfigCache.entries()) {
    if (now - entry.cachedAt >= entry.ttl) {
      providerConfigCache.delete(key);
    }
  }
  
  // Clean sender address cache
  for (const [key, entry] of senderAddressCache.entries()) {
    if (now - entry.cachedAt >= entry.ttl) {
      senderAddressCache.delete(key);
    }
  }
  
  // Clean active provider cache
  if (activeProviderCache && now - activeProviderCache.cachedAt >= activeProviderCache.ttl) {
    activeProviderCache = null;
  }
}

/**
 * Clear all caches
 */
export function clearAll(): void {
  templateCache.clear();
  renderedTemplateCache.clear();
  providerConfigCache.clear();
  senderAddressCache.clear();
  activeProviderCache = null;
}

/**
 * Get cache statistics
 */
export function getStats(): {
  templates: number;
  renderedTemplates: number;
  providerConfigs: number;
  senderAddresses: number;
  activeProvider: boolean;
  totalEntries: number;
} {
  return {
    templates: templateCache.size,
    renderedTemplates: renderedTemplateCache.size,
    providerConfigs: providerConfigCache.size,
    senderAddresses: senderAddressCache.size,
    activeProvider: activeProviderCache !== null,
    totalEntries:
      templateCache.size +
      renderedTemplateCache.size +
      providerConfigCache.size +
      senderAddressCache.size +
      (activeProviderCache ? 1 : 0),
  };
}

// ============================================================================
// Automatic Cleanup
// ============================================================================

// Automatic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, CACHE_CONFIG.CLEANUP_INTERVAL);
}
