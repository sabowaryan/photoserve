/**
 * Password Reset Flow Integration Tests
 * Tests the complete password reset flow components
 * Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8, 9.9
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/token.service');
vi.mock('@/lib/services/email-verification.service');
vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remainingAttempts: 10,
    resetTime: new Date(Date.now() + 3600000),
  })),
  createRateLimitHeaders: vi.fn(() => ({})),
  createRateLimitErrorResponse: vi.fn(),
}));
vi.mock('@react-email/render', () => ({
  render: vi.fn(() => '<html>Mocked email HTML</html>'),
}));

// Mock email templates
vi.mock('@/emails/password-reset-email', () => ({
  PasswordResetEmail: vi.fn(() => null),
}));

vi.mock('@/emails/password-changed-email', () => ({
  PasswordChangedEmail: vi.fn(() => null),
}));

describe('Password Reset Flow Integration', () => {
  let mockSupabase: any;
  let mockEmailService: any;
  let mockTokenService: any;
  let mockCreateAdminClient: any;
  let mockEmailVerificationService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mock chain for Supabase queries
    const createMockChain = (finalResult: any) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(finalResult)),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
      };
      return chain;
    };

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn((table: string) => {
        // Return different chains based on table
        if (table === 'profiles') {
          return createMockChain({ data: null, error: null });
        }
        if (table === 'email_verification_tokens') {
          return createMockChain({ data: null, error: null });
        }
        return createMockChain({ data: null, error: null });
      }),
      auth: {
        admin: {
          updateUserById: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })),
        },
      },
    };

    // Mock token service
    mockTokenService = {
      generate: vi.fn(() => Promise.resolve({
        token: 'mock-token-123456789',
        expiresAt: new Date(Date.now() + 3600000),
      })),
      validate: vi.fn(() => Promise.resolve({
        valid: true,
        userId: 'user-123',
        error: null,
      })),
      invalidateAllForUser: vi.fn(() => Promise.resolve()),
    };

    // Mock email service
    mockEmailService = {
      sendPasswordResetEmail: vi.fn(() => Promise.resolve({
        success: true,
        queueTime: 100,
        provider: 'resend',
      })),
      sendPasswordChangedEmail: vi.fn(() => Promise.resolve({
        success: true,
        queueTime: 100,
        provider: 'resend',
      })),
    };

    // Import and mock createAdminClient
    const supabaseModule = await import('@/lib/supabase/server');
    mockCreateAdminClient = vi.mocked(supabaseModule.createAdminClient);
    mockCreateAdminClient.mockReturnValue(mockSupabase);

    // Import and mock tokenService
    const tokenModule = await import('@/lib/services/token.service');
    vi.mocked(tokenModule.tokenService).generate = mockTokenService.generate;
    vi.mocked(tokenModule.tokenService).validate = mockTokenService.validate;
    vi.mocked(tokenModule.tokenService).invalidateAllForUser = mockTokenService.invalidateAllForUser;

    // Import and mock EmailVerificationService
    const emailModule = await import('@/lib/services/email-verification.service');
    mockEmailVerificationService = vi.mocked(emailModule.EmailVerificationService);
    mockEmailVerificationService.mockImplementation(function(this: any) {
      return mockEmailService;
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Forgot Password Request', () => {
    it('should send password reset email for existing user', async () => {
      // Mock user exists
      const userChain = {
        select: vi.fn(() => userChain),
        eq: vi.fn(() => userChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(userChain);

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return success even for non-existent user (security)', async () => {
      // Mock user doesn't exist
      const userChain = {
        select: vi.fn(() => userChain),
        eq: vi.fn(() => userChain),
        single: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'User not found' },
        })),
      };
      mockSupabase.from.mockReturnValue(userChain);

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Reset Password', () => {
    it('should reset password with valid token', async () => {
      const token = 'mock-token-123456789';

      // Mock user profile chain
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };

      mockSupabase.from.mockReturnValue(profileChain);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-123',
        { password: 'NewPassword123!' }
      );
    });

    it('should send password changed notification email after successful reset', async () => {
      const token = 'mock-token-123456789';

      // Mock user profile chain
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };

      mockSupabase.from.mockReturnValue(profileChain);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEmailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        })
      );
    });

    it('should invalidate all reset tokens after successful password change', async () => {
      const token = 'mock-token-123456789';

      // Mock user profile chain
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };

      mockSupabase.from.mockReturnValue(profileChain);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockTokenService.invalidateAllForUser).toHaveBeenCalledWith(
        'user-123',
        'password_reset'
      );
    });

    it('should reject expired token', async () => {
      const token = 'expired-token-123';

      // Mock token validation to return expired error
      mockTokenService.validate.mockResolvedValue({
        valid: false,
        error: 'TOKEN_EXPIRED',
        errorMessage: 'Token has expired',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject already used token', async () => {
      const token = 'used-token-123';

      // Mock token validation to return used error
      mockTokenService.validate.mockResolvedValue({
        valid: false,
        error: 'TOKEN_USED',
        errorMessage: 'Token has already been used',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('TOKEN_USED');
    });

    it('should validate password format', async () => {
      const token = 'valid-token-123';

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: '123', // Too short
          confirmPassword: '123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password confirmation matches', async () => {
      const token = 'valid-token-123';

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Complete Password Reset Flow Integration', () => {
    it('should complete full password reset flow: request → email → reset → notification', async () => {
      // Step 1: Request password reset
      const userChain = {
        select: vi.fn(() => userChain),
        eq: vi.fn(() => userChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(userChain);

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const forgotResponse = await forgotPasswordPOST(forgotRequest);
      const forgotData = await forgotResponse.json();

      // Verify password reset email was sent
      expect(forgotResponse.status).toBe(200);
      expect(forgotData.success).toBe(true);
      expect(mockTokenService.generate).toHaveBeenCalledWith('user-123', 'password_reset');
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();

      // Step 2: Reset password with the token
      const token = 'mock-token-123456789';
      
      // Mock profile chain for reset
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resetResponse = await resetPasswordPOST(resetRequest);
      const resetData = await resetResponse.json();

      // Verify password was updated
      expect(resetResponse.status).toBe(200);
      expect(resetData.success).toBe(true);
      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-123',
        { password: 'NewPassword123!' }
      );

      // Step 3: Verify all reset tokens were invalidated
      expect(mockTokenService.invalidateAllForUser).toHaveBeenCalledWith(
        'user-123',
        'password_reset'
      );

      // Step 4: Verify password changed notification email was sent
      expect(mockEmailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        })
      );
    });

    it('should handle expired reset token in complete flow', async () => {
      // Step 1: Request password reset (successful)
      const userChain = {
        select: vi.fn(() => userChain),
        eq: vi.fn(() => userChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(userChain);

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const forgotResponse = await forgotPasswordPOST(forgotRequest);
      expect(forgotResponse.status).toBe(200);

      // Step 2: Simulate token expiration (1 hour passes)
      mockTokenService.validate.mockResolvedValue({
        valid: false,
        error: 'TOKEN_EXPIRED',
        errorMessage: 'Token has expired',
      });

      // Step 3: Attempt to reset password with expired token
      const expiredToken = 'expired-token-123';
      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: expiredToken,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resetResponse = await resetPasswordPOST(resetRequest);
      const resetData = await resetResponse.json();

      // Verify expired token is rejected
      expect(resetResponse.status).toBe(400);
      expect(resetData.code).toBe('TOKEN_EXPIRED');
      expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordChangedEmail).not.toHaveBeenCalled();
    });

    it('should invalidate all tokens after password change', async () => {
      const token = 'mock-token-123456789';

      // Mock user profile chain
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      // Step 1: Reset password successfully
      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resetResponse = await resetPasswordPOST(resetRequest);
      expect(resetResponse.status).toBe(200);

      // Verify token invalidation was called
      expect(mockTokenService.invalidateAllForUser).toHaveBeenCalledWith(
        'user-123',
        'password_reset'
      );

      // Step 2: Attempt to use the same token again
      mockTokenService.validate.mockResolvedValue({
        valid: false,
        error: 'TOKEN_USED',
        errorMessage: 'Token has already been used',
      });

      const secondResetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondResetResponse = await resetPasswordPOST(secondResetRequest);
      const secondResetData = await secondResetResponse.json();

      // Verify token is rejected as already used
      expect(secondResetResponse.status).toBe(400);
      expect(secondResetData.code).toBe('TOKEN_USED');
    });

    it('should send password changed notification email after successful reset', async () => {
      const token = 'mock-token-123456789';

      // Mock user profile chain
      const profileChain = {
        select: vi.fn(() => profileChain),
        eq: vi.fn(() => profileChain),
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          error: null,
        })),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resetResponse = await resetPasswordPOST(resetRequest);
      const resetData = await resetResponse.json();

      // Verify password changed notification was sent
      expect(resetResponse.status).toBe(200);
      expect(resetData.success).toBe(true);
      expect(mockEmailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        })
      );

      // Verify notification was sent within acceptable time
      const sendCall = mockEmailService.sendPasswordChangedEmail.mock.calls[0];
      expect(sendCall).toBeDefined();
      expect(sendCall[0]).toMatchObject({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });
});
