-- =====================================================
-- Fix RLS for Cleanup Expired Galleries Function (v2)
-- =====================================================
-- This migration ensures the cleanup function can access
-- all galleries including guest galleries (user_id = NULL)
-- =====================================================

-- 1. Create policies for service role to access all galleries
-- This allows the cleanup function (using service_role_key) to see all galleries

-- Drop existing service role policies if they exist
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

-- 2. DON'T modify guest galleries (user_id = NULL is valid)
-- Guest galleries are allowed to have NULL user_id
-- The cleanup function will handle them correctly

-- 3. Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('galleries', 'images')
  AND 'service_role' = ANY(roles)
ORDER BY tablename, policyname;

-- 4. Test query - should return all expired galleries including guest galleries
SELECT 
  COUNT(*) as total_expired,
  COUNT(*) FILTER (WHERE user_id IS NULL) as guest_galleries,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as user_galleries
FROM galleries
WHERE expires_at < NOW();

-- 5. Show sample of expired galleries
SELECT 
  id,
  title,
  user_id,
  expires_at,
  is_active,
  CASE 
    WHEN user_id IS NULL THEN 'GUEST'
    ELSE 'USER'
  END as gallery_type
FROM galleries
WHERE expires_at < NOW()
ORDER BY expires_at ASC
LIMIT 10;
