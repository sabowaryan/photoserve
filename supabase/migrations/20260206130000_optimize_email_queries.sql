-- Migration: Optimize Email System Queries
-- Date: 2026-02-06
-- Description: Adds additional indexes and optimizations for email system performance
-- Requirements: 11.5, 11.6

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for queue processing (status + priority + created_at)
-- This optimizes the main queue processing query
-- Note: Cannot use NOW() in index predicate as it's not IMMUTABLE
-- The application will filter scheduled_at in the query
CREATE INDEX IF NOT EXISTS idx_email_queue_processing_composite 
ON public.email_queue(status, priority DESC, created_at ASC)
WHERE status = 'pending';

-- Separate index for scheduled emails (includes scheduled_at for filtering)
CREATE INDEX IF NOT EXISTS idx_email_queue_pending_with_schedule
ON public.email_queue(status, scheduled_at, priority DESC, created_at ASC)
WHERE status = 'pending';

-- Index for finding emails by template and status (analytics queries)
CREATE INDEX IF NOT EXISTS idx_email_logs_template_status_composite
ON public.email_logs(template_id, status, created_at DESC)
WHERE template_id IS NOT NULL;

-- Index for time-based analytics queries
CREATE INDEX IF NOT EXISTS idx_email_logs_created_status
ON public.email_logs(created_at DESC, status)
INCLUDE (template_id, to_address);

-- Index for event-based analytics
CREATE INDEX IF NOT EXISTS idx_email_events_log_type_created
ON public.email_events(log_id, event_type, created_at DESC);

-- Partial index for failed emails (for retry monitoring)
CREATE INDEX IF NOT EXISTS idx_email_queue_failed
ON public.email_queue(created_at DESC, retry_count)
WHERE status = 'failed';

-- Partial index for scheduled emails
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_pending
ON public.email_queue(scheduled_at ASC)
WHERE status = 'pending' AND scheduled_at IS NOT NULL;

-- Index for suppression lookups (critical for send-time checks)
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email_reason
ON public.email_suppressions(email, reason);

-- Index for unsubscribe lookups (critical for send-time checks)
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email_lookup
ON public.email_unsubscribes(email)
INCLUDE (unsubscribed_at);

-- ============================================================================
-- MATERIALIZED VIEW FOR ANALYTICS
-- ============================================================================

-- Create materialized view for email analytics aggregation
-- This significantly speeds up analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS email_analytics_daily AS
SELECT
  DATE(created_at) as date,
  template_id,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE status = 'opened') as opened_count,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked_count,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced_count,
  COUNT(*) FILTER (WHERE status = 'complained') as complained_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'opened')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0)) * 100,
    2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'clicked')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0)) * 100,
    2
  ) as click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'bounced')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'bounced')), 0)) * 100,
    2
  ) as bounce_rate
FROM public.email_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), template_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_date
ON email_analytics_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_template
ON email_analytics_daily(template_id, date DESC);

-- Add comment
COMMENT ON MATERIALIZED VIEW email_analytics_daily IS 
'Daily aggregated email analytics for fast dashboard queries. Refresh periodically.';

-- ============================================================================
-- FUNCTION TO REFRESH ANALYTICS MATERIALIZED VIEW
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_email_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY email_analytics_daily;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_email_analytics() IS 
'Refresh the email analytics materialized view. Should be called daily via cron.';

-- ============================================================================
-- OPTIMIZED QUERY FUNCTIONS
-- ============================================================================

-- Function to get queue statistics (optimized)
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  sent_count_24h BIGINT,
  failed_count_24h BIGINT,
  scheduled_count BIGINT,
  high_priority_count BIGINT,
  normal_priority_count BIGINT,
  low_priority_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'sent' AND updated_at >= NOW() - INTERVAL '24 hours') as sent_count_24h,
    COUNT(*) FILTER (WHERE status = 'failed' AND updated_at >= NOW() - INTERVAL '24 hours') as failed_count_24h,
    COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_at IS NOT NULL AND scheduled_at > NOW()) as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND priority = 'high') as high_priority_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND priority = 'normal') as normal_priority_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND priority = 'low') as low_priority_count
  FROM public.email_queue;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_email_queue_stats() IS 
