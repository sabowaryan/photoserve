# Email Management User Guide

## Overview

The Email Management System provides a comprehensive interface for managing all email operations in PikSend. This guide covers how to configure email providers, manage sender addresses, create templates, monitor email delivery, and analyze email performance.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Email Dashboard](#email-dashboard)
3. [Provider Configuration](#provider-configuration)
4. [Sender Address Management](#sender-address-management)
5. [Template Management](#template-management)
6. [Email Logs](#email-logs)
7. [Analytics](#analytics)
8. [Suppressions Management](#suppressions-management)

## Getting Started

### Accessing Email Management

Navigate to the admin panel and select **Emails** from the navigation menu. This will take you to the Email Management Dashboard.

### Initial Setup Checklist

Before sending emails, complete these steps:

1. ✅ Configure an email provider (Resend or AWS SES)
2. ✅ Add and verify at least one sender address
3. ✅ Review existing email templates
4. ✅ Test email sending with a test email

## Email Dashboard

The Email Dashboard (`/admin/emails`) provides an overview of your email system.

### Quick Stats

The dashboard displays key metrics:

- **Emails Sent Today**: Total emails sent in the last 24 hours
- **Queue Size**: Number of emails waiting to be sent
- **Delivery Rate**: Percentage of emails successfully delivered
- **Bounce Rate**: Percentage of emails that bounced

### Recent Emails Widget

Shows the last 10 emails sent with:
- Recipient email
- Subject line
- Status (sent, delivered, opened, clicked, bounced, failed)
- Timestamp

Click on any email to view full details.

### Queue Status Widget

Displays current queue information:
- **Pending**: Emails waiting to be processed
- **Processing**: Emails currently being sent
- **Failed**: Emails that failed after all retries
- **Scheduled**: Emails scheduled for future delivery

### Provider Status

Shows the currently active email provider and connection status:
- 🟢 **Connected**: Provider is working correctly
- 🟡 **Warning**: Provider has issues but is functional
- 🔴 **Disconnected**: Provider is not working

### Quick Actions

- **Send Test Email**: Send a test email to verify configuration
- **View Templates**: Navigate to template management
- **View Logs**: Navigate to email logs
- **View Analytics**: Navigate to analytics dashboard

## Provider Configuration

### Choosing a Provider

PikSend supports two email providers:

**Resend**
- ✅ Easy setup with single API key
- ✅ Great for small to medium volume
- ✅ Excellent deliverability
- ✅ Built-in analytics

**AWS SES**
- ✅ Cost-effective for high volume
- ✅ Highly scalable
- ✅ Advanced features
- ⚠️ More complex setup

### Configuring Resend

1. Navigate to **Emails > Providers**
2. Select **Resend** as your provider
3. Enter your Resend API key
   - Get your API key from [resend.com/api-keys](https://resend.com/api-keys)
4. Click **Test Connection** to verify
5. Click **Save Configuration**

### Configuring AWS SES

1. Navigate to **Emails > Providers**
2. Select **AWS SES** as your provider
3. Enter your AWS credentials:
   - **Access Key ID**: Your AWS access key
   - **Secret Access Key**: Your AWS secret key
   - **Region**: AWS region (e.g., us-east-1)
4. Click **Test Connection** to verify
5. Click **Save Configuration**

### Switching Providers

You can switch between providers at any time:

1. Navigate to **Emails > Providers**
2. Select the new provider
3. Configure credentials
4. Click **Set as Active Provider**

⚠️ **Note**: All existing templates and logs are preserved when switching providers.

## Sender Address Management

### Adding a Sender Address

1. Navigate to **Emails > Senders**
2. Click **Add Sender Address**
3. Enter:
   - **Email Address**: The email you want to send from
   - **Display Name**: Name shown to recipients (optional)
4. Click **Add Sender**

### Verifying a Sender Address

After adding a sender address, you must verify it:

#### For Individual Email Addresses

1. Click **Verify** next to the sender address
2. Check your email for a verification link
3. Click the verification link
4. Return to PikSend - status will update to **Verified**

#### For Domain Verification

For better deliverability, verify your entire domain:

1. Click **View DNS Records** next to your sender address
2. Add the provided DNS records to your domain:
   - **DKIM Record**: Authenticates your emails
   - **SPF Record**: Authorizes your sending servers
   - **DMARC Record**: Protects against spoofing (optional)
3. Wait for DNS propagation (up to 48 hours)
4. Click **Check Verification Status**

**Example DNS Records:**

```
Type: TXT
Name: resend._domainkey.yourdomain.com
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...

Type: TXT
Name: yourdomain.com
Value: v=spf1 include:resend.com ~all
```

### Setting a Default Sender

1. Navigate to **Emails > Senders**
2. Click **Set as Default** next to your preferred sender
3. This sender will be used when no sender is specified

### Deleting a Sender Address

1. Navigate to **Emails > Senders**
2. Click **Delete** next to the sender address
3. Confirm deletion

⚠️ **Note**: You cannot delete the default sender or the only verified sender.

## Template Management

### Viewing Templates

Navigate to **Emails > Templates** to see all email templates.

**Template Types:**
- 🔵 **Transactional**: Automated emails (purchase confirmations, receipts)
- 🟢 **Marketing**: Promotional emails (newsletters, announcements)

**Template Sources:**
- **React Email**: Code-based templates (existing templates)
- **Custom**: WYSIWYG editor templates

### Creating a New Template

1. Navigate to **Emails > Templates**
2. Click **Create Template**
3. Fill in template details:
   - **Name**: Internal name for the template
   - **Subject**: Email subject line (can include variables)
   - **Type**: Transactional or Marketing
   - **Category**: Optional category for organization
4. Use the visual editor to design your email:
   - Drag components from the left panel
   - Click components to edit content
   - Use the toolbar to format text
5. Click **Save Draft** to save without publishing
6. Click **Publish** to make the template active

### Using Template Variables

Template variables allow personalization:

**Inserting Variables:**
1. Click where you want to insert a variable
2. Click the **Variables** dropdown
3. Select a variable (e.g., `{recipientName}`)

**Common Variables:**
- `{recipientName}`: Recipient's name
- `{recipientEmail}`: Recipient's email
- `{appName}`: Application name (PikSend)
- `{appUrl}`: Application URL
- `{supportEmail}`: Support email address

**Template-Specific Variables:**

Purchase Confirmation:
- `{buyerName}`, `{galleryName}`, `{photoCount}`, `{amountPaid}`, `{accessLink}`

Sale Notification:
- `{photographerName}`, `{galleryName}`, `{netEarnings}`, `{dashboardLink}`

### Previewing Templates

1. Open a template in the editor
2. Click **Preview**
3. Enter sample data for variables
4. Toggle between **Desktop** and **Mobile** views
5. Toggle between **HTML** and **Plain Text** views

### Sending Test Emails

1. Open a template in the editor
2. Click **Send Test Email**
3. Enter your email address
4. Enter sample data for variables
5. Click **Send**
6. Check your inbox

### Template Versioning

Every time you edit and save a template, a new version is created:

**Viewing Version History:**
1. Open a template in the editor
2. Click **Version History**
3. See all previous versions with timestamps

**Comparing Versions:**
1. In version history, select two versions
2. Click **Compare**
3. View side-by-side differences

**Reverting to a Previous Version:**
1. In version history, find the version you want
2. Click **Revert to This Version**
3. Confirm the action
4. The template will be restored (creates a new version)

### Duplicating Templates

1. Navigate to **Emails > Templates**
2. Click **Duplicate** next to a template
3. Edit the duplicated template as needed

### Deleting Templates

1. Navigate to **Emails > Templates**
2. Click **Delete** next to a template
3. Confirm deletion

⚠️ **Note**: Templates are soft-deleted and can be recovered if needed.

## Email Logs

### Viewing Email Logs

Navigate to **Emails > Logs** to see all sent emails.

### Filtering Logs

Use filters to find specific emails:

**Status Filters:**
- **Queued**: Waiting to be sent
- **Sent**: Successfully sent to provider
- **Delivered**: Confirmed delivered to recipient
- **Opened**: Recipient opened the email
- **Clicked**: Recipient clicked a link
- **Bounced**: Email bounced (invalid address or server issue)
- **Failed**: Failed to send after all retries

**Date Range:**
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

**Search:**
- Search by recipient email
- Search by subject line

### Viewing Email Details

Click on any email in the logs to view:

- **Recipient Information**: Email, name
- **Sender Information**: From address, name
- **Email Content**: Subject, preview
- **Delivery Timeline**: All events with timestamps
- **Provider Information**: Which provider sent it
- **Error Messages**: If the email failed

### Retrying Failed Emails

1. Find the failed email in logs
2. Click **Retry**
3. The email will be added back to the queue
4. Monitor the status

### Exporting Logs

1. Apply desired filters
2. Click **Export**
3. Choose format (CSV or JSON)
4. Download the file

## Analytics

### Accessing Analytics

Navigate to **Emails > Analytics** to view email performance metrics.

### Summary Metrics

The analytics dashboard shows:

- **Total Sent**: Total emails sent in the selected period
- **Delivered**: Successfully delivered emails
- **Opened**: Emails opened by recipients
- **Clicked**: Emails with link clicks
- **Bounced**: Emails that bounced
- **Open Rate**: (Opened / Delivered) × 100
- **Click Rate**: (Clicked / Delivered) × 100
- **Bounce Rate**: (Bounced / Sent) × 100

### Email Volume Chart

Shows email volume over time:
- View by day, week, or month
- Hover over points for exact numbers
- Compare different time periods

### Performance Charts

**Open Rate Over Time:**
- Track how open rates change
- Identify trends and patterns

**Click Rate Over Time:**
- Monitor engagement levels
- See which periods have better engagement

### Template Performance

Compare performance across templates:

| Template | Sent | Delivered | Opened | Clicked | Open Rate | Click Rate |
|----------|------|-----------|--------|---------|-----------|------------|
| Purchase Confirmation | 1,234 | 1,230 | 856 | 234 | 69.6% | 19.0% |
| Sale Notification | 567 | 565 | 423 | 89 | 74.9% | 15.8% |

**Insights:**
- Identify best-performing templates
- Find templates that need improvement
- Compare transactional vs marketing performance

### Sender Performance

View metrics by sender address:
- Which sender addresses have better deliverability
- Compare bounce rates across senders
- Identify sender reputation issues

### Date Range Selection

Choose the time period to analyze:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range

### Exporting Analytics

1. Select desired date range and filters
2. Click **Export Analytics**
3. Choose format (CSV or JSON)
4. Use the data in external tools

## Suppressions Management

### Understanding Suppressions

Suppressions are email addresses that should not receive emails due to:
- **Hard Bounces**: Permanent delivery failures (invalid address)
- **Soft Bounces**: Temporary delivery failures (mailbox full)
- **Complaints**: Recipients marked emails as spam

### Viewing Suppressions

Navigate to **Emails > Suppressions** to see all suppressed addresses.

### Suppression Types

**Hard Bounce** 🔴
- Email address doesn't exist
- Domain doesn't exist
- Permanent delivery failure
- **Action**: Automatically suppressed after 1 hard bounce

**Soft Bounce** 🟡
- Mailbox full
- Server temporarily unavailable
- **Action**: Automatically suppressed after 3 soft bounces

**Complaint** 🚫
- Recipient marked email as spam
- **Action**: Immediately suppressed and unsubscribed from marketing

### Adding Manual Suppressions

1. Navigate to **Emails > Suppressions**
2. Click **Add Suppression**
3. Enter email address and reason
4. Click **Add**

Use this to:
- Prevent sending to known bad addresses
- Honor manual unsubscribe requests
- Comply with legal requirements

### Removing Suppressions

1. Find the suppressed email
2. Click **Remove**
3. Confirm the action

⚠️ **Warning**: Only remove suppressions if you're certain the issue is resolved.

### Bulk Actions

Select multiple suppressions and:
- Remove all selected
- Export selected to CSV

## Best Practices

### Email Deliverability

1. **Verify Your Domain**: Always use domain verification for better deliverability
2. **Warm Up New Senders**: Start with low volume and gradually increase
3. **Monitor Bounce Rates**: Keep bounce rate below 5%
4. **Monitor Complaint Rates**: Keep complaint rate below 0.1%
5. **Clean Your List**: Remove invalid addresses regularly

### Template Design

1. **Keep It Simple**: Avoid complex layouts
2. **Mobile-First**: Most emails are read on mobile
3. **Clear Call-to-Action**: Make buttons obvious
4. **Test Before Sending**: Always send test emails
5. **Use Variables**: Personalize emails for better engagement

### Email Content

1. **Clear Subject Lines**: Be specific and concise
2. **Valuable Content**: Provide value to recipients
3. **Proper Formatting**: Use headings, lists, and spacing
4. **Include Unsubscribe**: Required for marketing emails
5. **Brand Consistency**: Use your logo and colors

### Monitoring

1. **Check Dashboard Daily**: Monitor for issues
2. **Review Failed Emails**: Investigate failures promptly
3. **Track Trends**: Watch for declining metrics
4. **Set Up Alerts**: Get notified of critical issues
5. **Regular Audits**: Review templates and settings monthly

## Troubleshooting

### Emails Not Sending

**Check:**
1. Provider configuration is correct
2. Sender address is verified
3. Queue is processing (check dashboard)
4. No rate limit issues

### Low Delivery Rates

**Check:**
1. Domain verification is complete
2. SPF/DKIM records are correct
3. Bounce rate is acceptable
4. Sender reputation is good

### Low Open Rates

**Improve:**
1. Subject lines (make them compelling)
2. Send timing (test different times)
3. Sender name (use recognizable names)
4. Email content (provide value)

### High Bounce Rates

**Actions:**
1. Remove invalid addresses
2. Verify email addresses before sending
3. Check for typos in addresses
4. Use double opt-in for marketing

## Support

If you need help:

1. **Documentation**: Check this guide and other docs
2. **Email Logs**: Review logs for error messages
3. **Support**: Contact support@piksend.com
4. **Community**: Join our community forum

## Glossary

- **Bounce**: Failed email delivery
- **Click Rate**: Percentage of delivered emails with clicks
- **DKIM**: Email authentication method
- **Hard Bounce**: Permanent delivery failure
- **Open Rate**: Percentage of delivered emails opened
- **Soft Bounce**: Temporary delivery failure
- **SPF**: Sender authentication method
- **Suppression**: Blocked email address
- **Template Variable**: Placeholder for dynamic content
- **Transactional Email**: Automated system email
- **Marketing Email**: Promotional email
