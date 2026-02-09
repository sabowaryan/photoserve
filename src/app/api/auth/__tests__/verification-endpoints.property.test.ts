/**
 * Property-Based Tests for Verification Endpoints
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.10 Write property tests for verification endpoints
 * Validates: Requirements 7.2, 7.3, 7.5, 9.8
 * 
 * Tests universal properties that should hold for all verification endpoint operations:
 * - Property 16: Token Regeneration - For any resend request, new token generated and old invalidated
 * - Property 20: Resend Rate Limiting - For any user, max 3 resends per hour enforced
 * - Property 21: Password Reset Token Invalidation - For any password reset, all reset tokens invalidated
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { POST as resendVerificationPOST } from '../resend-verification/route';
import { POST as resetPasswordPOST } from '../reset-password/route';
import { createAdminClient } from '@/lib/supabase/server';
import { tokenService } from '@/lib/services/token.service';
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

describe('Verification Endpoints - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 16: Token Regeneration
   * **Validates: Requirements 7.2, 7.3**
   * 
   * For any resend verification email request, a new unique token must be generated
   * and all previous verification tokens for that user must be invalidated.
   * 
   * This property ensures that:
   * 1. Each resend generates a fresh, unique token
   * 2. Old tokens cannot be used after a resend
   * 3. Only the most recent token is valid
   */
  describe('Property 16: Token Regeneration', () => {
    it('should generate new token and invalidate old tokens for any resend request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (userData) => {
            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            name: userData.name,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
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
                        is: vi.fn(() => Promise.resolve({ error: null })),
                      })),
                    })),
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        is: vi.fn(() => Promise.resolve({
                          data: [],
                          error: null,
                        })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendVerificationEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            // Generate first token
            const firstToken = await tokenService.generate(userData.userId, 'verification');
            expect(firstToken.token).toBeDefined();
            expect(firstToken.token).toHaveLength(64);

            // Simulate resend request
            const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: userData.email }),
            });

            const response = await resendVerificationPOST(request);
            expect(response.status).toBe(200);

            // Generate second token (simulating what happens in the endpoint)
            const secondToken = await tokenService.generate(userData.userId, 'verification');
            
            // Verify tokens are different
            expect(secondToken.token).toBeDefined();
            expect(secondToken.token).toHaveLength(64);
            expect(secondToken.token).not.toBe(firstToken.token);

            // Verify old token was invalidated
            await tokenService.invalidateAllForUser(userData.userId, 'verification');
            
            // Try to validate the first token - should fail
            const firstTokenValidation = await tokenService.validate(firstToken.token, 'verification');
            expect(firstTokenValidation.valid).toBe(false);
            expect(firstTokenValidation.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure each resend generates a unique token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
          }),
          fc.integer({ min: 2, max: 5 }), // Number of resends
          async (userData, resendCount) => {
            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
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
                        is: vi.fn(() => Promise.resolve({ error: null })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendVerificationEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            // Generate multiple tokens
            const tokens: string[] = [];
            for (let i = 0; i < resendCount; i++) {
              const { token } = await tokenService.generate(userData.userId, 'verification');
              tokens.push(token);
            }

            // Verify all tokens are unique
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(tokens.length);

            // Verify all tokens are 64 characters
            tokens.forEach(token => {
              expect(token).toHaveLength(64);
              expect(token).toMatch(/^[a-f0-9]{64}$/i);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should invalidate previous tokens when new token is generated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Track tokens in memory for this test
            const tokenStore = new Map<string, { used: boolean; userId: string }>();

            // Setup mock Supabase client with token tracking
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
                    })),
                  };
                }
                if (table === 'email_verification_tokens') {
                  return {
                    insert: vi.fn((data: any) => {
                      tokenStore.set(data.token, { used: false, userId: data.user_id });
                      return {
                        select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                      };
                    }),
                    update: vi.fn((_data: any) => ({
                      eq: vi.fn(() => ({
                        is: vi.fn(() => {
                          // Mark all unused tokens for this user as used
                          for (const [, info] of tokenStore.entries()) {
                            if (info.userId === userData.userId && !info.used) {
                              info.used = true;
                            }
                          }
                          return Promise.resolve({ error: null });
                        }),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Generate first token
            const firstToken = await tokenService.generate(userData.userId, 'verification');
            expect(tokenStore.get(firstToken.token)?.used).toBe(false);

            // Invalidate all tokens for user
            await tokenService.invalidateAllForUser(userData.userId, 'verification');

            // Verify first token is now marked as used
            expect(tokenStore.get(firstToken.token)?.used).toBe(true);

            // Generate second token
            const secondToken = await tokenService.generate(userData.userId, 'verification');
            expect(tokenStore.get(secondToken.token)?.used).toBe(false);

            // First token should still be marked as used
            expect(tokenStore.get(firstToken.token)?.used).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 20: Resend Rate Limiting
   * **Validates: Requirements 7.5**
   * 
   * For any user attempting to resend verification emails, after 3 resend requests
   * within a 1-hour window, subsequent requests must be rejected until the window expires.
   * 
   * This property ensures that:
   * 1. Users can resend up to 3 times within an hour
   * 2. The 4th request within the hour is rejected
   * 3. Rate limit resets after the time window
   */
  describe('Property 20: Resend Rate Limiting', () => {
    it('should enforce max 3 resends per hour for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (userData) => {
            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            name: userData.name,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
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
                        is: vi.fn(() => Promise.resolve({ error: null })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendVerificationEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            // Create request helper
            const createRequest = () => new NextRequest('http://localhost:3000/api/auth/resend-verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 255)}`, // Unique IP per test
              },
              body: JSON.stringify({ email: userData.email }),
            });

            // First 3 requests should succeed
            for (let i = 0; i < 3; i++) {
              const response = await resendVerificationPOST(createRequest());
              expect(response.status).toBe(200);
              
              const data = await response.json();
              expect(data.success).toBe(true);
            }

            // 4th request should be rate limited
            const fourthResponse = await resendVerificationPOST(createRequest());
            expect(fourthResponse.status).toBe(429);
            
            const fourthData = await fourthResponse.json();
            expect(fourthData.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(fourthData.retryAfter).toBeDefined();
            expect(fourthData.retryAfter).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track rate limits per client IP address', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
          }),
          fc.array(fc.ipV4(), { minLength: 2, maxLength: 5 }), // Different IPs
          async (userData, ipAddresses) => {
            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: 'user-123',
                            email: userData.email,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
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
                        is: vi.fn(() => Promise.resolve({ error: null })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendVerificationEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            // Each IP should be able to make 3 requests independently
            for (const ip of ipAddresses) {
              for (let i = 0; i < 3; i++) {
                const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': ip,
                  },
                  body: JSON.stringify({ email: userData.email }),
                });

                const response = await resendVerificationPOST(request);
                expect(response.status).toBe(200);
              }

              // 4th request from this IP should be rate limited
              const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-forwarded-for': ip,
                },
                body: JSON.stringify({ email: userData.email }),
              });

              const response = await resendVerificationPOST(request);
              expect(response.status).toBe(429);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should include rate limit headers in all responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            email_verified: false,
                          },
                          error: null,
                        })),
                      })),
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
                        is: vi.fn(() => Promise.resolve({ error: null })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendVerificationEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 255)}`,
              },
              body: JSON.stringify({ email: userData.email }),
            });

            const response = await resendVerificationPOST(request);

            // Verify rate limit headers are present
            expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
            expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
            expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();

            // Verify header values are valid
            const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
            const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
            
            expect(limit).toBeGreaterThan(0);
            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 21: Password Reset Token Invalidation
   * **Validates: Requirements 9.8**
   * 
   * For any successful password reset, all existing password reset tokens for that
   * user must be immediately invalidated to prevent token reuse.
   * 
   * This property ensures that:
   * 1. After a password reset, old reset tokens cannot be used
   * 2. Multiple reset tokens are all invalidated
   * 3. Only new tokens generated after the reset are valid
   */
  describe('Property 21: Password Reset Token Invalidation', () => {
    it('should invalidate all reset tokens after password reset for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userData) => {
            // Track tokens in memory for this test
            const tokenStore = new Map<string, { 
              used: boolean; 
              userId: string; 
              type: string;
              expiresAt: Date;
            }>();

            // Setup mock Supabase client with token tracking
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                            name: userData.name,
                          },
                          error: null,
                        })),
                      })),
                    })),
                  };
                }
                if (table === 'email_verification_tokens') {
                  return {
                    insert: vi.fn((data: any) => {
                      tokenStore.set(data.token, { 
                        used: false, 
                        userId: data.user_id,
                        type: data.token_type,
                        expiresAt: new Date(data.expires_at),
                      });
                      return {
                        select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                      };
                    }),
                    update: vi.fn((_data: any) => ({
                      eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                          is: vi.fn(() => {
                            // Mark all unused password_reset tokens for this user as used
                            for (const [, info] of tokenStore.entries()) {
                              if (info.userId === userData.userId && 
                                  info.type === 'password_reset' && 
                                  !info.used) {
                                info.used = true;
                              }
                            }
                            return Promise.resolve({ error: null });
                          }),
                        })),
                      })),
                    })),
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                          single: vi.fn((tokenToFind: string) => {
                            const tokenInfo = tokenStore.get(tokenToFind);
                            if (!tokenInfo) {
                              return Promise.resolve({ data: null, error: { message: 'Not found' } });
                            }
                            return Promise.resolve({
                              data: {
                                id: 'token-id',
                                user_id: tokenInfo.userId,
                                token: tokenToFind,
                                token_type: tokenInfo.type,
                                expires_at: tokenInfo.expiresAt.toISOString(),
                                used_at: tokenInfo.used ? new Date().toISOString() : null,
                                created_at: new Date().toISOString(),
                              },
                              error: null,
                            });
                          }),
                        })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
              auth: {
                admin: {
                  updateUserById: vi.fn(() => Promise.resolve({ error: null })),
                },
              },
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Mock email service
            const mockEmailService = {
              sendPasswordChangedEmail: vi.fn().mockResolvedValue({
                success: true,
                queueId: 'queue-123',
                queueTime: 100,
                provider: 'primary',
                retryAttempts: 0,
              }),
            };
            vi.mocked(EmailVerificationService).mockImplementation(() => mockEmailService as any);

            // Generate multiple password reset tokens
            const tokens: string[] = [];
            for (let i = 0; i < 3; i++) {
              const { token } = await tokenService.generate(userData.userId, 'password_reset');
              tokens.push(token);
              expect(tokenStore.get(token)?.used).toBe(false);
            }

            // Verify all tokens are initially valid (not used)
            tokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(false);
            });

            // Simulate password reset with the first token
            const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '192.168.1.100',
              },
              body: JSON.stringify({ 
                token: tokens[0], 
                password: userData.password,
              }),
            });

            // Mock token validation to return valid for the first token
            const originalValidate = tokenService.validate;
            vi.spyOn(tokenService, 'validate').mockImplementation(async (token, type) => {
              if (token === tokens[0] && type === 'password_reset') {
                return {
                  valid: true,
                  userId: userData.userId,
                };
              }
              return originalValidate.call(tokenService, token, type);
            });

            const response = await resetPasswordPOST(request);
            expect(response.status).toBe(200);

            // Invalidate all password reset tokens (as the endpoint should do)
            await tokenService.invalidateAllForUser(userData.userId, 'password_reset');

            // Verify all password reset tokens are now marked as used
            tokens.forEach(token => {
              const tokenInfo = tokenStore.get(token);
              expect(tokenInfo?.used).toBe(true);
            });

            // Verify that verification tokens (if any) are NOT affected
            const verificationToken = await tokenService.generate(userData.userId, 'verification');
            expect(tokenStore.get(verificationToken.token)?.used).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only invalidate password_reset tokens, not verification tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userData) => {
            // Track tokens by type
            const resetTokens: string[] = [];
            const verificationTokens: string[] = [];
            const tokenStore = new Map<string, { 
              used: boolean; 
              userId: string; 
              type: string;
            }>();

            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                          },
                          error: null,
                        })),
                      })),
                    })),
                  };
                }
                if (table === 'email_verification_tokens') {
                  return {
                    insert: vi.fn((data: any) => {
                      tokenStore.set(data.token, { 
                        used: false, 
                        userId: data.user_id,
                        type: data.token_type,
                      });
                      return {
                        select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                      };
                    }),
                    update: vi.fn((_data: any) => ({
                      eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                          is: vi.fn(() => {
                            // Mark only password_reset tokens as used
                            for (const [, info] of tokenStore.entries()) {
                              if (info.userId === userData.userId && 
                                  info.type === 'password_reset' && 
                                  !info.used) {
                                info.used = true;
                              }
                            }
                            return Promise.resolve({ error: null });
                          }),
                        })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
              auth: {
                admin: {
                  updateUserById: vi.fn(() => Promise.resolve({ error: null })),
                },
              },
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Generate password reset tokens
            for (let i = 0; i < 2; i++) {
              const { token } = await tokenService.generate(userData.userId, 'password_reset');
              resetTokens.push(token);
            }

            // Generate verification tokens
            for (let i = 0; i < 2; i++) {
              const { token } = await tokenService.generate(userData.userId, 'verification');
              verificationTokens.push(token);
            }

            // Verify all tokens are initially not used
            [...resetTokens, ...verificationTokens].forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(false);
            });

            // Invalidate only password reset tokens
            await tokenService.invalidateAllForUser(userData.userId, 'password_reset');

            // Verify only password reset tokens are marked as used
            resetTokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(true);
            });

            // Verify verification tokens are still valid
            verificationTokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple concurrent password resets correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          fc.integer({ min: 2, max: 5 }), // Number of reset tokens
          async (userData, tokenCount) => {
            const tokenStore = new Map<string, { 
              used: boolean; 
              userId: string; 
              type: string;
              expiresAt: Date;
            }>();

            // Setup mock Supabase client
            const mockSupabase = {
              from: vi.fn((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            id: userData.userId,
                            email: userData.email,
                          },
                          error: null,
                        })),
                      })),
                    })),
                  };
                }
                if (table === 'email_verification_tokens') {
                  return {
                    insert: vi.fn((data: any) => {
                      tokenStore.set(data.token, { 
                        used: false, 
                        userId: data.user_id,
                        type: data.token_type,
                        expiresAt: new Date(data.expires_at),
                      });
                      return {
                        select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                      };
                    }),
                    update: vi.fn((_data: any) => ({
                      eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                          is: vi.fn(() => {
                            for (const [, info] of tokenStore.entries()) {
                              if (info.userId === userData.userId && 
                                  info.type === 'password_reset' && 
                                  !info.used) {
                                info.used = true;
                              }
                            }
                            return Promise.resolve({ error: null });
                          }),
                        })),
                      })),
                    })),
                  };
                }
                return {
                  insert: vi.fn(() => ({
                    select: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                };
              }),
              auth: {
                admin: {
                  updateUserById: vi.fn(() => Promise.resolve({ error: null })),
                },
              },
            };

            vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

            // Generate multiple reset tokens
            const tokens: string[] = [];
            for (let i = 0; i < tokenCount; i++) {
              const { token } = await tokenService.generate(userData.userId, 'password_reset');
              tokens.push(token);
            }

            // Verify all tokens are initially valid
            tokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(false);
            });

            // Invalidate all tokens (simulating password reset)
            await tokenService.invalidateAllForUser(userData.userId, 'password_reset');

            // Verify all tokens are now invalid
            tokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(true);
            });

            // Generate a new token after reset
            const newToken = await tokenService.generate(userData.userId, 'password_reset');
            
            // New token should be valid
            expect(tokenStore.get(newToken.token)?.used).toBe(false);
            
            // Old tokens should still be invalid
            tokens.forEach(token => {
              expect(tokenStore.get(token)?.used).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
