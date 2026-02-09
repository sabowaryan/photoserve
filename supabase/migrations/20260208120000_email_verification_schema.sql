-- ============================================================================
-- Email Verification Schema Migration
-- ============================================================================
-- This migration adds email verification support to the authentication system.
-- It adds email verification tracking to the profiles table and creates a new
-- table for managing verification and password reset tokens.
--
-- Requirements: 21.1
-- Task: 5.1 Create database schema for email verification
-- ============================================================================

-- Add email verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
  ON public.email_verification_tokens(token);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id 
  ON public.email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at 
  ON public.email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_type 
  ON public.email_verification_tokens(user_id, token_type);

-- Enable RLS on email_verification_tokens table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_verification_tokens
-- Only service role should access tokens directly (for security)
-- Users should not be able to view or manipulate tokens directly
CREATE POLICY "Service role has full access to verification tokens"
ON public.email_verification_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.email_verification_tokens IS 
'Stores email verification and password reset tokens. Tokens are single-use and expire after a set period (24 hours for verification, 1 hour for password reset).';

COMMENT ON COLUMN public.email_verification_tokens.token_type IS 
'Type of token: verification (for email verification) or password_reset (for password reset flow)';

COMMENT ON COLUMN public.email_verification_tokens.expires_at IS 
'Token expiration time. Verification tokens expire after 24 hours, password reset tokens after 1 hour.';

COMMENT ON COLUMN public.email_verification_tokens.used_at IS 
'Timestamp when token was used. Tokens can only be used once.';

COMMENT ON COLUMN public.profiles.email_verified IS 
'Whether the user has verified their email address. New users must verify email before accessing protected features.';

COMMENT ON COLUMN public.profiles.email_verified_at IS 
'Timestamp when the user verified their email address.';

-- Function to clean up expired tokens (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete tokens that expired more than 7 days ago
  DELETE FROM public.email_verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_tokens() IS 
'Maintenance function to delete expired tokens older than 7 days. Should be run periodically via cron job.';
