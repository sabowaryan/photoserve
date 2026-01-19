-- =====================================================
-- Diagnostic Script: Check Expired Galleries
-- =====================================================
-- This script helps diagnose why galleries might not be
-- detected as expired by the cleanup function
-- =====================================================

-- 1. Check current time
SELECT NOW() as current_time;

-- 2. Count all galleries
SELECT 
  COUNT(*) as total_galleries,
  COUNT(*) FILTER (WHERE is_active = true) as active_galleries,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_galleries
FROM galleries;

-- 3. Count expired galleries
SELECT 
  COUNT(*) as expired_by_date,
  COUNT(*) FILTER (WHERE is_active = false) as inactive,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND is_active = true) as expired_and_active
FROM galleries
WHERE expires_at < NOW() OR is_active = false;

-- 4. Show all galleries with expiration status
SELECT 
  id,
  title,
  user_id,
  expires_at,
  is_active,
  created_at,
  CASE 
    WHEN expires_at < NOW() AND is_active = false THEN 'EXPIRED + INACTIVE'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN is_active = false THEN 'INACTIVE'
    ELSE 'ACTIVE'
  END as status,
  CASE 
    WHEN expires_at < NOW() THEN EXTRACT(EPOCH FROM (NOW() - expires_at))/3600
    ELSE NULL
  END as hours_expired
FROM galleries
ORDER BY 
  CASE 
    WHEN expires_at < NOW() OR is_active = false THEN 0
    ELSE 1
  END,
  expires_at ASC;

-- 5. Show galleries that should be cleaned up
SELECT 
  id,
  title,
  user_id,
  expires_at,
  is_active,
  EXTRACT(EPOCH FROM (NOW() - expires_at))/3600 as hours_expired,
  (SELECT COUNT(*) FROM images WHERE gallery_id = galleries.id) as image_count
FROM galleries
WHERE expires_at < NOW() OR is_active = false
ORDER BY expires_at ASC;

-- 6. Check if there are any galleries with NULL expires_at
SELECT 
  COUNT(*) as galleries_with_null_expiration
FROM galleries
WHERE expires_at IS NULL;

-- 7. Show galleries expiring soon (next 7 days)
SELECT 
  id,
  title,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 as hours_until_expiration
FROM galleries
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND is_active = true
ORDER BY expires_at ASC;

-- 8. Check RLS policies on galleries table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'galleries';

-- 9. Test the exact query used by the cleanup function
-- This simulates what the Edge Function does
SELECT 
  id, 
  user_id, 
  title,
  expires_at,
  is_active
FROM galleries
WHERE expires_at < NOW()::timestamptz;

SELECT 
  id, 
  user_id, 
  title,
  expires_at,
  is_active
FROM galleries
WHERE is_active = false;
