-- ============================================================================
-- Email Delivery Metrics Schema Migration
-- ============================================================================
-- This migration creates a table for tracking email delivery timing and success
-- rates for monitoring and alerting purposes.
--
-- Requirements: 21.4 (Email system infrastructure)
-- Task: 5.6 Implement email sending service integration
-- ============================================================================

-- Create email_delivery_metrics table
CREATE TABLE IF NOT EXISTS public.email_delivery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('verification', 'password_reset', 'password_changed')),
  queue_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('primary', 'fallback')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_user_id 
  ON public.email_delivery_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_email_type 
  ON public.email_delivery_metrics(email_type);

CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_created_at 
  ON public.email_delivery_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_success 
  ON public.email_delivery_metrics(success);

CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_provider 
  ON public.email_delivery_metrics(provider);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_email_delivery_metrics_type_success_created 
  ON public.email_delivery_metrics(email_type, success, created_at DESC);

-- Enable RLS on email_delivery_metrics table
ALTER TABLE public.email_delivery_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_delivery_metrics
-- Only service role should access metrics (for monitoring/analytics)
CREATE POLICY "Service role has full access to delivery metrics"
ON public.email_delivery_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view metrics for monitoring
CREATE POLICY "Admins can view delivery metrics"
ON public.email_delivery_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.email_delivery_metrics IS 
'Tracks email delivery timing and success rates for monitoring and alerting. Used to ensure emails are delivered within SLA (30 seconds).';

COMMENT ON COLUMN public.email_delivery_metrics.email_type IS 
'Type of email: verification, password_reset, or password_changed';

COMMENT ON COLUMN public.email_delivery_metrics.queue_time_ms IS 
'Time taken to queue the email in milliseconds. Should be under 30000ms (30 seconds) per requirement 5.1';

COMMENT ON COLUMN public.email_delivery_metrics.success IS 
'Whether the email was successfully queued for delivery';

COMMENT ON COLUMN public.email_delivery_metrics.provider IS 
'Email provider used: primary (Resend) or fallback (AWS SES)';

COMMENT ON COLUMN public.email_delivery_metrics.error_message IS 
'Error message if delivery failed';

-- Function to get email delivery statistics
CREATE OR REPLACE FUNCTION public.get_email_delivery_stats(
  p_email_type TEXT DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  email_type TEXT,
  total_emails BIGINT,
  successful_emails BIGINT,
  failed_emails BIGINT,
  success_rate NUMERIC,
  avg_queue_time_ms NUMERIC,
  max_queue_time_ms INTEGER,
  primary_provider_count BIGINT,
  fallback_provider_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    edm.email_type,
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE edm.success = true) as successful_emails,
    COUNT(*) FILTER (WHERE edm.success = false) as failed_emails,
    ROUND(
      (COUNT(*) FILTER (WHERE edm.success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(edm.queue_time_ms), 2) as avg_queue_time_ms,
    MAX(edm.queue_time_ms) as max_queue_time_ms,
    COUNT(*) FILTER (WHERE edm.provider = 'primary') as primary_provider_count,
    COUNT(*) FILTER (WHERE edm.provider = 'fallback') as fallback_provider_count
  FROM public.email_delivery_metrics edm
  WHERE 
    edm.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_email_type IS NULL OR edm.email_type = p_email_type)
  GROUP BY edm.email_type
  ORDER BY edm.email_type;
END;
$$;

COMMENT ON FUNCTION public.get_email_delivery_stats(TEXT, INTEGER) IS 
'Get email delivery statistics for monitoring. Returns success rates, average queue times, and provider usage.';

-- Function to check if email delivery is healthy
CREATE OR REPLACE FUNCTION public.check_email_delivery_health(
  p_hours INTEGER DEFAULT 1
)
RETURNS TABLE (
  is_healthy BOOLEAN,
  success_rate NUMERIC,
  avg_queue_time_ms NUMERIC,
  max_queue_time_ms INTEGER,
  total_emails BIGINT,
  failed_emails BIGINT,
  issues TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_success_rate NUMERIC;
  v_avg_queue_time NUMERIC;
  v_max_queue_time INTEGER;
  v_total BIGINT;
  v_failed BIGINT;
  v_issues TEXT[] := ARRAY[]::TEXT[];
  v_is_healthy BOOLEAN := true;
BEGIN
  -- Get metrics for the specified time period
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE success = false),
    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    ROUND(AVG(queue_time_ms), 2),
    MAX(queue_time_ms)
  INTO v_total, v_failed, v_success_rate, v_avg_queue_time, v_max_queue_time
  FROM public.email_delivery_metrics
  WHERE created_at >= NOW() - (p_hours || ' hours')::INTERVAL;
  
  -- Check for issues
  IF v_total = 0 THEN
    v_issues := array_append(v_issues, 'No emails sent in the last ' || p_hours || ' hour(s)');
  ELSE
    -- Check success rate (should be > 95%)
    IF v_success_rate < 95 THEN
      v_is_healthy := false;
      v_issues := array_append(v_issues, 'Low success rate: ' || v_success_rate || '%');
    END IF;
    
    -- Check average queue time (should be < 5000ms)
    IF v_avg_queue_time > 5000 THEN
      v_is_healthy := false;
      v_issues := array_append(v_issues, 'High average queue time: ' || v_avg_queue_time || 'ms');
    END IF;
    
    -- Check max queue time (should be < 30000ms per requirement)
    IF v_max_queue_time > 30000 THEN
      v_is_healthy := false;
      v_issues := array_append(v_issues, 'Max queue time exceeded SLA: ' || v_max_queue_time || 'ms');
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    v_is_healthy,
    v_success_rate,
    v_avg_queue_time,
    v_max_queue_time,
    v_total,
    v_failed,
    v_issues;
END;
$$;

COMMENT ON FUNCTION public.check_email_delivery_health(INTEGER) IS 
'Check email delivery health status. Returns whether the system is healthy and any issues detected.';

-- Function to clean up old metrics (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete metrics older than 90 days
  DELETE FROM public.email_delivery_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_email_metrics() IS 
'Maintenance function to delete email delivery metrics older than 90 days. Should be run periodically via cron job.';
