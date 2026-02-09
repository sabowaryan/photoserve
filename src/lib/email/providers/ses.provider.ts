/**
 * AWS SES Email Provider Implementation
 * 
 * This module implements the EmailProvider interface for AWS SES (Simple Email Service).
 * It provides email sending, batch operations, and domain verification using AWS SDK v3.
 * 
 * Requirements: 2.1, 2.5, 2.6
 */

import {
  SESv2Client,
  SendEmailCommand,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
} from '@aws-sdk/client-sesv2';
import {
  BaseEmailProvider,
  EmailProviderName,
  SendEmailParams,
  SendEmailResult,
  VerificationResult,
  VerificationStatus,
  DomainRecords,
  SESProviderConfig,
  EmailSendError,
  VerificationError,
  ConfigurationError,
} from './types';

/**
 * AWS SES email provider implementation
 * 
 * Provides email sending and domain verification using the AWS SES v2 API.
 * Includes automatic retry logic with exponential backoff for failed requests.
 */
export class SESProvider extends BaseEmailProvider {
  readonly name: EmailProviderName = 'aws-ses';
  private client: SESv2Client;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second
  private configurationSetName?: string;

  constructor(config: SESProviderConfig) {
    super(config);
    
    if (!config.config.accessKeyId || !config.config.secretAccessKey) {
      throw new ConfigurationError(
        'AWS credentials (accessKeyId and secretAccessKey) are required',
        'aws-ses',
        'MISSING_CREDENTIALS'
      );
    }
    
    if (!config.config.region) {
      throw new ConfigurationError(
        'AWS region is required',
        'aws-ses',
        'MISSING_REGION'
      );
    }
    
    this.client = new SESv2Client({
      region: config.config.region,
      credentials: {
        accessKeyId: config.config.accessKeyId,
        secretAccessKey: config.config.secretAccessKey,
      },
    });
    
    this.configurationSetName = config.config.configurationSetName;
  }

  /**
   * Send a single email via AWS SES
   * 
   * @param params - Email parameters
   * @returns Promise resolving to send result
   */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Validate parameters
    this.validateSendParams(params);

