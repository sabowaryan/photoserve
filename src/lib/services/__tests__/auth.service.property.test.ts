/**
 * Property-Based Tests for Auth Service - Password Hashing
 * 
 * Feature: nextjs-migration, Property 1: Password Hashing Consistency
 * Validates: Requirements 3.2, 4.3, 11.6
 * 
 * Tests that:
 * - For any password string, hashing it with bcrypt and then verifying the original 
 *   password against the hash SHALL return true
 * - Verifying a different password against the hash SHALL return false
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';

// Use lower cost factor for testing to speed up execution
// Production uses 10, but for property testing we use 4 (minimum secure value)
const TEST_BCRYPT_ROUNDS = 4;

describe('Auth Service - Password Hashing Consistency (Property 1)', () => {
  /**
   * Feature: nextjs-migration, Property 1: Password Hashing Consistency
   * Validates: Requirements 3.2, 4.3, 11.6
   * 
   * For any password string, hashing it with bcrypt and then verifying the original 
   * password against the hash SHALL return true, and verifying a different password 
   * SHALL return false.
   */

  it('should verify correct passwords after hashing', () => {
    fc.assert(
      fc.property(
        // Generate passwords with reasonable constraints (4-50 chars as per schema)
        fc.string({ minLength: 4, maxLength: 50 }),
        (password) => {
          // Hash the password using bcrypt (sync for speed in tests)
          const hash = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          
          // Verify the original password against the hash
          const isValid = bcrypt.compareSync(password, hash);
          
          // The original password should always verify successfully
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject incorrect passwords after hashing', () => {
    fc.assert(
      fc.property(
        // Generate two different passwords
        fc.string({ minLength: 4, maxLength: 50 }),
        fc.string({ minLength: 4, maxLength: 50 }),
        (password, wrongPassword) => {
          // Precondition: passwords must be different
          fc.pre(password !== wrongPassword);
          
          // Hash the original password
          const hash = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          
          // Verify the wrong password against the hash
          const isValid = bcrypt.compareSync(wrongPassword, hash);
          
          // The wrong password should always fail verification
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce different hashes for the same password (salt uniqueness)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 4, maxLength: 50 }),
        (password) => {
          // Hash the same password twice
          const hash1 = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          const hash2 = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          
          // Hashes should be different due to unique salts
          expect(hash1).not.toBe(hash2);
          
          // But both should verify the original password
          const isValid1 = bcrypt.compareSync(password, hash1);
          const isValid2 = bcrypt.compareSync(password, hash2);
          
          expect(isValid1).toBe(true);
          expect(isValid2).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle passwords with special characters', () => {
    fc.assert(
      fc.property(
        // Generate passwords with unicode and special characters
        fc.string({ minLength: 4, maxLength: 50 }),
        fc.constantFrom(
          '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
          'éàüöñ中文日本語한국어',
          '🔐🔑🔒',
          '\t\n\r',
          '   spaces   ',
        ),
        (basePassword, specialChars) => {
          const password = basePassword + specialChars;
          
          // Hash the password
          const hash = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          
          // Verify the original password
          const isValid = bcrypt.compareSync(password, hash);
          expect(isValid).toBe(true);
          
          // Verify a modified password fails
          const modifiedPassword = password + 'x';
          const isInvalid = bcrypt.compareSync(modifiedPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce valid bcrypt hashes with correct format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 4, maxLength: 50 }),
        (password) => {
          const hash = bcrypt.hashSync(password, TEST_BCRYPT_ROUNDS);
          
          // bcrypt hashes should start with $2a$ or $2b$ and be 60 characters
          expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
          
          // Hash should be exactly 60 characters
          expect(hash.length).toBe(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work with async bcrypt operations consistently', async () => {
    // Test a smaller number of runs with async operations
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 4, maxLength: 50 }),
        async (password) => {
          // Test using bcrypt async methods
          const hash = await bcrypt.hash(password, TEST_BCRYPT_ROUNDS);
          
          // Verify using bcrypt.compare (async)
          const isValidAsync = await bcrypt.compare(password, hash);
          expect(isValidAsync).toBe(true);
          
          // Wrong password should fail
          const wrongPassword = password + '_wrong';
          const isInvalidAsync = await bcrypt.compare(wrongPassword, hash);
          expect(isInvalidAsync).toBe(false);
        }
      ),
      { numRuns: 50 } // Fewer runs for async tests
    );
  }, 30000); // 30 second timeout for async test
});
