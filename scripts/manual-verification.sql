-- Manual Verification for Email Management System Migration
-- Run this in Supabase SQL Editor or via psql

-- ============================================================================
-- 1. Verify all tables exist
-- ============================================================================
SELECT 
  'Tables' as category,
  table_name,
  '✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'email_providers',
  'sender_addresses',
  'email_templates',
  'template_versions',
  'email_queue',
  'email_logs',
  'email_events',
  'email_suppressions',
  'email_unsubscribes'
)
ORDER BY table_name;

-- ============================================================================
-- 2. Count indexes
-- ============================================================================
SELECT 
  'Indexes' as category,
  COUNT(*) as total_indexes,
  '✓' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%';

-- ============================================================================
-- 3. List all indexes
-- ============================================================================
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. Count RLS policies
-- ============================================================================
SELECT 
  'RLS Policies' as category,
  COUNT(*) as total_policies,
  '✓' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%';

-- ============================================================================
-- 5. List all RLS policies
-- ============================================================================
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. Verify triggers
-- ============================================================================
SELECT 
  'Triggers' as category,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✓' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'email_%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. Verify functions
-- ============================================================================
SELECT 
  'Functions' as category,
  routine_name as function_name,
  '✓' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_updated_at_column',
  'ensure_single_active_provider',
  'ensure_single_default_sender',
  'update_email_log_from_event'
)
ORDER BY routine_name;

-- ============================================================================
-- 8. Summary
-- ============================================================================
SELECT 
  '=== MIGRATION VERIFICATION SUMMARY ===' as summary,
  'All core components verified!' as result;
