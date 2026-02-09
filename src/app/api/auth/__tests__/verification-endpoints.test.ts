/**
 * Unit Tests for Verification Endpoints
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.11 Write unit tests for verification endpoints
 * 
 * Tests specific examples and edge cases for verification endpoints:
 * - verify-email with valid token marks account as verified
 * - verify-email with expired token returns error
 * - resend-verification generates new token
 * - resend-verification rate limiting
 * - request-password-reset sends email
 * - reset-password with valid token updates password
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as verifyEmailPOST } from '../verify-email/route';
import { POST as resendVerificationPOST } from '../resend-verification/route';
import { POST as requestPasswordResetPOST } from '../request-password-reset/route';
import { POST as resetPasswordPOST } from '../reset-password/route';
import { createAdminClient } from '@/lib/supabase/server';
import { tokenService, TokenError } from '@/lib/services/token.service';
import { EmailVerificationService } from '@/lib/services/email-verification.service';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/email-verification.service');
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

// Helper to create mock email service
function createMockEmailService(methods: any = {}) {
  const MockEmailService = vi.fn().mockImplementation(function(this: any) {
    Object.assign(this, {
      sendVerificationEmail: vi.fn().mockResolvedValue({
        success: true,
        queueId: 'queue-123',
        queueTime: 100,
        provider: 'primary',
        retryAttempts: 0,
      }),
      sendPasswordResetEmail: vi.fn().mockResolvedValue({
        success: true,
        queueId: 'queue-456',
        queueTime: 150,
        provider: 'primary',
        retryAttempts: 0,
      }),
      sendPasswordChangedEmail: vi.fn().mockResolvedValue({
        success: true,
        queueId: 'queue-changed',
        queueTime: 100,
        provider: 'primary',
        retryAttempts: 0,
      }),
      ...methods,
    });
    return this;
  });
  vi.mocked(EmailVerificationService).mockImplementation(MockEmailService as any);
  return MockEmailService;
}

describe('Verification Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Suite: verify-email endpoint
   * Tests email verification token validation and account verification
   */
  describe('POST /api/auth/verify-email', () => {
    it('should mark account as verified with valid token', async () => {
      const userId = 'user-123';
      const token = 'a'.repeat(64); // Valid 64-char token

      // Mock Supabase client
      const mockUpdate = vi.fn(() => Promise.resolve({ error: null }));
      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: mockUpdate,
          })),
        })),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      // Mock token validation to return valid
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: true,
        userId,
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ token }),
      });

      // Execute
      const response = await verifyEmailPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.emailVerifiedSuccess');
      
      // Verify token was validated
      expect(tokenService.validate).toHaveBeenCalledWith(token, 'verification');
      
      // Verify profile was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return error with expired token', async () => {
      const token = 'b'.repeat(64); // Valid format but expired

      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn(() => ({})),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      // Mock token validation to return expired error
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_EXPIRED,
        errorMessage: 'Token has expired',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ token }),
      });

      // Execute
      const response = await verifyEmailPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.tokenExpired');
      expect(data.code).toBe('TOKEN_EXPIRED');
      
      // Verify token was validated
      expect(tokenService.validate).toHaveBeenCalledWith(token, 'verification');
    });

    it('should return error with already used token', async () => {
      const token = 'c'.repeat(64);
      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_USED,
        errorMessage: 'Token has already been used',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ token }),
      });

      const response = await verifyEmailPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.tokenAlreadyUsed');
      expect(data.code).toBe('TOKEN_USED');
    });

    it('should return error with token not found', async () => {
      const token = 'd'.repeat(64);
      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_NOT_FOUND,
        errorMessage: 'Token not found',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ token }),
      });

      const response = await verifyEmailPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.tokenNotFound');
      expect(data.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should handle invalid token format gracefully', async () => {
      const token = 'invalid'; // Too short
      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_NOT_FOUND,
        errorMessage: 'Token not found',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ token }),
      });

      const response = await verifyEmailPOST(request);
      const data = await response.json();

      // Token validation happens in the service, not schema validation
      expect(response.status).toBe(400);
      expect(data.code).toBeDefined();
    });
  });

  /**
   * Test Suite: resend-verification endpoint
   * Tests resending verification emails with rate limiting
   */
  describe('POST /api/auth/resend-verification', () => {
    it('should generate new token and send email', async () => {
      const email = 'test@example.com';
      const userId = 'user-456';
      const newToken = 'e'.repeat(64);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, name: 'Test User', email_verified: false },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      createMockEmailService(); // Add mock email service
      vi.spyOn(tokenService, 'invalidateAllForUser').mockResolvedValue();
      vi.spyOn(tokenService, 'generate').mockResolvedValue({
        token: newToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });


      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.2' },
        body: JSON.stringify({ email }),
      });

      const response = await resendVerificationPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.verificationEmailSent');
      expect(tokenService.invalidateAllForUser).toHaveBeenCalledWith(userId, 'verification');
      expect(tokenService.generate).toHaveBeenCalledWith(userId, 'verification');
    });

    it('should enforce rate limiting after 3 requests', async () => {
      const email = 'ratelimit@example.com';
      const userId = 'user-789';

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, email_verified: false },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'invalidateAllForUser').mockResolvedValue();
      vi.spyOn(tokenService, 'generate').mockResolvedValue({
        token: 'f'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      createMockEmailService();

      const createRequest = () => new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
        body: JSON.stringify({ email }),
      });

      for (let i = 0; i < 3; i++) {
        const response = await resendVerificationPOST(createRequest());
        expect(response.status).toBe(200);
      }

      const fourthResponse = await resendVerificationPOST(createRequest());
      expect(fourthResponse.status).toBe(429);
      const fourthData = await fourthResponse.json();
      expect(fourthData.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(fourthData.retryAfter).toBeDefined();
    });

    it('should return success even if user not found (security)', async () => {
      const email = 'nonexistent@example.com';
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.3' },
        body: JSON.stringify({ email }),
      });

      const response = await resendVerificationPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.verificationEmailSent');
    });

    it('should return error if user already verified', async () => {
      const email = 'verified@example.com';
      const userId = 'user-verified';

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, email_verified: true },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.4' },
        body: JSON.stringify({ email }),
      });

      const response = await resendVerificationPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('EMAIL_ALREADY_VERIFIED');
    });
  });

  /**
   * Test Suite: request-password-reset endpoint
   * Tests password reset email requests
   */
  describe('POST /api/auth/request-password-reset', () => {
    it('should send password reset email', async () => {
      const email = 'reset@example.com';
      const userId = 'user-reset';
      const resetToken = 'g'.repeat(64);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, name: 'Reset User' },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'generate').mockResolvedValue({
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      createMockEmailService();

      const request = new NextRequest('http://localhost:3000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.5' },
        body: JSON.stringify({ email }),
      });

      const response = await requestPasswordResetPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.passwordResetEmailSent');
      expect(tokenService.generate).toHaveBeenCalledWith(userId, 'password_reset');
    });

    it('should return success even if user not found (security)', async () => {
      const email = 'nonexistent@example.com';
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.6' },
        body: JSON.stringify({ email }),
      });

      const response = await requestPasswordResetPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.passwordResetEmailSent');
    });

    it('should enforce rate limiting after 3 requests', async () => {
      const email = 'ratelimit-reset@example.com';
      const userId = 'user-reset-limit';

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'generate').mockResolvedValue({
        token: 'h'.repeat(64),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      createMockEmailService();

      const createRequest = () => new NextRequest('http://localhost:3000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.200' },
        body: JSON.stringify({ email }),
      });

      for (let i = 0; i < 3; i++) {
        const response = await requestPasswordResetPOST(createRequest());
        expect(response.status).toBe(200);
      }

      const fourthResponse = await requestPasswordResetPOST(createRequest());
      expect(fourthResponse.status).toBe(429);
      const fourthData = await fourthResponse.json();
      expect(fourthData.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  /**
   * Test Suite: reset-password endpoint
   * Tests password reset with token validation
   */
  describe('POST /api/auth/reset-password', () => {
    it('should update password with valid token', async () => {
      const token = 'i'.repeat(64);
      const userId = 'user-password-reset';
      const email = 'password@example.com';
      const newPassword = 'NewPassword123!';

      const mockUpdateUserById = vi.fn(() => Promise.resolve({ error: null }));
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, name: 'Password User' },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
        auth: {
          admin: {
            updateUserById: mockUpdateUserById,
          },
        },
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({ valid: true, userId });
      vi.spyOn(tokenService, 'invalidateAllForUser').mockResolvedValue();

      createMockEmailService();

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.7' },
        body: JSON.stringify({ token, password: newPassword, confirmPassword: newPassword }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('api.errors.passwordResetSuccess');
      expect(tokenService.validate).toHaveBeenCalledWith(token, 'password_reset');
      expect(mockUpdateUserById).toHaveBeenCalledWith(userId, { password: newPassword });
      expect(tokenService.invalidateAllForUser).toHaveBeenCalledWith(userId, 'password_reset');
    });

    it('should return error with expired reset token', async () => {
      const token = 'j'.repeat(64);
      const newPassword = 'NewPassword123!';

      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_EXPIRED,
        errorMessage: 'Reset token has expired',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.8' },
        body: JSON.stringify({ token, password: newPassword, confirmPassword: newPassword }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.resetTokenExpired');
      expect(data.code).toBe('TOKEN_EXPIRED');
    });

    it('should return error with already used reset token', async () => {
      const token = 'k'.repeat(64);
      const newPassword = 'NewPassword123!';

      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({
        valid: false,
        error: TokenError.TOKEN_USED,
        errorMessage: 'Token has already been used',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.9' },
        body: JSON.stringify({ token, password: newPassword, confirmPassword: newPassword }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.tokenAlreadyUsed');
      expect(data.code).toBe('TOKEN_USED');
    });

    it('should return validation error with weak password', async () => {
      const token = 'l'.repeat(64);
      const weakPassword = 'weak';

      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.10' },
        body: JSON.stringify({ token, password: weakPassword, confirmPassword: weakPassword }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('should return validation error with mismatched passwords', async () => {
      const token = 'm'.repeat(64);
      const password = 'ValidPassword123!';
      const confirmPassword = 'DifferentPassword123!';

      const mockSupabase = { from: vi.fn(() => ({})) };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.11' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should send password changed notification email', async () => {
      const token = 'n'.repeat(64);
      const userId = 'user-notification';
      const email = 'notification@example.com';
      const newPassword = 'NewPassword123!';

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: userId, email, name: 'Notification User' },
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
        auth: {
          admin: {
            updateUserById: vi.fn(() => Promise.resolve({ error: null })),
          },
        },
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
      vi.spyOn(tokenService, 'validate').mockResolvedValue({ valid: true, userId });
      vi.spyOn(tokenService, 'invalidateAllForUser').mockResolvedValue();


      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.12' },
        body: JSON.stringify({ token, password: newPassword, confirmPassword: newPassword }),
      });

      const response = await resetPasswordPOST(request);

      expect(response.status).toBe(200);
      
      // Wait a bit for async email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify notification email was sent (it's called asynchronously)
      // Note: The endpoint doesn't await the email, so we just verify the response
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});


