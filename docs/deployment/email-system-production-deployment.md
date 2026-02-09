# Email Management System - Production Deployment Guide

## Overview

This guide walks through deploying the Email Management System to production, including database migrations, edge functions, webhook configuration, and monitoring setup.

## Prerequisites

Before deploying, ensure you have:

1. **Supabase CLI** installed and authenticated
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **Production environment variables** configured in `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
   - `RESEND_API_KEY` - Production Resend API key (if using Resend)
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (if using AWS SES)
   - `EMAIL_PROVIDER_DEFAULT` - Default provider (resend or aws-ses)
   - `EMAIL_PROVIDER_ENCRYPTION_KEY` - Encryption key for provider credentials

3. **Supabase project** linked to production:
   ```bash
   supabase link --project-ref your-production-project-ref
   ```

4. **Backup** of production database (recommended)

## Deployment Steps

### Step 1: Run Database Migrations

The email management system requires several database migrations to be applied:

```bash
# Check migration status
supabase db remote list

# Apply all pending migrations to production
supabase db push

# Verify migrations were applied successfully
supabase db remote list
```

**Key migrations for email system:**
- `20260206120000_create_email_management_system.sql` - Core email tables
- `20260206120001_fix_email_providers_config_type.sql` - Provider config fix
- `20260206130000_optimize_email_queries.sql` - Performance indexes

**Verify tables were created:**
```sql
-- Connect to production database and verify
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%';

-- Expected tables:
-- email_providers
-- sender_addresses
-- email_templates
-- template_versions
-- email_queue
-- email_logs
-- email_events
-- email_suppressions
-- email_unsubscribes
```

### Step 2: Deploy Edge Functions

Deploy the email queue processing edge function to production:

```bash
# Deploy the process-email-queue function
supabase functions deploy process-email-queue

