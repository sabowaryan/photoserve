# Cron Jobs Setup Guide

## Overview

The application uses Edge Functions as cron jobs to perform periodic maintenance tasks. These functions need to be triggered on a schedule using an external cron service.

## Available Cron Jobs

### 1. Cleanup Expired Galleries

**Function:** `cleanup-expired-galleries`  
**Recommended Schedule:** Daily at 2:00 AM  
**Cron Expression:** `0 2 * * *`

**What it does:**
- Finds all galleries where `expires_at < now` OR `is_active = false`
- Deletes images from Cloudinary
- Deletes images from database
- Deletes galleries from database
- Updates user storage usage
- Returns statistics (galleries deleted, images deleted, storage freed)

**Endpoint:**
```
POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries
```

### 2. Notify Expiring Galleries

**Function:** `notify-expiring-galleries`  
**Recommended Schedule:** Daily at 9:00 AM  
**Cron Expression:** `0 9 * * *`

**What it does:**
- Finds galleries expiring in the next 24-48 hours
- Sends email notifications to gallery owners
- Reminds users to renew or download content

**Endpoint:**
```
POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/notify-expiring-galleries
```

### 3. Cleanup Rate Limits

**Function:** `cleanup-rate-limits`  
**Recommended Schedule:** Every hour  
**Cron Expression:** `0 * * * *`

**What it does:**
- Removes expired rate limit entries from database
- Prevents rate_limits table from growing indefinitely
- Improves query performance

**Endpoint:**
```
POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-rate-limits
```

## Setup Options

### Option 1: Supabase Cron (Recommended for Production)

Supabase provides built-in cron functionality via pg_cron extension.

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Create cron jobs in SQL Editor:

```sql
-- Cleanup expired galleries daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-expired-galleries',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Notify expiring galleries daily at 9 AM UTC
SELECT cron.schedule(
  'notify-expiring-galleries',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/notify-expiring-galleries',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Cleanup rate limits every hour
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-rate-limits',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**View scheduled jobs:**
```sql
SELECT * FROM cron.job;
```

**Unschedule a job:**
```sql
SELECT cron.unschedule('cleanup-expired-galleries');
```

### Option 2: External Cron Service (Alternative)

Use services like:
- **Cron-job.org** (Free, simple)
- **EasyCron** (Free tier available)
- **GitHub Actions** (If using GitHub)

**Example with cron-job.org:**
1. Sign up at https://cron-job.org
2. Create new cron job
3. Set URL: `https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries`
4. Set schedule: Daily at 2:00 AM
5. Add header: `Authorization: Bearer YOUR_ANON_KEY`

### Option 3: GitHub Actions (For GitHub Users)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Scheduled Cron Jobs

on:
  schedule:
    # Cleanup expired galleries - Daily at 2 AM UTC
    - cron: '0 2 * * *'
    # Notify expiring galleries - Daily at 9 AM UTC
    - cron: '0 9 * * *'
    # Cleanup rate limits - Every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup-expired-galleries:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *'
    steps:
      - name: Cleanup Expired Galleries
        run: |
          curl -X POST \
            https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"

  notify-expiring-galleries:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 9 * * *'
    steps:
      - name: Notify Expiring Galleries
        run: |
          curl -X POST \
            https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/notify-expiring-galleries \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"

  cleanup-rate-limits:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Cleanup Rate Limits
        run: |
          curl -X POST \
            https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-rate-limits \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## Testing Cron Jobs Manually

You can test the cron jobs manually using curl:

```bash
# Test cleanup expired galleries
curl -X POST \
  https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test notify expiring galleries
curl -X POST \
  https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/notify-expiring-galleries \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test cleanup rate limits
curl -X POST \
  https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-rate-limits \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

### Check Logs

View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select the function
3. View Logs tab

### Expected Responses

**Cleanup Expired Galleries:**
```json
{
  "success": true,
  "deletedGalleries": 5,
  "deletedImages": 123,
  "freedStorageMb": 456.78,
  "affectedUsers": 3
}
```

**No galleries to clean:**
```json
{
  "success": true,
  "message": "No expired galleries to clean up",
  "deletedGalleries": 0,
  "deletedImages": 0,
  "freedStorageMb": 0
}
```

## Troubleshooting

### Cron job not running

1. Check cron schedule is correct
2. Verify function URL is correct
3. Check authorization header is set
4. View function logs for errors

### Function returns error

1. Check environment variables are set in Supabase
2. Verify Cloudinary credentials are correct
3. Check database permissions
4. Review function logs for specific error

### No galleries being deleted

1. Verify galleries have `expires_at` in the past
2. Check `is_active` field
3. Run manual test to see response
4. Check database for expired galleries:

```sql
SELECT id, title, expires_at, is_active
FROM galleries
WHERE expires_at < NOW() OR is_active = false;
```

## Best Practices

1. **Monitor regularly**: Check logs weekly to ensure jobs are running
2. **Test before production**: Test cron jobs in staging environment first
3. **Set up alerts**: Configure alerts for failed cron jobs
4. **Backup before cleanup**: Ensure database backups are enabled
5. **Document changes**: Update this guide when modifying cron schedules
