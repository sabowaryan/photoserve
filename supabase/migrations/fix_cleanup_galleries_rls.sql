-- =====================================================
-- Fix RLS for Cleanup Expired Galleries Function
-- =====================================================
-- This migration ensures the cleanup function can access
-- all galleries regardless of RLS policies
-- =====================================================

-- 1. Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('galleries', 'images');

-- 2. Create a policy for service role to access all galleries
-- This allows the cleanup function (using service_role_key) to see all galleries

-- Drop existing service role policy if it exists
DROP POLICY IF EXISTS "Service role can access all galleries" ON galleries;
DROP POLICY IF EXISTS "Service role can delete all galleries" ON galleries;
DROP POLICY IF EXISTS "Service role can access all images" ON images;
DROP POLICY IF EXISTS "Service role can delete all images" ON images;

-- Create policies for service role (used by Edge Functions)
CREATE POLICY "Service role can access all galleries"
ON galleries
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can delete all galleries"
ON galleries
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can access all images"
ON images
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can delete all images"
ON images
FOR DELETE
TO service_role
USING (true);

-- 3. Fix galleries with NULL user_id (guest galleries)
-- These should still be cleanable
UPDATE galleries
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;

-- Add a comment to track guest galleries
COMMENT ON COLUMN galleries.user_id IS 'User ID of gallery owner. Use 00000000-0000-0000-0000-000000000000 for guest galleries';

-- 4. Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('galleries', 'images')
  AND roles @> ARRAY['service_role']
ORDER BY tablename, policyname;

-- 5. Test query that the cleanup function will use
-- This should return all expired galleries
SELECT 
  COUNT(*) as expired_galleries_count
FROM galleries
WHERE expires_at < NOW();

SELECT 
  id,
  title,
  user_id,
  expires_at,
  is_active
FROM galleries
WHERE expires_at < NOW()
ORDER BY expires_at ASC
LIMIT 5;
