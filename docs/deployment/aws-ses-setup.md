# AWS SES Setup Guide

## Overview

This guide walks you through setting up Amazon Simple Email Service (AWS SES) as your email provider for PikSend. AWS SES is a cost-effective, scalable email service ideal for high-volume sending.

## Prerequisites

- AWS account with billing enabled
- PikSend admin account
- Domain you want to send emails from
- Access to your domain's DNS settings
- Basic understanding of AWS services

## Table of Contents

1. [AWS Account Setup](#aws-account-setup)
2. [Request Production Access](#request-production-access)
3. [Create IAM User](#create-iam-user)
4. [Verify Domain](#verify-domain)
5. [Configure DKIM](#configure-dkim)
6. [Add Sender Addresses](#add-sender-addresses)
7. [Configure SNS for Webhooks](#configure-sns-for-webhooks)
8. [Configure in PikSend](#configure-in-piksend)
9. [Test Configuration](#test-configuration)
10. [Troubleshooting](#troubleshooting)

## AWS Account Setup

### Step 1: Create AWS Account

If you don't have an AWS account:

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **Create an AWS Account**
3. Enter email and account name
4. Provide payment information
5. Verify identity
6. Choose support plan (Basic is free)

### Step 2: Access SES Console

1. Log in to AWS Console
2. Search for "SES" in the services search
3. Click **Amazon Simple Email Service**
4. Select your preferred region (e.g., us-east-1)

⚠️ **Important**: SES is region-specific. Choose a region close to your users for better performance.

## Request Production Access

By default, AWS SES starts in **Sandbox Mode** with limitations:
- Can only send to verified email addresses
- Limited to 200 emails per day
- Maximum 1 email per second

### Step 1: Request Production Access

1. In SES console, go to **Account dashboard**
2. Click **Request production access**
3. Fill out the form:

**Mail Type**: Select **Transactional**

**Website URL**: `https://piksend.com`

**Use Case Description**:
```
PikSend is a photography gallery platform that sends transactional 
emails to photographers and their clients. Email types include:

- Purchase confirmations when clients buy photos
- Sale notifications to photographers
- Payout notifications for earnings
- Gallery expiration reminders
- Password reset emails

Expected volume: 10,000-50,000 emails per month
All emails are opt-in and transactional in nature.
We maintain strict bounce and complaint monitoring.
```

**Compliance**: Describe how you handle bounces and complaints:
```
We automatically process bounce and complaint notifications via SNS.
Hard bounces are immediately suppressed.
Complaint addresses are unsubscribed and suppressed.
We maintain bounce rate below 5% and complaint rate below 0.1%.
```

4. Click **Submit request**

### Step 2: Wait for Approval

- Approval typically takes 24-48 hours
- AWS may ask follow-up questions
- Check email for updates
- Once approved, limits increase to:
  - 50,000 emails per day (can be increased)
  - 14 emails per second

## Create IAM User

Create a dedicated IAM user for PikSend with minimal permissions.

### Step 1: Create IAM User

1. Go to **IAM** service in AWS Console
2. Click **Users** in sidebar
3. Click **Add users**
4. Enter username: `piksend-ses-user`
5. Select **Access key - Programmatic access**
6. Click **Next: Permissions**

### Step 2: Attach Permissions

1. Click **Attach existing policies directly**
2. Search for and select: **AmazonSESFullAccess**
3. Click **Next: Tags**
4. (Optional) Add tags for organization
5. Click **Next: Review**
6. Click **Create user**

### Step 3: Save Credentials

⚠️ **Critical**: Save these credentials immediately. They won't be shown again.

```
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Store them securely - you'll need them for PikSend configuration.

### Step 4: (Optional) Create Custom Policy

For better security, create a custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendBulkEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics",
        "ses:VerifyEmailIdentity",
        "ses:VerifyDomainIdentity",
        "ses:GetIdentityVerificationAttributes",
        "ses:GetIdentityDkimAttributes",
        "ses:VerifyDomainDkim"
      ],
      "Resource": "*"
    }
  ]
}
```

## Verify Domain

### Step 1: Add Domain in SES

1. In SES console, go to **Verified identities**
2. Click **Create identity**
3. Select **Domain**
4. Enter your domain: `piksend.com`
5. (Optional) Check **Assign a default configuration set**
6. Click **Create identity**

### Step 2: Get DNS Records

AWS will provide DNS records to add:

**Domain Verification Record:**
```
Type: TXT
Name: _amazonses.piksend.com
Value: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz=
```

**DKIM Records (3 records):**
```
Type: CNAME
Name: abc123._domainkey.piksend.com
Value: abc123.dkim.amazonses.com

Type: CNAME
Name: def456._domainkey.piksend.com
Value: def456.dkim.amazonses.com

Type: CNAME
Name: ghi789._domainkey.piksend.com
Value: ghi789.dkim.amazonses.com
```

### Step 3: Add DNS Records

Add these records to your DNS provider (see Resend guide for provider-specific instructions).

**Example for Route 53:**

1. Go to **Route 53** in AWS Console
2. Select your hosted zone
3. Click **Create record**
4. For verification record:
   - Name: `_amazonses`
   - Type: `TXT`
   - Value: (paste from SES)
5. For each DKIM record:
   - Name: (paste from SES)
   - Type: `CNAME`
   - Value: (paste from SES)
6. Click **Create records**

### Step 4: Verify Domain

1. Wait for DNS propagation (15-30 minutes)
2. In SES console, refresh the identity page
3. Status should change to **Verified** ✅

**Check DNS Propagation:**
```bash
# Check verification record
dig TXT _amazonses.piksend.com

# Check DKIM records
dig CNAME abc123._domainkey.piksend.com
```

## Configure DKIM

DKIM (DomainKeys Identified Mail) authenticates your emails.

### Step 1: Enable DKIM

1. In SES console, go to your verified domain
2. Go to **DKIM** tab
3. Click **Edit**
4. Enable **Easy DKIM**
5. Select **RSA_2048_BIT** (recommended)
6. Click **Save changes**

### Step 2: Add DKIM Records

AWS provides 3 CNAME records (see Step 2 of Verify Domain above).

Add all 3 records to your DNS.

### Step 3: Verify DKIM

1. Wait for DNS propagation
2. In SES console, check DKIM status
3. Should show **Successful** ✅

## Add Sender Addresses

### Option 1: Use Verified Domain

If your domain is verified, you can send from any address on that domain without additional verification.

### Option 2: Verify Individual Addresses

To verify specific email addresses:

1. In SES console, go to **Verified identities**
2. Click **Create identity**
3. Select **Email address**
4. Enter email: `noreply@piksend.com`
5. Click **Create identity**
6. Check your email for verification link
7. Click the verification link
8. Status will change to **Verified**

## Configure SNS for Webhooks

SNS (Simple Notification Service) sends webhook notifications for email events.

### Step 1: Create SNS Topic

1. Go to **SNS** service in AWS Console
2. Click **Topics** in sidebar
3. Click **Create topic**
4. Select **Standard** type
5. Enter name: `piksend-ses-events`
6. Click **Create topic**
7. Copy the **Topic ARN**: `arn:aws:sns:us-east-1:123456789012:piksend-ses-events`

### Step 2: Create SNS Subscription

1. In the topic page, click **Create subscription**
2. Select **HTTPS** as protocol
3. Enter endpoint: `https://your-piksend-domain.com/api/webhooks/email/ses`
4. Click **Create subscription**
5. AWS will send a confirmation request to your endpoint
6. PikSend will automatically confirm (check logs)
7. Status should change to **Confirmed** ✅

### Step 3: Configure SES to Use SNS

1. Go back to **SES** console
2. Go to **Configuration sets**
3. Click **Create set**
4. Enter name: `piksend-events`
5. Click **Create set**
6. In the configuration set, go to **Event destinations**
7. Click **Add destination**
8. Select event types:
   - ✅ Sends
   - ✅ Deliveries
   - ✅ Opens
   - ✅ Clicks
   - ✅ Bounces
   - ✅ Complaints
9. Select **SNS** as destination
10. Select your SNS topic: `piksend-ses-events`
11. Click **Next** and **Add destination**

### Step 4: Set as Default Configuration Set

1. In SES console, go to **Account dashboard**
2. Click **Edit** in Configuration set section
3. Select `piksend-events` as default
4. Click **Save changes**

## Configure in PikSend

### Step 1: Add to Environment Variables

```bash
# .env.local or .env.production
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
EMAIL_PROVIDER_DEFAULT=aws-ses
```

### Step 2: Configure in Admin Panel

1. Log in to PikSend admin panel
2. Navigate to **Emails > Providers**
3. Select **AWS SES** as your provider
4. Enter credentials:
   - **Access Key ID**: (from IAM user)
   - **Secret Access Key**: (from IAM user)
   - **Region**: us-east-1 (or your chosen region)
5. Click **Test Connection**
6. If successful, click **Save Configuration**
7. Click **Set as Active Provider**

### Step 3: Add Sender Addresses in PikSend

1. Go to **Emails > Senders**
2. Click **Add Sender Address**
3. Enter email: `noreply@piksend.com`
4. Enter name: `PikSend`
5. Click **Add Sender**
6. If domain is verified, status will be **Verified** automatically

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
- ✅ DKIM signature is present
- ✅ Images load properly
- ✅ Links work correctly

**Check DKIM Signature:**
1. Open email in Gmail
2. Click **Show original**
3. Look for `dkim=pass`

### Step 3: Test Webhooks

1. Open the test email
2. Click a link
3. Wait 1-2 minutes
4. Check email logs in PikSend
5. Verify events are recorded

### Step 4: Check SES Metrics

1. In SES console, go to **Account dashboard**
2. View sending statistics
3. Check for any bounces or complaints

## Production Checklist

Before going live:

- [ ] Production access approved
- [ ] Domain verified in SES
- [ ] DKIM configured and verified
- [ ] IAM user created with minimal permissions
- [ ] SNS topic created and configured
- [ ] Configuration set created
- [ ] Webhook endpoint confirmed
- [ ] At least one sender address verified
- [ ] Default sender set in PikSend
- [ ] Test email sent and received
- [ ] DKIM signature verified
- [ ] Webhooks working correctly
- [ ] Credentials stored securely
- [ ] Environment variables set in production
- [ ] Monitoring and alerts configured

## Monitoring

### SES Dashboard Metrics

Monitor in SES console:

- **Send Rate**: Emails sent per second
- **Bounce Rate**: Should be <5%
- **Complaint Rate**: Should be <0.1%
- **Reputation**: Dashboard shows reputation status

### CloudWatch Metrics

Set up CloudWatch alarms:

1. Go to **CloudWatch** in AWS Console
2. Click **Alarms**
3. Create alarms for:
   - High bounce rate
   - High complaint rate
   - Send quota approaching limit
   - Reputation issues

**Example Alarm for Bounce Rate:**
```
Metric: Bounce Rate
Threshold: > 5%
Period: 5 minutes
Action: Send SNS notification
```

### PikSend Analytics

Monitor in PikSend admin:

1. Go to **Emails > Analytics**
2. Check daily trends
3. Compare with SES metrics
4. Investigate discrepancies

## Troubleshooting

### Emails Not Sending

**Problem**: Emails stuck in queue

**Solutions**:
1. Check AWS credentials are correct
2. Verify IAM user has SES permissions
3. Check you're out of sandbox mode
4. Verify send quota not exceeded
5. Check region matches configuration
6. Test with AWS CLI:

```bash
aws ses send-email \
  --from noreply@piksend.com \
  --destination ToAddresses=test@example.com \
  --message Subject={Data="Test"},Body={Text={Data="Test email"}} \
  --region us-east-1
```

### Still in Sandbox Mode

**Problem**: Can only send to verified addresses

**Solutions**:
1. Check production access request status
2. Respond to any AWS questions
3. Resubmit request with more details
4. Contact AWS support
5. Verify email addresses for testing

### Domain Verification Failing

**Problem**: Domain won't verify

**Solutions**:
1. Wait longer (DNS can take up to 48 hours)
2. Check DNS records are correct
3. Verify with dig:
   ```bash
   dig TXT _amazonses.piksend.com
   ```
4. Remove duplicate records
5. Try different DNS provider
6. Contact AWS support

### DKIM Not Working

**Problem**: DKIM verification failing

**Solutions**:
1. Verify all 3 CNAME records are added
2. Check for typos in record names
3. Wait for DNS propagation
4. Test with dig:
   ```bash
   dig CNAME abc123._domainkey.piksend.com
   ```
5. Regenerate DKIM records in SES

### SNS Subscription Not Confirming

**Problem**: Subscription stuck in "Pending"

**Solutions**:
1. Check webhook endpoint is accessible
2. Verify HTTPS is used (not HTTP)
3. Check PikSend logs for confirmation request
4. Manually confirm via AWS Console
5. Recreate subscription

### High Bounce Rate

**Problem**: Many emails bouncing

**Solutions**:
1. Check email addresses are valid
2. Remove invalid addresses
3. Verify domain reputation
4. Check for blacklisting: [mxtoolbox.com](https://mxtoolbox.com)
5. Warm up domain gradually
6. Review bounce notifications in SNS

### Reputation Issues

**Problem**: SES reputation dashboard shows issues

**Solutions**:
1. Immediately stop sending
2. Review bounce and complaint rates
3. Remove problematic addresses
4. Improve email content
5. Implement double opt-in
6. Contact AWS support
7. Request reputation review

## Cost Optimization

### Pricing

AWS SES pricing (as of 2024):

**Sending:**
- First 62,000 emails/month: $0.10 per 1,000 emails
- After 62,000: $0.12 per 1,000 emails

**Receiving:**
- First 1,000 emails/month: Free
- After 1,000: $0.10 per 1,000 emails

**Data Transfer:**
- First 1 GB/month: Free
- After 1 GB: $0.12 per GB

**Example Costs:**
- 10,000 emails/month: ~$1.00
- 50,000 emails/month: ~$5.00
- 100,000 emails/month: ~$10.00

### Cost Optimization Tips

1. **Use Batch Sending**: Send multiple emails in one API call
2. **Optimize Email Size**: Compress images, minimize HTML
3. **Remove Inactive Recipients**: Don't send to bounced addresses
4. **Monitor Usage**: Set up billing alerts
5. **Use Reserved Capacity**: For predictable high volume

### Set Up Billing Alerts

1. Go to **Billing** in AWS Console
2. Click **Budgets**
3. Click **Create budget**
4. Set monthly budget (e.g., $50)
5. Set alert threshold (e.g., 80%)
6. Enter email for notifications

## Best Practices

### Warm Up Your Domain

Start with low volume and gradually increase:

**Week 1**: 50-100 emails/day
**Week 2**: 200-500 emails/day
**Week 3**: 1,000-2,000 emails/day
**Week 4**: 5,000-10,000 emails/day
**Week 5+**: Full volume

### Maintain Good Reputation

1. Keep bounce rate below 5%
2. Keep complaint rate below 0.1%
3. Process bounces immediately
4. Honor unsubscribe requests
5. Send only to engaged recipients
6. Use double opt-in for marketing

### Security

1. **Rotate Credentials**: Change IAM keys every 90 days
2. **Use IAM Roles**: For EC2/Lambda instead of keys
3. **Enable MFA**: On AWS account
4. **Monitor Access**: Review CloudTrail logs
5. **Restrict Permissions**: Use minimal IAM policy

### Compliance

1. **CAN-SPAM**: Include physical address and unsubscribe
2. **GDPR**: Honor data deletion requests
3. **CASL**: Get explicit consent (Canada)
4. **Privacy Policy**: Link in all emails
5. **Record Keeping**: Maintain consent records

## Support

### AWS Support

- **Documentation**: [docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses)
- **Support Center**: AWS Console > Support
- **Forums**: [forums.aws.amazon.com](https://forums.aws.amazon.com)
- **Status**: [status.aws.amazon.com](https://status.aws.amazon.com)

### PikSend Support

- **Documentation**: Check other guides in `/docs`
- **Email**: support@piksend.com
- **Community**: Join our forum

## Additional Resources

- [SES Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/)
- [SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Email Authentication](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html)
- [SNS Documentation](https://docs.aws.amazon.com/sns/)

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial AWS SES setup guide
- Production access request instructions
- IAM user creation
- SNS webhook configuration
- Troubleshooting section
