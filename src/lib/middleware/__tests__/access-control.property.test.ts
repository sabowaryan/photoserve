/**
 * Property-Based Tests for Email Verification Access Control
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.15 Write property tests for access control
 * Validates: Requirements 6.1, 6.2, 6.5, 6.6
 * 
 * Tests that:
 * - Property 17: For any unverified user, protected routes are blocked
 * - Property 18: For any unverified user, sign out works correctly
 * - Property 19: For any newly verified user, access is immediately granted
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { proxy as middleware } from '@/proxy';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

import { getToken } from 'next-auth/jwt';

describe('Access Control - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: authentication-flow-optimization, Property 17: Unverified Account Access Control
   * Validates: Requirements 6.1, 6.2
   * 
   * For any unverified user, protected routes must be blocked:
   * - Protected pages redirect to /verify-email
   * - Protected API routes return 403 with EMAIL_NOT_VERIFIED code
   */
  describe('Property 17: Unverified Account Access Control', () => {
    it('should block any unverified user from accessing protected page routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate protected route paths
          fc.oneof(
            fc.constant('/dashboard'),
            fc.constant('/settings'),
            fc.constant('/revenue'),
            fc.constant('/admin'),
            // Dashboard sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/dashboard/${suffix}`),
            // Settings sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/settings/${suffix}`),
            // Revenue sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/revenue/${suffix}`),
          ),
          async (userData, protectedRoute) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL(protectedRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must redirect to verification page (Requirement 6.1)
            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe(
              'http://localhost:3000/verify-email'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should block any unverified user from accessing protected API routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate protected API route paths (excluding auth and verification APIs)
          fc.oneof(
            fc.constant('/api/galleries'),
            fc.constant('/api/photos'),
            fc.constant('/api/settings'),
            fc.constant('/api/revenue'),
            fc.constant('/api/admin'),
            // Gallery API sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/api/galleries/${suffix}`),
            // Photos API sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/api/photos/${suffix}`),
          ),
          async (userData, apiRoute) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL(apiRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must return 403 with EMAIL_NOT_VERIFIED code (Requirement 6.2)
            expect(response.status).toBe(403);
            
            const body = await response.json();
            expect(body).toHaveProperty('code', 'EMAIL_NOT_VERIFIED');
            expect(body).toHaveProperty('error');
            expect(body).toHaveProperty('message');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow unverified users to access verification flow routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate verification flow routes
          fc.oneof(
            fc.constant('/verify-email'),
            fc.constant('/verify-email/success'),
            fc.constant('/verify-email/error'),
            fc.constant('/api/auth/verify-email'),
            fc.constant('/api/auth/resend-verification'),
          ),
          async (userData, verificationRoute) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL(verificationRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must allow access to verification routes
            expect(response.status).not.toBe(307); // Not redirected
            expect(response.status).not.toBe(403); // Not forbidden
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow unverified users to access public routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate public routes
          fc.oneof(
            fc.constant('/'),
            fc.constant('/auth'),
            fc.constant('/pricing'),
            fc.constant('/features'),
            fc.constant('/contact'),
            fc.constant('/forgot-password'),
            fc.constant('/reset-password'),
            // Public gallery routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_]+$/.test(s))
              .map(suffix => `/g/${suffix}`),
            // Public profile routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_]+$/.test(s))
              .map(suffix => `/p/${suffix}`),
          ),
          async (userData, publicRoute) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL(publicRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must allow access to public routes
            expect(response.status).not.toBe(403); // Not forbidden
            // May redirect authenticated users from auth routes, but not block
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: authentication-flow-optimization, Property 18: Unverified Account Sign Out
   * Validates: Requirement 6.5
   * 
   * For any unverified user, sign out functionality must work correctly:
   * - Sign out API route must be accessible
   * - Session must be cleared
   */
  describe('Property 18: Unverified Account Sign Out', () => {
    it('should allow any unverified user to access sign out endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (userData) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL('/api/auth/signout', 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must allow access to sign out (Requirement 6.5)
            expect(response.status).not.toBe(403);
            expect(response.status).not.toBe(307);
            
            // Should continue to NextAuth handler
            const location = response.headers.get('location');
            if (location) {
              // If redirected, should not be to verification page
              expect(location).not.toContain('/verify-email');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow unverified users to access all auth API routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate auth API routes
          fc.oneof(
            fc.constant('/api/auth/signout'),
            fc.constant('/api/auth/signin'),
            fc.constant('/api/auth/signup'),
            fc.constant('/api/auth/session'),
            fc.constant('/api/auth/csrf'),
            fc.constant('/api/auth/providers'),
            fc.constant('/api/auth/callback'),
          ),
          async (userData, authApiRoute) => {
            // Mock unverified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: false,
            } as any);

            const request = new NextRequest(
              new URL(authApiRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must allow access to auth API routes (including sign out)
            expect(response.status).not.toBe(403);
            
            // Should not redirect to verification page
            const location = response.headers.get('location');
            if (location) {
              expect(location).not.toContain('/verify-email');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: authentication-flow-optimization, Property 19: Verified Account Access Grant
   * Validates: Requirement 6.6
   * 
   * For any newly verified user, access to protected features must be immediately granted:
   * - Protected routes must be accessible
   * - Protected API routes must be accessible
   * - No verification page redirects
   */
  describe('Property 19: Verified Account Access Grant', () => {
    it('should grant any verified user immediate access to protected page routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate protected route paths
          fc.oneof(
            fc.constant('/dashboard'),
            fc.constant('/settings'),
            fc.constant('/revenue'),
            // Dashboard sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/dashboard/${suffix}`),
            // Settings sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/settings/${suffix}`),
          ),
          async (userData, protectedRoute) => {
            // Mock verified user token (Requirement 6.6)
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: true, // User is verified
            } as any);

            const request = new NextRequest(
              new URL(protectedRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must NOT redirect to verification page
            const location = response.headers.get('location');
            if (location) {
              expect(location).not.toContain('/verify-email');
            }
            
            // Must NOT return 403 forbidden
            expect(response.status).not.toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant any verified user immediate access to protected API routes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate protected API route paths
          fc.oneof(
            fc.constant('/api/galleries'),
            fc.constant('/api/photos'),
            fc.constant('/api/settings'),
            fc.constant('/api/revenue'),
            // Gallery API sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/api/galleries/${suffix}`),
            // Photos API sub-routes
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => /^[a-zA-Z0-9\-_/]+$/.test(s))
              .map(suffix => `/api/photos/${suffix}`),
          ),
          async (userData, apiRoute) => {
            // Mock verified user token (Requirement 6.6)
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: true, // User is verified
            } as any);

            const request = new NextRequest(
              new URL(apiRoute, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must NOT return 403 with EMAIL_NOT_VERIFIED
            if (response.status === 403) {
              const body = await response.json();
              expect(body.code).not.toBe('EMAIL_NOT_VERIFIED');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should redirect verified users away from verification page to dashboard', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (userData) => {
            // Mock verified user token
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: true, // User is verified
            } as any);

            const request = new NextRequest(
              new URL('/verify-email', 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Verified users should be redirected away from verification page
            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe(
              'http://localhost:3000/dashboard'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow verified users to access all routes without verification restrictions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          // Generate various route types
          fc.oneof(
            // Protected routes
            fc.constant('/dashboard'),
            fc.constant('/settings'),
            fc.constant('/revenue'),
            // Public routes
            fc.constant('/'),
            fc.constant('/pricing'),
            // API routes
            fc.constant('/api/galleries'),
            fc.constant('/api/photos'),
          ),
          async (userData, route) => {
            // Mock verified user token (Requirement 6.6)
            vi.mocked(getToken).mockResolvedValue({
              ...userData,
              emailVerified: true, // User is verified
            } as any);

            const request = new NextRequest(
              new URL(route, 'http://localhost:3000')
            );
            const response = await middleware(request);

            // Must NOT be blocked by email verification
            const location = response.headers.get('location');
            if (location) {
              expect(location).not.toContain('/verify-email');
            }
            
            if (response.status === 403) {
              const body = await response.json();
              expect(body.code).not.toBe('EMAIL_NOT_VERIFIED');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
