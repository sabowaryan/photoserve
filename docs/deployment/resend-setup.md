# Resend Setup Guide

## Overview

This guide walks you through setting up Resend as your email provider for PikSend. Resend is a modern email API that's easy to set up and provides excellent deliverability.

## Prerequisites

- PikSend admin account
- Domain you want to send emails from
- Access to your domain's DNS settings

## Table of Contents

1. [Create Resend Account](#create-resend-account)
2. [Get API Key](#get-api-key)
3. [Configure in PikSend](#configure-in-piksend)
4. [Verify Domain](#verify-domain)
5. [Add Sender Addresses](#add-sender-addresses)
6. [Configure Webhooks](#configure-webhooks)
7. [Test Configuration](#test-configuration)
8. [Troubleshooting](#troubleshooting)

## Create Resend Account

### Step 1: Sign Up

1. Go to [resend.com](https://resend.com)
2. Click **Sign Up**
3. Enter your email address
4. Verify your email
5. Complete your profile

### Step 2: Choose Plan

**Free Plan:**
- 100 emails/day
- 1 domain
- Good for testing and small projects

**Pro Plan ($20/month):**
- 50,000 emails/month
- Unlimited domains
- Priority support
- Recommended for production

**Enterprise Plan:**
- Custom volume
- Dedicated IP
- SLA guarantee
- Contact sales

## Get API Key

### Step 1: Create API Key

1. Log in to Resend dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Enter a name: "PikSend Production"
5. Select permissions:
   - ✅ **Sending access**: Required
   - ✅ **Domain access**: Required for verification
   - ✅ **Webhook access**: Required for tracking
6. Click **Create**

### Step 2: Save API Key

⚠️ **Important**: Copy the API key immediately. It will only be shown once.

```
re_123456789abcdefghijklmnopqrstuvwxyz
```

Store it securely - you'll need it for PikSend configuration.

## Configure in PikSend

### Step 1: Add to Environment Variables

Add the API key to your environment variables:

```bash
# .env.local or .env.production
RESEND_API_KEY=re_123456789abcdefghijklmnopqrstuvwxyz
```

### Step 2: Configure in Admin Panel

1. Log in to PikSend admin panel
2. Navigate to **Emails > Providers**
3. Select **Resend** as your provider
4. Enter your API key
5. Click **Test Connection**
6. If successful, click **Save Configuration**
7. Click **Set as Active Provider**

## Verify Domain

Domain verification improves deliverability and allows you to send from any email address on your domain.

### Step 1: Add Domain in Resend

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `piksend.com`
4. Click **Add**

### Step 2: Get DNS Records

Resend will provide three DNS records:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

**DMARC Record (Optional but Recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@piksend.com
```

### Step 3: Add DNS Records

The process varies by DNS provider. Here are instructions for common providers:

#### Cloudflare

1. Log in to Cloudflare
2. Select your domain
3. Go to **DNS** tab
4. Click **Add record**
5. For each record:
   - Select **TXT** as type
   - Enter **Name** from Resend
   - Enter **Content** from Resend
   - Click **Save**

#### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products**
3. Find your domain and click **DNS**
4. Click **Add** under DNS Records
5. For each record:
   - Select **TXT** as type
   - Enter **Name** from Resend
   - Enter **Value** from Resend
   - Click **Save**

#### Namecheap

1. Log in to Namecheap
2. Go to **Domain List**
3. Click **Manage** next to your domain
4. Go to **Advanced DNS** tab
5. Click **Add New Record**
6. For each record:
   - Select **TXT Record** as type
   - Enter **Host** from Resend
   - Enter **Value** from Resend
   - Click **Save**

#### Route 53 (AWS)

1. Log in to AWS Console
2. Go to **Route 53**
3. Select your hosted zone
4. Click **Create Record**
5. For each record:
   - Enter **Record name** from Resend
   - Select **TXT** as type
   - Enter **Value** from Resend
   - Click **Create records**

### Step 4: Verify Domain

1. Wait for DNS propagation (can take up to 48 hours, usually 15-30 minutes)
2. In Resend dashboard, click **Verify** next to your domain
3. If successful, status will change to **Verified** ✅

**Check DNS Propagation:**
```bash
# Check SPF record
dig TXT piksend.com

# Check DKIM record
dig TXT resend._domainkey.piksend.com

# Check DMARC record
dig TXT _dmarc.piksend.com
```

## Add Sender Addresses

### Step 1: Add in PikSend

1. In PikSend admin, go to **Emails > Senders**
2. Click **Add Sender Address**
3. Enter email: `noreply@piksend.com`
4. Enter name: `PikSend`
5. Click **Add Sender**

### Step 2: Verification

If your domain is verified, the sender address is automatically verified. Otherwise:

1. Click **Verify** next to the sender address
2. Check your email for verification link
3. Click the verification link
4. Return to PikSend - status will update to **Verified**

### Step 3: Set Default Sender

1. Click **Set as Default** next to your preferred sender
2. This sender will be used when no sender is specified

### Common Sender Addresses

```
noreply@piksend.com          - Transactional emails
support@piksend.com          - Support emails
notifications@piksend.com    - System notifications
hello@piksend.com            - Marketing emails
```

## Configure Webhooks

Webhooks allow PikSend to track email delivery, opens, clicks, and bounces.

### Step 1: Get Webhook URL

Your webhook URL is:
```
https://your-piksend-domain.com/api/webhooks/email/resend
```

### Step 2: Add Webhook in Resend

1. In Resend dashboard, go to **Webhooks**
2. Click **Add Webhook**
3. Enter webhook URL
4. Select events to track:
   - ✅ **email.sent**: Email sent to provider
   - ✅ **email.delivered**: Email delivered to recipient
   - ✅ **email.delivery_delayed**: Delivery delayed
   - ✅ **email.complained**: Marked as spam
   - ✅ **email.bounced**: Email bounced
   - ✅ **email.opened**: Email opened (if tracking enabled)
   - ✅ **email.clicked**: Link clicked (if tracking enabled)
5. Click **Create**

### Step 3: Verify Webhook

1. Resend will send a test webhook
2. Check PikSend logs to confirm receipt
3. Status should show **Active** ✅

### Step 4: Enable Tracking (Optional)

To track opens and clicks:

1. In Resend dashboard, go to **Settings**
2. Enable **Open Tracking**
3. Enable **Click Tracking**
4. Click **Save**

⚠️ **Note**: Some email clients block tracking pixels, so open rates may be underreported.

## Test Configuration

### Step 1: Send Test Email

1. In PikSend admin, go to **Emails > Dashboard**
2. Click **Send Test Email**
3. Enter your email address
4. Click **Send**
5. Check your inbox

### Step 2: Verify Delivery

Check that:
- ✅ Email arrives in inbox (not spam)
- ✅ Sender shows correctly
- ✅ Images load properly
- ✅ Links work correctly
- ✅ Email looks good on mobile

### Step 3: Check Logs

1. In PikSend admin, go to **Emails > Logs**
2. Find your test email
3. Verify status is **Delivered**
4. Check for any errors

### Step 4: Test Webhooks

1. Open the test email
2. Click a link in the email
3. Wait 1-2 minutes
4. Check email logs in PikSend
5. Verify **Opened** and **Clicked** events are recorded

## Production Checklist

Before going live, verify:

- [ ] Domain is verified in Resend
- [ ] SPF, DKIM, and DMARC records are configured
- [ ] At least one sender address is verified
- [ ] Default sender is set
- [ ] Webhooks are configured and active
- [ ] Test email sent and received successfully
- [ ] Open and click tracking working
- [ ] API key is stored securely
- [ ] Environment variables are set in production
- [ ] Rate limits are understood (100/day free, 50k/month pro)

## Monitoring

### Resend Dashboard

Monitor these metrics in Resend dashboard:

- **Delivery Rate**: Should be >95%
- **Bounce Rate**: Should be <5%
- **Complaint Rate**: Should be <0.1%
- **Open Rate**: Varies by email type (20-60%)
- **Click Rate**: Varies by email type (2-10%)

### PikSend Analytics

Monitor in PikSend admin:

1. Go to **Emails > Analytics**
2. Check daily/weekly trends
3. Identify issues early
4. Compare template performance

### Alerts

Set up alerts for:

- High bounce rate (>5%)
- High complaint rate (>0.1%)
- Delivery failures
- Webhook failures

## Troubleshooting

### Emails Not Sending

**Problem**: Emails stuck in queue

**Solutions**:
1. Check API key is correct
2. Verify Resend account is active
3. Check rate limits (100/day on free plan)
4. Review error logs in PikSend
5. Test API key with curl:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@piksend.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Emails Going to Spam

**Problem**: Emails landing in spam folder

**Solutions**:
1. Verify domain is verified
2. Check SPF/DKIM records are correct
3. Add DMARC record
4. Warm up your domain (start with low volume)
5. Improve email content (avoid spam trigger words)
6. Ask recipients to whitelist your domain
7. Check sender reputation: [mxtoolbox.com](https://mxtoolbox.com)

### Domain Verification Failing

**Problem**: Domain won't verify

**Solutions**:
1. Wait longer (DNS can take up to 48 hours)
2. Check DNS records are correct (no typos)
3. Verify DNS records with dig:
   ```bash
   dig TXT resend._domainkey.piksend.com
   ```
4. Remove any duplicate records
5. Check with your DNS provider
6. Try removing and re-adding domain

### Webhooks Not Working

**Problem**: Events not being tracked

**Solutions**:
1. Verify webhook URL is correct
2. Check webhook is active in Resend
3. Ensure HTTPS is used (not HTTP)
4. Check PikSend webhook endpoint is accessible
5. Review webhook logs in Resend
6. Test webhook manually:

```bash
curl -X POST 'https://your-domain.com/api/webhooks/email/resend' \
  -H 'Content-Type: application/json' \
  -H 'svix-id: test' \
  -H 'svix-timestamp: 1234567890' \
  -H 'svix-signature: test' \
  -d '{
    "type": "email.delivered",
    "data": {
      "email_id": "test-123"
    }
  }'
```

### High Bounce Rate

**Problem**: Many emails bouncing

**Solutions**:
1. Validate email addresses before sending
2. Remove invalid addresses from list
3. Use double opt-in for marketing emails
4. Check for typos in email addresses
5. Monitor bounce types (hard vs soft)
6. Remove hard bounces immediately

### Rate Limit Exceeded

**Problem**: "Rate limit exceeded" error

**Solutions**:
1. Check your plan limits (100/day free, 50k/month pro)
2. Upgrade to Pro plan if needed
3. Implement rate limiting in your code
4. Spread sends over time
5. Contact Resend for higher limits

## Best Practices

### Email Deliverability

1. **Warm Up Your Domain**
   - Start with low volume (10-20 emails/day)
   - Gradually increase over 2-4 weeks
   - Monitor bounce and complaint rates

2. **Maintain Good Sender Reputation**
   - Keep bounce rate below 5%
   - Keep complaint rate below 0.1%
   - Remove invalid addresses promptly
   - Honor unsubscribe requests immediately

3. **Authenticate Your Domain**
   - Always use SPF, DKIM, and DMARC
   - Verify domain before sending
   - Use consistent sender addresses

4. **Monitor Metrics**
   - Check delivery rates daily
   - Track bounce and complaint rates
   - Review open and click rates
   - Investigate anomalies quickly

### Email Content

1. **Avoid Spam Triggers**
   - Don't use all caps in subject
   - Avoid excessive punctuation!!!
   - Don't use spam words (FREE, URGENT, etc.)
   - Balance text and images

2. **Provide Value**
   - Make content relevant
   - Include clear call-to-action
   - Personalize when possible
   - Keep it concise

3. **Make It Easy to Unsubscribe**
   - Include unsubscribe link
   - Make it easy to find
   - Process requests immediately
   - Don't require login to unsubscribe

## Support

### Resend Support

- **Documentation**: [resend.com/docs](https://resend.com/docs)
- **Email**: support@resend.com
- **Discord**: [resend.com/discord](https://resend.com/discord)
- **Status**: [status.resend.com](https://status.resend.com)

### PikSend Support

- **Documentation**: Check other guides in `/docs`
- **Email**: support@piksend.com
- **Community**: Join our forum

## Additional Resources

- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Best Practices](https://resend.com/docs/best-practices)
- [SPF/DKIM/DMARC Guide](https://resend.com/docs/authentication)
- [Webhook Events](https://resend.com/docs/webhooks)
- [Rate Limits](https://resend.com/docs/rate-limits)

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial Resend setup guide
- Domain verification instructions
- Webhook configuration
- Troubleshooting section
