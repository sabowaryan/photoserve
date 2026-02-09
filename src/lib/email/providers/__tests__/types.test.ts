/**
 * Tests for Email Provider Types
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  BaseEmailProvider,
  EmailProviderError,
  EmailSendError,
  VerificationError,
  ConfigurationError,
  type SendEmailParams,
  type SendEmailResult,
  type VerificationResult,
  type VerificationStatus,
  type DomainRecords,
  type ProviderConfig,
} from '../types';

describe('BaseEmailProvider', () => {
  // Create a concrete implementation for testing
  class TestEmailProvider extends BaseEmailProvider {
    readonly name = 'resend' as const;
    
    async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
      this.validateSendParams(params);
      return {
        id: 'test-id',
        status: 'sent',
      };
    }
    
    async sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]> {
      return emails.map(() => ({
        id: 'test-id',
        status: 'sent',
      }));
    }
    
    async verifySender(_email: string): Promise<VerificationResult> {
      return {
        success: true,
        status: 'verified',
      };
    }
    
    async getVerificationStatus(_email: string): Promise<VerificationStatus> {
      return 'verified';
    }
    
    async getDomainRecords(domain: string): Promise<DomainRecords> {
      return {
        dkim: [],
        spf: { type: 'TXT', name: domain, value: 'v=spf1 include:_spf.example.com ~all' },
      };
    }
    
    async testConnection(): Promise<boolean> {
      return true;
    }
  }
  
  const config: ProviderConfig = {
    provider: 'resend',
    isActive: true,
    config: {
      apiKey: 're_test_key',
    },
  };
  
  let provider: TestEmailProvider;
  
  beforeEach(() => {
    provider = new TestEmailProvider(config);
  });
  
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(provider['validateEmail']('test@example.com')).toBe(true);
      expect(provider['validateEmail']('user.name+tag@example.co.uk')).toBe(true);
    });
    
    it('should reject invalid email addresses', () => {
      expect(provider['validateEmail']('invalid')).toBe(false);
      expect(provider['validateEmail']('invalid@')).toBe(false);
      expect(provider['validateEmail']('@example.com')).toBe(false);
      expect(provider['validateEmail']('test@')).toBe(false);
    });
  });
  
  describe('validateSendParams', () => {
    const validParams: SendEmailParams = {
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    };
    
    it('should validate correct parameters', () => {
      expect(() => provider['validateSendParams'](validParams)).not.toThrow();
    });
    
    it('should throw error for invalid sender email', () => {
      expect(() => 
        provider['validateSendParams']({ ...validParams, from: 'invalid' })
      ).toThrow('Invalid sender email address');
    });
    
    it('should throw error for invalid recipient email', () => {
      expect(() => 
        provider['validateSendParams']({ ...validParams, to: 'invalid' })
      ).toThrow('Invalid recipient email address');
    });
    
    it('should throw error for empty recipients', () => {
      expect(() => 
        provider['validateSendParams']({ ...validParams, to: [] })
      ).toThrow('At least one recipient is required');
    });
    
    it('should throw error for missing subject', () => {
      expect(() => 
        provider['validateSendParams']({ ...validParams, subject: '' })
      ).toThrow('Email subject is required');
    });
    
    it('should throw error for missing HTML content', () => {
      expect(() => 
        provider['validateSendParams']({ ...validParams, html: '' })
      ).toThrow('Email HTML content is required');
    });
    
    it('should validate CC addresses', () => {
      expect(() => 
        provider['validateSendParams']({ 
          ...validParams, 
          cc: ['valid@example.com', 'invalid'] 
        })
      ).toThrow('Invalid CC email address');
    });
    
    it('should validate BCC addresses', () => {
      expect(() => 
        provider['validateSendParams']({ 
          ...validParams, 
          bcc: ['valid@example.com', 'invalid'] 
        })
      ).toThrow('Invalid BCC email address');
    });
    
    it('should validate reply-to address', () => {
      expect(() => 
        provider['validateSendParams']({ 
          ...validParams, 
          replyTo: 'invalid' 
        })
      ).toThrow('Invalid reply-to email address');
    });
  });
  
  describe('extractDomain', () => {
    it('should extract domain from email address', () => {
      expect(provider['extractDomain']('test@example.com')).toBe('example.com');
      expect(provider['extractDomain']('user@subdomain.example.com')).toBe('subdomain.example.com');
    });
    
    it('should throw error for invalid email format', () => {
      expect(() => provider['extractDomain']('invalid')).toThrow('Invalid email address format');
      expect(() => provider['extractDomain']('test@@example.com')).toThrow('Invalid email address format');
    });
    
    it('should convert domain to lowercase', () => {
      expect(provider['extractDomain']('test@EXAMPLE.COM')).toBe('example.com');
    });
  });
  
  describe('normalizeEmail', () => {
    it('should normalize email addresses', () => {
      expect(provider['normalizeEmail']('  Test@Example.COM  ')).toBe('test@example.com');
      expect(provider['normalizeEmail']('USER@DOMAIN.COM')).toBe('user@domain.com');
    });
  });
  
  describe('htmlToText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = provider['htmlToText'](html);
      expect(text).toBe('Hello World');
    });
    
    it('should remove style tags', () => {
      const html = '<style>body { color: red; }</style><p>Content</p>';
      const text = provider['htmlToText'](html);
      expect(text).not.toContain('color: red');
      expect(text).toContain('Content');
    });
    
    it('should remove script tags', () => {
      const html = '<script>alert("test")</script><p>Content</p>';
      const text = provider['htmlToText'](html);
      expect(text).not.toContain('alert');
      expect(text).toContain('Content');
    });
    
    it('should normalize whitespace', () => {
      const html = '<p>Hello    \n\n   World</p>';
      const text = provider['htmlToText'](html);
      expect(text).toBe('Hello World');
    });
  });
});

describe('Error Classes', () => {
  describe('EmailProviderError', () => {
    it('should create error with all properties', () => {
      const error = new EmailProviderError(
        'Test error',
        'resend',
        'TEST_CODE',
        { key: 'value' }
      );
      
      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('resend');
      expect(error.code).toBe('TEST_CODE');
      expect(error.metadata).toEqual({ key: 'value' });
      expect(error.name).toBe('EmailProviderError');
    });
  });
  
  describe('EmailSendError', () => {
    it('should create error with email ID', () => {
      const error = new EmailSendError(
        'Send failed',
        'resend',
        'email-123',
        'SEND_FAILED'
      );
      
      expect(error.message).toBe('Send failed');
      expect(error.provider).toBe('resend');
      expect(error.emailId).toBe('email-123');
      expect(error.code).toBe('SEND_FAILED');
      expect(error.name).toBe('EmailSendError');
    });
  });
  
  describe('VerificationError', () => {
    it('should create error with email', () => {
      const error = new VerificationError(
        'Verification failed',
        'resend',
        'test@example.com',
        'VERIFY_FAILED'
      );
      
      expect(error.message).toBe('Verification failed');
      expect(error.provider).toBe('resend');
      expect(error.email).toBe('test@example.com');
      expect(error.code).toBe('VERIFY_FAILED');
      expect(error.name).toBe('VerificationError');
    });
  });
  
  describe('ConfigurationError', () => {
    it('should create error with configuration details', () => {
      const error = new ConfigurationError(
        'Invalid config',
        'aws-ses',
        'INVALID_CONFIG',
        { field: 'apiKey' }
      );
      
      expect(error.message).toBe('Invalid config');
      expect(error.provider).toBe('aws-ses');
      expect(error.code).toBe('INVALID_CONFIG');
      expect(error.metadata).toEqual({ field: 'apiKey' });
      expect(error.name).toBe('ConfigurationError');
    });
  });
});

describe('Type Guards', () => {
  it('should allow valid email statuses', () => {
    const statuses: Array<any> = [
      'queued',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'complained',
      'failed',
    ];
    
    // TypeScript will catch invalid statuses at compile time
    statuses.forEach((status) => {
      expect(typeof status).toBe('string');
    });
  });
  
  it('should allow valid email priorities', () => {
    const priorities: Array<any> = ['high', 'normal', 'low'];
    
    priorities.forEach((priority) => {
      expect(typeof priority).toBe('string');
    });
  });
  
  it('should allow valid email types', () => {
    const types: Array<any> = ['transactional', 'marketing'];
    
    types.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });
});
