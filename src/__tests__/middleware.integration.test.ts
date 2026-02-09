/**
 * Integration Tests for Email Verification Middleware
 * 
 * Tests the complete flow of email verification access control including:
 * - User registration → unverified state → blocked access
 * - Email verification → verified state → granted access
 * - Sign-out functionality for unverified users
 * 
 * Requirements:
 * - 6.1: Redirect unverified users to /verify-email page
 * - 6.2: Block API access for unverified users (return 403)
 * - 6.5: Allow sign-out for unverified users
 * - 6.6: Grant immediate access after verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy as middleware } from '@/proxy';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
}));

import { getToken } from 'next-auth/jwt';

describe('Email Verification Middleware - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Journey: Registration → Verification → Access', () => {
    it('should block unverified user, then grant access after verification', async () => {
      // Step 1: User just registered (unverified)
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'newuser@example.com',
        emailVerified: false,
      } as any);

      // Try to access dashboard - should be redirected to verify-email
      let request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      let response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email');

      // Try to access API - should be blocked with 403
      request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(403);
      const apiError = await response.json();
      expect(apiError.code).toBe('EMAIL_NOT_VERIFIED');

      // User can still sign out
      request = new NextRequest(new URL('/api/auth/signout', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).not.toBe(403);

      // Step 2: User verifies email (emailVerified becomes true)
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'newuser@example.com',
        emailVerified: true,
      } as any);

      // Now can access dashboard immediately (Requirement 6.6)
      request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);

      // Now can access API routes
      request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);

      // Trying to access /verify-email redirects to dashboard
      request = new NextRequest(new URL('/verify-email', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Unverified User Workflow', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-456',
        email: 'unverified@example.com',
        emailVerified: false,
      } as any);
    });

    it('should allow unverified user to complete verification flow', async () => {
      // Can access verification page
      let request = new NextRequest(new URL('/verify-email', 'http://localhost:3000'));
      let response = await middleware(request);
      expect(response.status).toBe(200);

      // Can resend verification email
      request = new NextRequest(new URL('/api/auth/resend-verification', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).not.toBe(403);

      // Can verify email
      request = new NextRequest(new URL('/api/auth/verify-email', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).not.toBe(403);

      // Can access success page
      request = new NextRequest(new URL('/verify-email/success', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).toBe(200);
    });

    it('should block all protected routes for unverified user', async () => {
      const protectedRoutes = [
        '/dashboard',
        '/settings',
        '/revenue',
        '/admin',
      ];

      for (const route of protectedRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email');
      }
    });

    it('should block all protected API routes for unverified user', async () => {
      const protectedApiRoutes = [
        '/api/galleries',
        '/api/images/upload',
        '/api/profile',
        '/api/stripe/checkout',
        '/api/admin/users',
      ];

      for (const route of protectedApiRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.code).toBe('EMAIL_NOT_VERIFIED');
      }
    });
  });

  describe('Verified User Workflow', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-789',
        email: 'verified@example.com',
        emailVerified: true,
      } as any);
    });

    it('should grant full access to verified user', async () => {
      // Can access all protected pages
      const protectedRoutes = [
        '/dashboard',
        '/settings',
        '/revenue',
      ];

      for (const route of protectedRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);
        expect(response.status).toBe(200);
      }

      // Can access all protected API routes
      const protectedApiRoutes = [
        '/api/galleries',
        '/api/images/upload',
        '/api/profile',
      ];

      for (const route of protectedApiRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);
        expect(response.status).toBe(200);
      }
    });

    it('should redirect verified user away from verification pages', async () => {
      const verificationRoutes = [
        '/verify-email',
        '/verify-email/success',
      ];

      for (const route of verificationRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);

        if (route === '/verify-email') {
          // Main verification page redirects to dashboard
          expect(response.status).toBe(307);
          expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
        } else {
          // Success/error pages are allowed (user might have just verified)
          expect(response.status).toBe(200);
        }
      }
    });
  });

  describe('Public Access', () => {
    it('should allow public access regardless of authentication state', async () => {
      const publicRoutes = [
        '/',
        '/auth',
        '/pricing',
        '/features',
        '/contact',
      ];

      // Test with no authentication
      vi.mocked(getToken).mockResolvedValue(null);

      for (const route of publicRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      }

      // Test with unverified user
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
      } as any);

      for (const route of publicRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      }

      // Test with verified user
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      } as any);

      for (const route of publicRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('Security: Sign-out for Unverified Users (Requirement 6.5)', () => {
    it('should always allow sign-out regardless of verification status', async () => {
      // Unverified user
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/api/auth/signout', 'http://localhost:3000'));
      let response = await middleware(request);
      expect(response.status).not.toBe(403);

      // Verified user
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      } as any);

      request = new NextRequest(new URL('/api/auth/signout', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).not.toBe(403);

      // No authentication
      vi.mocked(getToken).mockResolvedValue(null);

      request = new NextRequest(new URL('/api/auth/signout', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Immediate Access After Verification (Requirement 6.6)', () => {
    it('should grant immediate access when emailVerified changes from false to true', async () => {
      // Start with unverified user trying to access dashboard
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      let response = await middleware(request);

      // Blocked
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email');

      // User verifies email (emailVerified becomes true)
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      } as any);

      // Immediate access granted (no re-authentication required)
      request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should grant immediate API access when emailVerified changes from false to true', async () => {
      // Start with unverified user trying to access API
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      let response = await middleware(request);

      // Blocked with 403
      expect(response.status).toBe(403);

      // User verifies email
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      } as any);

      // Immediate API access granted
      request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