    try {
      // Prepare email content
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      
      // Build email body
      const emailBody: any = {
        Html: {
          Charset: 'UTF-8',
          Data: params.html,
        },
      };

      // Add plain text version
      if (params.text) {
        emailBody.Text = {
          Charset: 'UTF-8',
          Data: params.text,
        };
      } else {
        // Auto-generate plain text from HTML
        emailBody.Text = {
          Charset: 'UTF-8',
          Data: this.htmlToText(params.html),
        };
      }

      // Build destination
      const destination: any = {
        ToAddresses: recipients,
      };

      if (params.cc && params.cc.length > 0) {
        destination.CcAddresses = params.cc;
      }

      if (params.bcc && params.bcc.length > 0) {
        destination.BccAddresses = params.bcc;
      }

      // Build email content
      const content: any = {
        Simple: {
          Subject: {
            Charset: 'UTF-8',
            Data: params.subject,
          },
          Body: emailBody,
        },
      };

      // Build command input
      const commandInput: any = {
        FromEmailAddress: params.from,
        Destination: destination,
        Content: content,
      };

      // Add reply-to if provided
      if (params.replyTo) {
        commandInput.ReplyToAddresses = [params.replyTo];
      }

      // Add configuration set if configured
      if (this.configurationSetName) {
        commandInput.ConfigurationSetName = this.configurationSetName;
      }

      // Add email tags if provided
      if (params.tags) {
        commandInput.EmailTags = Object.entries(params.tags).map(([Name, Value]) => ({
          Name,
          Value,
        }));
      }

      // Send email with retry logic
      const command = new SendEmailCommand(commandInput);
      const result = await this.executeWithRetry(async () => {
        return await this.client.send(command);
      });

      return {
        id: result.MessageId || '',
        status: 'sent',
        metadata: {
          provider: 'aws-ses',
          timestamp: new Date().toISOString(),
          messageId: result.MessageId,
        },
      };
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.name || 'SEND_FAILED';
      
      throw new EmailSendError(
        `Failed to send email: ${errorMessage}`,
        'aws-ses',
        undefined,
        errorCode,
        { originalError: error }
      );
    }
  }

  /**
   * Send multiple emails in batch using SES bulk operations
   * 
   * @param emails - Array of email parameters
   * @returns Promise resolving to array of send results
   */
  async sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]> {
    if (emails.length === 0) {
      return [];
    }

    // Validate all emails first
    for (const email of emails) {
      this.validateSendParams(email);
    }

    try {
      // For SES bulk email, all emails must have the same sender and template structure
      // We'll use individual sends for flexibility with different content
      // In production, you might want to use SendBulkEmailCommand with templates
      
      const results: SendEmailResult[] = [];
      
      // Send emails in parallel with concurrency limit
      const batchSize = 10; // SES rate limit consideration
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(email => this.sendEmail(email))
        );
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new EmailSendError(
        `Failed to send batch emails: ${errorMessage}`,
        'aws-ses',
        undefined,
        'BATCH_SEND_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Verify a sender email address or domain
   * 
   * @param email - Email address or domain to verify
   * @returns Promise resolving to verification result
   */
  async verifySender(email: string): Promise<VerificationResult> {
    try {
      const isDomain = !email.includes('@');
      const identity = isDomain ? email : email;

      // Create email identity in SES
      const command = new CreateEmailIdentityCommand({
        EmailIdentity: identity,
        DkimSigningAttributes: {
          DomainSigningSelector: 'ses',
        },
      });

      const result = await this.executeWithRetry(async () => {
        return await this.client.send(command);
      });

      // Get DNS records for the identity
      const records = isDomain 
        ? await this.getDomainRecords(identity)
        : await this.getDomainRecords(this.extractDomain(identity));

      return {
        success: true,
        status: 'pending',
        records,
        metadata: {
          identityType: result.IdentityType,
          dkimAttributes: result.DkimAttributes,
          provider: 'aws-ses',
        },
      };
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.name || 'VERIFICATION_FAILED';
      
      throw new VerificationError(
        `Failed to verify sender: ${errorMessage}`,
        'aws-ses',
        email,
        errorCode,
        { originalError: error }
      );
    }
  }

  /**
   * Get verification status for a sender
   * 
   * @param email - Email address or domain to check
   * @returns Promise resolving to verification status
   */
  async getVerificationStatus(email: string): Promise<VerificationStatus> {
    try {
      const isDomain = !email.includes('@');
      const identity = isDomain ? email : email;

      // Get email identity details from SES
      const command = new GetEmailIdentityCommand({
        EmailIdentity: identity,
      });

      const result = await this.executeWithRetry(async () => {
        return await this.client.send(command);
      });

      // Check DKIM status
      const dkimStatus = result.DkimAttributes?.Status;
      
      switch (dkimStatus) {
        case 'SUCCESS':
          return 'verified';
        case 'PENDING':
        case 'TEMPORARY_FAILURE':
          return 'pending';
        case 'FAILED':
        case 'NOT_STARTED':
          return 'failed';
        default:
          return 'pending';
      }
    } catch (error) {
      // If identity doesn't exist, return pending
      const errorCode = (error as any)?.name;
      if (errorCode === 'NotFoundException') {
        return 'pending';
      }
      
      // On other errors, return pending status
      return 'pending';
    }
  }

  /**
   * Get DNS records needed for domain verification
   * 
   * @param domain - Domain to get records for
   * @returns Promise resolving to domain records
   */
  async getDomainRecords(domain: string): Promise<DomainRecords> {
    try {
      // Get email identity details from SES
      const command = new GetEmailIdentityCommand({
        EmailIdentity: domain,
      });

      const result = await this.executeWithRetry(async () => {
        return await this.client.send(command);
      });

      const records: DomainRecords = {
        dkim: [],
        spf: {
          type: 'TXT',
          name: domain,
          value: 'v=spf1 include:amazonses.com ~all',
          ttl: 3600,
        },
      };

      // Add DKIM records if available
      if (result.DkimAttributes?.Tokens) {
        for (const token of result.DkimAttributes.Tokens) {
          records.dkim.push({
            type: 'CNAME',
            name: `${token}._domainkey.${domain}`,
            value: `${token}.dkim.amazonses.com`,
            ttl: 3600,
          });
        }
      }

      // Add DMARC record
      records.dmarc = {
        type: 'TXT',
        name: `_dmarc.${domain}`,
        value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
        ttl: 3600,
      };

      // Add MX record for receiving bounces (optional)
      records.returnPath = {
        type: 'MX',
        name: domain,
        value: `feedback-smtp.${this.client.config.region}.amazonses.com`,
        ttl: 3600,
        priority: 10,
      };

      return records;
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.name || 'GET_RECORDS_FAILED';
      
      throw new VerificationError(
        `Failed to get domain records: ${errorMessage}`,
        'aws-ses',
        domain,
        errorCode,
        { originalError: error }
      );
    }
  }

  /**
   * Test provider connection and credentials
   * 
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get account sending enabled status as a connection test
      // This is a lightweight operation that verifies credentials
      const command = new GetEmailIdentityCommand({
        EmailIdentity: 'test@example.com', // Dummy identity for testing
      });

      await this.executeWithRetry(async () => {
        return await this.client.send(command);
      });

      // If we get here without error, connection is successful
      // Even if the identity doesn't exist, it means credentials are valid
      return true;
    } catch (error) {
      // Check if error is due to invalid credentials
      const errorCode = (error as any)?.name;
      
      // NotFoundException means credentials are valid but identity doesn't exist
      if (errorCode === 'NotFoundException') {
        return true;
      }
      
      // Other errors indicate connection/credential issues
      return false;
    }
  }

  /**
   * Execute a function with exponential backoff retry logic
   * 
   * @param fn - Function to execute
   * @returns Promise resolving to function result
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Check if error is retryable
        const errorCode = (error as any)?.name;
        const nonRetryableErrors = [
          'ValidationException',
          'InvalidParameterException',
          'MessageRejected',
          'MailFromDomainNotVerifiedException',
        ];

        if (nonRetryableErrors.includes(errorCode)) {
          // Don't retry these errors
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    throw lastError || new Error('All retry attempts failed');
  }
}