# Verify deployment
supabase functions list
```

**Configure cron trigger:**

The edge function should run every 1 minute to process the email queue. Configure this in the Supabase dashboard:

1. Go to **Database** → **Cron Jobs** (or use pg_cron extension)
2. Create a new cron job:
   ```sql
   -- Enable pg_cron extension if not already enabled
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Schedule the email queue processing job
   SELECT cron.schedule(
     'process-email-queue',
     '* * * * *', -- Every minute
     $$
     SELECT
       net.http_post(
         url := 'https://your-project-ref.supabase.co/functions/v1/process-email-queue',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
         ),
         body := '{}'::jsonb
       ) as request_id;
     $$
   );
   ```

**Alternative: Use Supabase Edge Function Cron (Recommended)**

In your Supabase dashboard:
1. Go to **Edge Functions** → **process-email-queue**
2. Click **Settings** → **Cron**
3. Set schedule: `* * * * *` (every minute)
4. Save

### Step 3: Configure Webhooks

#### Resend Webhooks (if using Resend)

1. **Get your production webhook URL:**
   ```
   https://your-domain.com/api/webhooks/email/resend
   ```

2. **Configure in Resend Dashboard:**
   - Go to https://resend.com/webhooks
   - Click **Add Webhook**
   - Enter webhook URL: `https://your-domain.com/api/webhooks/email/resend`
   - Select events to track:
     - ✅ email.sent
     - ✅ email.delivered
     - ✅ email.delivery_delayed
     - ✅ email.complained
     - ✅ email.bounced
     - ✅ email.opened
     - ✅ email.clicked
   - Click **Create Webhook**
   - **Save the webhook signing secret** (you'll need this for verification)

3. **Test webhook:**
   - Send a test email through the system
   - Check Resend dashboard for webhook delivery status
   - Check your application logs for webhook processing

#### AWS SES Webhooks (if using AWS SES)

1. **Create SNS Topic:**
   ```bash
   aws sns create-topic --name email-events-production
   ```

2. **Configure SES to publish events to SNS:**
   ```bash
   # Create configuration set
   aws sesv2 create-configuration-set --configuration-set-name production-emails

   # Add event destination
   aws sesv2 create-configuration-set-event-destination \
     --configuration-set-name production-emails \
     --event-destination-name email-events \
     --event-destination '{
       "Enabled": true,
       "MatchingEventTypes": ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK"],
       "SnsDestination": {
         "TopicArn": "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:email-events-production"
       }
     }'
   ```

3. **Subscribe your webhook endpoint to SNS:**
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:email-events-production \
     --protocol https \
     --notification-endpoint https://your-domain.com/api/webhooks/email/ses
   ```

4. **Confirm subscription:**
   - AWS will send a confirmation request to your endpoint
   - Your webhook handler should automatically confirm it
   - Check SNS dashboard to verify subscription is confirmed

### Step 4: Test Email Sending in Production

**Important:** Test with real email addresses you control before sending to customers.

1. **Configure email provider in admin UI:**
   - Go to `https://your-domain.com/admin/emails/providers`
   - Select your provider (Resend or AWS SES)
   - Enter production API credentials
   - Click **Test Connection**
   - Verify connection is successful

2. **Add and verify sender address:**
   - Go to `https://your-domain.com/admin/emails/senders`
   - Add your sender email address (e.g., `noreply@your-domain.com`)
   - Follow DNS verification instructions
   - Add DKIM, SPF, and DMARC records to your domain
   - Wait for verification (can take up to 24 hours)

3. **Send test emails:**
   ```bash
   # Using the API
   curl -X POST https://your-domain.com/api/emails/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{
       "templateId": "purchase-confirmation",
       "to": "your-test-email@example.com",
       "variables": {
         "buyerName": "Test User",
         "galleryName": "Test Gallery",
         "photoCount": 5,
         "amountPaid": "$50.00",
         "transactionId": "test_123",
         "purchaseDate": "2026-02-06",
         "accessLink": "https://your-domain.com/gallery/test",
         "photographerName": "Test Photographer"
       }
     }'
   ```

4. **Verify email delivery:**
   - Check that email was received
   - Verify email content renders correctly
   - Check email logs in admin UI: `https://your-domain.com/admin/emails/logs`
   - Verify webhook events are being received

### Step 5: Monitor for Errors (First 24 Hours)

**Set up monitoring dashboards:**

1. **Email Queue Monitoring:**
   - Monitor queue depth: Should stay below 100 under normal load
   - Monitor processing rate: Should process emails within 1-2 minutes
   - Monitor failed emails: Should be < 1% of total

2. **Delivery Metrics:**
   - Delivery rate: Should be > 95%
   - Bounce rate: Should be < 5%
   - Complaint rate: Should be < 0.1%

3. **System Health:**
   - Edge function execution time: Should be < 10 seconds
   - Database query performance: Monitor slow queries
   - API response times: Should be < 500ms

**Check logs regularly:**

```bash
# View edge function logs
supabase functions logs process-email-queue --tail

# Check for errors in application logs
# (Use your logging service: Vercel logs, CloudWatch, etc.)
```

**SQL queries for monitoring:**

```sql
-- Queue depth
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Recent failures
SELECT COUNT(*) as failed_count
FROM email_queue
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '1 hour';

-- Delivery rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as delivery_rate_percent
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Bounce rate
SELECT 
  COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) as bounced,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE bounced_at IS NOT NULL)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as bounce_rate_percent
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Step 6: Set Up Alerting for Critical Failures

**Configure alerts for:**

1. **High Queue Depth:**
   - Alert when queue depth > 500 (critical)
   - Alert when queue depth > 100 (warning)

2. **High Failure Rate:**
   - Alert when failure rate > 10% (critical)
   - Alert when failure rate > 5% (warning)

3. **High Bounce Rate:**
   - Alert when bounce rate > 10% (critical)
   - Alert when bounce rate > 5% (warning)

4. **Edge Function Failures:**
   - Alert when edge function fails to execute
   - Alert when edge function execution time > 30 seconds

**Implementation options:**

**Option 1: Supabase Database Webhooks**

Create a database function that checks metrics and sends alerts:

```sql
CREATE OR REPLACE FUNCTION check_email_alerts()
RETURNS void AS $$
DECLARE
  queue_depth INTEGER;
  failure_rate NUMERIC;
  bounce_rate NUMERIC;
BEGIN
  -- Check queue depth
  SELECT COUNT(*) INTO queue_depth
  FROM email_queue
  WHERE status IN ('pending', 'processing');

  IF queue_depth > 500 THEN
    -- Send critical alert
    PERFORM net.http_post(
      url := 'YOUR_ALERT_WEBHOOK_URL',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'alert', 'CRITICAL',
        'message', 'Email queue depth is ' || queue_depth,
        'metric', 'queue_depth',
        'value', queue_depth
      )::jsonb
    );
  END IF;

  -- Check failure rate (last hour)
  SELECT 
    ROUND(
      COUNT(*) FILTER (WHERE status = 'failed')::numeric / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) INTO failure_rate
  FROM email_queue
  WHERE created_at > NOW() - INTERVAL '1 hour';

  IF failure_rate > 10 THEN
    -- Send critical alert
    PERFORM net.http_post(
      url := 'YOUR_ALERT_WEBHOOK_URL',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'alert', 'CRITICAL',
        'message', 'Email failure rate is ' || failure_rate || '%',
        'metric', 'failure_rate',
        'value', failure_rate
      )::jsonb
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule alert checks every 5 minutes
SELECT cron.schedule(
  'check-email-alerts',
  '*/5 * * * *',
  'SELECT check_email_alerts();'
);
```

**Option 2: External Monitoring Service**

Use a service like:
- **Sentry** - For error tracking
- **Datadog** - For metrics and alerting
- **PagerDuty** - For on-call alerting
- **Slack/Discord** - For team notifications

**Option 3: Custom Monitoring Edge Function**

Create a separate edge function that runs periodically to check metrics and send alerts.

### Step 7: Production Checklist

Before considering deployment complete, verify:

- [ ] All database migrations applied successfully
- [ ] Edge function deployed and running on cron schedule
- [ ] Email provider configured and connection tested
- [ ] Sender address verified with DKIM/SPF/DMARC
- [ ] Webhooks configured and receiving events
- [ ] Test emails sent and received successfully
- [ ] Email logs showing correct status updates
- [ ] Analytics tracking working correctly
- [ ] Queue processing working (emails sent within 1-2 minutes)
- [ ] Retry logic working for failed emails
- [ ] Bounce and complaint handling working
- [ ] Monitoring dashboards set up
- [ ] Alerting configured for critical failures
- [ ] Documentation updated with production URLs
- [ ] Team trained on admin UI

## Rollback Plan

If issues occur during deployment:

1. **Database rollback:**
   ```bash
   # Revert to previous migration
   supabase db reset --db-url "postgresql://..."
   ```

2. **Edge function rollback:**
   ```bash
   # Deploy previous version
   git checkout previous-commit
   supabase functions deploy process-email-queue
   ```

3. **Disable email system:**
   ```sql
   -- Temporarily disable all email providers
   UPDATE email_providers SET is_active = false;
   ```

4. **Fallback to old system:**
   - Route emails through previous email sending code
   - Monitor for stability
   - Investigate and fix issues

## Post-Deployment

After successful deployment:

1. **Monitor for 24-48 hours** - Watch for any issues
2. **Review metrics daily** - Check delivery rates, bounce rates, etc.
3. **Optimize as needed** - Adjust batch sizes, retry delays, etc.
4. **Document any issues** - Keep a log of problems and solutions
5. **Train team** - Ensure everyone knows how to use the admin UI

## Troubleshooting

### Emails not being sent

1. Check queue status:
   ```sql
   SELECT * FROM email_queue WHERE status = 'pending' LIMIT 10;
   ```

2. Check edge function logs:
   ```bash
   supabase functions logs process-email-queue --tail
   ```

3. Verify provider configuration:
   ```sql
   SELECT name, is_active FROM email_providers;
   ```

### High bounce rate

1. Check sender address verification
2. Review email content for spam triggers
3. Check domain reputation
4. Verify DKIM/SPF/DMARC records

### Webhooks not working

1. Check webhook URL is accessible
2. Verify webhook signature validation
3. Check webhook logs in provider dashboard
4. Test webhook endpoint manually

## Support

For issues or questions:
- Check documentation: `/docs/development/email-integration.md`
- Review troubleshooting guide: `/docs/development/email-troubleshooting.md`
- Contact development team

## Conclusion

The email management system is now deployed to production. Continue monitoring for the first 24-48 hours to ensure stability.
