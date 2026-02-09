/**
 * Resend Email Provider Implementation
 * 
 * This module implements the EmailProvider interface for Resend.
 * It provides email sending, batch operations, and domain verification.
 * 
 * Requirements: 2.1, 2.5, 2.6
 */

import { Resend } from 'resend';
import {
  BaseEmailProvider,
  EmailProviderName,
  SendEmailParams,
  SendEmailResult,
  VerificationResult,
  VerificationStatus,
  DomainRecords,
  ResendProviderConfig,
  EmailSendError,
  VerificationError,
  ConfigurationError,
} from './types';

/**
 * Resend email provider implementation
 * 
 * Provides email sending and domain verification using the Resend API.
 * Includes automatic retry logic with exponential backoff for failed requests.
 */
export class ResendProvider extends BaseEmailProvider {
  readonly name: EmailProviderName = 'resend';
  private client: Resend;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  constructor(config: ResendProviderConfig) {
    super(config);
    
    if (!config.config.apiKey) {
      throw new ConfigurationError(
        'Resend API key is required',
        'resend',
        'MISSING_API_KEY'
      );
    }
    
    this.client = new Resend(config.config.apiKey);
  }

  /**
   * Send a single email via Resend
   * 
   * @param params - Email parameters
   * @returns Promise resolving to send result
   */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Validate parameters
    this.validateSendParams(params);

    try {
      // Prepare email data for Resend
      const emailData: any = {
        from: params.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
      };

      // Add optional fields
      if (params.text) {
        emailData.text = params.text;
      } else {
        // Auto-generate plain text from HTML
        emailData.text = this.htmlToText(params.html);
      }

      if (params.replyTo) {
        emailData.reply_to = params.replyTo;
      }

      if (params.cc && params.cc.length > 0) {
        emailData.cc = params.cc;
      }

      if (params.bcc && params.bcc.length > 0) {
        emailData.bcc = params.bcc;
      }

      if (params.attachments && params.attachments.length > 0) {
        emailData.attachments = params.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
        }));
      }

      if (params.tags) {
        emailData.tags = Object.entries(params.tags).map(([name, value]) => ({
          name,
          value,
        }));
      }

      // Send email with retry logic
      const result = await this.executeWithRetry(async () => {
        return await this.client.emails.send(emailData);
      });

      if (result.error) {
        throw new EmailSendError(
          result.error.message || 'Failed to send email',
          'resend',
          undefined,
          'SEND_FAILED',
          { error: result.error }
        );
      }

      return {
        id: result.data?.id || '',
        status: 'sent',
        metadata: {
          provider: 'resend',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new EmailSendError(
        `Failed to send email: ${errorMessage}`,
        'resend',
        undefined,
        'SEND_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Send multiple emails in batch
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
      // Prepare batch email data
      const batchData = emails.map(params => {
        const emailData: any = {
          from: params.from,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html,
        };

        if (params.text) {
          emailData.text = params.text;
        } else {
          emailData.text = this.htmlToText(params.html);
        }

        if (params.replyTo) {
          emailData.reply_to = params.replyTo;
        }

        if (params.cc && params.cc.length > 0) {
          emailData.cc = params.cc;
        }

        if (params.bcc && params.bcc.length > 0) {
          emailData.bcc = params.bcc;
        }

        if (params.attachments && params.attachments.length > 0) {
          emailData.attachments = params.attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            content_type: att.contentType,
          }));
        }

        if (params.tags) {
          emailData.tags = Object.entries(params.tags).map(([name, value]) => ({
            name,
            value,
          }));
        }

        return emailData;
      });

      // Send batch with retry logic
      const result = await this.executeWithRetry(async () => {
        return await this.client.batch.send(batchData);
      });

      if (result.error) {
        throw new EmailSendError(
          result.error.message || 'Failed to send batch emails',
          'resend',
          undefined,
          'BATCH_SEND_FAILED',
          { error: result.error }
        );
      }

      // Map results - ensure data exists
      const data = result.data;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      return data.map((item: any) => ({
        id: item.id || '',
        status: 'sent' as const,
        metadata: {
          provider: 'resend',
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new EmailSendError(
        `Failed to send batch emails: ${errorMessage}`,
        'resend',
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
      const domain = email.includes('@') ? this.extractDomain(email) : email;

      // Create domain in Resend
      const result = await this.executeWithRetry(async () => {
        return await this.client.domains.create({ name: domain });
      });

      if (result.error) {
        throw new VerificationError(
          result.error.message || 'Failed to initiate domain verification',
          'resend',
          email,
          'VERIFICATION_FAILED',
          { error: result.error }
        );
      }

      // Get DNS records for the domain
      const records = await this.getDomainRecords(domain);

      return {
        success: true,
        status: 'pending',
        records,
        metadata: {
          domainId: result.data?.id,
          provider: 'resend',
        },
      };
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new VerificationError(
        `Failed to verify sender: ${errorMessage}`,
        'resend',
        email,
        'VERIFICATION_FAILED',
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
      const domain = email.includes('@') ? this.extractDomain(email) : email;

      // Get domain details from Resend
      const result = await this.executeWithRetry(async () => {
        return await this.client.domains.get(domain);
      });

      if (result.error) {
        // Domain not found or error - return pending
        return 'pending';
      }

      // Map Resend status to our status
      const resendStatus = result.data?.status;
      
      switch (resendStatus) {
        case 'verified':
          return 'verified';
        case 'not_started':
        case 'pending':
          return 'pending';
        case 'failed':
          return 'failed';
        default:
          return 'pending';
      }
    } catch (error) {
      // On error, return pending status
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
      // Get domain details from Resend
      const result = await this.executeWithRetry(async () => {
        return await this.client.domains.get(domain);
      });

      if (result.error) {
        throw new VerificationError(
          result.error.message || 'Failed to get domain records',
          'resend',
          domain,
          'GET_RECORDS_FAILED',
          { error: result.error }
        );
      }

      const domainData = result.data;
      const records: DomainRecords = {
        dkim: [],
        spf: {
          type: 'TXT',
          name: domain,
          value: 'v=spf1 include:_spf.resend.com ~all',
          ttl: 3600,
        },
      };

      // Add DKIM records if available
      if (domainData?.records) {
        for (const record of domainData.records as any[]) {
          if (record.record_type === 'TXT' && record.name?.includes('_domainkey')) {
            records.dkim.push({
              type: 'TXT',
              name: record.name,
              value: record.value || '',
              ttl: 3600,
            });
          }
        }
      }

      // Add DMARC record
      records.dmarc = {
        type: 'TXT',
        name: `_dmarc.${domain}`,
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@' + domain,
        ttl: 3600,
      };

      return records;
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new VerificationError(
        `Failed to get domain records: ${errorMessage}`,
        'resend',
        domain,
        'GET_RECORDS_FAILED',
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
      // Try to list domains as a connection test
      const result = await this.executeWithRetry(async () => {
        return await this.client.domains.list();
      });

      // If we get a response without error, connection is successful
      return !result.error;
    } catch (error) {
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
