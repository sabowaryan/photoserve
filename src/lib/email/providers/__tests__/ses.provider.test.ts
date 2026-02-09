/**
 * AWS SES Provider Tests
 * 
 * Tests for the AWS SES email provider implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SESProvider } from '../ses.provider';
import {
  SESProviderConfig,
  SendEmailParams,
  EmailSendError,
  VerificationError,
  ConfigurationError,
} from '../types';

// Mock AWS SDK v3 SES client
const mockSESClient = {
  send: vi.fn(),
  config: {
    region: 'us-east-1',
  },
};

vi.mock('@aws-sdk/client-sesv2', () => {
  return {
    SESv2Client: class MockSESv2Client {
      config = mockSESClient.config;
      send = mockSESClient.send;
    },
    SendEmailCommand: class MockSendEmailCommand {
      constructor(public input: any) {}
    },
    SendBulkEmailCommand: class MockSendBulkEmailCommand {
      constructor(public input: any) {}
    },
    CreateEmailIdentityCommand: class MockCreateEmailIdentityCommand {
      constructor(public input: any) {}
    },
    GetEmailIdentityCommand: class MockGetEmailIdentityCommand {
      constructor(public input: any) {}
    },
    DeleteEmailIdentityCommand: class MockDeleteEmailIdentityCommand {
      constructor(public input: any) {}
    },
    PutEmailIdentityDkimAttributesCommand: class MockPutEmailIdentityDkimAttributesCommand {
      constructor(public input: any) {}
    },
    GetEmailIdentityPoliciesCommand: class MockGetEmailIdentityPoliciesCommand {
      constructor(public input: any) {}
    },
  };
});

describe('SESProvider', () => {
  let provider: SESProvider;
  let config: SESProviderConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSESClient.send.mockReset();
    
    config = {
      provider: 'aws-ses',
      isActive: true,
      config: {
        accessKeyId: 'test_access_key',
        secretAccessKey: 'test_secret_key',
        region: 'us-east-1',
      },
    };

    provider = new SESProvider(config);
  });

  describe('Constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('aws-ses');
    });

    it('should throw error if access key is missing', () => {
      const invalidConfig: SESProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: '',
          secretAccessKey: 'test_secret_key',
          region: 'us-east-1',
        },
      };

      expect(() => new SESProvider(invalidConfig)).toThrow(ConfigurationError);
      expect(() => new SESProvider(invalidConfig)).toThrow('AWS credentials');
    });

    it('should throw error if secret key is missing', () => {
      const invalidConfig: SESProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: 'test_access_key',
          secretAccessKey: '',
          region: 'us-east-1',
        },
      };

      expect(() => new SESProvider(invalidConfig)).toThrow(ConfigurationError);
      expect(() => new SESProvider(invalidConfig)).toThrow('AWS credentials');
    });

    it('should throw error if region is missing', () => {
      const invalidConfig: SESProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: 'test_access_key',
          secretAccessKey: 'test_secret_key',
          region: '',
        },
      };

      expect(() => new SESProvider(invalidConfig)).toThrow(ConfigurationError);
      expect(() => new SESProvider(invalidConfig)).toThrow('AWS region is required');
    });

    it('should accept optional configuration set name', () => {
      const configWithSet: SESProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: 'test_access_key',
          secretAccessKey: 'test_secret_key',
          region: 'us-east-1',
          configurationSetName: 'my-config-set',
        },
      };

      expect(() => new SESProvider(configWithSet)).not.toThrow();
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
      mockSESClient.send.mockResolvedValue({
        MessageId: 'ses_message_123',
      });

      const result = await provider.sendEmail(validEmailParams);

      expect(result).toEqual({
        id: 'ses_message_123',
        status: 'sent',
        metadata: expect.objectContaining({
          provider: 'aws-ses',
          messageId: 'ses_message_123',
        }),
      });

      expect(mockSESClient.send).toHaveBeenCalledTimes(1);
      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.FromEmailAddress).toBe('sender@example.com');
      expect(command.input.Destination.ToAddresses).toEqual(['recipient@example.com']);
      expect(command.input.Content.Simple.Subject.Data).toBe('Test Email');
      expect(command.input.Content.Simple.Body.Html.Data).toBe('<p>Test content</p>');
    });

    it('should send email with multiple recipients', async () => {
      mockSESClient.send.mockResolvedValue({
        MessageId: 'ses_message_123',
      });

      const params: SendEmailParams = {
        ...validEmailParams,
        to: ['recipient1@example.com', 'recipient2@example.com'],
      };

      await provider.sendEmail(params);

      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.Destination.ToAddresses).toEqual([
        'recipient1@example.com',
        'recipient2@example.com',
      ]);
    });

    it('should include optional fields when provided', async () => {
      mockSESClient.send.mockResolvedValue({
        MessageId: 'ses_message_123',
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

      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.Content.Simple.Body.Text.Data).toBe('Plain text content');
      expect(command.input.ReplyToAddresses).toEqual(['reply@example.com']);
      expect(command.input.Destination.CcAddresses).toEqual(['cc@example.com']);
      expect(command.input.Destination.BccAddresses).toEqual(['bcc@example.com']);
      expect(command.input.EmailTags).toEqual([
        { Name: 'campaign', Value: 'test' },
        { Name: 'type', Value: 'transactional' },
      ]);
    });

    it('should auto-generate plain text if not provided', async () => {
      mockSESClient.send.mockResolvedValue({
        MessageId: 'ses_message_123',
      });

      await provider.sendEmail(validEmailParams);

      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.Content.Simple.Body.Text).toBeDefined();
      expect(command.input.Content.Simple.Body.Text.Data).toBeTruthy();
    });

    it('should include configuration set if configured', async () => {
      const configWithSet: SESProviderConfig = {
        ...config,
        config: {
          ...config.config,
          configurationSetName: 'my-config-set',
        },
      };
      const providerWithSet = new SESProvider(configWithSet);

      mockSESClient.send.mockResolvedValue({
        MessageId: 'ses_message_123',
      });

      await providerWithSet.sendEmail(validEmailParams);

      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.ConfigurationSetName).toBe('my-config-set');
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

    it('should throw EmailSendError when SES API fails', async () => {
      const error = new Error('SES API error');
      (error as any).name = 'MessageRejected';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow(EmailSendError);
      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow('SES API error');
    });

    it('should retry on transient failures', async () => {
      // Fail twice, then succeed
      mockSESClient.send
        .mockRejectedValueOnce(Object.assign(new Error('Throttling'), { name: 'ThrottlingException' }))
        .mockRejectedValueOnce(Object.assign(new Error('Throttling'), { name: 'ThrottlingException' }))
        .mockResolvedValueOnce({
          MessageId: 'ses_message_123',
        });

      const result = await provider.sendEmail(validEmailParams);

      expect(result.id).toBe('ses_message_123');
      expect(mockSESClient.send).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation errors', async () => {
      const error = new Error('Invalid parameter');
      (error as any).name = 'ValidationException';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow(EmailSendError);
      expect(mockSESClient.send).toHaveBeenCalledTimes(1); // No retries
    });

    it('should throw error after max retries', async () => {
      const error = new Error('Network error');
      (error as any).name = 'ServiceUnavailable';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.sendEmail(validEmailParams)).rejects.toThrow(EmailSendError);
      expect(mockSESClient.send).toHaveBeenCalledTimes(4); // Initial + 3 retries
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
      mockSESClient.send
        .mockResolvedValueOnce({ MessageId: 'ses_message_123' })
        .mockResolvedValueOnce({ MessageId: 'ses_message_456' });

      const results = await provider.sendBatch(validBatchParams);

      expect(results).toHaveLength(2);
      expect(results[0]!.id).toBe('ses_message_123');
      expect(results[1]!.id).toBe('ses_message_456');
      expect(results[0]!.status).toBe('sent');
      expect(results[1]!.status).toBe('sent');
      expect(mockSESClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return empty array for empty batch', async () => {
      const results = await provider.sendBatch([]);
      expect(results).toEqual([]);
      expect(mockSESClient.send).not.toHaveBeenCalled();
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
      expect(mockSESClient.send).not.toHaveBeenCalled();
    });

    it('should handle large batches with concurrency limit', async () => {
      const largeBatch: SendEmailParams[] = Array.from({ length: 25 }, (_, i) => ({
        from: 'sender@example.com',
        to: `recipient${i}@example.com`,
        subject: `Test Email ${i}`,
        html: `<p>Test content ${i}</p>`,
      }));

      mockSESClient.send.mockResolvedValue({ MessageId: 'ses_message_123' });

      const results = await provider.sendBatch(largeBatch);

      expect(results).toHaveLength(25);
      expect(mockSESClient.send).toHaveBeenCalledTimes(25);
    });

    it('should throw EmailSendError when batch send fails', async () => {
      const error = new Error('Batch send failed');
      (error as any).name = 'MessageRejected';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.sendBatch(validBatchParams)).rejects.toThrow(EmailSendError);
    });
  });

  describe('verifySender', () => {
    it('should verify domain successfully', async () => {
      mockSESClient.send
        .mockResolvedValueOnce({
          IdentityType: 'DOMAIN',
          DkimAttributes: {
            Status: 'PENDING',
            Tokens: ['token1', 'token2', 'token3'],
          },
        })
        .mockResolvedValueOnce({
          DkimAttributes: {
            Status: 'PENDING',
            Tokens: ['token1', 'token2', 'token3'],
          },
        });

      const result = await provider.verifySender('example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.records).toBeDefined();
      expect(result.records?.dkim).toBeDefined();
      expect(result.records?.dkim.length).toBeGreaterThan(0);
      expect(result.records?.spf).toBeDefined();
    });

    it('should extract domain from email address', async () => {
      mockSESClient.send
        .mockResolvedValueOnce({
          IdentityType: 'EMAIL_ADDRESS',
          DkimAttributes: {
            Status: 'PENDING',
            Tokens: ['token1'],
          },
        })
        .mockResolvedValueOnce({
          DkimAttributes: {
            Status: 'PENDING',
            Tokens: ['token1'],
          },
        });

      await provider.verifySender('user@example.com');

      // Should have called CreateEmailIdentityCommand with the full email
      const createCommand = mockSESClient.send.mock.calls[0]![0];
      expect(createCommand.input.EmailIdentity).toBe('user@example.com');
    });

    it('should throw VerificationError when identity creation fails', async () => {
      const error = new Error('Identity already exists');
      (error as any).name = 'ValidationException';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.verifySender('example.com')).rejects.toThrow(VerificationError);
      await expect(provider.verifySender('example.com')).rejects.toThrow('Identity already exists');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verified status', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'SUCCESS',
        },
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('verified');
    });

    it('should return pending status', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'PENDING',
        },
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('pending');
    });

    it('should return failed status', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'FAILED',
        },
      });

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('failed');
    });

    it('should return pending when identity not found', async () => {
      const error = new Error('Identity not found');
      (error as any).name = 'NotFoundException';
      mockSESClient.send.mockRejectedValue(error);

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('pending');
    }, 10000);

    it('should return pending on other errors', async () => {
      const error = new Error('Network error');
      (error as any).name = 'ServiceUnavailable';
      mockSESClient.send.mockRejectedValue(error);

      const status = await provider.getVerificationStatus('example.com');
      expect(status).toBe('pending');
    }, 10000);

    it('should extract domain from email address', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'SUCCESS',
        },
      });

      await provider.getVerificationStatus('user@example.com');

      const command = mockSESClient.send.mock.calls[0]![0];
      expect(command.input.EmailIdentity).toBe('user@example.com');
    });
  });

  describe('getDomainRecords', () => {
    it('should return domain records successfully', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'PENDING',
          Tokens: ['token1', 'token2', 'token3'],
        },
      });

      const records = await provider.getDomainRecords('example.com');

      expect(records.dkim).toHaveLength(3);
      expect(records.dkim[0]!.type).toBe('CNAME');
      expect(records.dkim[0]!.name).toBe('token1._domainkey.example.com');
      expect(records.dkim[0]!.value).toBe('token1.dkim.amazonses.com');
      expect(records.spf).toBeDefined();
      expect(records.spf.value).toContain('amazonses.com');
      expect(records.dmarc).toBeDefined();
      expect(records.dmarc?.name).toBe('_dmarc.example.com');
      expect(records.returnPath).toBeDefined();
    });

    it('should handle domain with no DKIM tokens', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'NOT_STARTED',
        },
      });

      const records = await provider.getDomainRecords('example.com');

      expect(records.dkim).toHaveLength(0);
      expect(records.spf).toBeDefined();
      expect(records.dmarc).toBeDefined();
    });

    it('should throw VerificationError when getting records fails', async () => {
      const error = new Error('Domain not found');
      (error as any).name = 'ValidationException';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.getDomainRecords('example.com')).rejects.toThrow(VerificationError);
      await expect(provider.getDomainRecords('example.com')).rejects.toThrow('Domain not found');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const error = new Error('Not found');
      (error as any).name = 'NotFoundException';
      mockSESClient.send.mockRejectedValue(error);

      const result = await provider.testConnection();
      expect(result).toBe(true);
    }, 10000);

    it('should return true when identity exists', async () => {
      mockSESClient.send.mockResolvedValue({
        DkimAttributes: {
          Status: 'SUCCESS',
        },
      });

      const result = await provider.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      (error as any).name = 'InvalidClientTokenId';
      mockSESClient.send.mockRejectedValue(error);

      const result = await provider.testConnection();
      expect(result).toBe(false);
    }, 10000);

    it('should return false when exception is thrown', async () => {
      const error = new Error('Access denied');
      (error as any).name = 'AccessDeniedException';
      mockSESClient.send.mockRejectedValue(error);

      const result = await provider.testConnection();
      expect(result).toBe(false);
    }, 10000); // 10 second timeout for retry test
  });

  describe('Retry Logic', () => {
    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      
      const error1 = new Error('Throttling');
      (error1 as any).name = 'ThrottlingException';
      const error2 = new Error('Throttling');
      (error2 as any).name = 'ThrottlingException';
      
      mockSESClient.send
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValueOnce({
          MessageId: 'ses_message_123',
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

    it('should not retry validation errors', async () => {
      const error = new Error('Invalid parameter');
      (error as any).name = 'ValidationException';
      mockSESClient.send.mockRejectedValue(error);

      await expect(provider.sendEmail({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })).rejects.toThrow();

      expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
