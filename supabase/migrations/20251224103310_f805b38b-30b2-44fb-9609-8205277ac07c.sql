-- 1. Add RLS policy for rate_limit_attempts (service role only)
-- This table should only be accessed by edge functions using service role
CREATE POLICY "Service role only access"
ON public.rate_limit_attempts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Recreate galleries_public view to ensure password_hash is never exposed
-- First drop the existing view
DROP VIEW IF EXISTS public.galleries_public;

-- Recreate the view without password_hash and only show active, non-expired galleries
CREATE VIEW public.galleries_public AS
SELECT 
  id,
  title,
  unique_slug,
  created_at,
  updated_at,
  expires_at,
  expiration_days,
  views_count,
  is_active
FROM public.galleries
WHERE is_active = true 
  AND expires_at > now();

-- 3. Fix profiles policies - change RESTRICTIVE to PERMISSIVE for proper behavior
-- Drop the conflicting "Block anonymous access" policy (RESTRICTIVE with false blocks everything)
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Drop and recreate profile policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create PERMISSIVE policies that properly restrict to authenticated users
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow profile insertion for new users (triggered by auth)
CREATE POLICY "Allow profile creation for new users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);