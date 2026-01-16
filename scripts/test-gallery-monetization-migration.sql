-- Test Script for Gallery Monetization Migration
-- This script verifies the gallery_monetization table structure and constraints
-- Run this after applying the migration to verify everything works correctly

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'gallery_monetization';
-- Expected: 1 row with table_name = 'gallery_monetization'

-- 2. Check all columns exist with correct types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gallery_monetization'
ORDER BY ordinal_position;
-- Expected: 14 columns (id, gallery_id, is_enabled, price_cents, currency, 
--           preview_mode, watermark_enabled, access_duration_days, 
--           stripe_price_id, platform_fee_percent, total_sales, 
--           total_revenue_cents, conversion_rate, created_at, updated_at)

-- 3. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'gallery_monetization'
ORDER BY indexname;
-- Expected: 4 indexes (primary key + 3 custom indexes)

-- 4. Check constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.gallery_monetization'::regclass
ORDER BY conname;
-- Expected: 6 constraints (primary key, unique, 3 check, foreign key)

-- 5. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'gallery_monetization';
-- Expected: rls_enabled = true

-- 6. Check policies
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'gallery_monetization'
ORDER BY policyname;
-- Expected: 5 policies

-- 7. Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gallery_monetization'
ORDER BY trigger_name;
-- Expected: 1 trigger (update_gallery_monetization_updated_at)

-- ============================================================================
-- CONSTRAINT TESTS
-- ============================================================================

-- Test 1: Price too low (should fail)
DO $$
BEGIN
  INSERT INTO gallery_monetization (gallery_id, price_cents) 
  VALUES ('00000000-0000-0000-0000-000000000001', 100);
  RAISE EXCEPTION 'Test failed: Price constraint should have rejected 100 cents';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test passed: Price constraint correctly rejected 100 cents';
END $$;

-- Test 2: Price too high (should fail)
DO $$
BEGIN
  INSERT INTO gallery_monetization (gallery_id, price_cents) 
  VALUES ('00000000-0000-0000-0000-000000000002', 60000);
  RAISE EXCEPTION 'Test failed: Price constraint should have rejected 60000 cents';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test passed: Price constraint correctly rejected 60000 cents';
END $$;

-- Test 3: Invalid platform fee (should fail)
DO $$
BEGIN
  INSERT INTO gallery_monetization (gallery_id, price_cents, platform_fee_percent) 
  VALUES ('00000000-0000-0000-0000-000000000003', 2999, 150.00);
  RAISE EXCEPTION 'Test failed: Fee constraint should have rejected 150%';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test passed: Fee constraint correctly rejected 150%';
END $$;

-- Test 4: Invalid preview mode (should fail)
DO $$
BEGIN
  INSERT INTO gallery_monetization (gallery_id, price_cents, preview_mode) 
  VALUES ('00000000-0000-0000-0000-000000000004', 2999, 'invalid_mode');
  RAISE EXCEPTION 'Test failed: Preview mode constraint should have rejected invalid value';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test passed: Preview mode constraint correctly rejected invalid value';
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  'Migration Verification Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name = 'gallery_monetization') AS table_exists,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'gallery_monetization') AS column_count,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE tablename = 'gallery_monetization') AS index_count,
  (SELECT COUNT(*) FROM pg_constraint 
   WHERE conrelid = 'public.gallery_monetization'::regclass) AS constraint_count,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename = 'gallery_monetization') AS policy_count,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE event_object_table = 'gallery_monetization') AS trigger_count;

-- Expected results:
-- table_exists: 1
-- column_count: 14
-- index_count: 4
-- constraint_count: 6
-- policy_count: 5
-- trigger_count: 1
