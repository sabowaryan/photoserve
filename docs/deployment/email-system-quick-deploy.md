# Email Management System - Quick Deployment Guide

## TL;DR - Fast Track Deployment

For experienced developers who want to deploy quickly:

```bash
# 1. Link to production
supabase link --project-ref YOUR_PROJECT_REF

# 2. Apply migrations
supabase db push

# 3. Deploy edge function
supabase functions deploy process-email-queue

# 4. Configure cron (in Supabase Dashboard)
# Edge Functions → process-email-queue → Settings → Cron → "* * * * *"

# 5. Configure provider (in Admin UI)
# https://your-domain.com/admin/emails/providers

# 6. Add sender address (in Admin UI)
# https://your-domain.com/admin/emails/senders

# 7. Configure webhooks
# Resend: https://resend.com/webhooks → https://your-domain.com/api/webhooks/email/resend
# AWS SES: Create SNS topic and subscribe webhook endpoint

# 8. Test
curl -X POST https://your-domain.com/api/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"templateId":"purchase-confirmation","to":"test@example.com","variables":{...}}'
```

## Automated Deployment

Use the deployment script:

```bash
# Linux/Mac
chmod +x scripts/deploy-email-system.sh
./scripts/deploy-email-system.sh

# Windows
.\scripts\deploy-email-system.ps1
```

## Manual Steps Required

After running the script, complete these steps:

### 1. Configure Cron Trigger (2 minutes)
- Supabase Dashboard → Edge Functions → process-email-queue
- Settings → Cron → `* * * * *` → Save

### 2. Configure Email Provider (3 minutes)
- Go to: `https://your-domain.com/admin/emails/providers`
- Select Resend or AWS SES
- Enter API credentials
- Test connection

### 3. Add Sender Address (5 minutes + DNS propagation)
- Go to: `https://your-domain.com/admin/emails/senders`
- Add email address
- Copy DNS records
- Add to domain DNS
- Wait for verification (up to 24 hours)

### 4. Configure Webhooks (5 minutes)

**Resend:**
```
URL: https://your-domain.com/api/webhooks/email/resend
Events: sent, delivered, bounced, complained, opened, clicked
```

**AWS SES:**
```bash
aws sns create-topic --name email-events-production
aws sesv2 create-configuration-set --configuration-set-name production-emails
# Subscribe webhook to SNS topic
```

### 5. Test Email Sending (2 minutes)
```bash
curl -X POST https://your-domain.com/api/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "templateId": "purchase-confirmation",
    "to": "your-email@example.com",
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

## Monitoring Commands

### Check Queue Status
```sql
SELECT status, COUNT(*) FROM email_queue GROUP BY status;
```

### Check Recent Failures
```sql
SELECT COUNT(*) FROM email_queue 
WHERE status = 'failed' 
AND updated_at > NOW() - INTERVAL '1 hour';
```

### View Edge Function Logs
```bash
supabase functions logs process-email-queue --tail
```

### Check System Health
```sql
SELECT * FROM get_email_queue_stats();
```

## Alert Configuration

Configure webhook URL for alerts:

```sql
UPDATE email_alert_config 
SET webhook_url = 'https://your-slack-webhook-url'
WHERE alert_type IN ('queue_depth', 'failure_rate', 'bounce_rate');
```

## Troubleshooting

### Emails not sending
1. Check provider configuration: `SELECT * FROM email_providers WHERE is_active = true;`
2. Check queue: `SELECT * FROM email_queue WHERE status = 'pending' LIMIT 10;`
3. Check edge function logs: `supabase functions logs process-email-queue`

### High bounce rate
1. Verify sender address: Check DNS records
2. Check email content: Avoid spam triggers
3. Review bounce reasons: `SELECT * FROM email_logs WHERE bounced_at IS NOT NULL;`

### Webhooks not working
1. Test endpoint: `curl -X POST https://your-domain.com/api/webhooks/email/resend`
2. Check provider dashboard for webhook delivery status
3. Verify signature validation in logs

## Environment Variables

Required in production `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Provider (Resend)
RESEND_API_KEY=re_your_api_key

# OR Email Provider (AWS SES)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Email Configuration
EMAIL_PROVIDER_DEFAULT=resend
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_RETRY_MAX_ATTEMPTS=5
EMAIL_PROVIDER_ENCRYPTION_KEY=your_encryption_key
```

## Success Checklist

- [ ] Migrations applied
- [ ] Edge function deployed and running
- [ ] Provider configured and tested
- [ ] Sender address verified
- [ ] Webhooks configured
- [ ] Test email sent and received
- [ ] Monitoring working
- [ ] Alerts configured

## Time Estimate

- **Automated deployment:** 5 minutes
- **Manual configuration:** 15 minutes
- **DNS propagation:** Up to 24 hours
- **Testing and verification:** 10 minutes
- **Total active time:** ~30 minutes

## Support

- Full guide: `docs/deployment/email-system-production-deployment.md`
- Checklist: `.kiro/specs/email-management-system/production-deployment-checklist.md`
- Troubleshooting: `docs/development/email-troubleshooting.md`

## Next Steps After Deployment

1. Monitor for 24-48 hours
2. Review metrics daily
3. Optimize batch size if needed
4. Train team on admin UI
5. Document any issues encountered
