/**
 * Rate Limiter Service
 * Implements rate limiting for password verification attempts
 * 
 * @module lib/services/rate-limiter.service
 * Requirements: 4.8 - Rate limiting for password verification (5 attempts per 15 minutes per IP/gallery)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { RateLimitResult } from '@/types';

// Rate limit configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface IRateLimiterService {
  checkRateLimit(key: string): Promise<RateLimitResult>;
  resetRateLimit(key: string): Promise<void>;
  generateKey(ip: string, gallerySlug: string): string;
}

export class RateLimiterService implements IRateLimiterService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generate a unique key for rate limiting
   * Combines IP address and gallery slug
   */
  generateKey(ip: string, gallerySlug: string): string {
    return `${ip}:${gallerySlug}`;
  }

  /**
   * Check if a request is allowed based on rate limits
   * 
   * - Creates a new entry if none exists
   * - Resets expired entries
   * - Increments attempts for existing entries
   * - Returns whether the request is allowed
   * 
   * Requirement: 4.8
   */
  async checkRateLimit(key: string): Promise<RateLimitResult> {
    const now = new Date();

    // Check for existing rate limit entry
    const { data: existing, error: fetchError } = await this.supabase
      .from('rate_limit_attempts')
      .select('id, attempts, expires_at')
      .eq('key', key)
      .maybeSingle();

    if (fetchError) {
      console.error('[RateLimiter] Error fetching rate limit:', fetchError);
      // On error, allow the request but log it
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    if (existing) {
      const expiresAt = new Date(existing.expires_at);

      // Check if the entry has expired
      if (expiresAt <= now) {
        // Delete expired entry and create a new one
        await this.supabase
          .from('rate_limit_attempts')
          .delete()
          .eq('id', existing.id);

        return this.createNewEntry(key, now);
      }

      // Check if max attempts reached
      if (existing.attempts >= MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterSeconds,
        };
      }

      // Increment attempts
      const newAttempts = existing.attempts + 1;
      const { error: updateError } = await this.supabase
        .from('rate_limit_attempts')
        .update({ attempts: newAttempts })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[RateLimiter] Error updating attempts:', updateError);
      }

      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - newAttempts,
      };
    }

    // No existing entry, create a new one
    return this.createNewEntry(key, now);
  }

  /**
   * Reset rate limit for a key (e.g., after successful password verification)
   */
  async resetRateLimit(key: string): Promise<void> {
    const { error } = await this.supabase
      .from('rate_limit_attempts')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('[RateLimiter] Error resetting rate limit:', error);
    }
  }

  /**
   * Create a new rate limit entry
   */
  private async createNewEntry(key: string, now: Date): Promise<RateLimitResult> {
    const expiresAt = new Date(now.getTime() + WINDOW_MS);

    const { error } = await this.supabase
      .from('rate_limit_attempts')
      .insert({
        key,
        attempts: 1,
        first_attempt_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('[RateLimiter] Error creating rate limit entry:', error);
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }
}

/**
 * Factory function to create a RateLimiterService instance
 */
export function createRateLimiterService(
  supabase: SupabaseClient<Database>
): IRateLimiterService {
  return new RateLimiterService(supabase);
}

/**
 * Get the rate limit configuration
 */
export function getRateLimitConfig() {
  return {
    maxAttempts: MAX_ATTEMPTS,
    windowMs: WINDOW_MS,
    windowMinutes: WINDOW_MS / 60000,
  };
}
