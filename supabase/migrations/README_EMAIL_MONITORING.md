# Email System Monitoring and Alerting

## Overview

This migration creates a comprehensive monitoring and alerting system for the email management infrastructure. It includes automated health checks, configurable alert thresholds, and webhook-based notifications.

## Migration File

- **File:** `20260206140000_create_email_monitoring.sql`
- **Created:** 2026-02-06
- **Requirements:** 12.5, 12.6

## Features

### 1. Monitoring Functions

#### `get_email_queue_stats()`
Returns comprehensive queue statistics:
- Pending email count
- Processing email count
- Sent count (last 24 hours)
- Failed count (last 24 hours and last hour)
- Queue depth (pending + processing)
- Oldest pending email age (in minutes)
- Delivery rate (last 24 hours)
- Failure rate (last hour)

**Usage:**
```sql
SELECT * FROM get_email_queue_stats();
```

#### `get_email_bounce_stats()`
Returns bounce and complaint statistics:
- Total emails sent (last 24 hours)
- Bounced email count
- Complained email count
- Bounce rate percentage
- Complaint rate percentage

**Usage:**
```sql
SELECT * FROM get_email_bounce_stats();
```

### 2. Alert Configuration

The `email_alert_config` table stores alert thresholds and webhook URLs:

| Alert Type | Warning Threshold | Critical Threshold | Description |
|------------|-------------------|-------------------|-------------|
| queue_depth | 100 | 500 | Number of emails in queue |
| failure_rate | 5% | 10% | Percentage of failed emails (last hour) |
| bounce_rate | 5% | 10% | Percentage of bounced emails (last 24h) |
| oldest_pending | 30 min | 60 min | Age of oldest pending email |

**Configure webhook URL:**
```sql
UPDATE email_alert_config 
SET webhook_url = 'https://your-webhook-url.com/alerts'
WHERE alert_type = 'queue_depth';
```

**Adjust thresholds:**
```sql
UPDATE email_alert_config 
SET threshold_warning = 200,
    threshold_critical = 1000
WHERE alert_type = 'queue_depth';
```

**Enable/disable alerts:**
```sql
UPDATE email_alert_config 
SET enabled = false
WHERE alert_type = 'bounce_rate';
```

### 3. Alert History

The `email_alert_history` table records all alerts sent:
- Alert type
- Severity (warning or critical)
- Message
- Metric value
- Threshold value
- Metadata (additional context)
- Timestamp

