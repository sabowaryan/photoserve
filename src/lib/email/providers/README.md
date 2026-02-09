# Email Provider Abstraction Layer

This module provides a unified interface for multiple email service providers (Resend, AWS SES), allowing the application to switch between providers without changing business logic.

## Overview

The email provider abstraction layer consists of:

- **Types and Interfaces**: Core types and the `EmailProvider` interface
- **Base Provider Class**: Common functionality shared across all providers
- **Factory Pattern**: Dynamic provider instantiation and registration
- **Error Classes**: Specialized error types for different failure scenarios

## Requirements

- **Requirement 2.1**: Multi-provider email delivery support
- **Requirement 2.4**: Provider abstraction and configuration

## Architecture

```
┌─────────────────────────────────────┐
│     Application Layer               │
│  (Email Service, Queue Manager)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Email Provider Interface          │
│   (Unified API)                     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│   Resend    │ │   AWS SES   │
│   Provider  │ │   Provider  │
└─────────────┘ └─────────────┘
```

## Core Types

### EmailProvider Interface

All email providers must implement this interface:

```typescript
interface EmailProvider {
  readonly name: EmailProviderName;
  
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]>;
  verifySender(email: string): Promise<VerificationResult>;
  getVerificationStatus(email: string): Promise<VerificationStatus>;
  getDomainRecords(domain: string): Promise<DomainRecords>;
  testConnection(): Promise<boolean>;
}
```

### SendEmailParams

Parameters for sending an email:

```typescript
interface SendEmailParams {
  from: string;                    // Sender email (must be verified)
  to: string | string[];           // Recipient(s)
  subject: string;                 // Email subject
  html: string;                    // HTML content
  text?: string;                   // Plain text (auto-generated if omitted)
  replyTo?: string;                // Reply-to address
  cc?: string[];                   // CC recipients
  bcc?: string[];                  // BCC recipients
  attachments?: EmailAttachment[]; // File attachments
  tags?: Record<string, string>;   // Tracking metadata
  scheduledAt?: Date;              // Delayed sending
  priority?: EmailPriority;        // Queue priority
  type?: EmailType;                // transactional | marketing
}
```

### SendEmailResult

Result of sending an email:

```typescript
interface SendEmailResult {
  id: string;                      // Provider-specific message ID
  status: EmailStatus;             // Current status
  error?: string;                  // Error message if failed
  metadata?: Record<string, any>;  // Additional provider data
}
```

## BaseEmailProvider Class

The `BaseEmailProvider` abstract class provides common functionality:

### Validation Methods

- `validateEmail(email: string)`: Validates email address format
- `validateSendParams(params: SendEmailParams)`: Validates all send parameters
- `extractDomain(email: string)`: Extracts domain from email address
- `normalizeEmail(email: string)`: Normalizes email (lowercase, trim)
- `htmlToText(html: string)`: Converts HTML to plain text

### Usage Example

```typescript
class MyProvider extends BaseEmailProvider {
  readonly name = 'my-provider' as const;
  
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Validate parameters
    this.validateSendParams(params);
    
    // Normalize sender email
    const from = this.normalizeEmail(params.from);
    
    // Extract domain for verification
    const domain = this.extractDomain(from);
    
    // Send email using provider API
    // ...
  }
  
  // Implement other required methods...
}
```

## Provider Factory

The factory pattern allows dynamic provider instantiation:

### Registering a Provider

```typescript
import { registerProvider } from './factory';

registerProvider('my-provider', (config) => {
  return new MyProvider(config);
});
```

### Creating a Provider Instance

```typescript
import { createEmailProvider } from './factory';

const config: ProviderConfig = {
  provider: 'resend',
  isActive: true,
  config: {
    apiKey: 're_your_api_key',
  },
};

const provider = createEmailProvider(config);
await provider.sendEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hello World</p>',
});
```

### Safe Provider Creation

For production use, use `createEmailProviderSafe` which tests the connection:

```typescript
import { createEmailProviderSafe } from './factory';

const provider = await createEmailProviderSafe(config);
if (!provider) {
  console.error('Failed to create provider');
  return;
}

// Provider is ready to use
await provider.sendEmail(...);
```

## Configuration

### Resend Configuration

