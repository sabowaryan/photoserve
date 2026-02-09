# Email Monitoring and Alerting Setup Guide

This guide explains how to set up and configure the email monitoring and alerting system for the PikSend email management platform.

## Overview

The email monitoring system provides real-time monitoring and alerting for:

- **Queue Size Monitoring**: Alerts when email queue exceeds 1,000 emails
- **Failure Rate Monitoring**: Alerts when failure rate exceeds 5%
- **Bounce Rate Monitoring**: Alerts when bounce rate exceeds 10%
- **Provider Health Checks**: Pings email provider every 5 minutes
- **Performance Monitoring**: Tracks email sending latency
- **Error Tracking**: Integrates with Sentry for error tracking

## Architecture

### Components

1. **EmailMonitoringService** (`src/lib/services/email-monitoring.service.ts`)
   - Core monitoring logic
   - Collects metrics from queue, logs, and analytics
   - Checks thresholds and generates alerts
   - Sends notifications via Sentry

2. **Monitoring API** (`src/app/api/emails/monitoring/route.ts`)
   - GET endpoint for fetching current metrics
   - POST endpoint for manual threshold checks
   - Admin-only access with authentication

3. **Monitoring Cron Job** (`src/app/api/cron/email-monitoring/route.ts`)
   - Automated checks every 5 minutes
   - Triggered by external cron service
   - Authenticated with CRON_SECRET

4. **Monitoring Dashboard** (`src/components/admin/email/monitoring-dashboard.tsx`)
   - Real-time metrics display
   - Alert history and management
   - Performance statistics
   - Auto-refresh every 30 seconds

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Cron Secret (required)
# Generate with: openssl rand -base64 32
CRON_SECRET=your_generated_secret_here

# Sentry Error Tracking (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### Monitoring Thresholds

Default thresholds are defined in `src/lib/services/email-monitoring.service.ts`:

```typescript
export const DEFAULT_THRESHOLDS = {
  queueSize: 1000,           // Alert if queue > 1000
  failureRate: 5,            // Alert if failure rate > 5%
  bounceRate: 10,            // Alert if bounce rate > 10%
  healthCheckInterval: 300000, // Check every 5 minutes
  latencyThreshold: 5000,    // Alert if latency > 5000ms
};
```

To customize thresholds, modify these values in the service file.

## Setting Up Automated Monitoring

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/email-monitoring",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Deploy to Vercel - cron jobs will run automatically

### Option 2: External Cron Service

Use any external cron service (e.g., cron-job.org, EasyCron) to call the monitoring endpoint:

