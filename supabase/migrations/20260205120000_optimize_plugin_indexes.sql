-- Migration: Optimize Plugin Infrastructure Indexes
-- Date: 2026-02-05
-- Description: Adds composite indexes and optimizations for frequently used queries
-- Requirements: 14.10 - Optimize database queries with indexes

-- ============================================================================
-- COMPOSITE INDEX: API Key Validation Query
-- This is the most critical query (must respond in <100ms)
-- ============================================================================

-- Composite index for API key validation with active and expiration checks
-- Covers: WHERE key_hash = ? AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
CREATE INDEX idx_api_keys_validation 
ON public.api_keys(key_hash, is_active, expires_at)
WHERE is_active = true;

COMMENT ON INDEX idx_api_keys_validation IS 'Optimizes API key validation queries - critical for <100ms response time';

-- ============================================================================
-- COMPOSITE INDEX: User API Keys with Status
-- Optimizes dashboard queries that filter by user and status
-- ============================================================================

-- Composite index for listing user's API keys with status filtering
CREATE INDEX idx_api_keys_user_status 
ON public.api_keys(user_id, is_active, created_at DESC);

COMMENT ON INDEX idx_api_keys_user_status IS 'Optimizes user API key listing with status filtering';

-- ============================================================================
-- COMPOSITE INDEX: Download Analytics by Date Range
-- Optimizes download statistics queries
-- ============================================================================

-- Composite index for download analytics by version and date
CREATE INDEX idx_plugin_downloads_version_date 
ON public.plugin_downloads(version_id, downloaded_at DESC);

COMMENT ON INDEX idx_plugin_downloads_version_date IS 'Optimizes download statistics queries by version and date range';

-- Composite index for user download history
CREATE INDEX idx_plugin_downloads_user_date 
ON public.plugin_downloads(user_id, downloaded_at DESC)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_plugin_downloads_user_date IS 'Optimizes user download history queries';

-- ============================================================================
-- COMPOSITE INDEX: Usage Logs Analytics
-- Optimizes usage tracking queries for admin dashboard
-- ============================================================================

-- Composite index for usage logs by action and date
CREATE INDEX idx_plugin_usage_logs_action_date 
ON public.plugin_usage_logs(action, created_at DESC);

COMMENT ON INDEX idx_plugin_usage_logs_action_date IS 'Optimizes usage statistics queries by action type';

-- Composite index for user usage logs with date range
CREATE INDEX idx_plugin_usage_logs_user_date 
ON public.plugin_usage_logs(user_id, created_at DESC);

COMMENT ON INDEX idx_plugin_usage_logs_user_date IS 'Optimizes user usage history queries with date filtering';

-- ============================================================================
-- PARTIAL INDEX: Active API Keys Only
-- Reduces index size by excluding revoked keys
-- ============================================================================

-- Note: idx_api_keys_active already exists as a partial index
-- This is documented here for completeness

-- ============================================================================
-- COVERING INDEX: Plugin Version Listing
-- Includes commonly selected columns to avoid table lookups
-- ============================================================================

-- Covering index for version listing (includes all commonly queried columns)
CREATE INDEX idx_plugin_versions_list 
ON public.plugin_versions(is_stable, release_date DESC)
INCLUDE (version, file_size, download_count);

COMMENT ON INDEX idx_plugin_versions_list IS 'Covering index for version listing - avoids table lookups';

-- ============================================================================
-- STATISTICS UPDATE
-- Ensure query planner has accurate statistics
-- ============================================================================

-- Update statistics for all plugin tables
ANALYZE public.api_keys;
ANALYZE public.plugin_versions;
ANALYZE public.plugin_downloads;
ANALYZE public.plugin_usage_logs;

-- ============================================================================
-- VACUUM CONFIGURATION
-- Configure autovacuum for optimal performance
-- ============================================================================

-- Configure autovacuum for api_keys (high update frequency on last_used_at)
ALTER TABLE public.api_keys SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Configure autovacuum for plugin_versions (low update frequency)
ALTER TABLE public.plugin_versions SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- Configure autovacuum for plugin_downloads (append-only, high insert rate)
ALTER TABLE public.plugin_downloads SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- Configure autovacuum for plugin_usage_logs (append-only, very high insert rate)
ALTER TABLE public.plugin_usage_logs SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- ============================================================================
-- INDEX MONITORING VIEW
-- Creates a view for easy index usage monitoring
-- ============================================================================

CREATE OR REPLACE VIEW public.plugin_index_stats AS
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
    ELSE 'HIGH_USAGE'
  END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    relname = 'api_keys' OR
    relname = 'plugin_versions' OR
    relname = 'plugin_downloads' OR
    relname = 'plugin_usage_logs'
  )
ORDER BY relname, idx_scan DESC;

COMMENT ON VIEW public.plugin_index_stats IS 'Monitoring view for plugin infrastructure index usage';

-- Grant access to authenticated users (for admin dashboard)
GRANT SELECT ON public.plugin_index_stats TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify all indexes were created successfully
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (
      tablename = 'api_keys' OR
      tablename = 'plugin_versions' OR
      tablename = 'plugin_downloads' OR
      tablename = 'plugin_usage_logs'
    );
  
  RAISE NOTICE 'Plugin infrastructure has % indexes', index_count;
  
  IF index_count < 15 THEN
    RAISE WARNING 'Expected at least 15 indexes, found %', index_count;
  END IF;
END $$;
