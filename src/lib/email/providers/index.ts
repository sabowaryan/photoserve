/**
 * Email Providers Module
 * 
 * This module provides the email provider abstraction layer, supporting
 * multiple email service providers (Resend, AWS SES) through a unified interface.
 * 
 * Requirements: 2.1, 2.4
 */

// Export all types
export type {
  EmailProviderName,
  EmailStatus,
  EmailPriority,
  EmailType,
  BounceType,
  VerificationStatus,
  EmailAttachment,
  SendEmailParams,
  SendEmailResult,
  DnsRecord,
  DomainRecords,
  VerificationResult,
  BaseProviderConfig,
  ResendProviderConfig,
  SESProviderConfig,
  ProviderConfig,
  EmailProvider,
  ProviderFactory,
  ProviderRegistry,
} from './types';

// Export base class
export { BaseEmailProvider } from './types';

// Export error classes
export {
  EmailProviderError,
  EmailSendError,
  VerificationError,
  ConfigurationError,
} from './types';

// Export factory functions
export {
  registerProvider,
  isProviderRegistered,
  getRegisteredProviders,
  createEmailProvider,
  createEmailProviderSafe,
  unregisterProvider,
  clearProviderRegistry,
} from './factory';
