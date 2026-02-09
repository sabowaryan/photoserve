/**
 * Token Service
 * Handles generation, validation, and invalidation of email verification and password reset tokens
 * 
 * Requirements: 5.2, 5.3, 9.2, 9.3, 21.5
 * Task: 5.2 Implement token generation and validation service
 * 
 * Features:
 * - Cryptographically secure token generation using crypto.randomBytes
 * - Token expiration logic (24 hours for verification, 1 hour for reset)
 * - Single-use token enforcement
 * - Comprehensive error handling
 */

import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

// Token expiration times
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

// Token types
export type TokenType = 'verification' | 'password_reset';

// Token validation error types
export enum TokenError {
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_USED = 'TOKEN_USED',
  TOKEN_INVALID = 'TOKEN_INVALID',
}

// Token validation result
export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  error?: TokenError;
  errorMessage?: string;
}

// Token generation result
export interface TokenGenerationResult {
  token: string;
  expiresAt: Date;
}

export interface ITokenService {
  generate(userId: string, tokenType: TokenType): Promise<TokenGenerationResult>;
  validate(token: string, tokenType: TokenType): Promise<TokenValidationResult>;
  invalidate(token: string): Promise<void>;
  invalidateAllForUser(userId: string, tokenType: TokenType): Promise<void>;
}

export class TokenService implements ITokenService {
  /**
   * Generate a cryptographically secure token
   * Uses crypto.randomBytes for secure random token generation
   * 
   * @param userId - The user ID to associate with the token
   * @param tokenType - The type of token (verification or password_reset)
   * @returns Token string and expiration date
   */
  async generate(userId: string, tokenType: TokenType): Promise<TokenGenerationResult> {
    try {
      // Generate a cryptographically secure random token (32 bytes = 64 hex characters)
      const token = randomBytes(32).toString('hex');

      // Calculate expiration time based on token type
      const expiryHours = tokenType === 'verification' 
        ? VERIFICATION_TOKEN_EXPIRY_HOURS 
        : PASSWORD_RESET_TOKEN_EXPIRY_HOURS;
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      // Store token in database
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: userId,
          token,
          token_type: tokenType,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('[TokenService] Failed to store token:', error);
        throw new Error('Failed to generate token');
      }

      return {
        token,
        expiresAt,
      };
    } catch (error) {
      console.error('[TokenService] Error generating token:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Validate a token and return the associated user ID
   * Checks for token existence, expiration, and single-use enforcement
   * 
   * @param token - The token string to validate
   * @param tokenType - The expected token type
   * @returns Validation result with user ID if valid, or error details
   */
  async validate(token: string, tokenType: TokenType): Promise<TokenValidationResult> {
    try {
      // Validate token format (should be 64 hex characters)
      if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
        return {
          valid: false,
          error: TokenError.TOKEN_INVALID,
          errorMessage: 'Invalid token format',
        };
      }

      const supabase = createAdminClient();

      // Fetch token from database
      const { data: tokenData, error: fetchError } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('token', token)
        .eq('token_type', tokenType)
        .single();

      if (fetchError || !tokenData) {
        return {
          valid: false,
          error: TokenError.TOKEN_NOT_FOUND,
          errorMessage: 'Token not found',
        };
      }

      // Type assertion for email_verification_tokens table
      const token_data = tokenData as {
        id: string;
        user_id: string;
        token: string;
        token_type: string;
        expires_at: string;
        used_at: string | null;
        created_at: string;
      };

      // Check if token has already been used
      if (token_data.used_at) {
        return {
          valid: false,
          error: TokenError.TOKEN_USED,
          errorMessage: 'Token has already been used',
        };
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(token_data.expires_at);
      
      if (now > expiresAt) {
        return {
          valid: false,
          error: TokenError.TOKEN_EXPIRED,
          errorMessage: 'Token has expired',
        };
      }

      // Token is valid - mark it as used
      const { error: updateError } = await supabase
        .from('email_verification_tokens')
        .update({ used_at: now.toISOString() })
        .eq('token', token);

      if (updateError) {
        console.error('[TokenService] Failed to mark token as used:', updateError);
        // Don't fail validation, but log the error
      }

      return {
        valid: true,
        userId: token_data.user_id,
      };
    } catch (error) {
      console.error('[TokenService] Error validating token:', error);
      return {
        valid: false,
        error: TokenError.TOKEN_INVALID,
        errorMessage: 'Error validating token',
      };
    }
  }

  /**
   * Invalidate a specific token by marking it as used
   * 
   * @param token - The token string to invalidate
   */
  async invalidate(token: string): Promise<void> {
    try {
      const supabase = createAdminClient();
      const now = new Date();

      const { error } = await supabase
        .from('email_verification_tokens')
        .update({ used_at: now.toISOString() })
        .eq('token', token);

      if (error) {
        console.error('[TokenService] Failed to invalidate token:', error);
        throw new Error('Failed to invalidate token');
      }
    } catch (error) {
      console.error('[TokenService] Error invalidating token:', error);
      throw new Error('Failed to invalidate token');
    }
  }

  /**
   * Invalidate all tokens for a user of a specific type
   * Useful when generating a new token to invalidate previous ones
   * 
   * @param userId - The user ID whose tokens should be invalidated
   * @param tokenType - The type of tokens to invalidate
   */
  async invalidateAllForUser(userId: string, tokenType: TokenType): Promise<void> {
    try {
      const supabase = createAdminClient();
      const now = new Date();

      // Mark all unused tokens of this type for this user as used
      const { error } = await supabase
        .from('email_verification_tokens')
        .update({ used_at: now.toISOString() })
        .eq('user_id', userId)
        .eq('token_type', tokenType)
        .is('used_at', null);

      if (error) {
        console.error('[TokenService] Failed to invalidate user tokens:', error);
        throw new Error('Failed to invalidate user tokens');
      }
    } catch (error) {
      console.error('[TokenService] Error invalidating user tokens:', error);
      throw new Error('Failed to invalidate user tokens');
    }
  }
}

/**
 * Factory function to create a TokenService instance
 */
export function createTokenService(): ITokenService {
  return new TokenService();
}

/**
 * Singleton instance of TokenService
 */
export const tokenService = new TokenService();
