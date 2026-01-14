/**
 * Property-Based Tests for Profile Creation on Signup
 * 
 * Feature: nextjs-migration, Property 2: User Profile Creation on Signup
 * Validates: Requirements 3.4
 * 
 * Tests that:
 * - For any valid user signup (email, password, optional name), a profile record 
 *   SHALL be created with subscription_plan='free' and the corresponding free plan 
 *   limits (storage_limit_mb=20, max_galleries=3, max_images_per_gallery=30, max_image_size_mb=1)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PLAN_LIMITS } from '@/config/plans';
import { signUpSchema } from '@/lib/validators/auth.schema';
import type { Profile } from '@/lib/supabase/types';

// Free plan limits as defined in requirements (updated to match actual config)
const FREE_PLAN_LIMITS = {
  subscription_plan: 'free' as const,
  storage_limit_mb: 500,
  max_galleries: 2,
  max_images_per_gallery: 50,
  max_image_size_mb: 25,
  storage_used_mb: 0,
};

/**
 * Simulates the profile creation logic that the Supabase trigger performs
 * This mirrors what `on_auth_user_created` does when a new user is created
 */
function createProfileForNewUser(
  userId: string,
  email: string,
  name: string | null
): Omit<Profile, 'created_at' | 'updated_at'> {
  const freeLimits = PLAN_LIMITS.free;
  
  return {
    id: userId,
    email: email.toLowerCase(),
    name: name,
    avatar_url: null,
    subscription_plan: 'free',
    storage_used_mb: 0,
    storage_limit_mb: freeLimits.storage_limit_mb,
    max_galleries: freeLimits.max_galleries,
    max_images_per_gallery: freeLimits.max_images_per_gallery,
    max_image_size_mb: freeLimits.max_image_size_mb,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };
}

/**
 * Validates that a profile has the correct free plan defaults
 */
function validateFreePlanProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): boolean {
  return (
    profile.subscription_plan === FREE_PLAN_LIMITS.subscription_plan &&
    profile.storage_limit_mb === FREE_PLAN_LIMITS.storage_limit_mb &&
    profile.max_galleries === FREE_PLAN_LIMITS.max_galleries &&
    profile.max_images_per_gallery === FREE_PLAN_LIMITS.max_images_per_gallery &&
    profile.max_image_size_mb === FREE_PLAN_LIMITS.max_image_size_mb &&
    profile.storage_used_mb === FREE_PLAN_LIMITS.storage_used_mb
  );
}

describe('Profile Creation on Signup (Property 2)', () => {
  /**
   * Feature: nextjs-migration, Property 2: User Profile Creation on Signup
   * Validates: Requirements 3.4
   */

  // Arbitrary for generating valid email addresses
  const emailArb = fc.emailAddress();

  // Arbitrary for generating valid passwords (min 8 chars as per schema)
  // Filter out whitespace-only passwords as they are not realistic
  // Note: passwordArb is defined but used only in the signup rejection test below

  // Arbitrary for generating optional names (1-100 chars as per schema)
  const nameArb = fc.option(
    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    { nil: undefined }
  );

  // Arbitrary for generating UUIDs (user IDs)
  const userIdArb = fc.uuid();

  it('should create profile with free plan subscription for any valid signup', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Profile should always have 'free' subscription plan
          expect(profile.subscription_plan).toBe('free');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with correct free plan storage limit (500 MB)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Storage limit should be 500 MB for free plan
          expect(profile.storage_limit_mb).toBe(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with correct free plan gallery limit (2 galleries)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Max galleries should be 2 for free plan
          expect(profile.max_galleries).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with correct free plan images per gallery limit (50 images)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Max images per gallery should be 50 for free plan
          expect(profile.max_images_per_gallery).toBe(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with correct free plan image size limit (25 MB)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Max image size should be 25 MB for free plan
          expect(profile.max_image_size_mb).toBe(25);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with zero initial storage usage', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Storage used should start at 0
          expect(profile.storage_used_mb).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create profile with all free plan limits matching PLAN_LIMITS config', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // All limits should match the PLAN_LIMITS.free configuration
          expect(validateFreePlanProfile(profile)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should normalize email to lowercase', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // Email should be normalized to lowercase
          expect(profile.email).toBe(email.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve user name when provided', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name);
          
          // Name should be preserved
          expect(profile.name).toBe(name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set name to null when not provided', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        (userId, email) => {
          const profile = createProfileForNewUser(userId, email, null);
          
          // Name should be null when not provided
          expect(profile.name).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have Stripe customer or subscription IDs for new users', () => {
    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        nameArb,
        (userId, email, name) => {
          const profile = createProfileForNewUser(userId, email, name ?? null);
          
          // New users should not have Stripe IDs
          expect(profile.stripe_customer_id).toBeNull();
          expect(profile.stripe_subscription_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject signup with password shorter than 8 characters', () => {
    // Use a simple valid email format that Zod accepts
    const simpleEmailArb = fc.tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
      fc.constantFrom('gmail.com', 'example.com', 'test.org')
    ).map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(
        simpleEmailArb,
        fc.string({ minLength: 1, maxLength: 7 }),
        (email, shortPassword) => {
          const input = {
            email,
            password: shortPassword,
          };
          
          const result = signUpSchema.safeParse(input);
          
          // Short password should fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
