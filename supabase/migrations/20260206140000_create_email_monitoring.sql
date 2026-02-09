-- ============================================================================
-- Email System Monitoring and Alerting
-- ============================================================================
-- This migration creates functions and scheduled jobs for monitoring the
-- email system and sending alerts when thresholds are exceeded.
--
-- Features:
-- - Queue depth monitoring
-- - Failure rate tracking
-- - Bounce rate monitoring
-- - Automated alerting
--
-- Requirements: 12.5, 12.6
-- ============================================================================

-- ============================================================================
-- Enable Required Extensions
-- ============================================================================

-- Note: pg_cron and http extensions should be enabled at the database level
-- If they're not available, the scheduled jobs and webhooks won't work,
-- but the monitoring functions will still be available for manual use.

-- Check if extensions are available (don't fail if they're not)
DO $$
BEGIN
  -- Try to create pg_cron extension if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION pg_cron;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension not available - scheduled jobs will not work';
    END;
  END IF;

  -- Try to create http extension if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    BEGIN
      CREATE EXTENSION http;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'http extension not available - webhook alerts will not work';
    END;
  END IF;
END $$;

-- ============================================================================
-- Monitoring Functions
-- ============================================================================

-- Drop existing functions if they exist (to handle return type changes)
DROP FUNCTION IF EXISTS get_email_queue_stats();
DROP FUNCTION IF EXISTS get_email_bounce_stats();
DROP FUNCTION IF EXISTS check_email_system_alerts();
DROP FUNCTION IF EXISTS send_email_alert(VARCHAR, VARCHAR, TEXT, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS cleanup_old_email_alerts();

-- Function to get email queue statistics
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  sent_count_24h BIGINT,
  failed_count_24h BIGINT,
  failed_count_1h BIGINT,
  queue_depth BIGINT,
  oldest_pending_minutes INTEGER,
  delivery_rate_24h NUMERIC,
  failure_rate_1h NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'sent' AND created_at > NOW() - INTERVAL '24 hours') as sent_24h,
      COUNT(*) FILTER (WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours') as failed_24h,
      COUNT(*) FILTER (WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '1 hour') as failed_1h,
      MIN(created_at) FILTER (WHERE status = 'pending') as oldest_pending
    FROM email_queue
  ),
  rates AS (
    SELECT
      CASE 
        WHEN (sent_24h + failed_24h) > 0 
        THEN ROUND((sent_24h::numeric / (sent_24h + failed_24h)) * 100, 2)
        ELSE 100.0
      END as delivery_rate,
      CASE 
        WHEN (sent_24h + failed_24h) > 0 
        THEN ROUND((failed_1h::numeric / NULLIF((sent_24h + failed_24h), 0)) * 100, 2)
        ELSE 0.0
      END as failure_rate
    FROM stats
  )
  SELECT
    s.pending,
    s.processing,
    s.sent_24h,
    s.failed_24h,
    s.failed_1h,
    (s.pending + s.processing) as queue_depth,
    EXTRACT(EPOCH FROM (NOW() - s.oldest_pending))::INTEGER / 60 as oldest_pending_minutes,
    r.delivery_rate,
    r.failure_rate
  FROM stats s, rates r;
END;
$$ LANGUAGE plpgsql;

-- Function to get bounce rate statistics
CREATE OR REPLACE FUNCTION get_email_bounce_stats()
RETURNS TABLE (
  total_sent_24h BIGINT,
  bounced_24h BIGINT,
  complained_24h BIGINT,
  bounce_rate_24h NUMERIC,
  complaint_rate_24h NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) as bounced,
    COUNT(*) FILTER (WHERE complained_at IS NOT NULL) as complained,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE bounced_at IS NOT NULL)::numeric / COUNT(*)) * 100, 2)
      ELSE 0.0
    END as bounce_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE complained_at IS NOT NULL)::numeric / COUNT(*)) * 100, 2)
      ELSE 0.0
    END as complaint_rate
  FROM email_logs
  WHERE created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Alert Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  webhook_url TEXT,
  last_alert_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default alert configurations
INSERT INTO email_alert_config (alert_type, threshold_warning, threshold_critical, webhook_url)
VALUES
  ('queue_depth', 100, 500, NULL),
  ('failure_rate', 5, 10, NULL),
  ('bounce_rate', 5, 10, NULL),
  ('oldest_pending', 30, 60, NULL)
ON CONFLICT (alert_type) DO NOTHING;

