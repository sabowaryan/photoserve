# Monitoring and Observability

This document describes the monitoring and observability infrastructure for the PikSend Lightroom Plugin.

## Overview

The monitoring system tracks key metrics, configures alerting thresholds, and provides health check endpoints for system observability.

## Components

### 1. Metrics Service

**Location:** `src/lib/services/metrics.service.ts`

The metrics service tracks and exposes metrics for monitoring:

- **API Key Validation Metrics**
  - Response time (p50, p95, p99)
  - Success rate
  - Failure count

- **Plugin Download Metrics**
  - Total downloads
  - Download failures
  - Failure rate

- **Active Users Metrics**
  - Daily active users
  - Weekly active users
  - Monthly active users

- **Error Metrics**
  - Error count by endpoint
  - Total requests by endpoint
  - Error rate by endpoint

- **Database Query Metrics**
  - Query response time (p50, p95, p99)
  - Query count

**Usage:**

```typescript
import { metricsService } from '@/lib/services/metrics.service';

// Track API key validation
metricsService.trackApiKeyValidation(durationMs, success);

// Track plugin download
metricsService.trackPluginDownload(success);

// Track endpoint error
metricsService.trackEndpointError('/api/endpoint', isError);

// Track database query
metricsService.trackDbQuery(durationMs);

// Get metrics
const apiKeyMetrics = metricsService.getApiKeyValidationMetrics();
const downloadMetrics = metricsService.getPluginDownloadMetrics();
const errorMetrics = metricsService.getErrorMetrics();
const dbMetrics = metricsService.getDbQueryMetrics();
```

### 2. Alerting Service

**Location:** `src/lib/services/alerting.service.ts`

The alerting service monitors metrics against configured thresholds and triggers alerts:

**Alert Thresholds:**

1. **API Validation Slow** (Warning)
   - Triggers when API key validation p95 > 100ms

2. **High Error Rate** (Critical)
   - Triggers when overall error rate > 1%

3. **High Download Failure Rate** (Warning)
   - Triggers when plugin download failure rate > 5%

4. **Slow Database Queries** (Critical)
   - Triggers when database query p95 > 1000ms

5. **Cloudinary Upload Failures** (Critical)
   - Triggers when Cloudinary upload failures are detected

**Usage:**

```typescript
import { alertingService } from '@/lib/services/alerting.service';

// Check all thresholds
const alerts = await alertingService.checkThresholds();

// Get recent alerts
const recentAlerts = alertingService.getRecentAlerts(10);

// Get alert summary
const summary = alertingService.getAlertSummary();
```

### 3. Health Check Endpoints

Health check endpoints provide status information for monitoring tools:

#### Basic Health Check

**Endpoint:** `GET /api/health`

Returns basic application health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### Database Health Check

**Endpoint:** `GET /api/health/db`

Tests database connectivity by running a simple query.

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 45,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### Cloudinary Health Check

**Endpoint:** `GET /api/health/cloudinary`

Tests Cloudinary connectivity by pinging the API.

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 120,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### Comprehensive Health Check

**Endpoint:** `GET /api/health/all`

Checks all services and returns overall health status.

