# Process Email Queue Edge Function

This Supabase Edge Function processes queued emails using the configured email provider (Resend or AWS SES). It runs on a cron schedule and processes emails in batches with automatic retry logic.

## Features

- **Batch Processing**: Processes up to 10 emails per run (configurable)
- **Priority-Based**: Processes high priority emails first, then normal, then low
- **Scheduled Emails**: Respects scheduled send times
- **Automatic Retry**: Retries failed emails with exponential backoff (1min, 5min, 15min, 45min, 2hr)
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Checks queue health and logs alerts
- **Provider Support**: Works with both Resend and AWS SES providers

## Configuration

### Environment Variables

The function requires the following environment variables (automatically available in Supabase):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

### Email Provider Configuration

The function reads the active email provider from the `email_providers` table. Ensure you have:

1. An active email provider configured in the database
2. Valid API credentials stored in the provider config

## Cron Schedule

To run this function automatically every minute, configure a cron trigger in your Supabase project:

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension if not already enabled
4. Go to **SQL Editor** and run:

```sql
-- Create cron job to process email queue every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

### Verify Cron Job

To verify the cron job is scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

### Remove Cron Job

If you need to remove the cron job:

```sql
SELECT cron.unschedule('process-email-queue');
```

## Local Testing

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

### Serve Function Locally

```bash
supabase functions serve process-email-queue --env-file .env.local
```

### Test Function

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-email-queue' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### View Logs

```bash
supabase functions logs process-email-queue
```

## Deployment

### Deploy to Supabase

```bash
supabase functions deploy process-email-queue
```

### Deploy with Secrets

If you need to set additional secrets:

```bash
supabase secrets set RESEND_API_KEY=your_api_key
supabase functions deploy process-email-queue
```

### Verify Deployment

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "processed": 10,
  "succeeded": 8,
  "failed": 1,
  "retried": 1
}
```

### Error Response

```json
{
  "success": false,
  "error": "No active email provider configured",
  "processed": 0,
  "succeeded": 0,
  "failed": 0,
  "retried": 0
}
```

## Monitoring

### Queue Health Checks

The function automatically checks queue health and logs alerts when:

- Queue depth exceeds 100 (warning) or 500 (critical)
- Oldest pending email is older than 30 minutes (warning) or 60 minutes (critical)
- More than 20 (warning) or 50 (critical) emails failed in the last hour

### View Logs

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Select `process-email-queue`
3. Click **Logs** tab

Or use CLI:
```bash
supabase functions logs process-email-queue --tail
```

### Metrics to Monitor

- **Processing Rate**: Number of emails processed per minute
- **Success Rate**: Percentage of emails sent successfully
- **Retry Rate**: Percentage of emails requiring retry
- **Queue Depth**: Number of pending + processing emails
- **Oldest Pending Age**: Age of the oldest pending email

## Troubleshooting

### No Emails Being Processed

1. Check if the cron job is running:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'process-email-queue' 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

2. Check if there's an active email provider:
   ```sql
   SELECT * FROM email_providers WHERE is_active = true;
   ```

3. Check if there are pending emails:
   ```sql
   SELECT COUNT(*) FROM email_queue WHERE status = 'pending';
   ```

### High Failure Rate

1. Check email provider credentials:
   ```sql
   SELECT name, is_active FROM email_providers WHERE is_active = true;
   ```

2. Review recent errors:
   ```sql
   SELECT id, to_address, last_error, retry_count 
   FROM email_queue 
   WHERE status = 'failed' 
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```

3. Check email logs:
   ```sql
   SELECT * FROM email_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Queue Backing Up

1. Increase batch size (modify `BATCH_SIZE` constant in index.ts)
2. Increase cron frequency (e.g., every 30 seconds instead of every minute)
3. Check for provider rate limits
4. Review and optimize email templates

## Performance Tuning

### Batch Size

The default batch size is 10 emails per run. To adjust:

1. Edit `index.ts` and change the `BATCH_SIZE` constant
2. Redeploy the function

Consider:
- **Smaller batches** (5-10): Better for reliability, easier to debug
- **Larger batches** (20-50): Better for throughput, but may hit rate limits

### Cron Frequency

The default is every minute. To process more frequently:

```sql
-- Every 30 seconds
SELECT cron.schedule(
  'process-email-queue',
  '*/30 * * * * *',
  $$ ... $$
);
```

Note: More frequent processing increases database load and function invocations.

## Security

- The function uses the service role key for database access
- Email provider credentials are stored encrypted in the database
- The function does not require JWT authentication (internal cron job)
- All operations are logged for audit purposes

## Related Documentation

- [Email Management System Design](../../../.kiro/specs/email-management-system/design.md)
- [Email Queue Manager](../../../src/lib/email/queue-manager.ts)
- [Email Service](../../../src/lib/services/email.service.ts)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
