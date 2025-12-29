/**
 * Property-Based Tests for Route Protection Logic
 * 
 * Feature: nextjs-migration, Property 21: Protected Route Redirect
 * Validates: Requirements 8.5
 * 
 * Tests that:
 * - For any unauthenticated request to a protected route (/dashboard/*, /settings),
 *   the response SHALL be a redirect to /auth
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isProtectedRoute,
  isAuthRoute,
  getRouteProtectionAction,
} from '../route-protection';

describe('Route Protection - Protected Route Redirect (Property 21)', () => {
  /**
   * Feature: nextjs-migration, Property 21: Protected Route Redirect
   * Validates: Requirements 8.5
   * 
   * For any unauthenticated request to a protected route (/dashboard/*, /settings),
   * the response SHALL be a redirect to /auth.
   */

  it('should redirect unauthenticated users from any protected route to /auth', () => {
    fc.assert(
      fc.property(
        // Generate protected route paths
        fc.oneof(
          // Base protected routes
          fc.constant('/dashboard'),
          fc.constant('/settings'),
          // Dashboard sub-routes
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/dashboard/${suffix}`),
          // Settings sub-routes
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/settings/${suffix}`),
        ),
        (pathname) => {
          const isAuthenticated = false;
          const result = getRouteProtectionAction(pathname, isAuthenticated);

          // Unauthenticated users on protected routes MUST be redirected to /auth
          expect(result.action).toBe('redirect');
          if (result.action === 'redirect') {
            expect(result.destination).toBe('/auth');
            expect(result.includeCallbackUrl).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow authenticated users to access protected routes', () => {
    fc.assert(
      fc.property(
        // Generate protected route paths
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/settings'),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/dashboard/${suffix}`),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/settings/${suffix}`),
        ),
        (pathname) => {
          const isAuthenticated = true;
          const result = getRouteProtectionAction(pathname, isAuthenticated);

          // Authenticated users on protected routes should continue
          expect(result.action).toBe('continue');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redirect authenticated users from auth routes to /dashboard', () => {
    fc.assert(
      fc.property(
        // Generate auth route paths
        fc.oneof(
          fc.constant('/auth'),
          fc.constant('/forgot-password'),
          fc.constant('/reset-password'),
          // Auth sub-routes
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/auth/${suffix}`),
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/forgot-password/${suffix}`),
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/reset-password/${suffix}`),
        ),
        (pathname) => {
          const isAuthenticated = true;
          const result = getRouteProtectionAction(pathname, isAuthenticated);

          // Authenticated users on auth routes MUST be redirected to /dashboard
          expect(result.action).toBe('redirect');
          if (result.action === 'redirect') {
            expect(result.destination).toBe('/dashboard');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow unauthenticated users to access auth routes', () => {
    fc.assert(
      fc.property(
        // Generate auth route paths
        fc.oneof(
          fc.constant('/auth'),
          fc.constant('/forgot-password'),
          fc.constant('/reset-password'),
        ),
        (pathname) => {
          const isAuthenticated = false;
          const result = getRouteProtectionAction(pathname, isAuthenticated);

          // Unauthenticated users on auth routes should continue
          expect(result.action).toBe('continue');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow any user to access public routes', () => {
    fc.assert(
      fc.property(
        // Generate public route paths (not protected, not auth)
        fc.oneof(
          fc.constant('/'),
          fc.constant('/pricing'),
          fc.constant('/legal/terms'),
          fc.constant('/legal/privacy'),
          fc.constant('/g/some-gallery-slug'),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_]+$/.test(s))
            .map(suffix => `/g/${suffix}`),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_]+$/.test(s))
            .map(suffix => `/legal/${suffix}`),
        ),
        fc.boolean(),
        (pathname, isAuthenticated) => {
          const result = getRouteProtectionAction(pathname, isAuthenticated);

          // Public routes should always continue regardless of auth status
          expect(result.action).toBe('continue');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Route Protection - isProtectedRoute function', () => {
  it('should correctly identify protected routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/settings'),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/dashboard/${suffix}`),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/settings/${suffix}`),
        ),
        (pathname) => {
          expect(isProtectedRoute(pathname)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify non-protected routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/'),
          fc.constant('/auth'),
          fc.constant('/pricing'),
          fc.constant('/legal/terms'),
          fc.constant('/g/gallery-slug'),
          fc.constant('/forgot-password'),
          fc.constant('/reset-password'),
        ),
        (pathname) => {
          expect(isProtectedRoute(pathname)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Route Protection - isAuthRoute function', () => {
  it('should correctly identify auth routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/auth'),
          fc.constant('/forgot-password'),
          fc.constant('/reset-password'),
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
            .map(suffix => `/auth/${suffix}`),
        ),
        (pathname) => {
          expect(isAuthRoute(pathname)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify non-auth routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/'),
          fc.constant('/dashboard'),
          fc.constant('/settings'),
          fc.constant('/pricing'),
          fc.constant('/legal/terms'),
          fc.constant('/g/gallery-slug'),
        ),
        (pathname) => {
          expect(isAuthRoute(pathname)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Route Protection - Callback URL inclusion', () => {
  /**
   * Tests that callback URL is included when redirecting from protected routes
   * This allows users to return to their intended destination after login
   */
  it('should include callback URL when redirecting from protected routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/settings'),
          fc.constant('/dashboard/gallery/new'),
          fc.constant('/dashboard/gallery/123'),
          fc.constant('/settings/profile'),
        ),
        (pathname) => {
          const result = getRouteProtectionAction(pathname, false);

          expect(result.action).toBe('redirect');
          if (result.action === 'redirect') {
            expect(result.includeCallbackUrl).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT include callback URL when redirecting authenticated users from auth routes', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/auth'),
          fc.constant('/forgot-password'),
          fc.constant('/reset-password'),
        ),
        (pathname) => {
          const result = getRouteProtectionAction(pathname, true);

          expect(result.action).toBe('redirect');
          if (result.action === 'redirect') {
            // Callback URL should not be included for auth route redirects
            expect(result.includeCallbackUrl).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
