/**
 * Admin Authentication Middleware
 * 
 * Provides authentication and authorization for admin routes.
 * Requirements: 1.1, 1.2, 1.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { createAdminClient } from '@/lib/supabase/server';
import { createAuditLogService, type IAuditLogService } from '@/lib/services/audit-log.service';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Result of admin authentication check
 */
export type AdminAuthResult =
  | { success: true; userId: string; isAdmin: true }
  | { success: false; error: string; status: 401 | 403 };

/**
 * Options for admin authentication
 */
export interface AdminAuthOptions {
  logAttempt?: boolean;
  ipAddress?: string | null;
}

/**
 * Check if a user has admin privileges
 * 
 * @param supabase - Supabase client
 * @param userId - The ID of the user to check
 * @returns true if the user is an admin, false otherwise
 */
export async function checkIsAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    throw error;
  }

  return profile?.is_admin === true;
}

/**
 * Extract IP address from request
 * 
 * @param request - Next.js request object
 * @returns IP address string or null
 */
export function getIpAddress(request: NextRequest): string | null {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : null;
  }

  // Try x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // NextRequest doesn't have ip property in all environments
  return null;
}

/**
 * Log an admin authentication attempt
 * 
 * @param auditLogService - Audit log service instance
 * @param userId - The ID of the user attempting access
 * @param success - Whether the authentication was successful
 * @param ipAddress - The IP address of the request
 */
export async function logAdminAuthAttempt(
  auditLogService: IAuditLogService,
  userId: string,
  success: boolean,
  ipAddress?: string | null
): Promise<void> {
  await auditLogService.log(
    userId,
    'admin_login',
    'system',
    null,
    {
      success,
      timestamp: new Date().toISOString(),
    },
    ipAddress
  );
}

/**
 * Require admin authentication for a request
 * 
 * This function checks if the current user is authenticated and has admin privileges.
 * It returns an AdminAuthResult indicating success or failure.
 * 
 * Requirements:
 * - 1.1: Verify that the user has the admin role
 * - 1.2: Return 403 for non-admin users
 * - 1.4: Log all admin authentication attempts
 * 
 * @param request - Next.js request object (optional, for IP extraction)
 * @param options - Authentication options
 * @returns AdminAuthResult indicating success or failure
 */
export async function requireAdmin(
  request?: NextRequest,
  options: AdminAuthOptions = {}
): Promise<AdminAuthResult> {
  const { logAttempt = true, ipAddress: providedIpAddress } = options;

  // Get the current session
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
    };
  }

  const userId = session.user.id as string;
  const supabase = createAdminClient();
  const ipAddress = providedIpAddress ?? (request ? getIpAddress(request) : null);

  // Check if user is admin
  const isAdmin = await checkIsAdmin(supabase, userId);

  // Log the authentication attempt if enabled
  if (logAttempt) {
    const auditLogService = createAuditLogService(supabase);
    try {
      await logAdminAuthAttempt(auditLogService, userId, isAdmin, ipAddress);
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Failed to log admin auth attempt:', error);
    }
  }

  if (!isAdmin) {
    return {
      success: false,
      error: 'Admin access required',
      status: 403,
    };
  }

  return {
    success: true,
    userId,
    isAdmin: true,
  };
}

/**
 * Create a JSON response for authentication errors
 * 
 * @param result - The failed authentication result
 * @returns NextResponse with appropriate status and error message
 */
export function createAuthErrorResponse(result: AdminAuthResult & { success: false }): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}

/**
 * Higher-order function to wrap an API route handler with admin authentication
 * 
 * @param handler - The route handler function
 * @returns Wrapped handler that checks admin auth first
 */
export function withAdminAuth<T>(
  handler: (
    request: NextRequest,
    context: { userId: string }
  ) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      ) as NextResponse<T | { error: string }>;
    }

    return handler(request, { userId: authResult.userId });
  };
}
