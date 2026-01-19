-- =====================================================
-- Setup Cron Jobs for PikSend
-- =====================================================
-- This script sets up automated cron jobs for:
-- 1. Cleaning up expired galleries (daily at 2 AM UTC)
-- 2. Notifying users of expiring galleries (daily at 9 AM UTC)
-- 3. Cleaning up expired rate limits (every hour)
--
-- Prerequisites:
-- - pg_cron extension must be enabled
-- - http extension must be enabled (for net.http_post)
--
-- To enable extensions:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS http;
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- =====================================================
-- 1. Cleanup Expired Galleries
-- Runs daily at 2:00 AM UTC
-- =====================================================

-- First, unschedule if it already exists
SELECT cron.unschedule('cleanup-expired-galleries');

-- Schedule the job
SELECT cron.schedule(
  'cleanup-expired-galleries',           -- Job name
  '0 2 * * *',                          -- Cron expression: Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- =====================================================
-- 2. Notify Expiring Galleries
-- Runs daily at 9:00 AM UTC
-- =====================================================

-- First, unschedule if it already exists
SELECT cron.unschedule('notify-expiring-galleries');

-- Schedule the job
SELECT cron.schedule(
  'notify-expiring-galleries',          -- Job name
  '0 9 * * *',                          -- Cron expression: Daily at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/notify-expiring-galleries',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- =====================================================
-- 3. Cleanup Rate Limits
-- Runs every hour
-- =====================================================

-- First, unschedule if it already exists
SELECT cron.unschedule('cleanup-rate-limits');

-- Schedule the job
SELECT cron.schedule(
  'cleanup-rate-limits',                -- Job name
  '0 * * * *',                          -- Cron expression: Every hour
  $$
  SELECT
    net.http_post(
      url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-rate-limits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- =====================================================
-- View all scheduled jobs
-- =====================================================
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobname;

-- =====================================================
-- Useful queries for monitoring
-- =====================================================

-- View job run history (last 10 runs)
-- SELECT * FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- View failed jobs
-- SELECT * FROM cron.job_run_details 
-- WHERE status = 'failed'
-- ORDER BY start_time DESC;

-- Manually trigger a job (for testing)
-- SELECT cron.schedule('test-cleanup', '* * * * *', 'SELECT 1');
-- SELECT cron.unschedule('test-cleanup');
