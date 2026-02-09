# Email System Troubleshooting Guide

## Overview

This guide helps developers diagnose and fix common issues with the PikSend Email Management System. It covers problems with sending, delivery, templates, webhooks, and performance.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Sending Issues](#sending-issues)
3. [Delivery Issues](#delivery-issues)
4. [Template Issues](#template-issues)
5. [Queue Issues](#queue-issues)
6. [Webhook Issues](#webhook-issues)
7. [Performance Issues](#performance-issues)
8. [Provider-Specific Issues](#provider-specific-issues)
9. [Database Issues](#database-issues)
10. [Debugging Tools](#debugging-tools)

## Quick Diagnostics

### Health Check Checklist

Run through this checklist first:

```typescript
// Quick health check script
import { EmailService } from '@/lib/services/email.service';
import { EmailProviderService } from '@/lib/services/email-provider.service';
import { QueueManager } from '@/lib/email/queue-manager';

async function healthCheck() {
  const results = {
    provider: false,
    queue: false,
    database: false,
    webhooks: false
  };
  
  try {
    // Check provider connection
    const providerService = new EmailProviderService();
    const provider = await providerService.getActiveProvider();
    const test = await providerService.testProviderConnection(provider.name);
    results.provider = test.success;
    
    // Check queue
    const queueManager = new QueueManager();
    const stats = await queueManager.getStats();
    results.queue = stats !== null;
    
    // Check database
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { error } = await supabase.from('email_providers').select('count');
    results.database = !error;
    
    // Check webhooks (check recent events)
    const { data } = await supabase
      .from('email_events')
      .select('count')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    results.webhooks = data !== null;
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  return results;
}

// Run health check
healthCheck().then(results => {
  console.log('Health Check Results:', results);
  console.log('All systems:', Object.values(results).every(v => v) ? '✅' : '❌');
});
```

### Common Error Codes

| Code | Meaning | Quick Fix |
|------|---------|-----------|
| `PROVIDER_NOT_CONFIGURED` | No active provider | Configure provider in admin |
| `INVALID_API_KEY` | Provider credentials invalid | Check API key |
| `SENDER_NOT_VERIFIED` | Sender address not verified | Verify sender address |
| `TEMPLATE_NOT_FOUND` | Template doesn't exist | Check template ID |
| `MISSING_VARIABLES` | Required variables not provided | Check template variables |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement rate limiting |
| `QUEUE_FULL` | Queue at capacity | Process queue or increase capacity |
| `WEBHOOK_SIGNATURE_INVALID` | Webhook verification failed | Check webhook configuration |

## Sending Issues

### Problem: Emails Not Being Queued

**Symptoms:**
- `sendTransactionalEmail()` throws error
- No entries in `email_queue` table
- Error: "Failed to queue email"

**Diagnosis:**
```typescript
// Check if email service is working
import { EmailService } from '@/lib/services/email.service';

const emailService = new EmailService();

try {
  const result = await emailService.sendTransactionalEmail({
    templateId: 'test-template',
    to: 'test@example.com',
    variables: { name: 'Test' }
  });
  console.log('Queue result:', result);
} catch (error) {
  console.error('Queue error:', error);
  // Check error.message for specific issue
}
```

**Solutions:**

1. **Check Database Connection:**
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
const { error } = await supabase.from('email_queue').select('count');

if (error) {
  console.error('Database error:', error);
  // Fix: Check Supabase connection, credentials, RLS policies
}
```

2. **Check Template Exists:**
```typescript
const { data: template } = await supabase
  .from('email_templates')
  .select('*')
  .eq('slug', 'test-template')
  .single();

if (!template) {
  console.error('Template not found');
  // Fix: Create template or use correct template ID
}
```

3. **Check Required Variables:**
```typescript
import { TemplateEngine } from '@/lib/email/template-engine';

const templateEngine = new TemplateEngine();
const validation = await templateEngine.validateVariables(
  'test-template',
  { name: 'Test' }
);

if (!validation.valid) {
  console.error('Missing variables:', validation.missingVariables);
  // Fix: Provide all required variables
}
```

### Problem: Emails Queued But Not Sending

**Symptoms:**
- Emails stuck in `pending` status
- Queue size increasing
- No emails being delivered

**Diagnosis:**
```typescript
import { QueueManager } from '@/lib/email/queue-manager';

const queueManager = new QueueManager();
const stats = await queueManager.getStats();

console.log('Queue stats:', stats);
// Check if pending count is high and processing is 0
```

**Solutions:**

1. **Check Edge Function is Running:**
```bash
# Check Supabase edge function logs
supabase functions logs process-email-queue

# If not running, deploy it
supabase functions deploy process-email-queue
```

2. **Manually Process Queue:**
```typescript
// Manually trigger queue processing
const results = await queueManager.processBatch(10);
console.log('Process results:', results);

// Check for errors
results.forEach(result => {
  if (result.status === 'failed') {
    console.error(`Email ${result.id} failed:`, result.error);
  }
});
```

3. **Check Provider Configuration:**
```typescript
import { EmailProviderService } from '@/lib/services/email-provider.service';

const providerService = new EmailProviderService();
const provider = await providerService.getActiveProvider();

if (!provider) {
  console.error('No active provider configured');
  // Fix: Configure provider in admin panel
}

const test = await providerService.testProviderConnection(provider.name);
if (!test.success) {
  console.error('Provider connection failed:', test.error);
  // Fix: Check API credentials
}
```

### Problem: Emails Failing After Queue

**Symptoms:**
- Emails move to `failed` status
- Error messages in `email_queue.last_error`
- Retry count increasing

**Diagnosis:**
```typescript
// Check failed emails
const { data: failedEmails } = await supabase
  .from('email_queue')
  .select('*')
  .eq('status', 'failed')
  .order('created_at', { ascending: false })
  .limit(10);

failedEmails?.forEach(email => {
  console.log('Failed email:', {
    id: email.id,
    to: email.to_address,
    error: email.last_error,
    retryCount: email.retry_count
  });
});
```

**Solutions:**

1. **Check Error Messages:**

Common errors and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid API key" | Wrong credentials | Update provider credentials |
| "Sender not verified" | Unverified sender | Verify sender address |
| "Rate limit exceeded" | Too many requests | Implement rate limiting |
| "Invalid recipient" | Bad email address | Validate email addresses |
| "Template render failed" | Template error | Check template syntax |

2. **Retry Failed Emails:**
```typescript
// Retry specific email
await queueManager.retry('email-queue-id');

// Or retry all failed emails
const { data: failed } = await supabase
  .from('email_queue')
  .select('id')
  .eq('status', 'failed')
  .lt('retry_count', 3);

for (const email of failed || []) {
  await queueManager.retry(email.id);
}
```

## Delivery Issues

### Problem: Emails Going to Spam

**Symptoms:**
- Emails delivered but in spam folder
- Low open rates
- High complaint rates

**Diagnosis:**
```bash
# Check email authentication
# Send test email and check headers

# In Gmail:
# 1. Open email
# 2. Click "Show original"
# 3. Check for:
#    - SPF: pass
#    - DKIM: pass
#    - DMARC: pass
```

**Solutions:**

1. **Verify Domain Authentication:**
```typescript
// Check if domain is verified
const { data: sender } = await supabase
  .from('sender_addresses')
  .select('*')
  .eq('email', 'noreply@piksend.com')
  .single();

if (!sender?.is_verified) {
  console.error('Sender not verified');
  // Fix: Complete domain verification
}

// Check DNS records
console.log('Domain records:', sender?.domain_records);
```

2. **Check Sender Reputation:**
```bash
# Check domain reputation
curl "https://www.senderscore.org/lookup.php?lookup=piksend.com"

# Check if blacklisted
curl "https://mxtoolbox.com/blacklists.aspx?domain=piksend.com"
```

3. **Improve Email Content:**
- Remove spam trigger words (FREE, URGENT, !!!)
- Balance text and images
- Include plain text version
- Add unsubscribe link
- Use consistent sender address

### Problem: High Bounce Rate

**Symptoms:**
- Many emails bouncing
- Bounce rate > 5%
- Reputation issues

**Diagnosis:**
```typescript
// Check bounce statistics
const { data: bounces } = await supabase
  .from('email_suppressions')
  .select('*')
  .eq('reason', 'bounce')
  .gte('created_at', new Date(Date.now() - 86400000 * 7).toISOString());

console.log('Bounces last 7 days:', bounces?.length);

// Check bounce types
const hardBounces = bounces?.filter(b => b.bounce_type === 'hard').length;
const softBounces = bounces?.filter(b => b.bounce_type === 'soft').length;

console.log('Hard bounces:', hardBounces);
console.log('Soft bounces:', softBounces);
```

**Solutions:**

1. **Remove Hard Bounces:**
```typescript
// Get hard bounce addresses
const { data: hardBounces } = await supabase
  .from('email_suppressions')
  .select('email')
  .eq('bounce_type', 'hard');

// Remove from mailing lists
// Don't send to these addresses again
```

2. **Validate Email Addresses:**
```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Before sending
if (!validateEmail(recipientEmail)) {
  throw new Error('Invalid email address');
}
```

3. **Implement Double Opt-In:**
```typescript
// For marketing emails, require confirmation
async function sendConfirmationEmail(email: string) {
  const token = generateToken();
  
  await emailService.sendTransactionalEmail({
    templateId: 'email-confirmation',
    to: email,
    variables: {
      confirmationLink: `https://piksend.com/confirm/${token}`
    }
  });
}
```

## Template Issues

### Problem: Template Not Rendering

**Symptoms:**
- Error: "Template not found"
- Error: "Failed to render template"
- Blank email content

**Diagnosis:**
```typescript
import { TemplateEngine } from '@/lib/email/template-engine';

const templateEngine = new TemplateEngine();

try {
  const rendered = await templateEngine.renderCustomTemplate(
    'template-id',
    { name: 'Test' }
  );
  console.log('Rendered:', rendered);
} catch (error) {
  console.error('Render error:', error);
}
```

**Solutions:**

1. **Check Template Exists:**
```typescript
const { data: template } = await supabase
  .from('email_templates')
  .select('*')
  .eq('id', 'template-id')
  .single();

if (!template) {
  console.error('Template not found');
  // Fix: Use correct template ID or create template
}

if (!template.is_active) {
  console.error('Template is inactive');
  // Fix: Activate template
}
```

2. **Check Template Content:**
```typescript
// Validate template content
if (!template.content) {
  console.error('Template has no content');
  // Fix: Add content to template
}

// Check for syntax errors
try {
  JSON.parse(JSON.stringify(template.content));
} catch (error) {
  console.error('Template content is invalid:', error);
  // Fix: Repair template content
}
```

3. **Check Variables:**
```typescript
const validation = await templateEngine.validateVariables(
  'template-id',
  variables
);

if (!validation.valid) {
  console.error('Missing variables:', validation.missingVariables);
  // Fix: Provide all required variables
}
```

### Problem: Variables Not Replacing

**Symptoms:**
- Email shows `{variableName}` instead of value
- Variables not substituted
- Partial substitution

**Diagnosis:**
```typescript
// Test variable substitution
const template = 'Hello {name}, your order {orderId} is ready!';
const variables = { name: 'John', orderId: '12345' };

const result = template.replace(/{(\w+)}/g, (match, key) => {
  return variables[key] || match;
});

console.log('Result:', result);
// Should be: "Hello John, your order 12345 is ready!"
```

**Solutions:**

1. **Check Variable Format:**
```typescript
// Variables must be in {curlyBraces}
// ✅ Correct: {variableName}
// ❌ Wrong: {{variableName}}
// ❌ Wrong: $variableName
// ❌ Wrong: [variableName]
```

2. **Check Variable Names:**
```typescript
// Variable names must match exactly (case-sensitive)
const variables = {
  userName: 'John',  // ✅ Correct
  UserName: 'John',  // ❌ Won't match {userName}
  user_name: 'John'  // ❌ Won't match {userName}
};
```

3. **Provide All Variables:**
```typescript
// Get required variables from template
const { data: template } = await supabase
  .from('email_templates')
  .select('variables')
  .eq('id', 'template-id')
  .single();

console.log('Required variables:', template?.variables);

// Ensure all are provided
const missingVars = template?.variables.filter(
  v => !variables[v]
);

if (missingVars.length > 0) {
  console.error('Missing variables:', missingVars);
}
```

## Queue Issues

### Problem: Queue Growing Too Large

**Symptoms:**
- Queue size > 1000
- Processing can't keep up
- Delays in email delivery

**Diagnosis:**
```typescript
const stats = await queueManager.getStats();

console.log('Queue stats:', {
  pending: stats.pending,
  processing: stats.processing,
  failed: stats.failed
});

if (stats.pending > 1000) {
  console.warn('Queue is too large!');
}
```

**Solutions:**

1. **Increase Batch Size:**
```typescript
// In edge function or processing script
const batchSize = 50; // Increase from default 10
await queueManager.processBatch(batchSize);
```

2. **Increase Processing Frequency:**
```typescript
// In Supabase edge function cron config
// Change from every 1 minute to every 30 seconds
// supabase/functions/process-email-queue/index.ts

// Deno.cron("process-email-queue", "*/30 * * * * *", async () => {
//   await processQueue();
// });
```

3. **Add More Workers:**
```typescript
// Process queue in parallel
async function processQueueParallel() {
  const workers = 5;
  const batchSize = 10;
  
  const promises = Array.from({ length: workers }, () =>
    queueManager.processBatch(batchSize)
  );
  
  await Promise.all(promises);
}
```

### Problem: Emails Stuck in Processing

**Symptoms:**
- Emails in `processing` status for long time
- Processing count high
- No progress

**Diagnosis:**
```typescript
// Check stuck emails
const { data: stuck } = await supabase
  .from('email_queue')
  .select('*')
  .eq('status', 'processing')
  .lt('updated_at', new Date(Date.now() - 300000).toISOString()); // 5 min ago

console.log('Stuck emails:', stuck?.length);
```

**Solutions:**

1. **Reset Stuck Emails:**
```typescript
// Reset to pending
const { error } = await supabase
  .from('email_queue')
  .update({ status: 'pending' })
  .eq('status', 'processing')
  .lt('updated_at', new Date(Date.now() - 300000).toISOString());

if (!error) {
  console.log('Reset stuck emails');
}
```

2. **Add Timeout Handling:**
```typescript
// In queue processing logic
async function processWithTimeout(email: QueuedEmail, timeoutMs: number = 30000) {
  return Promise.race([
    processEmail(email),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

## Webhook Issues

### Problem: Webhooks Not Being Received

**Symptoms:**
- No events in `email_events` table
- Open/click tracking not working
- Delivery status not updating

**Diagnosis:**
```typescript
// Check recent webhook events
const { data: events } = await supabase
  .from('email_events')
  .select('*')
  .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  .order('created_at', { ascending: false });

console.log('Events last hour:', events?.length);

if (!events || events.length === 0) {
  console.error('No webhook events received');
}
```

**Solutions:**

1. **Check Webhook Configuration:**

For Resend:
```bash
# Check webhook in Resend dashboard
# Verify URL: https://your-domain.com/api/webhooks/email/resend
# Verify events are selected
# Check status is "Active"
```

For AWS SES:
```bash
# Check SNS subscription
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:123456789012:piksend-ses-events

# Check subscription is "Confirmed"
```

2. **Test Webhook Endpoint:**
```bash
# Test Resend webhook
curl -X POST https://your-domain.com/api/webhooks/email/resend \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test" \
  -d '{
    "type": "email.delivered",
    "data": {
      "email_id": "test-123"
    }
  }'

# Check response and logs
```

3. **Check Webhook Signature Verification:**
```typescript
// In webhook handler
import { WebhookHandler } from '@/lib/email/webhook-handler';

const webhookHandler = new WebhookHandler();

// Temporarily disable signature verification for testing
// (Re-enable in production!)
const isValid = true; // webhookHandler.verifySignature(payload, signature, 'resend');

if (!isValid) {
  console.error('Invalid webhook signature');
  // Fix: Check webhook secret configuration
}
```

### Problem: Webhook Signature Verification Failing

**Symptoms:**
- Error: "Invalid signature"
- Webhooks rejected
- 401 responses

**Solutions:**

1. **Check Webhook Secret:**
```typescript
// Verify webhook secret is configured
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('Webhook secret not configured');
  // Fix: Add RESEND_WEBHOOK_SECRET to environment variables
}
```

2. **Verify Signature Correctly:**
```typescript
// For Resend (uses Svix)
import { Webhook } from 'svix';

const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);

try {
  const payload = webhook.verify(
    JSON.stringify(body),
    {
      'svix-id': headers.get('svix-id')!,
      'svix-timestamp': headers.get('svix-timestamp')!,
      'svix-signature': headers.get('svix-signature')!
    }
  );
  console.log('Signature valid');
} catch (error) {
  console.error('Signature invalid:', error);
}
```

## Performance Issues

### Problem: Slow Email Sending

**Symptoms:**
- High latency
- Timeouts
- Slow queue processing

**Diagnosis:**
```typescript
// Measure sending performance
const start = Date.now();

await emailService.sendTransactionalEmail({
  templateId: 'test',
  to: 'test@example.com',
  variables: {}
});

const duration = Date.now() - start;
console.log(`Sending took ${duration}ms`);

if (duration > 5000) {
  console.warn('Sending is slow!');
}
```

**Solutions:**

1. **Add Database Indexes:**
```sql
-- Check if indexes exist
SELECT * FROM pg_indexes 
WHERE tablename IN ('email_queue', 'email_logs', 'email_templates');

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled 
ON email_queue(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_created 
ON email_logs(created_at DESC);
```

2. **Cache Templates:**
```typescript
import { LRUCache } from 'lru-cache';

const templateCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 60 // 1 hour
});

async function getTemplate(id: string) {
  const cached = templateCache.get(id);
  if (cached) return cached;
  
  const template = await fetchTemplate(id);
  templateCache.set(id, template);
  return template;
}
```

3. **Batch Processing:**
```typescript
// Process multiple emails at once
async function sendBatch(emails: SendEmailParams[]) {
  const provider = await providerService.getActiveProvider();
  
  // Use provider's batch method
  const results = await provider.sendBatch(emails);
  
  return results;
}
```

### Problem: High Memory Usage

**Symptoms:**
- Out of memory errors
- Slow performance
- Process crashes

**Solutions:**

1. **Limit Batch Size:**
```typescript
// Don't process too many at once
const MAX_BATCH_SIZE = 10;

async function processSafely() {
  const stats = await queueManager.getStats();
  const batchSize = Math.min(stats.pending, MAX_BATCH_SIZE);
  
  await queueManager.processBatch(batchSize);
}
```

2. **Stream Large Results:**
```typescript
// Don't load all emails into memory
async function* getEmailsStream() {
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const { data } = await supabase
      .from('email_queue')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (!data || data.length === 0) break;
    
    yield* data;
    offset += limit;
  }
}

// Use stream
for await (const email of getEmailsStream()) {
  await processEmail(email);
}
```

## Provider-Specific Issues

### Resend Issues

**Problem: Rate Limit Exceeded**
```typescript
// Error: "Rate limit exceeded"

// Solution: Implement rate limiting
import pLimit from 'p-limit';

const limit = pLimit(10); // 10 concurrent requests

const promises = emails.map(email =>
  limit(() => emailService.sendTransactionalEmail(email))
);

await Promise.all(promises);
```

**Problem: Invalid API Key**
```typescript
// Test API key
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'test@piksend.com',
    to: 'test@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  })
});

if (response.status === 401) {
  console.error('Invalid API key');
}
```

### AWS SES Issues

**Problem: Still in Sandbox Mode**
```bash
# Check SES sending limits
aws ses get-send-quota --region us-east-1

# If MaxSendRate is 1, you're in sandbox mode
# Request production access in AWS Console
```

**Problem: IAM Permissions**
```bash
# Test IAM permissions
aws ses send-email \
  --from noreply@piksend.com \
  --destination ToAddresses=test@example.com \
  --message Subject={Data="Test"},Body={Text={Data="Test"}} \
  --region us-east-1

# If error, check IAM policy
```

## Database Issues

### Problem: RLS Policies Blocking Access

**Symptoms:**
- Error: "new row violates row-level security policy"
- Can't insert/update records
- Permission denied

**Solutions:**

```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename IN ('email_queue', 'email_logs', 'email_templates');

-- Temporarily disable RLS for testing (re-enable after!)
ALTER TABLE email_queue DISABLE ROW LEVEL SECURITY;

-- Or add policy for service role
CREATE POLICY "Service role can manage emails"
ON email_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Problem: Connection Pool Exhausted

**Symptoms:**
- Error: "remaining connection slots are reserved"
- Timeouts
- Can't connect to database

**Solutions:**

```typescript
// Use connection pooling
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'x-connection-pool': 'true'
      }
    }
  }
);
```

## Debugging Tools

### Enable Debug Logging

```typescript
// Add to environment variables
DEBUG=email:*

// In code
import debug from 'debug';

const log = debug('email:service');

log('Sending email to %s', recipient);
log('Template: %s', templateId);
log('Variables: %O', variables);
```

### Email Service Debug Script

```typescript
// scripts/debug-email.ts
import { EmailService } from '@/lib/services/email.service';
import { QueueManager } from '@/lib/email/queue-manager';
import { EmailProviderService } from '@/lib/services/email-provider.service';

async function debugEmail(emailId: string) {
  console.log('=== Email Debug Report ===\n');
  
  // Check queue entry
  const { data: queueEntry } = await supabase
    .from('email_queue')
    .select('*')
    .eq('id', emailId)
    .single();
  
  console.log('Queue Entry:', queueEntry);
  
  // Check email log
  const { data: log } = await supabase
    .from('email_logs')
    .select('*')
    .eq('queue_id', emailId)
    .single();
  
  console.log('Email Log:', log);
  
  // Check events
  const { data: events } = await supabase
    .from('email_events')
    .select('*')
    .eq('log_id', log?.id)
    .order('created_at', { ascending: true });
  
  console.log('Events:', events);
  
  // Check provider
  const providerService = new EmailProviderService();
  const provider = await providerService.getActiveProvider();
  console.log('Active Provider:', provider.name);
  
  // Test provider connection
  const test = await providerService.testProviderConnection(provider.name);
  console.log('Provider Test:', test);
}

// Run: ts-node scripts/debug-email.ts <email-id>
debugEmail(process.argv[2]);
```

### Queue Monitor Script

```typescript
// scripts/monitor-queue.ts
import { QueueManager } from '@/lib/email/queue-manager';

async function monitorQueue() {
  const queueManager = new QueueManager();
  
  setInterval(async () => {
    const stats = await queueManager.getStats();
    
    console.clear();
    console.log('=== Queue Monitor ===');
    console.log(`Pending: ${stats.pending}`);
    console.log(`Processing: ${stats.processing}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Scheduled: ${stats.scheduled}`);
    console.log(`Sent Today: ${stats.sentToday}`);
    console.log(`\nLast updated: ${new Date().toLocaleTimeString()}`);
  }, 5000); // Update every 5 seconds
}

monitorQueue();
```

## Getting Help

If you're still stuck:

1. **Check Logs:**
   - Application logs
   - Supabase logs
   - Provider dashboard logs
   - Browser console (for UI issues)

2. **Search Documentation:**
   - This troubleshooting guide
   - Email Integration Guide
   - Provider setup guides

3. **Contact Support:**
   - Email: dev-support@piksend.com
   - Include: Error messages, logs, steps to reproduce
   - Attach: Debug output from scripts above

4. **Community:**
   - Join our Discord/Slack
   - Search existing issues
   - Ask questions in forum

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial troubleshooting guide
- Common issues and solutions
- Debugging tools and scripts
- Provider-specific troubleshooting
