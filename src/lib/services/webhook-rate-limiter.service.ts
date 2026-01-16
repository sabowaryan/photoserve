/**
 * Webhook Rate Limiter Service
 * Implements in-memory rate limiting for webhook endpoints
 * 
 * @module lib/services/webhook-rate-limiter.service
 * Requirements: 6.1 - THE Endpoint SHALL have rate limiting protection
 * Requirements: 11.3 - THE Webhook_Endpoint SHALL return 200 OK within 3 seconds
 * 
 * Uses in-memory storage for fast response times (webhooks need to respond quickly)
 * Allows 100 requests per minute per IP to handle legitimate Stripe webhook traffic
 * while protecting against abuse.
 */

// Rate limit configuration for webhooks
// Higher limits than password verification to allow legitimate Stripe retries
const WEBHOOK_MAX_REQUESTS = 100; // 100 requests per window
const WEBHOOK_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * In-memory storage for rate limit tracking
 * Key: IP address
 * Value: { count: number, windowStart: number }
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval to prevent memory leaks
 * Removes expired entries every 5 minutes
 */
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > WEBHOOK_WINDOW_MS * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Clean up every 5 minutes
  
  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

// Start cleanup on module load
startCleanupInterval();

export interface WebhookRateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
  limit: number;
  windowMs: number;
}

/**
 * Check if a webhook request is allowed based on rate limits
 * 
 * @param ip - The IP address of the request
 * @returns Rate limit result with allowed status and remaining requests
 * 
 * Requirements: 6.1 - Rate limiting protection
 */
export function checkWebhookRateLimit(ip: string): WebhookRateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // No existing entry or window expired - create new entry
  if (!entry || now - entry.windowStart > WEBHOOK_WINDOW_MS) {
    rateLimitStore.set(ip, {
      count: 1,
      windowStart: now,
    });
    
    return {
      allowed: true,
      remainingRequests: WEBHOOK_MAX_REQUESTS - 1,
      limit: WEBHOOK_MAX_REQUESTS,
      windowMs: WEBHOOK_WINDOW_MS,
    };
  }

  // Check if limit exceeded
  if (entry.count >= WEBHOOK_MAX_REQUESTS) {
    const windowEnd = entry.windowStart + WEBHOOK_WINDOW_MS;
    const retryAfterSeconds = Math.ceil((windowEnd - now) / 1000);
    
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      limit: WEBHOOK_MAX_REQUESTS,
      windowMs: WEBHOOK_WINDOW_MS,
    };
  }

  // Increment count
  entry.count++;
  
  return {
    allowed: true,
    remainingRequests: WEBHOOK_MAX_REQUESTS - entry.count,
    limit: WEBHOOK_MAX_REQUESTS,
    windowMs: WEBHOOK_WINDOW_MS,
  };
}

/**
 * Get the client IP from a request
 * Handles various proxy headers
 * 
 * @param request - The incoming request
 * @returns The client IP address
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    const firstIp = vercelForwardedFor.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  // Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to unknown
  return 'unknown';
}

/**
 * Reset rate limit for an IP (for testing purposes)
 * 
 * @param ip - The IP address to reset
 */
export function resetWebhookRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Get the current rate limit configuration
 */
export function getWebhookRateLimitConfig() {
  return {
    maxRequests: WEBHOOK_MAX_REQUESTS,
    windowMs: WEBHOOK_WINDOW_MS,
    windowSeconds: WEBHOOK_WINDOW_MS / 1000,
  };
}

/**
 * Clear all rate limit entries (for testing purposes)
 */
export function clearAllWebhookRateLimits(): void {
  rateLimitStore.clear();
}
