-- Test script to validate migration syntax
-- This script can be used to test the migration in a local PostgreSQL instance

-- Start transaction (will rollback at the end for testing)
BEGIN;

-- Source the migration
\i supabase/migrations/20260115120100_create_stripe_connect_accounts.sql

-- Verify table was created
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'stripe_connect_accounts';

-- Verify columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'stripe_connect_accounts'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'stripe_connect_accounts';

-- Verify constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.stripe_connect_accounts'::regclass;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'stripe_connect_accounts';

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'stripe_connect_accounts';

-- Test insert (will fail if RLS is working correctly without auth)
-- This should fail with permission denied
-- INSERT INTO public.stripe_connect_accounts (user_id, stripe_account_id, account_type)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'acct_test123', 'express');

-- Rollback to clean up
ROLLBACK;

-- If you want to actually apply the migration, replace ROLLBACK with COMMIT