**Response:**
```json
{
  "overall": "healthy",
  "services": {
    "application": {
      "status": "healthy",
      "responseTime": 5
    },
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "cloudinary": {
      "status": "healthy",
      "responseTime": 120
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Status Codes:**
- `200` - All services healthy
- `207` - Some services degraded (partial success)
- `503` - Critical services unhealthy

## Admin Endpoints

### Metrics Endpoint

**Endpoint:** `GET /api/admin/metrics`

**Authentication:** Required (Admin only)

Returns all system metrics for monitoring dashboards.

**Response:**
```json
{
  "metrics": {
    "apiKeyValidation": {
      "p50": 45,
      "p95": 89,
      "p99": 120,
      "count": 1000,
      "successRate": 0.98
    },
    "pluginDownloads": {
      "total": 500,
      "failures": 5,
      "failureRate": 0.01
    },
    "activeUsers": {
      "daily": 50,
      "weekly": 200,
      "monthly": 800
    },
    "errors": [
      {
        "endpoint": "/api/plugin/auth/validate",
        "errorCount": 10,
        "totalRequests": 1000,
        "errorRate": 0.01
      }
    ],
    "dbQueries": {
      "p50": 20,
      "p95": 50,
      "p99": 100,
      "count": 5000
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Alerts Endpoint

**Endpoint:** `GET /api/admin/alerts`

**Authentication:** Required (Admin only)

Returns recent alerts and alert summary.

**Response:**
```json
{
  "summary": {
    "total": 5,
    "critical": 1,
    "warning": 4,
    "recent": [
      {
        "name": "api_validation_slow",
        "description": "API key validation p95 response time exceeds 100ms",
        "severity": "warning",
        "timestamp": "2024-01-15T10:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Endpoint:** `POST /api/admin/alerts`

**Authentication:** Required (Admin only)

Manually triggers alert checks.

**Response:**
```json
{
  "alertsTriggered": 2,
  "alerts": [
    {
      "name": "api_validation_slow",
      "description": "API key validation p95 response time exceeds 100ms",
      "severity": "warning",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Automated Alert Checking

### Cron Job

**Endpoint:** `GET /api/cron/check-alerts`

This endpoint is designed to be called by external cron services (e.g., Vercel Cron) every 5 minutes.

**Authentication:** Bearer token with `CRON_SECRET` environment variable

**Vercel Cron Configuration:**

The `vercel.json` file configures automatic alert checking:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Manual Trigger:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/check-alerts
```

## Environment Variables

Required environment variables for monitoring:

```env
# Cron job authentication
CRON_SECRET=your-secret-key

# Application URL for health checks
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Integration with Monitoring Tools

### Prometheus

The metrics can be exported to Prometheus format by creating a custom endpoint:

```typescript
// /api/metrics (Prometheus format)
export async function GET() {
  const metrics = await metricsService.getAllMetrics(supabase);
  
  // Convert to Prometheus format
  const prometheusMetrics = `
# HELP api_key_validation_duration_seconds API key validation duration
# TYPE api_key_validation_duration_seconds summary
api_key_validation_duration_seconds{quantile="0.5"} ${metrics.apiKeyValidation.p50 / 1000}
api_key_validation_duration_seconds{quantile="0.95"} ${metrics.apiKeyValidation.p95 / 1000}
api_key_validation_duration_seconds{quantile="0.99"} ${metrics.apiKeyValidation.p99 / 1000}
api_key_validation_duration_seconds_count ${metrics.apiKeyValidation.count}

# HELP api_key_validation_success_rate API key validation success rate
# TYPE api_key_validation_success_rate gauge
api_key_validation_success_rate ${metrics.apiKeyValidation.successRate}
  `.trim();
  
  return new Response(prometheusMetrics, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

### Datadog / New Relic

Metrics can be pushed to Datadog or New Relic by modifying the alerting service:

```typescript
// In alerting.service.ts
private async sendAlert(alert: Alert): Promise<void> {
  // Send to Datadog
  await fetch('https://api.datadoghq.com/api/v1/events', {
    method: 'POST',
    headers: {
      'DD-API-KEY': process.env.DATADOG_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: alert.name,
      text: alert.description,
      alert_type: alert.severity === 'critical' ? 'error' : 'warning',
    }),
  });
}
```

## Best Practices

1. **Monitor Regularly**: Set up automated monitoring with 5-minute intervals
2. **Set Appropriate Thresholds**: Adjust alert thresholds based on your traffic patterns
3. **Review Metrics**: Regularly review metrics to identify trends and potential issues
4. **Test Health Checks**: Periodically test health check endpoints to ensure they work correctly
5. **Alert Fatigue**: Avoid too many alerts by setting reasonable thresholds
6. **Document Incidents**: Keep a log of alerts and how they were resolved

## Troubleshooting

### High API Validation Times

If API key validation p95 exceeds 100ms:

1. Check database connection pool
2. Review database query performance
3. Check for network latency issues
4. Consider adding caching for API key validation

### High Error Rates

If error rate exceeds 1%:

1. Check application logs for error details
2. Review recent deployments
3. Check external service status (database, Cloudinary)
4. Monitor resource usage (CPU, memory)

### Database Connection Issues

If database health checks fail:

1. Check Supabase status
2. Verify database credentials
3. Check connection pool settings
4. Review database query logs

### Cloudinary Connection Issues

If Cloudinary health checks fail:

1. Check Cloudinary status
2. Verify API credentials
3. Check network connectivity
4. Review Cloudinary usage limits

## Future Enhancements

1. **Real-time Dashboards**: Build admin dashboard with real-time metrics visualization
2. **Custom Alert Channels**: Add support for Slack, email, SMS notifications
3. **Historical Metrics**: Store metrics in database for long-term analysis
4. **Anomaly Detection**: Implement ML-based anomaly detection for proactive alerting
5. **Distributed Tracing**: Add OpenTelemetry for distributed tracing across services
