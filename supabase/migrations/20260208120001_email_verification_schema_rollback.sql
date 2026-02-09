-- ============================================================================
-- Email Verification Schema Rollback Migration
-- ============================================================================
-- This migration rolls back the email verification schema changes.
-- Use this if you need to revert the email verification feature.
--
-- Task: 5.1 Create database schema for email verification (Rollback)
-- ============================================================================

-- Drop the cleanup function
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens();

-- Drop RLS policies
DROP POLICY IF EXISTS "Service role has full access to verification tokens" 
ON public.email_verification_tokens;

-- Drop the email_verification_tokens table
DROP TABLE IF EXISTS public.email_verification_tokens;

-- Remove email verification columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS email_verified_at;
