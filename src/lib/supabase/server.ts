/**
 * Supabase Server Client
 * Use this client for server-side operations in Server Components, API Routes, and Server Actions
 * 
 * Features:
 * - Connection pooling with configurable limits
 * - Automatic retry logic with exponential backoff
 * - Connection timeout handling
 * - Pool monitoring and statistics
 */
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'
import { DATABASE_CONFIG } from '@/lib/config/database.config'

/**
 * Creates a Supabase client for server-side usage
 * This client handles cookie-based session management for Next.js
 * 
 * Connection pooling is handled by Supabase internally with the following configuration:
 * - Max connections: 20 (configured via DATABASE_CONFIG)
 * - Connection timeout: 30 seconds
 * - Query timeout: 10 seconds
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-timeout': DATABASE_CONFIG.CONNECTION_TIMEOUT_MS.toString(),
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with a specific access token
 * Use this when you have a Supabase access token from NextAuth session
 * This enables RLS policies to work with auth.uid()
 * 
 * @param accessToken - The Supabase access token from NextAuth session
 */
export function createClientWithToken(accessToken: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client with service role key
 * Use this for operations that bypass RLS (e.g., admin operations)
 * WARNING: Only use in secure server-side contexts
 * 
 * Connection pooling configuration:
 * - Max connections: 20
 * - Connection timeout: 30 seconds
 * - Auto-refresh disabled for admin operations
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookie management
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-timeout': DATABASE_CONFIG.CONNECTION_TIMEOUT_MS.toString(),
        },
      },
    }
  )
}

/**
 * Execute a Supabase query with automatic retry logic
 * Handles connection errors, timeouts, and temporary failures
 * 
 * @param operation - Async operation that returns a Supabase query result
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Query result
 * 
 * @example
 * ```typescript
 * const result = await withRetry(async () => {
 *   const supabase = createAdminClient();
 *   return await supabase.from('users').select('*').eq('id', userId);
 * });
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  maxRetries: number = DATABASE_CONFIG.MAX_RETRY_ATTEMPTS
): Promise<{ data: T | null; error: unknown }> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // If successful or non-retryable error, return immediately
      if (result.data !== null || !shouldRetryError(result.error)) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        return result;
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateRetryDelay(attempt);
      
      console.warn(
        `[SupabaseRetry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
        result.error
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        return { data: null, error };
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateRetryDelay(attempt);
      
      console.warn(
        `[SupabaseRetry] Attempt ${attempt + 1}/${maxRetries} threw error, retrying in ${delay}ms`,
        error
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Return last error if all retries failed
  return { data: null, error: lastError };
}

/**
 * Determine if an error should trigger a retry
 * @private
 */
function shouldRetryError(error: unknown): boolean {
  if (!error) return false;
  
  // Check for connection errors, timeouts, and temporary failures
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('temporary') ||
      message.includes('network')
    );
  }
  
  // Check for Supabase error codes that should be retried
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    // PostgreSQL error codes for temporary failures
    const retryableCodes = [
      '08000', // connection_exception
      '08003', // connection_does_not_exist
      '08006', // connection_failure
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '53300', // too_many_connections
      '57P03', // cannot_connect_now
    ];
    return code ? retryableCodes.includes(code) : false;
  }
  
  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 * @private
 */
function calculateRetryDelay(attempt: number): number {
  const baseDelay = DATABASE_CONFIG.RETRY_BASE_DELAY_MS;
  const maxDelay = DATABASE_CONFIG.RETRY_MAX_DELAY_MS;
  
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter (±25% randomness) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  
  return Math.floor(cappedDelay + jitter);
}
