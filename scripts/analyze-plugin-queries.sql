-- Query Plan Analysis for Plugin Infrastructure
-- This script analyzes frequently used queries to verify index usage
-- Run with: psql -f scripts/analyze-plugin-queries.sql

-- ============================================================================
-- ANALYZE TABLES
-- Update statistics for query planner
-- ============================================================================

ANALYZE public.api_keys;
ANALYZE public.plugin_versions;
ANALYZE public.plugin_downloads;
ANALYZE public.plugin_usage_logs;

-- ============================================================================
-- QUERY 1: API Key Validation (Most Critical - 100ms requirement)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  ak.id,
  ak.user_id,
  ak.is_active,
  ak.expires_at,
  ak.last_used_at,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  p.plan_type
FROM public.api_keys ak
JOIN auth.users u ON u.id = ak.user_id
LEFT JOIN public.profiles p ON p.id = ak.user_id
WHERE ak.key_hash = 'example_hash_value'
  AND ak.is_active = true
  AND (ak.expires_at IS NULL OR ak.expires_at > NOW());

-- Expected: Index Scan on idx_api_keys_key_hash

-- ============================================================================
-- QUERY 2: Get Latest Stable Version (Cached, but still important)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM public.plugin_versions
WHERE is_stable = true
ORDER BY release_date DESC
LIMIT 1;

-- Expected: Index Scan on idx_plugin_versions_stable + idx_plugin_versions_release_date

-- ============================================================================
-- QUERY 3: List User's API Keys
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  name,
  key_prefix,
  last_used_at,
  expires_at,
  created_at,
  is_active
FROM public.api_keys
WHERE user_id = 'example_user_id'
ORDER BY created_at DESC;

-- Expected: Index Scan on idx_api_keys_user_id

-- ============================================================================
-- QUERY 4: Download Statistics by Version
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  version_id,
  COUNT(*) as total_downloads,
  COUNT(user_id) as authenticated_downloads,
  COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_downloads,
  DATE_TRUNC('day', downloaded_at) as download_date
FROM public.plugin_downloads
WHERE version_id = 'example_version_id'
GROUP BY version_id, DATE_TRUNC('day', downloaded_at)
ORDER BY download_date DESC;

-- Expected: Index Scan on idx_plugin_downloads_version_id

-- ============================================================================
-- QUERY 5: Usage Logs by User and Date Range
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  action,
  plugin_version,
  lightroom_version,
  os_version,
  metadata,
  created_at
FROM public.plugin_usage_logs
WHERE user_id = 'example_user_id'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 100;

-- Expected: Index Scan on idx_plugin_usage_logs_user_id + idx_plugin_usage_logs_created_at

-- ============================================================================
-- QUERY 6: Global Usage Statistics (Admin Dashboard)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  action,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.plugin_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY action_count DESC;

-- Expected: Index Scan on idx_plugin_usage_logs_created_at

-- ============================================================================
-- QUERY 7: Metadata Search (JSONB GIN Index)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  user_id,
  action,
  metadata,
  created_at
FROM public.plugin_usage_logs
WHERE metadata @> '{"error": true}'::jsonb
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Expected: Bitmap Index Scan on idx_plugin_usage_logs_metadata

-- ============================================================================
-- INDEX USAGE STATISTICS
-- Shows which indexes are being used and how often
-- ============================================================================

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'api_keys' OR
    tablename = 'plugin_versions' OR
    tablename = 'plugin_downloads' OR
    tablename = 'plugin_usage_logs'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- TABLE STATISTICS
-- Shows table sizes and row counts
-- ============================================================================

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (
    tablename = 'api_keys' OR
    tablename = 'plugin_versions' OR
    tablename = 'plugin_downloads' OR
    tablename = 'plugin_usage_logs'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- MISSING INDEXES DETECTION
-- Identifies potential missing indexes based on sequential scans
-- ============================================================================

SELECT
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as rows_read_sequentially,
  idx_scan as index_scans,
  n_live_tup as row_count,
  CASE 
    WHEN seq_scan > 0 AND idx_scan > 0 
    THEN ROUND((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
    ELSE 0
  END as sequential_scan_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (
    tablename = 'api_keys' OR
    tablename = 'plugin_versions' OR
    tablename = 'plugin_downloads' OR
    tablename = 'plugin_usage_logs'
  )
  AND seq_scan > 100  -- Only show tables with significant sequential scans
ORDER BY seq_scan DESC;

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

-- If any queries show "Seq Scan" instead of "Index Scan", consider:
-- 1. Adding a new index on the filtered/sorted columns
-- 2. Updating table statistics with ANALYZE
-- 3. Checking if the table is too small for indexes to be beneficial

-- If sequential_scan_percentage is high (>20%), investigate:
-- 1. Which queries are causing sequential scans
-- 2. Whether additional indexes would help
-- 3. Whether the query can be rewritten to use existing indexes

-- Monitor index usage regularly:
-- - Unused indexes waste space and slow down writes
-- - Missing indexes slow down reads
-- - Run this script monthly to track trends
