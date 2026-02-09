/**
 * Resend Provider Tests
 * 
 * Tests for the Resend email provider implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResendProvider } from '../resend.provider';
import {
  ResendProviderConfig,
  SendEmailParams,
  EmailSendError,
  VerificationError,
  ConfigurationError,
} from '../types';

// Mock Resend SDK
const mockResendInstance = {
  emails: {
    send: vi.fn(),
  },
  batch: {
    send: vi.fn(),
  },
  domains: {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
  },
};

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = mockResendInstance.emails;
      batch = mockResendInstance.batch;
      domains = mockResendInstance.domains;
    },
  };
});

describe('ResendProvider', () => {
  let provider: ResendProvider;
  let config: ResendProviderConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mock functions
    mockResendInstance.emails.send.mockReset();
    mockResendInstance.batch.send.mockReset();
    mockResendInstance.domains.create.mockReset();
    mockResendInstance.domains.get.mockReset();
    mockResendInstance.domains.list.mockReset();
    
    config = {
      provider: 'resend',
      isActive: true,
      config: {
        apiKey: 'test_api_key_12345',
      },
    };

    provider = new ResendProvider(config);
  });

  describe('Constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('resend');
    });

    it('should throw error if API key is missing', () => {
      const invalidConfig: ResendProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: '',
        },
      };

      expect(() => new ResendProvider(invalidConfig)).toThrow(ConfigurationError);
      expect(() => new ResendProvider(invalidConfig)).toThrow('Resend API key is required');
    });
  });

  describe('sendEmail', () => {
    const validEmailParams: SendEmailParams = {
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    };

    it('should send email successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await provider.sendEmail(validEmailParams);

      expect(result).toEqual({
        id: 'email_123',
        status: 'sent',
        metadata: expect.objectContaining({
          provider: 'resend',
        }),
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
          html: '<p>Test content</p>',
        })
      );
    });

    it('should send email with multiple recipients', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const params: SendEmailParams = {
        ...validEmailParams,
        to: ['recipient1@example.com', 'recipient2@example.com'],
      };

      await provider.sendEmail(params);

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        })
      );
    });

    it('should include optional fields when provided', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const params: SendEmailParams = {
        ...validEmailParams,
        text: 'Plain text content',
        replyTo: 'reply@example.com',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        tags: { campaign: 'test', type: 'transactional' },
      };

      await provider.sendEmail(params);

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Plain text content',
          reply_to: 'reply@example.com',
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
          tags: [
            { name: 'campaign', value: 'test' },
            { name: 'type', value: 'transactional' },
          ],
        })
      );
    });

    it('should auto-generate plain text if not provided', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await provider.sendEmail(validEmailParams);

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
        })
      );
    });

    it('should handle attachments', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const params: SendEmailParams = {
        ...validEmailParams,
        attachments: [
          {
            filename: 'test.pdf',
            content: 'base64content',
            contentType: 'application/pdf',
          },
        ],
      };

      await provider.sendEmail(params);

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'test.pdf',
              content: 'base64content',
              content_type: 'application/pdf',
            },
          ],
        })
      );
    });

    it('should throw error for invalid sender email', async () => {
      const params: SendEmailParams = {
        ...validEmailParams,
        from: 'invalid-email',
      };

      await expect(provider.sendEmail(params)).rejects.toThrow('Invalid sender email address');
    });

    it('should throw error for invalid recipient email', async () => {
      const params: SendEmailParams = {
        ...validEmailParams,
        to: 'invalid-email',
      };

      await expect(provider.sendEmail(params)).rejects.toThrow('Invalid recipient email address');
    });

    it('should throw error for empty subject', async () => {
      const params: SendEmailParams = {
        ...validEmailParams,
        subject: '',
      };

      await expect(provider.sendEmail(params)).rejects.toThrow('Email subject is required');
    });

    it('should throw error for empty HTML content', async () => {
      const params: SendEmailParams = {
        ...validEmailParams,
        html: '',
      };

      await expect(provider.sendEmail(params)).rejects.toThrow('Email HTML content is required');
    });

    it('should throw EmailSendError when Resend API returns error', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      });

      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow(EmailSendError);
      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow('API error');
    });

    it('should retry on failure', async () => {
      // Fail twice, then succeed
      mockResendInstance.emails.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { id: 'email_123' },
          error: null,
        });

      const result = await provider.sendEmail(validEmailParams);

      expect(result.id).toBe('email_123');
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockResendInstance.emails.send.mockRejectedValue(new Error('Network error'));

      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow(EmailSendError);
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 10000); // 10 second timeout for retry test
  });

  describe('sendBatch', () => {
    const validBatchParams: SendEmailParams[] = [
      {
        from: 'sender@example.com',
        to: 'recipient1@example.com',
        subject: 'Test Email 1',
        html: '<p>Test content 1</p>',
      },
      {
        from: 'sender@example.com',
        to: 'recipient2@example.com',
        subject: 'Test Email 2',
        html: '<p>Test content 2</p>',
      },
    ];

    it('should send batch emails successfully', async () => {
      mockResendInstance.batch.send.mockResolvedValue({
        data: [
          { id: 'email_123' },
          { id: 'email_456' },
        ],
        error: null,
      });

      const results = await provider.sendBatch(validBatchParams);

      expect(results).toHaveLength(2);
      expect(results[0]!.id).toBe('email_123');
      expect(results[1]!.id).toBe('email_456');
      expect(results[0]!.status).toBe('sent');
      expect(results[1]!.status).toBe('sent');
    });

    it('should return empty array for empty batch', async () => {
      const results = await provider.sendBatch([]);
      expect(results).toEqual([]);
      expect(mockResendInstance.batch.send).not.toHaveBeenCalled();
    });

    it('should validate all emails before sending', async () => {
      const invalidBatch: SendEmailParams[] = [
        {
          from: 'sender@example.com',
          to: 'valid@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        },
        {
          from: 'invalid-email',
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        },
      ];

      await expect(provider.sendBatch(invalidBatch)).rejects.toThrow('Invalid sender email address');
      expect(mockResendInstance.batch.send).not.toHaveBeenCalled();
    });

    it('should throw EmailSendError when batch send fails', async () => {
      mockResendInstance.batch.send.mockResolvedValue({
        data: null,
        error: { message: 'Batch send failed' },
      });

      await expect(provider.sendBatch(validBatchParams)).rejects.toThrow(EmailSendError);
      await expect(provider.sendBatch(validBatchParams)).rejects.toThrow('Batch send failed');
    });
  });

  describe('verifySender', () => {
    it('should verify domain successfully', async () => {
      mockResendInstance.domains.create.mockResolvedValue({
        data: { id: 'domain_123' },
        error: null,
      });

      mockResendInstance.domains.get.mockResolvedValue({
        data: {
          status: 'pending',
          records: [
            {
              record_type: 'TXT',
              name: 'resend._domainkey.example.com',
              value: 'dkim-value',
            },
          ],
        },
        error: null,
      });

      const result = await provider.verifySender('example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.records).toBeDefined();
      expect(result.records?.dkim).toBeDefined();
      expect(result.records?.spf).toBeDefined();
    });

    it('should extract domain from email address', async () => {
      mockResendInstance.domains.create.mockResolvedValue({
        data: { id: 'domain_123' },
        error: null,
      });

      mockResendInstance.domains.get.mockResolvedValue({
        data: { status: 'pending', records: [] },
        error: null,
      });

      await provider.verifySender('user@example.com');

      expect(mockResendInstance.domains.create).toHaveBeenCalledWith({
        name: 'example.com',
      });
    });

    it('should throw VerificationError when domain creation fails', async () => {
      mockResendInstance.domains.create.mockResolvedValue({
        data: null,
        error: { message: 'Domain already exists' },
      });

      await expect(provider.verifySender('example.com')).rejects.toThrow(VerificationError);
      await expect(provider.verifySender('example.com')).rejects.toThrow('Domain already exists');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verified status', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: { status: 'verified' },
        error: null,
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('verified');
    });

    it('should return pending status', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: { status: 'pending' },
        error: null,
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('pending');
    });

    it('should return failed status', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: { status: 'failed' },
        error: null,
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('failed');
    });

    it('should return pending on error', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: null,
        error: { message: 'Domain not found' },
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('pending');
    });

    it('should extract domain from email address', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: { status: 'verified' },
        error: null,
      });

      await provider.getVerificationStatus('user@example.com');

      expect(mockResendInstance.domains.get).toHaveBeenCalledWith('example.com');
    });
  });

  describe('getDomainRecords', () => {
    it('should return domain records successfully', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: {
          records: [
            {
              record_type: 'TXT',
              name: 'resend._domainkey.example.com',
              value: 'dkim-value-1',
            },
            {
              record_type: 'TXT',
              name: 'resend2._domainkey.example.com',
              value: 'dkim-value-2',
            },
          ],
        },
        error: null,
      });

      const records = await provider.getDomainRecords('example.com');

      expect(records.dkim).toHaveLength(2);
      expect(records.dkim[0]!.name).toBe('resend._domainkey.example.com');
      expect(records.dkim[0]!.value).toBe('dkim-value-1');
      expect(records.spf).toBeDefined();
      expect(records.spf.value).toContain('_spf.resend.com');
      expect(records.dmarc).toBeDefined();
      expect(records.dmarc?.name).toBe('_dmarc.example.com');
    });

    it('should handle domain with no records', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: { records: [] },
        error: null,
      });

      const records = await provider.getDomainRecords('example.com');

      expect(records.dkim).toHaveLength(0);
      expect(records.spf).toBeDefined();
      expect(records.dmarc).toBeDefined();
    });

    it('should throw VerificationError when getting records fails', async () => {
      mockResendInstance.domains.get.mockResolvedValue({
        data: null,
        error: { message: 'Domain not found' },
      });

      await expect(provider.getDomainRecords('example.com')).rejects.toThrow(VerificationError);
      await expect(provider.getDomainRecords('example.com')).rejects.toThrow('Domain not found');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockResendInstance.domains.list.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await provider.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockResendInstance.domains.list.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const result = await provider.testConnection();
      expect(result).toBe(false);
    });

    it('should return false when exception is thrown', async () => {
      mockResendInstance.domains.list.mockRejectedValue(new Error('Network error'));

      const result = await provider.testConnection();
      expect(result).toBe(false);
    }, 10000); // 10 second timeout for retry test
  });

  describe('Retry Logic', () => {
    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      
      mockResendInstance.emails.send
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({
          data: { id: 'email_123' },
          error: null,
        });

      await provider.sendEmail({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      const duration = Date.now() - startTime;
      
      // Should have waited at least 1s + 2s = 3s for two retries
      // Using a lower threshold to account for test execution time
      expect(duration).toBeGreaterThanOrEqual(2900);
    });
  });
});
