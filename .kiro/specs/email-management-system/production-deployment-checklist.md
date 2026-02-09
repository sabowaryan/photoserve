# Email Management System - Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Setup
- [ ] Production environment variables configured in `.env`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` set to production URL
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` set to production key
  - [ ] `RESEND_API_KEY` set (if using Resend)
  - [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` set (if using AWS SES)
  - [ ] `EMAIL_PROVIDER_DEFAULT` configured
  - [ ] `EMAIL_PROVIDER_ENCRYPTION_KEY` generated and set
  - [ ] `EMAIL_QUEUE_BATCH_SIZE` configured (default: 10)
  - [ ] `EMAIL_RETRY_MAX_ATTEMPTS` configured (default: 5)

### Supabase Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Production project linked (`supabase link --project-ref YOUR_PROJECT_REF`)
- [ ] Production database backup created

### Code Preparation
- [ ] All code changes committed to version control
- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Deployment scripts tested in staging environment

## Deployment Steps

### Step 1: Database Migrations
- [ ] Check migration status (`supabase db remote list`)
- [ ] Review pending migrations
- [ ] Apply migrations to production (`supabase db push`)
- [ ] Verify email tables created:
  - [ ] `email_providers`
  - [ ] `sender_addresses`
  - [ ] `email_templates`
  - [ ] `template_versions`
  - [ ] `email_queue`
  - [ ] `email_logs`
  - [ ] `email_events`
  - [ ] `email_suppressions`
  - [ ] `email_unsubscribes`
  - [ ] `email_alert_config`
  - [ ] `email_alert_history`
- [ ] Verify indexes created
- [ ] Verify RLS policies applied

### Step 2: Edge Functions
- [ ] Deploy `process-email-queue` function (`supabase functions deploy process-email-queue`)
- [ ] Verify function deployed (`supabase functions list`)
- [ ] Configure cron trigger (every 1 minute):
  - [ ] Go to Supabase Dashboard → Edge Functions → process-email-queue
  - [ ] Click Settings → Cron
  - [ ] Set schedule: `* * * * *`
  - [ ] Save configuration
- [ ] Test edge function manually
- [ ] Verify function logs show successful execution

### Step 3: Email Provider Configuration
- [ ] Access admin UI: `https://your-domain.com/admin/emails/providers`
- [ ] Select email provider (Resend or AWS SES)
- [ ] Enter production API credentials
- [ ] Test connection
- [ ] Verify connection successful
- [ ] Set as active provider

### Step 4: Sender Address Setup
- [ ] Access sender management: `https://your-domain.com/admin/emails/senders`
- [ ] Add sender email address (e.g., `noreply@your-domain.com`)
- [ ] Copy DNS records (DKIM, SPF, DMARC)
- [ ] Add DNS records to domain:
  - [ ] DKIM record added
  - [ ] SPF record added
  - [ ] DMARC record added
- [ ] Wait for DNS propagation (up to 24 hours)
- [ ] Verify sender address
- [ ] Set as default sender

### Step 5: Webhook Configuration

#### For Resend:
- [ ] Go to https://resend.com/webhooks
- [ ] Click "Add Webhook"
- [ ] Enter webhook URL: `https://your-domain.com/api/webhooks/email/resend`
- [ ] Select events:
  - [ ] email.sent
  - [ ] email.delivered
  - [ ] email.delivery_delayed
  - [ ] email.complained
  - [ ] email.bounced
  - [ ] email.opened
  - [ ] email.clicked
- [ ] Create webhook
- [ ] Save webhook signing secret
- [ ] Test webhook with sample event

#### For AWS SES:
- [ ] Create SNS topic: `aws sns create-topic --name email-events-production`
- [ ] Create SES configuration set
- [ ] Add event destination to configuration set
- [ ] Subscribe webhook endpoint to SNS topic
- [ ] Confirm subscription
- [ ] Test webhook with sample event

### Step 6: Testing
- [ ] Send test email to personal email address
- [ ] Verify email received
- [ ] Check email content renders correctly
- [ ] Verify email logs show correct status
- [ ] Test webhook events received
- [ ] Test queue processing (email sent within 1-2 minutes)
- [ ] Test retry logic with intentional failure
- [ ] Test scheduled email
- [ ] Test template rendering with variables
- [ ] Test bounce handling (if possible)
- [ ] Test unsubscribe link (for marketing emails)

### Step 7: Monitoring Setup
- [ ] Configure alert webhook URL in `email_alert_config` table
- [ ] Verify alert thresholds:
  - [ ] Queue depth: warning=100, critical=500
  - [ ] Failure rate: warning=5%, critical=10%
  - [ ] Bounce rate: warning=5%, critical=10%
  - [ ] Oldest pending: warning=30min, critical=60min
- [ ] Test alert system by triggering threshold
- [ ] Set up external monitoring (optional):
  - [ ] Sentry for error tracking
  - [ ] Datadog for metrics
  - [ ] PagerDuty for on-call alerts
- [ ] Create monitoring dashboard
- [ ] Set up log aggregation

### Step 8: Documentation
- [ ] Update production URLs in documentation
- [ ] Document webhook endpoints
- [ ] Document monitoring queries
- [ ] Document troubleshooting steps
- [ ] Update team wiki/knowledge base
- [ ] Create runbook for common issues

### Step 9: Team Training
- [ ] Train team on admin UI
- [ ] Show how to view email logs
- [ ] Show how to check queue status
- [ ] Show how to retry failed emails
- [ ] Show how to create/edit templates
- [ ] Show how to view analytics
- [ ] Show how to manage sender addresses
- [ ] Show how to respond to alerts

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1-2: Critical Monitoring
- [ ] Monitor edge function logs continuously
- [ ] Check queue depth every 5 minutes
- [ ] Verify emails being sent successfully
- [ ] Check for any error spikes
- [ ] Monitor webhook delivery

### Hour 2-6: Active Monitoring
- [ ] Check queue depth every 15 minutes
- [ ] Review email logs for failures
- [ ] Check delivery rate (should be >95%)
- [ ] Check bounce rate (should be <5%)
- [ ] Monitor system performance

### Hour 6-24: Regular Monitoring
- [ ] Check queue depth every hour
- [ ] Review daily metrics
- [ ] Check for any alerts
- [ ] Monitor bounce/complaint rates
- [ ] Review edge function performance

### Day 2-7: Ongoing Monitoring
- [ ] Daily review of metrics
- [ ] Weekly review of analytics
- [ ] Monitor for trends
- [ ] Optimize as needed

## Monitoring Queries

### Queue Status
```sql
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;
```

### Recent Failures
```sql
SELECT COUNT(*) as failed_count
FROM email_queue
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '1 hour';
```

### Delivery Rate (24h)
```sql
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
```

### Bounce Rate (24h)
```sql
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

### Queue Health
```sql
SELECT * FROM get_email_queue_stats();
```

### Recent Alerts
```sql
SELECT *
FROM email_alert_history
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Rollback Plan

If critical issues occur:

### Immediate Actions
1. [ ] Disable email provider in admin UI
2. [ ] Stop edge function cron job
3. [ ] Investigate issue in logs
4. [ ] Document the problem

### Database Rollback
1. [ ] Create backup of current state
2. [ ] Revert migrations if needed
3. [ ] Verify data integrity

### Code Rollback
1. [ ] Revert to previous deployment
2. [ ] Redeploy edge functions
3. [ ] Verify system stability

### Communication
1. [ ] Notify team of issue
2. [ ] Update status page (if applicable)
3. [ ] Communicate with stakeholders

## Success Criteria

Deployment is considered successful when:

- [ ] All migrations applied without errors
- [ ] Edge function running on schedule
- [ ] Email provider configured and connected
- [ ] Sender address verified
- [ ] Webhooks receiving events
- [ ] Test emails sent and received successfully
- [ ] Queue processing working (emails sent within 1-2 minutes)
- [ ] Delivery rate >95%
- [ ] Bounce rate <5%
- [ ] No critical alerts triggered
- [ ] Monitoring and alerting working
- [ ] Team trained and comfortable with system
- [ ] Documentation complete and accurate

## Sign-off

- [ ] Technical Lead approval
- [ ] Product Owner approval
- [ ] Operations team notified
- [ ] Support team trained
- [ ] Deployment documented

## Notes

Use this space to document any issues, decisions, or important information during deployment:

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Issues Encountered:** 

---

**Resolution:** 

---

**Additional Notes:**

---
