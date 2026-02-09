/**
 * Property-Based Tests for Token Service
 * 
 * Feature: authentication-flow-optimization
 * Validates: Requirements 5.2, 5.3, 9.2, 9.3, 5.7, 9.6
 * 
 * Tests universal properties that should hold for all token operations:
 * - Property 12: Token Uniqueness - All generated tokens must be unique
 * - Property 13: Verification Token Expiration - Verification tokens expire after 24 hours
 * - Property 14: Password Reset Token Expiration - Reset tokens expire after 1 hour
 * - Property 15: Token Validation - Valid tokens succeed and mark as used
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TokenService, TokenError, type TokenType } from '../token.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the Supabase admin client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

// Import after mocking
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Helper to create a mock Supabase client with in-memory token storage
 */
function createMockSupabaseClient() {
  const tokens = new Map<string, any>();
  
  const mockClient = {
    from: vi.fn((table: string) => {
      if (table !== 'email_verification_tokens') {
        throw new Error(`Unexpected table: ${table}`);
      }
      
      return {
        insert: vi.fn((data: any) => {
          const tokenData = Array.isArray(data) ? data[0] : data;
          tokens.set(tokenData.token, {
            id: crypto.randomUUID(),
            user_id: tokenData.user_id,
            token: tokenData.token,
            token_type: tokenData.token_type,
            expires_at: tokenData.expires_at,
            used_at: null,
            created_at: new Date().toISOString(),
          });
          return Promise.resolve({ data: tokenData, error: null });
        }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => {
                // This will be called during validation
                // We need to find the token from the chain of eq calls
                return Promise.resolve({ data: null, error: null });
              }),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }),
  } as unknown as SupabaseClient;

  return { mockClient, tokens };
}

/**
 * Helper to create a mock client with custom behavior for validation tests
 */
function createMockSupabaseClientWithValidation(tokens: Map<string, any>) {
  const mockClient = {
    from: vi.fn((_table: string) => ({
      insert: vi.fn((data: any) => {
        const tokenData = Array.isArray(data) ? data[0] : data;
        tokens.set(tokenData.token, {
          id: crypto.randomUUID(),
          user_id: tokenData.user_id,
          token: tokenData.token,
          token_type: tokenData.token_type,
          expires_at: tokenData.expires_at,
          used_at: null,
          created_at: new Date().toISOString(),
        });
        return Promise.resolve({ data: tokenData, error: null });
      }),
      select: vi.fn((_columns: string) => ({
        eq: vi.fn((_column: string, value: any) => ({
          eq: vi.fn((_column2: string, value2: any) => ({
            single: vi.fn(() => {
              // Find token by the first eq call (token value)
              const tokenData = tokens.get(value);
              if (!tokenData || tokenData.token_type !== value2) {
                return Promise.resolve({ data: null, error: null });
              }
              return Promise.resolve({ data: tokenData, error: null });
            }),
          })),
        })),
      })),
      update: vi.fn((data: any) => ({
        eq: vi.fn((_column: string, value: any) => {
          const tokenData = tokens.get(value);
          if (tokenData) {
            tokenData.used_at = data.used_at;
          }
          return Promise.resolve({ error: null });
        }),
      })),
    })),
  } as unknown as SupabaseClient;

  return mockClient;
}

describe('Token Service - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 12: Token Uniqueness
   * **Validates: Requirements 5.2, 9.2**
   * 
   * For any set of token generation requests, all generated tokens must be unique.
   * This ensures no token collisions occur even when generating many tokens.
   */
  describe('Property 12: Token Uniqueness', () => {
    it('should generate unique tokens for multiple users', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of user IDs (10-50 users)
          fc.array(fc.uuid(), { minLength: 10, maxLength: 50 }),
          // Generate token types
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          async (userIds, tokenType) => {
            const { mockClient } = createMockSupabaseClient();
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            const generatedTokens: string[] = [];

            // Generate tokens for all users
            for (const userId of userIds) {
              const result = await tokenService.generate(userId, tokenType);
              generatedTokens.push(result.token);
            }

            // Verify all tokens are unique
            const uniqueTokens = new Set(generatedTokens);
            expect(uniqueTokens.size).toBe(generatedTokens.length);

            // Verify all tokens are 64 hex characters
            for (const token of generatedTokens) {
              expect(token).toMatch(/^[a-f0-9]{64}$/i);
              expect(token.length).toBe(64);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique tokens for the same user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          fc.integer({ min: 5, max: 20 }),
          async (userId, tokenType, count) => {
            const { mockClient } = createMockSupabaseClient();
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            const generatedTokens: string[] = [];

            // Generate multiple tokens for the same user
            for (let i = 0; i < count; i++) {
              const result = await tokenService.generate(userId, tokenType);
              generatedTokens.push(result.token);
            }

            // Verify all tokens are unique even for the same user
            const uniqueTokens = new Set(generatedTokens);
            expect(uniqueTokens.size).toBe(generatedTokens.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Verification Token Expiration
   * **Validates: Requirements 5.3**
   * 
   * For any verification token, the token must expire exactly 24 hours after creation.
   */
  describe('Property 13: Verification Token Expiration', () => {
    it('should set verification token expiration to 24 hours', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const { mockClient } = createMockSupabaseClient();
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            const beforeGeneration = new Date();
            
            const result = await tokenService.generate(userId, 'verification');
            
            const afterGeneration = new Date();

            // Calculate expected expiration (24 hours from now)
            const expectedExpiryMin = new Date(beforeGeneration);
            expectedExpiryMin.setHours(expectedExpiryMin.getHours() + 24);
            
            const expectedExpiryMax = new Date(afterGeneration);
            expectedExpiryMax.setHours(expectedExpiryMax.getHours() + 24);

            // Verify expiration is within the expected range
            expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiryMin.getTime());
            expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiryMax.getTime());

            // Verify it's approximately 24 hours (within 1 second tolerance)
            const hoursDifference = (result.expiresAt.getTime() - beforeGeneration.getTime()) / (1000 * 60 * 60);
            expect(hoursDifference).toBeGreaterThanOrEqual(23.999);
            expect(hoursDifference).toBeLessThanOrEqual(24.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Password Reset Token Expiration
   * **Validates: Requirements 9.3**
   * 
   * For any password reset token, the token must expire exactly 1 hour after creation.
   */
  describe('Property 14: Password Reset Token Expiration', () => {
    it('should set password reset token expiration to 1 hour', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const { mockClient } = createMockSupabaseClient();
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            const beforeGeneration = new Date();
            
            const result = await tokenService.generate(userId, 'password_reset');
            
            const afterGeneration = new Date();

            // Calculate expected expiration (1 hour from now)
            const expectedExpiryMin = new Date(beforeGeneration);
            expectedExpiryMin.setHours(expectedExpiryMin.getHours() + 1);
            
            const expectedExpiryMax = new Date(afterGeneration);
            expectedExpiryMax.setHours(expectedExpiryMax.getHours() + 1);

            // Verify expiration is within the expected range
            expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiryMin.getTime());
            expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiryMax.getTime());

            // Verify it's approximately 1 hour (within 1 second tolerance)
            const hoursDifference = (result.expiresAt.getTime() - beforeGeneration.getTime()) / (1000 * 60 * 60);
            expect(hoursDifference).toBeGreaterThanOrEqual(0.999);
            expect(hoursDifference).toBeLessThanOrEqual(1.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Token Validation
   * **Validates: Requirements 5.7, 9.6**
   * 
   * For any valid, unexpired token:
   * - Validation must succeed and return the user ID
   * - Token must be marked as used after validation
   * - Subsequent validation attempts must fail with TOKEN_USED error
   */
  describe('Property 15: Token Validation', () => {
    it('should validate unexpired tokens and mark them as used', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          async (userId, tokenType) => {
            const tokens = new Map<string, any>();
            const mockClient = createMockSupabaseClientWithValidation(tokens);
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            
            // Generate a token
            const { token } = await tokenService.generate(userId, tokenType);

            // Validate the token (first time should succeed)
            const result = await tokenService.validate(token, tokenType);

            // Verify validation succeeded
            expect(result.valid).toBe(true);
            expect(result.userId).toBe(userId);
            expect(result.error).toBeUndefined();

            // Verify token was marked as used
            const tokenData = tokens.get(token);
            expect(tokenData).toBeDefined();
            expect(tokenData?.used_at).not.toBeNull();

            // Validate again (should fail with TOKEN_USED)
            const secondResult = await tokenService.validate(token, tokenType);
            expect(secondResult.valid).toBe(false);
            expect(secondResult.error).toBe(TokenError.TOKEN_USED);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          async (userId, tokenType) => {
            const tokens = new Map<string, any>();
            const mockClient = createMockSupabaseClientWithValidation(tokens);
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            
            // Generate a token
            const { token } = await tokenService.generate(userId, tokenType);

            // Manually expire the token by setting expires_at to the past
            const tokenData = tokens.get(token);
            if (tokenData) {
              const pastDate = new Date();
              pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago
              tokenData.expires_at = pastDate.toISOString();
            }

            // Validate the expired token
            const result = await tokenService.validate(token, tokenType);

            // Verify validation failed with TOKEN_EXPIRED
            expect(result.valid).toBe(false);
            expect(result.error).toBe(TokenError.TOKEN_EXPIRED);
            expect(result.userId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid token formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid tokens (not 64 hex characters)
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 63 }), // Too short
            fc.string({ minLength: 65, maxLength: 100 }), // Too long
            fc.string({ minLength: 64, maxLength: 64 }).filter(s => !/^[a-f0-9]{64}$/i.test(s)), // Wrong format
            fc.constant(''), // Empty
          ),
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          async (invalidToken, tokenType) => {
            const tokens = new Map<string, any>();
            const mockClient = createMockSupabaseClientWithValidation(tokens);
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();

            // Validate the invalid token
            const result = await tokenService.validate(invalidToken, tokenType);

            // Verify validation failed with TOKEN_INVALID
            expect(result.valid).toBe(false);
            expect(result.error).toBe(TokenError.TOKEN_INVALID);
            expect(result.userId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-existent tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid format but non-existent tokens (64 hex characters)
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
          fc.constantFrom('verification' as TokenType, 'password_reset' as TokenType),
          async (nonExistentToken, tokenType) => {
            const tokens = new Map<string, any>();
            const mockClient = createMockSupabaseClientWithValidation(tokens);
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();

            // Validate a token that was never generated
            const result = await tokenService.validate(nonExistentToken, tokenType);

            // Verify validation failed with TOKEN_NOT_FOUND
            expect(result.valid).toBe(false);
            expect(result.error).toBe(TokenError.TOKEN_NOT_FOUND);
            expect(result.userId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject tokens with wrong token type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const tokens = new Map<string, any>();
            const mockClient = createMockSupabaseClientWithValidation(tokens);
            vi.mocked(createAdminClient).mockReturnValue(mockClient);

            const tokenService = new TokenService();
            
            // Generate a verification token
            const { token } = await tokenService.generate(userId, 'verification');

            // Try to validate it as a password_reset token
            const result = await tokenService.validate(token, 'password_reset');

            // Verify validation failed with TOKEN_NOT_FOUND (wrong type)
            expect(result.valid).toBe(false);
            expect(result.error).toBe(TokenError.TOKEN_NOT_FOUND);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