-- ============================================================================
-- Alert History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'warning' or 'critical'
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent alerts
CREATE INDEX IF NOT EXISTS idx_email_alert_history_created 
ON email_alert_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_alert_history_type 
ON email_alert_history(alert_type);

-- ============================================================================
-- Alert Sending Function
-- ============================================================================

CREATE OR REPLACE FUNCTION send_email_alert(
  p_alert_type VARCHAR,
  p_severity VARCHAR,
  p_message TEXT,
  p_metric_value NUMERIC,
  p_threshold_value NUMERIC,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_config RECORD;
  v_webhook_response RECORD;
  v_cooldown_minutes INTEGER := 15; -- Don't send same alert more than once per 15 minutes
BEGIN
  -- Get alert configuration
  SELECT * INTO v_config
  FROM email_alert_config
  WHERE alert_type = p_alert_type
  AND enabled = true;

  -- Check if alert is enabled
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check cooldown period
  IF v_config.last_alert_sent_at IS NOT NULL 
     AND v_config.last_alert_sent_at > NOW() - INTERVAL '15 minutes' THEN
    RETURN FALSE; -- Skip alert due to cooldown
  END IF;

  -- Record alert in history
  INSERT INTO email_alert_history (
    alert_type,
    severity,
    message,
    metric_value,
    threshold_value,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_message,
    p_metric_value,
    p_threshold_value,
    p_metadata
  );

  -- Send webhook if configured
  IF v_config.webhook_url IS NOT NULL THEN
    BEGIN
      -- Check if http extension is available
      IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        SELECT * INTO v_webhook_response
        FROM http_post(
          v_config.webhook_url,
          jsonb_build_object(
            'alert_type', p_alert_type,
            'severity', p_severity,
            'message', p_message,
            'metric_value', p_metric_value,
            'threshold_value', p_threshold_value,
            'metadata', p_metadata,
            'timestamp', NOW()
          )::TEXT,
          'application/json'
        );
      ELSE
        RAISE NOTICE 'http extension not available - webhook not sent for alert: %', p_alert_type;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log webhook failure but don't fail the alert
      RAISE WARNING 'Failed to send webhook for alert: %', SQLERRM;
    END;
  END IF;

  -- Update last alert sent time
  UPDATE email_alert_config
  SET last_alert_sent_at = NOW(),
      updated_at = NOW()
  WHERE alert_type = p_alert_type;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Main Alert Checking Function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_email_system_alerts()
RETURNS TABLE (
  alert_type VARCHAR,
  severity VARCHAR,
  message TEXT,
  metric_value NUMERIC
) AS $$
DECLARE
  v_queue_stats RECORD;
  v_bounce_stats RECORD;
  v_config RECORD;
  v_alert_sent BOOLEAN;
BEGIN
  -- Get current statistics
  SELECT * INTO v_queue_stats FROM get_email_queue_stats();
  SELECT * INTO v_bounce_stats FROM get_email_bounce_stats();

  -- Check queue depth
  SELECT * INTO v_config FROM email_alert_config WHERE alert_type = 'queue_depth';
  IF v_config.enabled THEN
    IF v_queue_stats.queue_depth >= v_config.threshold_critical THEN
      v_alert_sent := send_email_alert(
        'queue_depth',
        'critical',
        format('CRITICAL: Email queue depth is %s (threshold: %s)', 
               v_queue_stats.queue_depth, v_config.threshold_critical),
        v_queue_stats.queue_depth,
        v_config.threshold_critical,
        jsonb_build_object(
          'pending', v_queue_stats.pending_count,
          'processing', v_queue_stats.processing_count
        )
      );
      
      RETURN QUERY SELECT 'queue_depth'::VARCHAR, 'critical'::VARCHAR, 
        format('Queue depth: %s', v_queue_stats.queue_depth), 
        v_queue_stats.queue_depth;
        
    ELSIF v_queue_stats.queue_depth >= v_config.threshold_warning THEN
      v_alert_sent := send_email_alert(
        'queue_depth',
        'warning',
        format('WARNING: Email queue depth is %s (threshold: %s)', 
               v_queue_stats.queue_depth, v_config.threshold_warning),
        v_queue_stats.queue_depth,
        v_config.threshold_warning,
        jsonb_build_object(
          'pending', v_queue_stats.pending_count,
          'processing', v_queue_stats.processing_count
        )
      );
      
      RETURN QUERY SELECT 'queue_depth'::VARCHAR, 'warning'::VARCHAR, 
        format('Queue depth: %s', v_queue_stats.queue_depth), 
        v_queue_stats.queue_depth;
    END IF;
  END IF;

  -- Check failure rate
  SELECT * INTO v_config FROM email_alert_config WHERE alert_type = 'failure_rate';
  IF v_config.enabled AND v_queue_stats.failure_rate_1h IS NOT NULL THEN
    IF v_queue_stats.failure_rate_1h >= v_config.threshold_critical THEN
      v_alert_sent := send_email_alert(
        'failure_rate',
        'critical',
        format('CRITICAL: Email failure rate is %s%% in last hour (threshold: %s%%)', 
               v_queue_stats.failure_rate_1h, v_config.threshold_critical),
        v_queue_stats.failure_rate_1h,
        v_config.threshold_critical,
        jsonb_build_object(
          'failed_count_1h', v_queue_stats.failed_count_1h,
          'failed_count_24h', v_queue_stats.failed_count_24h
        )
      );
      
      RETURN QUERY SELECT 'failure_rate'::VARCHAR, 'critical'::VARCHAR, 
        format('Failure rate: %s%%', v_queue_stats.failure_rate_1h), 
        v_queue_stats.failure_rate_1h;
        
    ELSIF v_queue_stats.failure_rate_1h >= v_config.threshold_warning THEN
      v_alert_sent := send_email_alert(
        'failure_rate',
        'warning',
        format('WARNING: Email failure rate is %s%% in last hour (threshold: %s%%)', 
               v_queue_stats.failure_rate_1h, v_config.threshold_warning),
        v_queue_stats.failure_rate_1h,
        v_config.threshold_warning,
        jsonb_build_object(
          'failed_count_1h', v_queue_stats.failed_count_1h,
          'failed_count_24h', v_queue_stats.failed_count_24h
        )
      );
      
      RETURN QUERY SELECT 'failure_rate'::VARCHAR, 'warning'::VARCHAR, 
        format('Failure rate: %s%%', v_queue_stats.failure_rate_1h), 
        v_queue_stats.failure_rate_1h;
    END IF;
  END IF;

  -- Check bounce rate
  SELECT * INTO v_config FROM email_alert_config WHERE alert_type = 'bounce_rate';
  IF v_config.enabled AND v_bounce_stats.bounce_rate_24h IS NOT NULL THEN
    IF v_bounce_stats.bounce_rate_24h >= v_config.threshold_critical THEN
      v_alert_sent := send_email_alert(
        'bounce_rate',
        'critical',
        format('CRITICAL: Email bounce rate is %s%% in last 24 hours (threshold: %s%%)', 
               v_bounce_stats.bounce_rate_24h, v_config.threshold_critical),
        v_bounce_stats.bounce_rate_24h,
        v_config.threshold_critical,
        jsonb_build_object(
          'bounced_24h', v_bounce_stats.bounced_24h,
          'total_sent_24h', v_bounce_stats.total_sent_24h,
          'complaint_rate', v_bounce_stats.complaint_rate_24h
        )
      );
      
      RETURN QUERY SELECT 'bounce_rate'::VARCHAR, 'critical'::VARCHAR, 
        format('Bounce rate: %s%%', v_bounce_stats.bounce_rate_24h), 
        v_bounce_stats.bounce_rate_24h;
        
    ELSIF v_bounce_stats.bounce_rate_24h >= v_config.threshold_warning THEN
      v_alert_sent := send_email_alert(
        'bounce_rate',
        'warning',
        format('WARNING: Email bounce rate is %s%% in last 24 hours (threshold: %s%%)', 
               v_bounce_stats.bounce_rate_24h, v_config.threshold_warning),
        v_bounce_stats.bounce_rate_24h,
        v_config.threshold_warning,
        jsonb_build_object(
          'bounced_24h', v_bounce_stats.bounced_24h,
          'total_sent_24h', v_bounce_stats.total_sent_24h,
          'complaint_rate', v_bounce_stats.complaint_rate_24h
        )
      );
      
      RETURN QUERY SELECT 'bounce_rate'::VARCHAR, 'warning'::VARCHAR, 
        format('Bounce rate: %s%%', v_bounce_stats.bounce_rate_24h), 
        v_bounce_stats.bounce_rate_24h;
    END IF;
  END IF;

  -- Check oldest pending email age
  SELECT * INTO v_config FROM email_alert_config WHERE alert_type = 'oldest_pending';
  IF v_config.enabled AND v_queue_stats.oldest_pending_minutes IS NOT NULL THEN
    IF v_queue_stats.oldest_pending_minutes >= v_config.threshold_critical THEN
      v_alert_sent := send_email_alert(
        'oldest_pending',
        'critical',
        format('CRITICAL: Oldest pending email is %s minutes old (threshold: %s minutes)', 
               v_queue_stats.oldest_pending_minutes, v_config.threshold_critical),
        v_queue_stats.oldest_pending_minutes,
        v_config.threshold_critical,
        jsonb_build_object(
          'queue_depth', v_queue_stats.queue_depth,
          'pending_count', v_queue_stats.pending_count
        )
      );
      
      RETURN QUERY SELECT 'oldest_pending'::VARCHAR, 'critical'::VARCHAR, 
        format('Oldest pending: %s minutes', v_queue_stats.oldest_pending_minutes), 
        v_queue_stats.oldest_pending_minutes::NUMERIC;
        
    ELSIF v_queue_stats.oldest_pending_minutes >= v_config.threshold_warning THEN
      v_alert_sent := send_email_alert(
        'oldest_pending',
        'warning',
        format('WARNING: Oldest pending email is %s minutes old (threshold: %s minutes)', 
               v_queue_stats.oldest_pending_minutes, v_config.threshold_warning),
        v_queue_stats.oldest_pending_minutes,
        v_config.threshold_warning,
        jsonb_build_object(
          'queue_depth', v_queue_stats.queue_depth,
          'pending_count', v_queue_stats.pending_count
        )
      );
      
      RETURN QUERY SELECT 'oldest_pending'::VARCHAR, 'warning'::VARCHAR, 
        format('Oldest pending: %s minutes', v_queue_stats.oldest_pending_minutes), 
        v_queue_stats.oldest_pending_minutes::NUMERIC;
    END IF;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Cleanup Old Alert History
-- ============================================================================

-- Function to clean up old alert history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM email_alert_history
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Schedule Alert Checks (Optional - requires pg_cron)
-- ============================================================================

-- Note: These scheduled jobs require pg_cron extension to be enabled.
-- If pg_cron is not available, you can:
-- 1. Call check_email_system_alerts() from a Supabase Edge Function
-- 2. Call it from your application on a schedule
-- 3. Use an external cron service

DO $$
BEGIN
  -- Only schedule if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Check for alerts every 5 minutes
    PERFORM cron.schedule(
      'check-email-system-alerts',
      '*/5 * * * *', -- Every 5 minutes
      'SELECT check_email_system_alerts();'
    );
    
    -- Schedule cleanup to run daily at 2 AM
    PERFORM cron.schedule(
      'cleanup-old-email-alerts',
      '0 2 * * *', -- Daily at 2 AM
      'SELECT cleanup_old_email_alerts();'
    );
    
    RAISE NOTICE 'Email monitoring cron jobs scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron not available - monitoring functions created but not scheduled';
    RAISE NOTICE 'You can call check_email_system_alerts() manually or from an edge function';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron jobs: %', SQLERRM;
  RAISE NOTICE 'Monitoring functions are still available for manual use';
END $$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute permissions on monitoring functions
GRANT EXECUTE ON FUNCTION get_email_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_bounce_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_system_alerts() TO authenticated;

-- Grant select on alert tables to authenticated users
GRANT SELECT ON email_alert_config TO authenticated;
GRANT SELECT ON email_alert_history TO authenticated;

-- Grant update on alert config to service role only
GRANT UPDATE ON email_alert_config TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE email_alert_config IS 'Configuration for email system alerts and thresholds';
COMMENT ON TABLE email_alert_history IS 'History of all email system alerts sent';
COMMENT ON FUNCTION get_email_queue_stats() IS 'Get current email queue statistics';
COMMENT ON FUNCTION get_email_bounce_stats() IS 'Get email bounce and complaint statistics';
COMMENT ON FUNCTION check_email_system_alerts() IS 'Check all alert conditions and send alerts if thresholds exceeded';
COMMENT ON FUNCTION send_email_alert(VARCHAR, VARCHAR, TEXT, NUMERIC, NUMERIC, JSONB) IS 'Send an alert via webhook and record in history';
COMMENT ON FUNCTION cleanup_old_email_alerts() IS 'Clean up alert history older than 90 days';
