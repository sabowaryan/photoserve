# Email Integration Developer Guide

## Overview

This guide provides comprehensive documentation for developers integrating with the PikSend Email Management System. It covers the email service API, template rendering, queue management, webhook handling, and best practices for email integration.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Email Service API](#email-service-api)
3. [Template Rendering](#template-rendering)
4. [Queue Management](#queue-management)
5. [Provider Integration](#provider-integration)
6. [Webhook Handling](#webhook-handling)
7. [Analytics Integration](#analytics-integration)
8. [Testing](#testing)
9. [Best Practices](#best-practices)

## Quick Start

### Sending Your First Email

```typescript
import { EmailService } from '@/lib/services/email.service';

const emailService = new EmailService();

// Send a transactional email
await emailService.sendTransactionalEmail({
  templateId: 'purchase-confirmation',
  to: 'customer@example.com',
  variables: {
    buyerName: 'John Doe',
    galleryName: 'Summer Wedding 2024',
    photoCount: 25,
    amountPaid: '$99.99',
    accessLink: 'https://piksend.com/gallery/abc123'
  }
});
```

### Installation

The email system is already integrated into PikSend. No additional installation required.

### Environment Variables

```bash
# Email Provider Configuration
EMAIL_PROVIDER_DEFAULT=resend  # or 'aws-ses'

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx

# AWS SES Configuration (if using SES)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Queue Configuration
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_RETRY_MAX_ATTEMPTS=5
```

## Email Service API

### EmailService Class

The main service for sending emails.

```typescript
import { EmailService } from '@/lib/services/email.service';

const emailService = new EmailService();
```


### sendTransactionalEmail()

Send a transactional email immediately.

**Signature:**
```typescript
async sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResult>
```

**Parameters:**
```typescript
interface SendEmailParams {
  templateId: string;           // Template slug or ID
  to: string | string[];        // Recipient email(s)
  variables: Record<string, any>; // Template variables
  from?: string;                // Optional sender (uses default if not provided)
  replyTo?: string;             // Optional reply-to address
  cc?: string[];                // Optional CC recipients
  bcc?: string[];               // Optional BCC recipients
  attachments?: Attachment[];   // Optional attachments
}
```

**Returns:**
```typescript
interface SendEmailResult {
  id: string;                   // Email queue ID
  status: 'queued' | 'sent' | 'failed';
  error?: string;               // Error message if failed
}
```

**Example:**
```typescript
const result = await emailService.sendTransactionalEmail({
  templateId: 'purchase-confirmation',
  to: 'customer@example.com',
  variables: {
    buyerName: 'John Doe',
    galleryName: 'Summer Wedding 2024',
    photoCount: 25,
    amountPaid: '$99.99',
    accessLink: 'https://piksend.com/gallery/abc123',
    photographerName: 'Jane Smith Photography'
  }
});

console.log(`Email queued with ID: ${result.id}`);
```

### sendMarketingEmail()

Send a marketing email with unsubscribe checking.

**Signature:**
```typescript
async sendMarketingEmail(params: SendEmailParams): Promise<SendEmailResult>
```

**Behavior:**
- Checks if recipient is unsubscribed
- Checks if recipient is suppressed (bounced/complained)
- Automatically adds unsubscribe link
- Respects marketing email preferences

**Example:**
```typescript
const result = await emailService.sendMarketingEmail({
  templateId: 'newsletter',
  to: 'subscriber@example.com',
  variables: {
    recipientName: 'John Doe',
    monthlyHighlights: [...],
    featuredGalleries: [...]
  }
});
```

### scheduleEmail()

Schedule an email for future delivery.

**Signature:**
```typescript
async scheduleEmail(params: ScheduleEmailParams): Promise<SendEmailResult>
```

**Parameters:**
```typescript
interface ScheduleEmailParams extends SendEmailParams {
  scheduledAt: Date;  // When to send the email
}
```

**Example:**
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

const result = await emailService.scheduleEmail({
  templateId: 'reminder',
  to: 'user@example.com',
  scheduledAt: tomorrow,
  variables: {
    eventName: 'Gallery Expiration',
    expirationDate: '2024-03-15'
  }
});
```

### cancelScheduledEmail()

Cancel a scheduled email before it's sent.

**Signature:**
```typescript
async cancelScheduledEmail(emailId: string): Promise<void>
```

**Example:**
```typescript
await emailService.cancelScheduledEmail('email-queue-id-123');
```

## Template Rendering

### TemplateEngine Class

Handles rendering of email templates.

```typescript
import { TemplateEngine } from '@/lib/email/template-engine';

const templateEngine = new TemplateEngine();
```

### renderReactEmail()

Render an existing React Email template.

**Signature:**
```typescript
async renderReactEmail(
  templateName: string,
  variables: Record<string, any>
): Promise<RenderedEmail>
```

**Returns:**
```typescript
interface RenderedEmail {
  html: string;      // HTML version
  text: string;      // Plain text version
  subject: string;   // Rendered subject line
}
```

**Example:**
```typescript
const rendered = await templateEngine.renderReactEmail(
  'purchase-confirmation',
  {
    buyerName: 'John Doe',
    galleryName: 'Summer Wedding 2024',
    photoCount: 25,
    amountPaid: '$99.99'
  }
);

console.log(rendered.html);  // Full HTML email
console.log(rendered.text);  // Plain text version
```

### renderCustomTemplate()

Render a custom template from the database.

**Signature:**
```typescript
async renderCustomTemplate(
  templateId: string,
  variables: Record<string, any>
): Promise<RenderedEmail>
```

**Example:**
```typescript
const rendered = await templateEngine.renderCustomTemplate(
  'template-uuid-123',
  {
    recipientName: 'John Doe',
    customField: 'Custom Value'
  }
);
```

### validateVariables()

Validate that all required variables are provided.

**Signature:**
```typescript
validateVariables(
  templateId: string,
  variables: Record<string, any>
): ValidationResult
```

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  missingVariables: string[];
  errors: string[];
}
```

**Example:**
```typescript
const validation = await templateEngine.validateVariables(
  'purchase-confirmation',
  { buyerName: 'John Doe' }
);

if (!validation.valid) {
  console.error('Missing variables:', validation.missingVariables);
  // ['galleryName', 'photoCount', 'amountPaid', 'accessLink']
}
```

## Queue Management

### QueueManager Class

Manages the email queue and processing.

```typescript
import { QueueManager } from '@/lib/email/queue-manager';

const queueManager = new QueueManager();
```

### enqueue()

Add an email to the queue.

**Signature:**
```typescript
async enqueue(email: QueuedEmail): Promise<string>
```

**Parameters:**
```typescript
interface QueuedEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  type: 'transactional' | 'marketing';
}
```

**Example:**
```typescript
const queueId = await queueManager.enqueue({
  from: 'noreply@piksend.com',
  to: 'customer@example.com',
  subject: 'Your Purchase Confirmation',
  html: '<html>...</html>',
  text: 'Plain text version...',
  priority: 'high',
  type: 'transactional'
});
```

### processBatch()

Process a batch of queued emails.

**Signature:**
```typescript
async processBatch(batchSize: number = 10): Promise<ProcessResult[]>
```

**Returns:**
```typescript
interface ProcessResult {
  id: string;
  status: 'sent' | 'failed' | 'retrying';
  error?: string;
}
```

**Example:**
```typescript
// Usually called by edge function, but can be called manually
const results = await queueManager.processBatch(10);

results.forEach(result => {
  if (result.status === 'failed') {
    console.error(`Email ${result.id} failed: ${result.error}`);
  }
});
```

### getStats()

Get queue statistics.

**Signature:**
```typescript
async getStats(): Promise<QueueStats>
```

**Returns:**
```typescript
interface QueueStats {
  pending: number;      // Emails waiting to be sent
  processing: number;   // Emails currently being sent
  failed: number;       // Emails that failed
  scheduled: number;    // Emails scheduled for future
  sentToday: number;    // Emails sent in last 24 hours
}
```

**Example:**
```typescript
const stats = await queueManager.getStats();
console.log(`Pending emails: ${stats.pending}`);
console.log(`Failed emails: ${stats.failed}`);
```

## Provider Integration

### EmailProvider Interface

All email providers implement this interface.

```typescript
interface EmailProvider {
  name: 'resend' | 'aws-ses';
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]>;
  verifySender(email: string): Promise<VerificationResult>;
  getVerificationStatus(email: string): Promise<VerificationStatus>;
  getDomainRecords(domain: string): Promise<DomainRecords>;
}
```

### EmailProviderService

Manages provider configuration and switching.

```typescript
import { EmailProviderService } from '@/lib/services/email-provider.service';

const providerService = new EmailProviderService();
```

### getActiveProvider()

Get the currently active email provider instance.

**Signature:**
```typescript
async getActiveProvider(): Promise<EmailProvider>
```

**Example:**
```typescript
const provider = await providerService.getActiveProvider();
console.log(`Active provider: ${provider.name}`);

// Use provider directly
const result = await provider.sendEmail({
  from: 'noreply@piksend.com',
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Test</p>'
});
```

### setActiveProvider()

Switch to a different email provider.

**Signature:**
```typescript
async setActiveProvider(providerName: 'resend' | 'aws-ses'): Promise<void>
```

**Example:**
```typescript
await providerService.setActiveProvider('aws-ses');
console.log('Switched to AWS SES');
```

### testProviderConnection()

Test if provider credentials are valid.

**Signature:**
```typescript
async testProviderConnection(providerName: string): Promise<TestResult>
```

**Returns:**
```typescript
interface TestResult {
  success: boolean;
  error?: string;
  latency?: number;  // Response time in ms
}
```

**Example:**
```typescript
const test = await providerService.testProviderConnection('resend');

if (test.success) {
  console.log(`Connection successful (${test.latency}ms)`);
} else {
  console.error(`Connection failed: ${test.error}`);
}
```

## Webhook Handling

### WebhookHandler Class

Processes delivery events from email providers.

```typescript
import { WebhookHandler } from '@/lib/email/webhook-handler';

const webhookHandler = new WebhookHandler();
```

### handleResendWebhook()

Process a webhook from Resend.

**Signature:**
```typescript
async handleResendWebhook(payload: ResendWebhookPayload): Promise<void>
```

**Example (API Route):**
```typescript
// app/api/webhooks/email/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandler } from '@/lib/email/webhook-handler';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const signature = request.headers.get('svix-signature');
  
  const webhookHandler = new WebhookHandler();
  
  // Verify signature
  const isValid = webhookHandler.verifySignature(
    payload,
    signature,
    'resend'
  );
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }
  
  // Process webhook
  await webhookHandler.handleResendWebhook(payload);
  
  return NextResponse.json({ success: true });
}
```

### handleSESWebhook()

Process a webhook from AWS SES (via SNS).

**Signature:**
```typescript
async handleSESWebhook(payload: SESWebhookPayload): Promise<void>
```

**Example (API Route):**
```typescript
// app/api/webhooks/email/ses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandler } from '@/lib/email/webhook-handler';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  
  const webhookHandler = new WebhookHandler();
  
  // Handle SNS subscription confirmation
  if (payload.Type === 'SubscriptionConfirmation') {
    // Confirm subscription (implementation specific)
    return NextResponse.json({ success: true });
  }
  
  // Process webhook
  await webhookHandler.handleSESWebhook(payload);
  
  return NextResponse.json({ success: true });
}
```

### Event Types

Webhooks track these email events:

```typescript
type EmailEventType =
  | 'sent'        // Email sent to provider
  | 'delivered'   // Email delivered to recipient
  | 'opened'      // Recipient opened email
  | 'clicked'     // Recipient clicked link
  | 'bounced'     // Email bounced
  | 'complained'  // Recipient marked as spam
  | 'failed';     // Email failed to send
```

## Analytics Integration

### AnalyticsService Class

Track and retrieve email analytics.

```typescript
import { AnalyticsService } from '@/lib/services/email-analytics.service';

const analyticsService = new AnalyticsService();
```

### recordEvent()

Record an email event for analytics.

**Signature:**
```typescript
async recordEvent(emailId: string, event: EmailEvent): Promise<void>
```

**Parameters:**
```typescript
interface EmailEvent {
  type: EmailEventType;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**Example:**
```typescript
await analyticsService.recordEvent('email-log-id-123', {
  type: 'opened',
  timestamp: new Date(),
  metadata: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});
```

### getTemplateAnalytics()

Get analytics for a specific template.

**Signature:**
```typescript
async getTemplateAnalytics(
  templateId: string,
  dateRange: DateRange
): Promise<TemplateAnalytics>
```

**Returns:**
```typescript
interface TemplateAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  openRate: number;      // Percentage
  clickRate: number;     // Percentage
  bounceRate: number;    // Percentage
}
```

**Example:**
```typescript
const analytics = await analyticsService.getTemplateAnalytics(
  'purchase-confirmation',
  {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31')
  }
);

console.log(`Open rate: ${analytics.openRate}%`);
console.log(`Click rate: ${analytics.clickRate}%`);
```

## Testing

### Unit Testing Email Service

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EmailService } from '@/lib/services/email.service';

describe('EmailService', () => {
  it('should send transactional email', async () => {
    const emailService = new EmailService();
    
    const result = await emailService.sendTransactionalEmail({
      templateId: 'test-template',
      to: 'test@example.com',
      variables: { name: 'Test User' }
    });
    
    expect(result.status).toBe('queued');
    expect(result.id).toBeDefined();
  });
  
  it('should validate required variables', async () => {
    const emailService = new EmailService();
    
    await expect(
      emailService.sendTransactionalEmail({
        templateId: 'purchase-confirmation',
        to: 'test@example.com',
        variables: {} // Missing required variables
      })
    ).rejects.toThrow('Missing required variables');
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { EmailService } from '@/lib/services/email.service';
import { QueueManager } from '@/lib/email/queue-manager';

describe('Email Integration', () => {
  it('should queue and process email', async () => {
    const emailService = new EmailService();
    const queueManager = new QueueManager();
    
    // Send email
    const result = await emailService.sendTransactionalEmail({
      templateId: 'test-template',
      to: 'test@example.com',
      variables: { name: 'Test' }
    });
    
    // Process queue
    const processResults = await queueManager.processBatch(1);
    
    expect(processResults[0].status).toBe('sent');
  });
});
```

### Testing with Mock Provider

```typescript
import { vi } from 'vitest';
import { EmailProviderService } from '@/lib/services/email-provider.service';

// Mock provider for testing
const mockProvider = {
  name: 'resend',
  sendEmail: vi.fn().mockResolvedValue({
    id: 'mock-id',
    status: 'sent'
  }),
  sendBatch: vi.fn(),
  verifySender: vi.fn(),
  getVerificationStatus: vi.fn(),
  getDomainRecords: vi.fn()
};

// Use in tests
vi.mock('@/lib/services/email-provider.service', () => ({
  EmailProviderService: vi.fn(() => ({
    getActiveProvider: vi.fn().mockResolvedValue(mockProvider)
  }))
}));
```

## Best Practices

### Error Handling

Always handle email sending errors gracefully:

```typescript
try {
  const result = await emailService.sendTransactionalEmail({
    templateId: 'purchase-confirmation',
    to: 'customer@example.com',
    variables: { /* ... */ }
  });
  
  if (result.status === 'failed') {
    // Log error but don't block user flow
    console.error('Email failed:', result.error);
    // Maybe queue for manual review
  }
} catch (error) {
  // Log error but don't crash
  console.error('Email service error:', error);
  // Continue with application flow
}
```

### Variable Validation

Always validate variables before sending:

```typescript
const requiredVariables = [
  'buyerName',
  'galleryName',
  'photoCount',
  'amountPaid',
  'accessLink'
];

const missingVariables = requiredVariables.filter(
  key => !variables[key]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required variables: ${missingVariables.join(', ')}`
  );
}
```

### Rate Limiting

Implement rate limiting for bulk sends:

```typescript
async function sendBulkEmails(recipients: string[]) {
  const batchSize = 10;
  const delayMs = 1000; // 1 second between batches
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(recipient =>
        emailService.sendMarketingEmail({
          templateId: 'newsletter',
          to: recipient,
          variables: { /* ... */ }
        })
      )
    );
    
    // Wait before next batch
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
```

### Logging

Log all email operations for debugging:

```typescript
import { logger } from '@/lib/logger';

async function sendEmail(params: SendEmailParams) {
  logger.info('Sending email', {
    templateId: params.templateId,
    to: params.to,
    timestamp: new Date().toISOString()
  });
  
  try {
    const result = await emailService.sendTransactionalEmail(params);
    
    logger.info('Email queued', {
      emailId: result.id,
      status: result.status
    });
    
    return result;
  } catch (error) {
    logger.error('Email failed', {
      error: error.message,
      templateId: params.templateId,
      to: params.to
    });
    
    throw error;
  }
}
```

### Performance Optimization

Cache frequently used templates:

```typescript
import { LRUCache } from 'lru-cache';

const templateCache = new LRUCache<string, RenderedEmail>({
  max: 100,
  ttl: 1000 * 60 * 60 // 1 hour
});

async function renderTemplate(
  templateId: string,
  variables: Record<string, any>
): Promise<RenderedEmail> {
  const cacheKey = `${templateId}:${JSON.stringify(variables)}`;
  
  const cached = templateCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const rendered = await templateEngine.renderCustomTemplate(
    templateId,
    variables
  );
  
  templateCache.set(cacheKey, rendered);
  
  return rendered;
}
```

### Security

Never expose sensitive data in email logs:

```typescript
function sanitizeVariables(variables: Record<string, any>) {
  const sanitized = { ...variables };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'apiKey',
    'token',
    'creditCard',
    'ssn'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Use when logging
logger.info('Sending email', {
  templateId: params.templateId,
  variables: sanitizeVariables(params.variables)
});
```

## API Reference

### Complete Type Definitions

```typescript
// Email sending
interface SendEmailParams {
  templateId: string;
  to: string | string[];
  variables: Record<string, any>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
}

interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailResult {
  id: string;
  status: 'queued' | 'sent' | 'failed';
  error?: string;
}

// Template rendering
interface RenderedEmail {
  html: string;
  text: string;
  subject: string;
}

// Queue management
interface QueuedEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  type: 'transactional' | 'marketing';
}

interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  scheduled: number;
  sentToday: number;
}

// Analytics
interface TemplateAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

// Events
type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

interface EmailEvent {
  type: EmailEventType;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## Support

For developer support:

- **Documentation**: Check this guide and other docs
- **API Reference**: See type definitions above
- **Code Examples**: Check `/examples` directory
- **Support**: Email dev-support@piksend.com
- **Issues**: Report bugs on GitHub

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- Resend and AWS SES support
- Template engine with React Email
- Queue management with retry logic
- Webhook handling
- Analytics tracking