'Get comprehensive queue statistics in a single optimized query';

-- Function to get template analytics (optimized)
CREATE OR REPLACE FUNCTION get_template_analytics(
  p_template_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  sent_count BIGINT,
  delivered_count BIGINT,
  opened_count BIGINT,
  clicked_count BIGINT,
  bounced_count BIGINT,
  complained_count BIGINT,
  failed_count BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(sent_count)::BIGINT,
    SUM(delivered_count)::BIGINT,
    SUM(opened_count)::BIGINT,
    SUM(clicked_count)::BIGINT,
    SUM(bounced_count)::BIGINT,
    SUM(complained_count)::BIGINT,
    SUM(failed_count)::BIGINT,
    ROUND(
      (SUM(opened_count)::numeric / NULLIF(SUM(delivered_count), 0)) * 100,
      2
    ),
    ROUND(
      (SUM(clicked_count)::numeric / NULLIF(SUM(delivered_count), 0)) * 100,
      2
    ),
    ROUND(
      (SUM(bounced_count)::numeric / NULLIF(SUM(sent_count), 0)) * 100,
      2
    )
  FROM email_analytics_daily
  WHERE template_id = p_template_id
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_template_analytics(UUID, DATE, DATE) IS 
'Get analytics for a specific template using materialized view for performance';

-- ============================================================================
-- VACUUM AND ANALYZE CONFIGURATION
-- ============================================================================

-- Configure autovacuum for email tables (they have high write volume)
ALTER TABLE public.email_queue SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.email_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.email_events SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Create table for tracking slow queries (optional, for monitoring)
CREATE TABLE IF NOT EXISTS email_query_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name VARCHAR(255) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_query_performance_created
ON email_query_performance(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_query_performance_query_name
ON email_query_performance(query_name, execution_time_ms DESC);

COMMENT ON TABLE email_query_performance IS 
'Tracks email system query performance for optimization analysis';

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
  p_query_name VARCHAR(255),
  p_execution_time_ms INTEGER,
  p_row_count INTEGER DEFAULT NULL,
  p_parameters JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Only log if execution time exceeds threshold (1 second)
  IF p_execution_time_ms > 1000 THEN
    INSERT INTO email_query_performance (
      query_name,
      execution_time_ms,
      row_count,
      parameters
    ) VALUES (
      p_query_name,
      p_execution_time_ms,
      p_row_count,
      p_parameters
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_slow_query(VARCHAR, INTEGER, INTEGER, JSONB) IS 
'Log slow queries for performance analysis (threshold: 1000ms)';

-- ============================================================================
-- CLEANUP OLD DATA (OPTIONAL)
-- ============================================================================

-- Function to archive old email logs (older than 90 days)
CREATE OR REPLACE FUNCTION archive_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete email events first (cascade will handle this, but explicit is better)
  DELETE FROM public.email_events
  WHERE log_id IN (
    SELECT id FROM public.email_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
  );
  
  -- Delete old email logs
  DELETE FROM public.email_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_email_logs() IS 
'Archive email logs older than 90 days. Returns number of deleted records.';

-- Function to clean up old queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete completed queue entries older than 7 days
  DELETE FROM public.email_queue
  WHERE status IN ('sent', 'cancelled')
    AND updated_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_queue_entries() IS 
'Clean up completed queue entries older than 7 days. Returns number of deleted records.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Analyze tables to update statistics
ANALYZE public.email_providers;
ANALYZE public.sender_addresses;
ANALYZE public.email_templates;
ANALYZE public.template_versions;
ANALYZE public.email_queue;
ANALYZE public.email_logs;
ANALYZE public.email_events;
ANALYZE public.email_suppressions;
ANALYZE public.email_unsubscribes;

-- Add final comment
COMMENT ON SCHEMA public IS 'Email system query optimizations applied successfully';
