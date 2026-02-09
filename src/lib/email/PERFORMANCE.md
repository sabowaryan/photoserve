# Email System Performance - Quick Reference

## Quick Start

### Enable Caching

```typescript
// Caching is enabled by default
// To disable in development:
process.env.DISABLE_CACHE = 'true';
```

### Use Optimized Batch Processing

```typescript
import { QueueManager } from '@/lib/email/queue-manager';

const queueManager = new QueueManager(supabase);

// Automatically uses optimized batch size
await queueManager.processBatch();

// Or specify custom size
await queueManager.processBatch(20);
```

### Monitor Performance

```typescript
import { startTimer } from '@/lib/email/performance-config';

const timer = startTimer('operation_name');
// ... perform operation
const metrics = timer.end({ metadata });
// Automatically logs if exceeds threshold
```

## Cache Usage

### Template Cache

```typescript
import { getTemplate, setTemplate, invalidateTemplate } from '@/lib/cache/email-cache';

// Get from cache
const template = getTemplate(templateId);

// Set in cache
setTemplate(templateId, templateData);

// Invalidate on update
invalidateTemplate(templateId);
```

### Rendered Template Cache

```typescript
import { getRenderedTemplate, setRenderedTemplate } from '@/lib/cache/email-cache';

// Check cache before rendering
const cached = getRenderedTemplate(templateId, variables);
if (cached) return cached;

// Render and cache
const rendered = await renderTemplate(templateId, variables);
setRenderedTemplate(templateId, variables, rendered);
```

## Database Queries

### Use Optimized Functions

```sql
-- Get queue statistics (single query)
SELECT * FROM get_email_queue_stats();

-- Get template analytics (uses materialized view)
SELECT * FROM get_template_analytics(
  'template-id',
  '2024-01-01'::DATE,
  '2024-01-31'::DATE
);
```

### Refresh Analytics

```sql
-- Run daily via cron
SELECT refresh_email_analytics();
```

## Configuration

### Environment Variables

```env
# Queue
EMAIL_QUEUE_BATCH_SIZE=10

# Cache
EMAIL_CACHE_ENABLED=true

# Database Pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# Monitoring
EMAIL_MONITORING_ENABLED=true
```

## Load Testing

```bash
# Basic test
k6 run tests/performance/email-system-load-test.js

# Custom load
k6 run --vus 50 --duration 5m tests/performance/email-system-load-test.js
```

## Maintenance

### Daily
```sql
SELECT refresh_email_analytics();
SELECT cleanup_old_queue_entries();
```

### Weekly
```sql
SELECT archive_old_email_logs();
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Request Duration (p95) | < 2000ms | < 5000ms |
| Error Rate | < 5% | < 10% |
| Email Send Success | > 95% | > 90% |
| Cache Hit Rate | > 80% | > 50% |

## Troubleshooting

### High Latency
1. Check cache hit rate: `getStats()`
2. Check slow queries: `SELECT * FROM email_query_performance`
3. Increase connection pool size

### High Memory
1. Check cache size: `getStats()`
2. Reduce cache TTL
3. Clear cache: `clearAll()`

### Slow Queries
1. Check query performance table
2. Analyze query plans: `EXPLAIN ANALYZE`
3. Add missing indexes

## More Information

See `docs/development/email-performance-optimization.md` for complete documentation.
