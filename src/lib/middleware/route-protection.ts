/**
 * Route Protection Logic
 * 
 * Pure functions for determining route protection behavior.
 * Extracted from middleware for testability.
 */

// Routes that require authentication
export const PROTECTED_ROUTES = ['/dashboard', '/settings'];

// Routes that should redirect to dashboard if authenticated
export const AUTH_ROUTES = ['/auth', '/forgot-password', '/reset-password'];

/**
 * Determines if a given pathname is a protected route
 * Protected routes require authentication
 * 
 * @param pathname - The URL pathname to check
 * @returns true if the route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Determines if a given pathname is an auth route
 * Auth routes should redirect authenticated users to dashboard
 * 
 * @param pathname - The URL pathname to check
 * @returns true if the route is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}

/**
 * Result of route protection decision
 */
export type RouteProtectionResult = 
  | { action: 'redirect'; destination: string; includeCallbackUrl?: boolean }
  | { action: 'continue' };

/**
 * Determines the appropriate action for a route based on authentication status
 * 
 * @param pathname - The URL pathname being accessed
 * @param isAuthenticated - Whether the user is authenticated
 * @returns The action to take (redirect or continue)
 */
export function getRouteProtectionAction(
  pathname: string,
  isAuthenticated: boolean
): RouteProtectionResult {
  const protectedRoute = isProtectedRoute(pathname);
  const authRoute = isAuthRoute(pathname);

  // Redirect unauthenticated users from protected routes to /auth
  if (protectedRoute && !isAuthenticated) {
    return {
      action: 'redirect',
      destination: '/auth',
      includeCallbackUrl: true,
    };
  }

  // Redirect authenticated users from auth routes to /dashboard
  if (authRoute && isAuthenticated) {
    return {
      action: 'redirect',
      destination: '/dashboard',
    };
  }

  return { action: 'continue' };
}
