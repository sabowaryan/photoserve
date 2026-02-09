/**
 * Email Provider Types and Interfaces
 * 
 * This module defines the core types and interfaces for the email provider abstraction layer.
 * It supports multiple email providers (Resend, AWS SES) through a unified interface.
 * 
 * Requirements: 2.1, 2.4
 */

// ============================================================================
// Core Provider Types
// ============================================================================

/**
 * Supported email provider names
 */
export type EmailProviderName = 'resend' | 'aws-ses';

/**
 * Email delivery status
 */
export type EmailStatus = 
  | 'queued'      // Email is in the queue waiting to be sent
  | 'sent'        // Email has been sent to the provider
  | 'delivered'   // Email was successfully delivered
  | 'opened'      // Email was opened by recipient
  | 'clicked'     // Link in email was clicked
  | 'bounced'     // Email bounced (hard or soft)
  | 'complained'  // Recipient marked as spam
  | 'failed';     // Email failed to send

/**
 * Email priority levels for queue processing
 */
export type EmailPriority = 'high' | 'normal' | 'low';

/**
 * Email type classification
 */
export type EmailType = 'transactional' | 'marketing';

/**
 * Bounce type classification
 */
export type BounceType = 'hard' | 'soft';

/**
 * Verification status for sender addresses
 */
export type VerificationStatus = 
  | 'pending'     // Verification initiated but not complete
  | 'verified'    // Successfully verified
  | 'failed'      // Verification failed
  | 'expired';    // Verification expired

// ============================================================================
// Email Attachment Types
// ============================================================================

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename of the attachment */
  filename: string;
  
  /** Content of the attachment (base64 encoded or buffer) */
  content: string | Buffer;
  
  /** MIME type of the attachment */
  contentType?: string;
  
  /** Content disposition (inline or attachment) */
  disposition?: 'inline' | 'attachment';
  
  /** Content ID for inline attachments */
  contentId?: string;
}

// ============================================================================
// Email Sending Types
// ============================================================================

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  /** Sender email address (must be verified) */
  from: string;
  
  /** Recipient email address(es) */
  to: string | string[];
  
  /** Email subject line */
  subject: string;
  
  /** HTML content of the email */
  html: string;
  
  /** Plain text version of the email (optional, will be auto-generated if not provided) */
  text?: string;
  
  /** Reply-to email address */
  replyTo?: string;
  
  /** CC recipients */
  cc?: string[];
  
  /** BCC recipients */
  bcc?: string[];
  
  /** Email attachments */
  attachments?: EmailAttachment[];
  
  /** Custom tags/metadata for tracking */
  tags?: Record<string, string>;
  
  /** Scheduled send time (for delayed sending) */
  scheduledAt?: Date;
  
  /** Email priority (affects queue processing order) */
  priority?: EmailPriority;
  
  /** Email type (transactional or marketing) */
  type?: EmailType;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  /** Unique identifier for the email (provider-specific) */
  id: string;
  
  /** Current status of the email */
  status: EmailStatus;
  
  /** Error message if sending failed */
  error?: string;
  
  /** Additional metadata from the provider */
  metadata?: Record<string, any>;
}

// ============================================================================
// Domain Verification Types
// ============================================================================

/**
 * DNS record for domain verification
 */
export interface DnsRecord {
  /** Record type (TXT, CNAME, MX) */
  type: 'TXT' | 'CNAME' | 'MX';
  
  /** Record name/host */
  name: string;
  
  /** Record value */
  value: string;
  
  /** TTL (time to live) in seconds */
  ttl?: number;
  
  /** Priority (for MX records) */
  priority?: number;
}

/**
 * Domain records for email authentication
 */
export interface DomainRecords {
  /** DKIM records for email signing */
  dkim: DnsRecord[];
  
  /** SPF record for sender authentication */
  spf: DnsRecord;
  
  /** DMARC record for email policy */
  dmarc?: DnsRecord;
  
  /** Return-path/bounce domain record */
  returnPath?: DnsRecord;
  
  /** Additional provider-specific records */
  custom?: DnsRecord[];
}

/**
 * Result of domain/sender verification
 */
export interface VerificationResult {
  /** Whether verification was successful */
  success: boolean;
  
  /** Current verification status */
  status: VerificationStatus;
  
  /** Error message if verification failed */
  error?: string;
  
  /** DNS records that need to be added */
  records?: DomainRecords;
  
  /** Verification token (if applicable) */
  token?: string;
  
  /** Additional verification metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Provider Configuration Types
// ============================================================================

/**
 * Base provider configuration
 */
export interface BaseProviderConfig {
  /** Provider name */
  provider: EmailProviderName;
  
  /** Whether this provider is currently active */
  isActive: boolean;
  
  /** Provider-specific configuration */
  config: Record<string, any>;
}

/**
 * Resend provider configuration
 */
export interface ResendProviderConfig extends BaseProviderConfig {
  provider: 'resend';
  config: {
    /** Resend API key */
    apiKey: string;
    
    /** Optional webhook secret for signature verification */
    webhookSecret?: string;
  };
}

/**
 * AWS SES provider configuration
 */
export interface SESProviderConfig extends BaseProviderConfig {
  provider: 'aws-ses';
  config: {
    /** AWS access key ID */
    accessKeyId: string;
    
    /** AWS secret access key */
    secretAccessKey: string;
    
    /** AWS region (e.g., us-east-1) */
    region: string;
    
    /** Optional configuration set name for tracking */
    configurationSetName?: string;
  };
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig = ResendProviderConfig | SESProviderConfig;

// ============================================================================
// Email Provider Interface
// ============================================================================

/**
 * Email provider interface
 * 
 * All email providers must implement this interface to ensure consistent behavior
 * across different email services (Resend, AWS SES, etc.)
 */
export interface EmailProvider {
  /** Provider name */
  readonly name: EmailProviderName;
  
