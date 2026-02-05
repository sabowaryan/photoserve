/**
 * CDN Configuration
 * Configures cache headers and optimization settings for CDN distribution
 * 
 * Requirements: 5.7, 14.2 - CDN configuration for plugin file distribution
 */

/**
 * Cache duration constants in seconds
 */
export const CACHE_DURATION = {
  /** Plugin files: 1 year (immutable, versioned URLs) */
  PLUGIN_FILE: 365 * 24 * 60 * 60,
  
  /** Plugin version info: 5 minutes */
  VERSION_INFO: 5 * 60,
  
  /** Static assets: 1 week */
  STATIC_ASSETS: 7 * 24 * 60 * 60,
  
  /** API responses: No cache */
  NO_CACHE: 0,
} as const;

/**
 * CDN cache control headers for different resource types
 */
export const CDN_HEADERS = {
  /**
   * Plugin file headers (1 year cache, immutable)
   * Use for versioned plugin files that never change
   */
  PLUGIN_FILE: {
    'Cache-Control': `public, max-age=${CACHE_DURATION.PLUGIN_FILE}, immutable`,
    'CDN-Cache-Control': `public, max-age=${CACHE_DURATION.PLUGIN_FILE}, immutable`,
    'Cloudflare-CDN-Cache-Control': `public, max-age=${CACHE_DURATION.PLUGIN_FILE}, immutable`,
    'Vary': 'Accept-Encoding',
  },
  
  /**
   * Version info headers (5 minutes cache)
   * Use for version check API responses
   */
  VERSION_INFO: {
    'Cache-Control': `public, max-age=${CACHE_DURATION.VERSION_INFO}, stale-while-revalidate=60`,
    'CDN-Cache-Control': `public, max-age=${CACHE_DURATION.VERSION_INFO}`,
    'Vary': 'Accept-Encoding',
  },
  
  /**
   * Static asset headers (1 week cache)
   * Use for images, CSS, JS files
   */
  STATIC_ASSETS: {
    'Cache-Control': `public, max-age=${CACHE_DURATION.STATIC_ASSETS}`,
    'CDN-Cache-Control': `public, max-age=${CACHE_DURATION.STATIC_ASSETS}`,
    'Vary': 'Accept-Encoding',
  },
  
  /**
   * No cache headers
   * Use for dynamic API responses
   */
  NO_CACHE: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
} as const;

/**
 * Compression settings
 */
export const COMPRESSION_CONFIG = {
  /**
   * Minimum file size for compression (in bytes)
   * Files smaller than this won't be compressed
   */
  MIN_SIZE: 1024, // 1KB
  
  /**
   * Compression level (1-9, higher = better compression but slower)
   */
  LEVEL: 6,
  
  /**
   * File types that should be compressed
   */
  COMPRESSIBLE_TYPES: [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'text/plain',
    'image/svg+xml',
  ],
} as const;

/**
 * Generate versioned URL for cache busting
 * Appends version parameter to URL
 * 
 * @param baseUrl - Base URL without version
 * @param version - Version string (e.g., "1.0.0")
 * @returns Versioned URL
 * 
 * @example
 * ```typescript
 * const url = generateVersionedUrl('https://cdn.example.com/plugin.lrplugin', '1.0.0');
 * // Returns: 'https://cdn.example.com/plugin.lrplugin?v=1.0.0'
 * ```
 */
export function generateVersionedUrl(baseUrl: string, version: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('v', version);
  return url.toString();
}

/**
 * Get cache headers for a specific resource type
 * 
 * @param resourceType - Type of resource ('plugin-file', 'version-info', 'static-asset', 'no-cache')
 * @returns Cache control headers
 */
export function getCacheHeaders(
  resourceType: 'plugin-file' | 'version-info' | 'static-asset' | 'no-cache'
): Record<string, string> {
  switch (resourceType) {
    case 'plugin-file':
      return { ...CDN_HEADERS.PLUGIN_FILE };
    case 'version-info':
      return { ...CDN_HEADERS.VERSION_INFO };
    case 'static-asset':
      return { ...CDN_HEADERS.STATIC_ASSETS };
    case 'no-cache':
      return { ...CDN_HEADERS.NO_CACHE };
    default:
      return { ...CDN_HEADERS.NO_CACHE };
  }
}

/**
 * Check if a file should be compressed based on content type and size
 * 
 * @param contentType - MIME type of the file
 * @param fileSize - Size of the file in bytes
 * @returns True if file should be compressed
 */
export function shouldCompress(contentType: string, fileSize: number): boolean {
  // Don't compress small files
  if (fileSize < COMPRESSION_CONFIG.MIN_SIZE) {
    return false;
  }
  
  // Check if content type is compressible
  return COMPRESSION_CONFIG.COMPRESSIBLE_TYPES.some(type =>
    contentType.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * Cloudinary transformation parameters for plugin files
 */
export const CLOUDINARY_TRANSFORMS = {
  /**
   * No transformation for plugin files (preserve original)
   */
  PLUGIN_FILE: {
    flags: 'attachment', // Force download instead of inline display
    resource_type: 'raw', // Treat as raw file, not image
  },
  
  /**
   * Optimization for images
   */
  IMAGE: {
    quality: 'auto:good',
    fetch_format: 'auto',
    flags: 'progressive',
  },
} as const;

/**
 * Build Cloudinary URL with transformations
 * 
 * @param publicId - Cloudinary public ID
 * @param transforms - Transformation parameters
 * @returns Full Cloudinary URL
 */
export function buildCloudinaryUrl(
  publicId: string,
  transforms: Record<string, string | number> = CLOUDINARY_TRANSFORMS.PLUGIN_FILE
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured');
  }
  
  // Build transformation string
  const transformStr = Object.entries(transforms)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  // Determine resource type
  const resourceType = transforms.resource_type || 'raw';
  
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformStr}/${publicId}`;
}

/**
 * CDN performance monitoring
 */
export interface CDNMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  bandwidthUsed: number;
  requestCount: number;
}

/**
 * Calculate cache hit rate from metrics
 * 
 * @param hits - Number of cache hits
 * @param misses - Number of cache misses
 * @returns Cache hit rate as percentage (0-100)
 */
export function calculateCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  if (total === 0) return 0;
  return (hits / total) * 100;
}