**View recent alerts:**
```sql
SELECT *
FROM email_alert_history
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Count alerts by type:**
```sql
SELECT alert_type, severity, COUNT(*) as count
FROM email_alert_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY alert_type, severity
ORDER BY count DESC;
```

### 4. Alert Checking

#### `check_email_system_alerts()`
Main function that checks all alert conditions and sends alerts when thresholds are exceeded.

**Features:**
- Checks all enabled alert types
- Compares current metrics against thresholds
- Sends webhook notifications
- Records alerts in history
- Implements 15-minute cooldown to prevent alert spam

**Manual execution:**
```sql
SELECT * FROM check_email_system_alerts();
```

**Scheduled execution:**
The function runs automatically every 5 minutes via pg_cron.

### 5. Webhook Format

When an alert is triggered, a webhook is sent with this JSON payload:

```json
{
  "alert_type": "queue_depth",
  "severity": "critical",
  "message": "CRITICAL: Email queue depth is 523 (threshold: 500)",
  "metric_value": 523,
  "threshold_value": 500,
  "metadata": {
    "pending": 450,
    "processing": 73
  },
  "timestamp": "2026-02-06T14:30:00Z"
}
```

### 6. Automated Cleanup

Old alert history is automatically cleaned up:
- Retention period: 90 days
- Runs daily at 2 AM
- Implemented via `cleanup_old_email_alerts()` function

## Scheduled Jobs

This migration creates two cron jobs:

1. **Alert Checking** - Every 5 minutes
   ```sql
   SELECT cron.schedule(
     'check-email-system-alerts',
     '*/5 * * * *',
     'SELECT check_email_system_alerts();'
   );
   ```

2. **Alert Cleanup** - Daily at 2 AM
   ```sql
   SELECT cron.schedule(
     'cleanup-old-email-alerts',
     '0 2 * * *',
     'SELECT cleanup_old_email_alerts();'
   );
   ```

## Integration Examples

### Slack Webhook

Configure Slack webhook for alerts:

```sql
UPDATE email_alert_config 
SET webhook_url = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
WHERE alert_type IN ('queue_depth', 'failure_rate', 'bounce_rate', 'oldest_pending');
```

### Discord Webhook

Configure Discord webhook:

```sql
UPDATE email_alert_config 
SET webhook_url = 'https://discord.com/api/webhooks/YOUR/WEBHOOK/URL'
WHERE alert_type IN ('queue_depth', 'failure_rate', 'bounce_rate', 'oldest_pending');
```

### Custom Webhook Handler

Create a custom endpoint to receive alerts and process them:

```typescript
// Example webhook handler
export async function POST(request: Request) {
  const alert = await request.json();
  
  // Log alert
  console.error(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  
  // Send to monitoring service
  if (alert.severity === 'critical') {
    await sendToPagerDuty(alert);
  }
  
  // Send to team chat
  await sendToSlack(alert);
  
  return new Response('OK', { status: 200 });
}
```

## Monitoring Dashboard Queries

### Current System Health

```sql
SELECT 
  (SELECT queue_depth FROM get_email_queue_stats()) as queue_depth,
  (SELECT delivery_rate_24h FROM get_email_queue_stats()) as delivery_rate,
  (SELECT bounce_rate_24h FROM get_email_bounce_stats()) as bounce_rate,
  (SELECT COUNT(*) FROM email_alert_history 
   WHERE created_at > NOW() - INTERVAL '1 hour') as alerts_last_hour;
```

### Alert Summary (Last 24 Hours)

```sql
SELECT 
  alert_type,
  severity,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM email_alert_history
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY alert_type, severity
ORDER BY count DESC;
```

### Queue Trends (Last 7 Days)

```sql
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as delivery_rate
FROM email_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day;
```

## Troubleshooting

### Alerts Not Being Sent

1. **Check if alerts are enabled:**
   ```sql
   SELECT * FROM email_alert_config WHERE enabled = true;
   ```

2. **Check webhook URL is configured:**
   ```sql
   SELECT alert_type, webhook_url FROM email_alert_config;
   ```

3. **Check for recent alerts:**
   ```sql
   SELECT * FROM email_alert_history 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

4. **Manually trigger alert check:**
   ```sql
   SELECT * FROM check_email_system_alerts();
   ```

### Too Many Alerts

1. **Adjust thresholds:**
   ```sql
   UPDATE email_alert_config 
   SET threshold_warning = 200,
       threshold_critical = 1000
   WHERE alert_type = 'queue_depth';
   ```

2. **Check cooldown period:**
   Alerts have a 15-minute cooldown to prevent spam. Check `last_alert_sent_at`:
   ```sql
   SELECT alert_type, last_alert_sent_at 
   FROM email_alert_config;
   ```

### Cron Jobs Not Running

1. **Check if pg_cron is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **List scheduled jobs:**
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%email%';
   ```

3. **Check job execution history:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid IN (
     SELECT jobid FROM cron.job 
     WHERE jobname LIKE '%email%'
   )
   ORDER BY start_time DESC
   LIMIT 10;
   ```

## Performance Considerations

- Monitoring functions use efficient queries with proper indexes
- Alert checking runs every 5 minutes (configurable)
- Cooldown period prevents alert spam
- Old alerts are automatically cleaned up
- Webhook calls are non-blocking (don't fail the alert if webhook fails)

## Security

- Alert configuration requires `service_role` permissions to update
- Authenticated users can view alerts and statistics
- Webhook URLs should be kept secure
- Consider using signed webhooks for production

## Dependencies

- **pg_cron** - Required for scheduled jobs
- **http** - Required for webhook calls (optional, alerts still work without it)

## Rollback

To remove monitoring and alerting:

```sql
-- Drop scheduled jobs
SELECT cron.unschedule('check-email-system-alerts');
SELECT cron.unschedule('cleanup-old-email-alerts');

-- Drop functions
DROP FUNCTION IF EXISTS check_email_system_alerts();
DROP FUNCTION IF EXISTS send_email_alert(VARCHAR, VARCHAR, TEXT, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS cleanup_old_email_alerts();
DROP FUNCTION IF EXISTS get_email_bounce_stats();
DROP FUNCTION IF EXISTS get_email_queue_stats();

-- Drop tables
DROP TABLE IF EXISTS email_alert_history;
DROP TABLE IF EXISTS email_alert_config;
```

## Related Documentation

- [Production Deployment Guide](../../docs/deployment/email-system-production-deployment.md)
- [Quick Deploy Guide](../../docs/deployment/email-system-quick-deploy.md)
- [Deployment Checklist](../.kiro/specs/email-management-system/production-deployment-checklist.md)
- [Email Troubleshooting](../../docs/development/email-troubleshooting.md)
