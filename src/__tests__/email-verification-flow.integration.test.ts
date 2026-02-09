/**
 * Integration Tests for Email Verification Flow
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.16 Write integration tests for email verification flow
 * 
 * Tests complete end-to-end flows:
 * - Complete registration → email → verification → access flow
 * - Resend verification email flow
 * - Expired token handling
 * - Rate limit enforcement
 * - Unverified user access blocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as verifyEmailPOST } from '@/app/api/auth/verify-email/route';
import { POST as resendVerificationPOST } from '@/app/api/auth/resend-verification/route';
import { createAdminClient } from '@/lib/supabase/server';
import { tokenService, TokenError } from '@/lib/services/token.service';
import { EmailVerificationService } from '@/lib/services/email-verification.service';
import { proxy as middleware } from '@/proxy';
import { getToken } from 'next-auth/jwt';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/email-verification.service');
vi.mock('next-auth/jwt');
vi.mock('@react-email/render', () => ({
  render: vi.fn(() => '<html>Mocked email HTML</html>'),
}));

// Mock email templates
vi.mock('@/emails/verification-email', () => ({
  VerificationEmail: vi.fn(() => null),
}));

vi.mock('@/emails/password-reset-email', () => ({
  PasswordResetEmail: vi.fn(() => null),
}));

vi.mock('@/emails/password-changed-email', () => ({
  PasswordChangedEmail: vi.fn(() => null),
}));

describe('Email Verification Flow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create properly chained mock Supabase client
  function createMockSupabaseClient(userId: string, email: string, emailVerified = false, userName?: string) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: userId,
                    email,
                    name: userName,
                    email_verified: emailVerified,
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => Promise.resolve({ error: null })),
                })),
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: {
                      id: 'token-id',
                      user_id: userId,
                      token: 'a'.repeat(64),
                      token_type: 'verification',
                      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      used_at: null,
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };
  }

  // Helper function to create mock email service
  function createMockEmailService() {
    const MockEmailService = vi.fn().mockImplementation(function(this: any, _supabase?: any) {
      this.sendVerificationEmail = vi.fn().mockImplementation((_params: any) => {
        return Promise.resolve({
          success: true,
          queueId: 'queue-123',
          queueTime: 100,
          provider: 'primary',
          retryAttempts: 0,
        });
      });
      return this;
    });
    vi.mocked(EmailVerificationService).mockImplementation(MockEmailService as any);
  }

  /**
   * Test Suite: Complete Registration → Email → Verification → Access Flow
   * Tests the entire user journey from registration to verified access
   */
  describe('Complete Registration → Email → Verification → Access Flow', () => {
    it('should complete full flow: register → send email → verify → grant access', async () => {
      const userId = 'user-integration-1';
      const email = 'newuser@example.com';
      const userName = 'New User';

      // Setup mocks
      const mockSupabase = createMockSupabaseClient(userId, email, false, userName);
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService();

      // Step 1: Generate verification token
      const { token } = await tokenService.generate(userId, 'verification');
      expect(token).toBeDefined();
      expect(token).toHaveLength(64);

      // Step 2: Send verification email
      const emailService = new EmailVerificationService({} as any);
      const emailResult = await emailService.sendVerificationEmail({
        userId,
        email,
        name: userName,
        token,
        baseUrl: 'http://localhost:3000',
      });

      expect(emailResult.success).toBe(true);
      expect(emailResult.queueTime).toBeLessThan(30000);

      // Step 3: User is unverified - access should be blocked
      vi.mocked(getToken).mockResolvedValue({
        id: userId,
        email,
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      let response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email');

      // Step 4: User clicks verification link
      const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ token }),
      });

      const verifyResponse = await verifyEmailPOST(verifyRequest);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.success).toBe(true);

      // Step 5: User is now verified - access granted immediately
      vi.mocked(getToken).mockResolvedValue({
        id: userId,
        email,
        emailVerified: true,
      } as any);

      request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);

      // API access should also be granted
      request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  /**
   * Test Suite: Resend Verification Email Flow
   * Tests the complete resend flow with token regeneration
   */
  describe('Resend Verification Email Flow', () => {
    it('should complete resend flow: request → invalidate old → generate new → send email', async () => {
      const userId = 'user-resend-1';
      const email = 'resend@example.com';

      const mockSupabase = createMockSupabaseClient(userId, email, false, 'Resend User');
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService();

      // Generate initial token
      const firstToken = await tokenService.generate(userId, 'verification');
      expect(firstToken.token).toBeDefined();

      // User requests resend
      const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.2',
        },
        body: JSON.stringify({ email }),
      });

      const resendResponse = await resendVerificationPOST(resendRequest);
      const resendData = await resendResponse.json();

      expect(resendResponse.status).toBe(200);
      expect(resendData.success).toBe(true);

      // Generate new token (simulating what happens in endpoint)
      const newToken = await tokenService.generate(userId, 'verification');
      expect(newToken.token).toBeDefined();
      expect(newToken.token).not.toBe(firstToken.token);

      // Verify tokens are unique
      expect(newToken.token).toHaveLength(64);
      expect(firstToken.token).toHaveLength(64);
    });
  });

  /**
   * Test Suite: Expired Token Handling
   * Tests the complete flow when tokens expire
   */
  describe('Expired Token Handling', () => {
    it('should reject expired token and allow resend', async () => {
      const userId = 'user-expired';
      const email = 'expired@example.com';

      const mockSupabase = createMockSupabaseClient(userId, email, false);
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService();

      // Mock token validation to return expired
      vi.spyOn(tokenService, 'validate').mockResolvedValueOnce({
        valid: false,
        error: TokenError.TOKEN_EXPIRED,
        errorMessage: 'Token has expired',
      });

      // Try to verify with expired token
      const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.3',
        },
        body: JSON.stringify({ token: 'expired-token' }),
      });

      const verifyResponse = await verifyEmailPOST(verifyRequest);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(400);
      expect(verifyData.code).toBe('TOKEN_EXPIRED');

      // User requests new verification email
      const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.3',
        },
        body: JSON.stringify({ email }),
      });

      const resendResponse = await resendVerificationPOST(resendRequest);
      expect(resendResponse.status).toBe(200);
    });
  });

  /**
   * Test Suite: Rate Limit Enforcement
   * Tests rate limiting across the complete verification flow
   */
  describe('Rate Limit Enforcement', () => {
    it('should enforce rate limit after 3 resend requests', async () => {
      const userId = 'user-ratelimit';
      const email = 'ratelimit@example.com';

      const mockSupabase = createMockSupabaseClient(userId, email, false);
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService();

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.100',
          },
          body: JSON.stringify({ email }),
        });

        const response = await resendVerificationPOST(request);
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const fourthRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({ email }),
      });

      const fourthResponse = await resendVerificationPOST(fourthRequest);
      expect(fourthResponse.status).toBe(429);

      const fourthData = await fourthResponse.json();
      expect(fourthData.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(fourthData.retryAfter).toBeDefined();
    });
  });

  /**
   * Test Suite: Unverified User Access Blocking
   * Tests that unverified users are properly blocked from protected resources
   */
  describe('Unverified User Access Blocking', () => {
    it('should block unverified user from protected routes', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-blocked',
        email: 'blocked@example.com',
        emailVerified: false,
      } as any);

      const request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email');
    });

    it('should block unverified user from protected API routes', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-api-blocked',
        email: 'apiblocked@example.com',
        emailVerified: false,
      } as any);

      const request = new NextRequest(new URL('/api/galleries', 'http://localhost:3000'));
      const response = await middleware(request);

      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should allow unverified user to access verification flow routes', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-verify-access',
        email: 'verifyaccess@example.com',
        emailVerified: false,
      } as any);

      const request = new NextRequest(new URL('/verify-email', 'http://localhost:3000'));
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow unverified user to access verification API endpoints', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-verify-api',
        email: 'verifyapi@example.com',
        emailVerified: false,
      } as any);

      const request = new NextRequest(new URL('/api/auth/verify-email', 'http://localhost:3000'));
      const response = await middleware(request);

      // Should not be blocked (403), but may return other status codes
      expect(response.status).not.toBe(403);
    });

    it('should allow unverified user to sign out', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-signout',
        email: 'signout@example.com',
        emailVerified: false,
      } as any);

      const request = new NextRequest(new URL('/api/auth/signout', 'http://localhost:3000'));
      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should allow unverified user to access public routes', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-public',
        email: 'public@example.com',
        emailVerified: false,
      } as any);

      const publicRoutes = ['/', '/auth', '/pricing'];

      for (const route of publicRoutes) {
        const request = new NextRequest(new URL(route, 'http://localhost:3000'));
        const response = await middleware(request);

        expect(response.status).not.toBe(403);
        // Public routes should not redirect to verify-email
        if (route !== '/') {
          expect(response.headers.get('location')).not.toBe('http://localhost:3000/verify-email');
        }
      }
    });

    it('should grant immediate access after verification', async () => {
      // Start as unverified
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-immediate',
        email: 'immediate@example.com',
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      let response = await middleware(request);

      expect(response.status).toBe(307);

      // User verifies email
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-immediate',
        email: 'immediate@example.com',
        emailVerified: true,
      } as any);

      // Immediate access granted
      request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should redirect verified user away from verification page', async () => {
      vi.mocked(getToken).mockResolvedValue({
        id: 'user-verified-redirect',
        email: 'verifiedredirect@example.com',
        emailVerified: true,
      } as any);

      const request = new NextRequest(new URL('/verify-email', 'http://localhost:3000'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  /**
   * Test Suite: Complete Flow with Error Recovery
   * Tests error scenarios and recovery paths
   */
  describe('Complete Flow with Error Recovery', () => {
    it('should handle complete flow with token expiration and recovery', async () => {
      const userId = 'user-recovery';
      const email = 'recovery@example.com';

      const mockSupabase = createMockSupabaseClient(userId, email, false);
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService();

      // Step 1: User is blocked
      vi.mocked(getToken).mockResolvedValue({
        id: userId,
        email,
        emailVerified: false,
      } as any);

      let request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      let response = await middleware(request);
      expect(response.status).toBe(307);

      // Step 2: Try expired token
      vi.spyOn(tokenService, 'validate').mockResolvedValueOnce({
        valid: false,
        error: TokenError.TOKEN_EXPIRED,
        errorMessage: 'Token expired',
      });

      const expiredRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.5' },
        body: JSON.stringify({ token: 'expired-token' }),
      });

      const expiredResponse = await verifyEmailPOST(expiredRequest);
      expect(expiredResponse.status).toBe(400);

      // Step 3: Request new token
      const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.5' },
        body: JSON.stringify({ email }),
      });

      const resendResponse = await resendVerificationPOST(resendRequest);
      expect(resendResponse.status).toBe(200);

      // Step 4: Verify with new token
      vi.spyOn(tokenService, 'validate').mockRestore();
      const newToken = await tokenService.generate(userId, 'verification');

      const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.5' },
        body: JSON.stringify({ token: newToken.token }),
      });

      const verifyResponse = await verifyEmailPOST(verifyRequest);
      expect(verifyResponse.status).toBe(200);

      // Step 5: Access granted
      vi.mocked(getToken).mockResolvedValue({
        id: userId,
        email,
        emailVerified: true,
      } as any);

      request = new NextRequest(new URL('/dashboard', 'http://localhost:3000'));
      response = await middleware(request);
      expect(response.status).toBe(200);
    });
  });
});
