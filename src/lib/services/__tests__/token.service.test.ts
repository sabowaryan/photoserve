/**
 * Unit Tests for Token Service
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.4 Write unit tests for token service
 * 
 * Tests specific examples and edge cases for token operations:
 * - Token generation produces 64-character hex strings
 * - Expired token validation returns TOKEN_EXPIRED error
 * - Used token validation returns TOKEN_USED error
 * - Invalid token format returns TOKEN_INVALID error
 * - Token not found returns TOKEN_NOT_FOUND error
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService, TokenError } from '../token.service';
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
    from: vi.fn(() => ({
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
              // This will be overridden in specific tests
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  } as unknown as SupabaseClient;

  return { mockClient, tokens };
}

/**
 * Helper to create a mock client with custom behavior for validation tests
 */
function createMockSupabaseClientWithValidation(tokens: Map<string, any>) {
  const mockClient = {
    from: vi.fn(() => ({
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

describe('Token Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate a 64-character hex string token', async () => {
      const { mockClient } = createMockSupabaseClient();
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-123';
      
      const result = await tokenService.generate(userId, 'verification');

      // Verify token is exactly 64 characters
      expect(result.token).toHaveLength(64);
      
      // Verify token contains only hexadecimal characters (0-9, a-f)
      expect(result.token).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should generate a 64-character hex string for password reset tokens', async () => {
      const { mockClient } = createMockSupabaseClient();
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-456';
      
      const result = await tokenService.generate(userId, 'password_reset');

      // Verify token is exactly 64 characters
      expect(result.token).toHaveLength(64);
      
      // Verify token contains only hexadecimal characters
      expect(result.token).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should generate different tokens on subsequent calls', async () => {
      const { mockClient } = createMockSupabaseClient();
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-789';
      
      const result1 = await tokenService.generate(userId, 'verification');
      const result2 = await tokenService.generate(userId, 'verification');

      // Verify tokens are different
      expect(result1.token).not.toBe(result2.token);
      
      // Both should still be valid 64-character hex strings
      expect(result1.token).toMatch(/^[a-f0-9]{64}$/i);
      expect(result2.token).toMatch(/^[a-f0-9]{64}$/i);
    });
  });

  describe('Token Validation - Expired Tokens', () => {
    it('should return TOKEN_EXPIRED error for expired verification token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-expired';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Manually expire the token by setting expires_at to the past
      const tokenData = tokens.get(token);
      if (tokenData) {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 25); // 25 hours ago (past 24-hour expiry)
        tokenData.expires_at = pastDate.toISOString();
      }

      // Validate the expired token
      const result = await tokenService.validate(token, 'verification');

      // Verify validation failed with TOKEN_EXPIRED
      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_EXPIRED);
      expect(result.errorMessage).toBe('Token has expired');
      expect(result.userId).toBeUndefined();
    });

    it('should return TOKEN_EXPIRED error for expired password reset token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-expired-reset';
      
      // Generate a password reset token
      const { token } = await tokenService.generate(userId, 'password_reset');

      // Manually expire the token by setting expires_at to the past
      const tokenData = tokens.get(token);
      if (tokenData) {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago (past 1-hour expiry)
        tokenData.expires_at = pastDate.toISOString();
      }

      // Validate the expired token
      const result = await tokenService.validate(token, 'password_reset');

      // Verify validation failed with TOKEN_EXPIRED
      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_EXPIRED);
      expect(result.errorMessage).toBe('Token has expired');
      expect(result.userId).toBeUndefined();
    });

    it('should return TOKEN_EXPIRED for token that just expired', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-just-expired';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Set token to expire 1 second ago
      const tokenData = tokens.get(token);
      if (tokenData) {
        const pastDate = new Date();
        pastDate.setSeconds(pastDate.getSeconds() - 1);
        tokenData.expires_at = pastDate.toISOString();
      }

      // Validate the expired token
      const result = await tokenService.validate(token, 'verification');

      // Verify validation failed with TOKEN_EXPIRED
      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_EXPIRED);
    });
  });

  describe('Token Validation - Used Tokens', () => {
    it('should return TOKEN_USED error for already used token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-used';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // First validation should succeed
      const firstResult = await tokenService.validate(token, 'verification');
      expect(firstResult.valid).toBe(true);
      expect(firstResult.userId).toBe(userId);

      // Second validation should fail with TOKEN_USED
      const secondResult = await tokenService.validate(token, 'verification');
      expect(secondResult.valid).toBe(false);
      expect(secondResult.error).toBe(TokenError.TOKEN_USED);
      expect(secondResult.errorMessage).toBe('Token has already been used');
      expect(secondResult.userId).toBeUndefined();
    });

    it('should return TOKEN_USED error for manually marked used token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-manual-used';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'password_reset');

      // Manually mark token as used
      const tokenData = tokens.get(token);
      if (tokenData) {
        tokenData.used_at = new Date().toISOString();
      }

      // Validation should fail with TOKEN_USED
      const result = await tokenService.validate(token, 'password_reset');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_USED);
      expect(result.errorMessage).toBe('Token has already been used');
    });
  });

  describe('Token Validation - Invalid Format', () => {
    it('should return TOKEN_INVALID error for empty string', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();

      const result = await tokenService.validate('', 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
      expect(result.userId).toBeUndefined();
    });

    it('should return TOKEN_INVALID error for token that is too short', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const shortToken = 'abc123'; // Only 6 characters

      const result = await tokenService.validate(shortToken, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });

    it('should return TOKEN_INVALID error for token that is too long', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const longToken = 'a'.repeat(65); // 65 characters (too long)

      const result = await tokenService.validate(longToken, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });

    it('should return TOKEN_INVALID error for token with non-hex characters', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      // 64 characters but contains 'g' and 'z' which are not hex
      const invalidToken = 'g'.repeat(32) + 'z'.repeat(32);

      const result = await tokenService.validate(invalidToken, 'password_reset');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });

    it('should return TOKEN_INVALID error for token with special characters', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      // 64 characters but contains special characters
      const invalidToken = 'abc123!@#$%^&*()_+-=[]{}|;:,.<>?/~`' + 'a'.repeat(30);

      const result = await tokenService.validate(invalidToken, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });

    it('should return TOKEN_INVALID error for null token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();

      const result = await tokenService.validate(null as any, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });

    it('should return TOKEN_INVALID error for undefined token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();

      const result = await tokenService.validate(undefined as any, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_INVALID);
      expect(result.errorMessage).toBe('Invalid token format');
    });
  });

  describe('Token Validation - Not Found', () => {
    it('should return TOKEN_NOT_FOUND error for non-existent token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      // Valid format but doesn't exist in database
      const nonExistentToken = 'a'.repeat(64);

      const result = await tokenService.validate(nonExistentToken, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_NOT_FOUND);
      expect(result.errorMessage).toBe('Token not found');
      expect(result.userId).toBeUndefined();
    });

    it('should return TOKEN_NOT_FOUND error for token with wrong type', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-wrong-type';
      
      // Generate a verification token
      const { token } = await tokenService.generate(userId, 'verification');

      // Try to validate it as a password_reset token
      const result = await tokenService.validate(token, 'password_reset');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_NOT_FOUND);
      expect(result.errorMessage).toBe('Token not found');
      expect(result.userId).toBeUndefined();
    });

    it('should return TOKEN_NOT_FOUND for password reset token validated as verification', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-type-mismatch';
      
      // Generate a password_reset token
      const { token } = await tokenService.generate(userId, 'password_reset');

      // Try to validate it as a verification token
      const result = await tokenService.validate(token, 'verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(TokenError.TOKEN_NOT_FOUND);
      expect(result.errorMessage).toBe('Token not found');
    });
  });

  describe('Token Validation - Success Cases', () => {
    it('should successfully validate a valid unexpired verification token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-valid';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Validate the token
      const result = await tokenService.validate(token, 'verification');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.error).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('should successfully validate a valid unexpired password reset token', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-valid-reset';
      
      // Generate a password reset token
      const { token } = await tokenService.generate(userId, 'password_reset');

      // Validate the token
      const result = await tokenService.validate(token, 'password_reset');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.error).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('should mark token as used after successful validation', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-mark-used';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Verify token is not used initially
      const tokenData = tokens.get(token);
      expect(tokenData?.used_at).toBeNull();

      // Validate the token
      await tokenService.validate(token, 'verification');

      // Verify token is now marked as used
      expect(tokenData?.used_at).not.toBeNull();
      expect(tokenData?.used_at).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with mixed case hex characters', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-mixed-case';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Convert to mixed case (should still be valid as regex is case-insensitive)
      const mixedCaseToken = token.split('').map((char, i) => 
        i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
      ).join('');

      // Store the mixed case version
      const originalData = tokens.get(token);
      if (originalData) {
        tokens.delete(token);
        tokens.set(mixedCaseToken, { ...originalData, token: mixedCaseToken });
      }

      // Validate with mixed case
      const result = await tokenService.validate(mixedCaseToken, 'verification');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
    });

    it('should handle validation of token that expires in the future', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      const userId = 'test-user-future';
      
      // Generate a token
      const { token } = await tokenService.generate(userId, 'verification');

      // Verify token expires in the future
      const tokenData = tokens.get(token);
      const expiresAt = new Date(tokenData?.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

      // Validate should succeed
      const result = await tokenService.validate(token, 'verification');
      expect(result.valid).toBe(true);
    });

    it('should handle multiple different users with different tokens', async () => {
      const tokens = new Map<string, any>();
      const mockClient = createMockSupabaseClientWithValidation(tokens);
      vi.mocked(createAdminClient).mockReturnValue(mockClient);

      const tokenService = new TokenService();
      
      // Generate tokens for multiple users
      const user1 = 'user-1';
      const user2 = 'user-2';
      const user3 = 'user-3';
      
      const token1 = await tokenService.generate(user1, 'verification');
      const token2 = await tokenService.generate(user2, 'verification');
      const token3 = await tokenService.generate(user3, 'password_reset');

      // Validate each token returns correct user
      const result1 = await tokenService.validate(token1.token, 'verification');
      expect(result1.valid).toBe(true);
      expect(result1.userId).toBe(user1);

      const result2 = await tokenService.validate(token2.token, 'verification');
      expect(result2.valid).toBe(true);
      expect(result2.userId).toBe(user2);

      const result3 = await tokenService.validate(token3.token, 'password_reset');
      expect(result3.valid).toBe(true);
      expect(result3.userId).toBe(user3);
    });
  });
});