**URL**: `https://your-domain.com/api/cron/email-monitoring`
**Method**: POST
**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```
**Schedule**: Every 5 minutes (`*/5 * * * *`)

### Option 3: GitHub Actions

Create `.github/workflows/email-monitoring.yml`:

```yaml
name: Email Monitoring

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Monitoring Check
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-domain.com/api/cron/email-monitoring
```

Add `CRON_SECRET` to your GitHub repository secrets.

## Setting Up Sentry Error Tracking

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for your Next.js application
3. Copy the DSN (Data Source Name)

### 2. Configure Sentry

Add the DSN to your `.env` file:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### 3. Sentry Configuration Files

The following Sentry configuration files are already set up:

- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking

### 4. Verify Sentry Integration

1. Deploy your application with Sentry configured
2. Trigger a test alert by manually checking thresholds
3. Check your Sentry dashboard for captured events

## Using the Monitoring Dashboard

### Accessing the Dashboard

Navigate to: `/admin/emails/monitoring`

### Dashboard Features

1. **Metrics Cards**
   - Queue Size: Current number of emails in queue
   - Failure Rate: Percentage of failed emails (last 24 hours)
   - Bounce Rate: Percentage of bounced emails (last 24 hours)
   - Provider Health: Current provider connection status
   - Average Latency: Average email sending time

2. **Performance Metrics**
   - Average latency
   - P50, P95, P99 latency percentiles
   - Total emails processed in time period

3. **Active Alerts**
   - List of all active alerts
   - Severity badges (info, warning, critical)
   - Alert details and timestamps
   - Clear alerts functionality

4. **Actions**
   - Refresh: Manually refresh metrics
   - Check Thresholds: Trigger manual threshold check
   - Clear Alerts: Clear all active alerts

### Auto-Refresh

The dashboard automatically refreshes every 30 seconds to show real-time data.

## API Endpoints

### GET /api/emails/monitoring

Get current monitoring metrics.

**Query Parameters**:
- `action=alerts` - Get alerts only
- `action=performance` - Get performance metrics
- `type=<alert_type>` - Filter alerts by type
- `severity=<severity>` - Filter alerts by severity
- `limit=<number>` - Limit number of results

**Response**:
```json
{
  "success": true,
  "metrics": {
    "queueSize": 150,
    "failureRate": 2.5,
    "bounceRate": 1.2,
    "providerHealthy": true,
    "avgLatency": 1250,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "summary": {
    "total": 5,
    "critical": 1,
    "warning": 4,
    "info": 0,
    "byType": {
      "queue_size": 2,
      "failure_rate": 1,
      "bounce_rate": 1,
      "provider_health": 0,
      "performance": 1
    },
    "recent": [...]
  }
}
```

### POST /api/emails/monitoring

Trigger monitoring actions.

**Request Body**:
```json
{
  "action": "check" | "clear" | "health-check"
}
```

**Actions**:
- `check` - Manually trigger threshold checks
- `clear` - Clear all alerts
- `health-check` - Manually trigger provider health check

### POST /api/cron/email-monitoring

Automated monitoring endpoint (cron job).

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**:
```json
{
  "success": true,
  "message": "Monitoring checks completed",
  "metrics": {...},
  "alerts": {
    "new": 2,
    "total": 5,
    "critical": 1,
    "warning": 4
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Alert Types and Thresholds

### Queue Size Alert
- **Threshold**: 1,000 emails
- **Severity**: Warning (> 1,000), Critical (> 2,000)
- **Action**: Check queue processing, increase batch size, or scale workers

### Failure Rate Alert
- **Threshold**: 5%
- **Severity**: Warning (> 5%), Critical (> 10%)
- **Action**: Check provider status, review error logs, verify credentials

### Bounce Rate Alert
- **Threshold**: 10%
- **Severity**: Warning (> 10%), Critical (> 20%)
- **Action**: Review email list quality, check sender reputation, verify domain authentication

### Provider Health Alert
- **Threshold**: Connection failure
- **Severity**: Critical
- **Action**: Check provider credentials, verify API status, switch to backup provider

### Performance Alert
- **Threshold**: 5,000ms average latency
- **Severity**: Warning (> 5s), Critical (> 10s)
- **Action**: Check provider performance, optimize queue processing, review database queries

## Troubleshooting

### Monitoring Not Working

1. **Check Cron Job Configuration**
   - Verify CRON_SECRET is set correctly
   - Check cron job is running (check logs)
   - Verify endpoint URL is correct

2. **Check Authentication**
   - Ensure admin user has proper permissions
   - Verify Supabase authentication is working
   - Check RLS policies on profiles table

3. **Check Provider Connection**
   - Verify email provider credentials
   - Test provider connection manually
   - Check provider API status

### Alerts Not Appearing

1. **Check Thresholds**
   - Verify metrics exceed thresholds
   - Check threshold values in service
   - Manually trigger threshold check

2. **Check Sentry Integration**
   - Verify SENTRY_DSN is set
   - Check Sentry dashboard for events
   - Review Sentry configuration

### Dashboard Not Loading

1. **Check API Endpoints**
   - Verify `/api/emails/monitoring` is accessible
   - Check browser console for errors
   - Review API route logs

2. **Check Authentication**
   - Ensure user is logged in as admin
   - Verify session is valid
   - Check admin permissions

## Best Practices

1. **Set Up Alerts Early**
   - Configure monitoring before going to production
   - Test alerts with simulated failures
   - Document alert response procedures

2. **Monitor Regularly**
   - Check dashboard daily
   - Review alert history weekly
   - Analyze trends monthly

3. **Respond to Alerts Promptly**
   - Critical alerts require immediate action
   - Warning alerts should be investigated within 24 hours
   - Document alert resolutions

4. **Optimize Thresholds**
   - Adjust thresholds based on your email volume
   - Reduce false positives
   - Increase sensitivity for critical metrics

5. **Integrate with Incident Management**
   - Connect Sentry to PagerDuty or similar
   - Set up email notifications for critical alerts
   - Create runbooks for common issues

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)
- [Monitoring Best Practices](https://www.datadoghq.com/blog/monitoring-101-collecting-data/)

## Support

For issues or questions about email monitoring:

1. Check the troubleshooting section above
2. Review Sentry error logs
3. Check email provider status pages
4. Contact support with monitoring dashboard screenshots
