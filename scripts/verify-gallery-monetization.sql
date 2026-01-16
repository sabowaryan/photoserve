-- Verification Script for Gallery Monetization Migration
-- Run this AFTER applying the migration to verify everything is correct
-- Can be run in Supabase SQL Editor

-- 1. Check if table exists
SELECT 
  'Table Exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'gallery_monetization'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

-- 2. Check indexes
SELECT 
  'Indexes Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ PASS (' || COUNT(*) || ' indexes)'
    ELSE '✗ FAIL (only ' || COUNT(*) || ' indexes)'
  END as status
FROM pg_indexes 
WHERE tablename = 'gallery_monetization';

-- 3. List all indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'gallery_monetization'
ORDER BY indexname;

-- 4. Check constraints
SELECT 
  'CHECK Constraints' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ PASS (' || COUNT(*) || ' constraints)'
    ELSE '✗ FAIL (only ' || COUNT(*) || ' constraints)'
  END as status
FROM pg_constraint 
WHERE conrelid = 'public.gallery_monetization'::regclass
AND contype = 'c';

-- 5. List all constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE contype::text
  END as type_description
FROM pg_constraint 
WHERE conrelid = 'public.gallery_monetization'::regclass
ORDER BY contype, conname;

-- 6. Check RLS is enabled
SELECT 
  'RLS Enabled' as check_name,
  CASE 
    WHEN rowsecurity THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM pg_tables 
WHERE tablename = 'gallery_monetization';

-- 7. Check policies
SELECT 
  'Policies Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✓ PASS (' || COUNT(*) || ' policies)'
    ELSE '✗ FAIL (only ' || COUNT(*) || ' policies)'
  END as status
FROM pg_policies 
WHERE tablename = 'gallery_monetization';

-- 8. List all policies
SELECT 
  policyname as policy_name,
  cmd as command,
  CASE 
    WHEN roles = '{public}' THEN 'public'
    ELSE array_to_string(roles, ', ')
  END as roles
FROM pg_policies 
WHERE tablename = 'gallery_monetization'
ORDER BY cmd, policyname;

-- 9. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'gallery_monetization'
ORDER BY ordinal_position;

-- 10. Check foreign key references
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'gallery_monetization';

-- 11. Summary
SELECT 
  '========================================' as summary
UNION ALL
SELECT 'MIGRATION VERIFICATION COMPLETE'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Run the checks above to verify:'
UNION ALL
SELECT '  • Table exists'
UNION ALL
SELECT '  • Indexes created (3+)'
UNION ALL
SELECT '  • Constraints working (3+ CHECK)'
UNION ALL
SELECT '  • RLS enabled'
UNION ALL
SELECT '  • Policies created (5)'
UNION ALL
SELECT '========================================';