  /**
   * Send a single email
   * 
   * @param params - Email parameters
   * @returns Promise resolving to send result
   */
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  
  /**
   * Send multiple emails in batch
   * 
   * @param emails - Array of email parameters
   * @returns Promise resolving to array of send results
   */
  sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]>;
  
  /**
   * Verify a sender email address or domain
   * 
   * @param email - Email address or domain to verify
   * @returns Promise resolving to verification result
   */
  verifySender(email: string): Promise<VerificationResult>;
  
  /**
   * Get verification status for a sender
   * 
   * @param email - Email address or domain to check
   * @returns Promise resolving to verification status
   */
  getVerificationStatus(email: string): Promise<VerificationStatus>;
  
  /**
   * Get DNS records needed for domain verification
   * 
   * @param domain - Domain to get records for
   * @returns Promise resolving to domain records
   */
  getDomainRecords(domain: string): Promise<DomainRecords>;
  
  /**
   * Test provider connection and credentials
   * 
   * @returns Promise resolving to true if connection is successful
   */
  testConnection(): Promise<boolean>;
}

// ============================================================================
// Base Email Provider Class
// ============================================================================

/**
 * Base email provider class with common functionality
 * 
 * This abstract class provides common utilities and validation logic
 * that can be shared across all provider implementations.
 */
export abstract class BaseEmailProvider implements EmailProvider {
  abstract readonly name: EmailProviderName;
  
  protected config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = config;
  }
  
  /**
   * Validate email address format
   */
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate email parameters before sending
   */
  protected validateSendParams(params: SendEmailParams): void {
    if (!params.from || !this.validateEmail(params.from)) {
      throw new Error('Invalid sender email address');
    }
    
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    if (recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }
    
    for (const recipient of recipients) {
      if (!this.validateEmail(recipient)) {
        throw new Error(`Invalid recipient email address: ${recipient}`);
      }
    }
    
    if (!params.subject || params.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }
    
    if (!params.html || params.html.trim().length === 0) {
      throw new Error('Email HTML content is required');
    }
    
    // Validate CC addresses
    if (params.cc) {
      for (const cc of params.cc) {
        if (!this.validateEmail(cc)) {
          throw new Error(`Invalid CC email address: ${cc}`);
        }
      }
    }
    
    // Validate BCC addresses
    if (params.bcc) {
      for (const bcc of params.bcc) {
        if (!this.validateEmail(bcc)) {
          throw new Error(`Invalid BCC email address: ${bcc}`);
        }
      }
    }
    
    // Validate reply-to address
    if (params.replyTo && !this.validateEmail(params.replyTo)) {
      throw new Error('Invalid reply-to email address');
    }
  }
  
  /**
   * Extract domain from email address
   */
  protected extractDomain(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) {
      throw new Error('Invalid email address format');
    }
    return parts[1].toLowerCase();
  }
  
  /**
   * Normalize email address (lowercase, trim)
   */
  protected normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
  
  /**
   * Convert HTML to plain text (basic implementation)
   * Providers can override this for better conversion
   */
  protected htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Abstract methods that must be implemented by concrete providers
  abstract sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  abstract sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]>;
  abstract verifySender(email: string): Promise<VerificationResult>;
  abstract getVerificationStatus(email: string): Promise<VerificationStatus>;
  abstract getDomainRecords(domain: string): Promise<DomainRecords>;
  abstract testConnection(): Promise<boolean>;
}

// ============================================================================
// Provider Factory Types
// ============================================================================

/**
 * Provider factory function type
 */
export type ProviderFactory = (config: ProviderConfig) => EmailProvider;

/**
 * Provider registry for factory pattern
 */
export interface ProviderRegistry {
  [key: string]: ProviderFactory;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for email provider errors
 */
export class EmailProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: EmailProviderName,
    public readonly code?: string,
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailProviderError';
  }
}

/**
 * Error thrown when email sending fails
 */
export class EmailSendError extends EmailProviderError {
  constructor(
    message: string,
    provider: EmailProviderName,
    public readonly emailId?: string,
    code?: string,
    metadata?: Record<string, any>
  ) {
    super(message, provider, code, metadata);
    this.name = 'EmailSendError';
  }
}

/**
 * Error thrown when verification fails
 */
export class VerificationError extends EmailProviderError {
  constructor(
    message: string,
    provider: EmailProviderName,
    public readonly email: string,
    code?: string,
    metadata?: Record<string, any>
  ) {
    super(message, provider, code, metadata);
    this.name = 'VerificationError';
  }
}

/**
 * Error thrown when provider configuration is invalid
 */
export class ConfigurationError extends EmailProviderError {
  constructor(
    message: string,
    provider: EmailProviderName,
    code?: string,
    metadata?: Record<string, any>
  ) {
    super(message, provider, code, metadata);
    this.name = 'ConfigurationError';
  }
}