```typescript
const resendConfig: ResendProviderConfig = {
  provider: 'resend',
  isActive: true,
  config: {
    apiKey: 're_your_api_key',        // Required: starts with 're_'
    webhookSecret: 'whsec_...',       // Optional: for webhook verification
  },
};
```

### AWS SES Configuration

```typescript
const sesConfig: SESProviderConfig = {
  provider: 'aws-ses',
  isActive: true,
  config: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',              // e.g., us-east-1, eu-west-1
    configurationSetName: 'my-set',   // Optional: for tracking
  },
};
```

## Error Handling

The module provides specialized error classes:

### EmailProviderError

Base error class for all provider errors:

```typescript
try {
  await provider.sendEmail(params);
} catch (error) {
  if (error instanceof EmailProviderError) {
    console.error(`Provider: ${error.provider}`);
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Metadata:`, error.metadata);
  }
}
```

### EmailSendError

Thrown when email sending fails:

```typescript
catch (error) {
  if (error instanceof EmailSendError) {
    console.error(`Failed to send email ${error.emailId}`);
  }
}
```

### VerificationError

Thrown when sender verification fails:

```typescript
catch (error) {
  if (error instanceof VerificationError) {
    console.error(`Failed to verify ${error.email}`);
  }
}
```

### ConfigurationError

Thrown when provider configuration is invalid:

```typescript
catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Invalid configuration for ${error.provider}`);
  }
}
```

## Domain Verification

Providers support domain verification for sender authentication:

```typescript
// Get DNS records to add
const records = await provider.getDomainRecords('example.com');

console.log('Add these DNS records:');
console.log('DKIM:', records.dkim);
console.log('SPF:', records.spf);
console.log('DMARC:', records.dmarc);

// Verify sender after adding records
const result = await provider.verifySender('sender@example.com');
if (result.success) {
  console.log('Sender verified!');
} else {
  console.error('Verification failed:', result.error);
}

// Check verification status
const status = await provider.getVerificationStatus('sender@example.com');
console.log('Status:', status); // 'pending' | 'verified' | 'failed' | 'expired'
```

## Testing

The module includes comprehensive tests:

```bash
# Run all provider tests
npm test -- src/lib/email/providers/__tests__

# Run specific test file
npm test -- src/lib/email/providers/__tests__/types.test.ts
npm test -- src/lib/email/providers/__tests__/factory.test.ts
```

## Best Practices

### 1. Always Validate Parameters

Use the built-in validation methods:

```typescript
class MyProvider extends BaseEmailProvider {
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Always validate first
    this.validateSendParams(params);
    
    // Then proceed with sending
    // ...
  }
}
```

### 2. Normalize Email Addresses

Always normalize email addresses before using them:

```typescript
const normalizedEmail = this.normalizeEmail(params.from);
```

### 3. Handle Errors Gracefully

Catch and wrap provider-specific errors:

```typescript
try {
  const result = await providerApi.send(email);
  return result;
} catch (error) {
  throw new EmailSendError(
    'Failed to send email',
    this.name,
    emailId,
    'SEND_FAILED',
    { originalError: error }
  );
}
```

### 4. Test Connections

Always test provider connections before using them:

```typescript
const provider = await createEmailProviderSafe(config);
if (!provider) {
  // Handle connection failure
  return;
}
```

### 5. Use Type Guards

Check error types for proper handling:

```typescript
catch (error) {
  if (error instanceof EmailSendError) {
    // Handle send error
  } else if (error instanceof VerificationError) {
    // Handle verification error
  } else if (error instanceof ConfigurationError) {
    // Handle configuration error
  }
}
```

## Next Steps

After implementing the provider interface:

1. **Implement Resend Provider** (Task 5)
   - Create `resend.provider.ts`
   - Implement all interface methods
   - Add Resend-specific error handling

2. **Implement AWS SES Provider** (Task 6)
   - Create `ses.provider.ts`
   - Implement all interface methods
   - Add SES-specific error handling

3. **Create Provider Service** (Task 7)
   - Manage active provider
   - Handle provider switching
   - Store configuration securely

## References

- [Resend API Documentation](https://resend.com/docs)
- [AWS SES API Documentation](https://docs.aws.amazon.com/ses/)
- Design Document: `.kiro/specs/email-management-system/design.md`
- Requirements Document: `.kiro/specs/email-management-system/requirements.md`
