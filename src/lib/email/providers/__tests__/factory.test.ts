/**
 * Tests for Email Provider Factory
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerProvider,
  isProviderRegistered,
  getRegisteredProviders,
  createEmailProvider,
  createEmailProviderSafe,
  unregisterProvider,
  clearProviderRegistry,
} from '../factory';
import {
  BaseEmailProvider,
  ConfigurationError,
  type ProviderConfig,
  type SendEmailParams,
  type SendEmailResult,
  type VerificationResult,
  type VerificationStatus,
  type DomainRecords,
} from '../types';

// Mock provider for testing
class MockEmailProvider extends BaseEmailProvider {
  readonly name = 'resend' as const;
  
  async sendEmail(_params: SendEmailParams): Promise<SendEmailResult> {
    return {
      id: 'mock-id',
      status: 'sent',
    };
  }
  
  async sendBatch(emails: SendEmailParams[]): Promise<SendEmailResult[]> {
    return emails.map(() => ({
      id: 'mock-id',
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

describe('Provider Factory', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearProviderRegistry();
  });
  
  describe('registerProvider', () => {
    it('should register a provider', () => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      
      expect(isProviderRegistered('resend')).toBe(true);
    });
    
    it('should allow registering multiple providers', () => {
      const factory1 = (config: ProviderConfig) => new MockEmailProvider(config);
      const factory2 = (config: ProviderConfig) => new MockEmailProvider(config);
      
      registerProvider('resend', factory1);
      registerProvider('aws-ses', factory2);
      
      expect(isProviderRegistered('resend')).toBe(true);
      expect(isProviderRegistered('aws-ses')).toBe(true);
    });
  });
  
  describe('isProviderRegistered', () => {
    it('should return false for unregistered provider', () => {
      expect(isProviderRegistered('resend')).toBe(false);
    });
    
    it('should return true for registered provider', () => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      
      expect(isProviderRegistered('resend')).toBe(true);
    });
  });
  
  describe('getRegisteredProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(getRegisteredProviders()).toEqual([]);
    });
    
    it('should return list of registered providers', () => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      registerProvider('aws-ses', factory);
      
      const providers = getRegisteredProviders();
      expect(providers).toContain('resend');
      expect(providers).toContain('aws-ses');
      expect(providers.length).toBe(2);
    });
  });
  
  describe('createEmailProvider', () => {
    beforeEach(() => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
    });
    
    it('should create provider instance with valid config', () => {
      const config: ProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: 're_test_key',
        },
      };
      
      const provider = createEmailProvider(config);
      expect(provider).toBeInstanceOf(MockEmailProvider);
      expect(provider.name).toBe('resend');
    });
    
    it('should throw error for unregistered provider', () => {
      const config: ProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'us-east-1',
        },
      };
      
      expect(() => createEmailProvider(config)).toThrow(ConfigurationError);
      expect(() => createEmailProvider(config)).toThrow('not registered');
    });
    
    it('should throw error for invalid Resend config', () => {
      const config: ProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: '', // Empty API key
        },
      };
      
      expect(() => createEmailProvider(config)).toThrow(ConfigurationError);
    });
    
    it('should throw error for invalid API key format', () => {
      const config: ProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: 'invalid_key', // Should start with 're_'
        },
      };
      
      expect(() => createEmailProvider(config)).toThrow(ConfigurationError);
      expect(() => createEmailProvider(config)).toThrow('should start with "re_"');
    });
  });
  
  describe('createEmailProviderSafe', () => {
    beforeEach(() => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
    });
    
    it('should create provider and test connection', async () => {
      const config: ProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: 're_test_key',
        },
      };
      
      const provider = await createEmailProviderSafe(config);
      expect(provider).toBeInstanceOf(MockEmailProvider);
    });
    
    it('should return null for invalid config', async () => {
      const config: ProviderConfig = {
        provider: 'resend',
        isActive: true,
        config: {
          apiKey: '', // Invalid
        },
      };
      
      const provider = await createEmailProviderSafe(config);
      expect(provider).toBeNull();
    });
    
    it('should return null for unregistered provider', async () => {
      const config: ProviderConfig = {
        provider: 'aws-ses',
        isActive: true,
        config: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'us-east-1',
        },
      };
      
      const provider = await createEmailProviderSafe(config);
      expect(provider).toBeNull();
    });
  });
  
  describe('unregisterProvider', () => {
    it('should unregister a provider', () => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      
      expect(isProviderRegistered('resend')).toBe(true);
      
      unregisterProvider('resend');
      
      expect(isProviderRegistered('resend')).toBe(false);
    });
  });
  
  describe('clearProviderRegistry', () => {
    it('should clear all registered providers', () => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      registerProvider('aws-ses', factory);
      
      expect(getRegisteredProviders().length).toBe(2);
      
      clearProviderRegistry();
      
      expect(getRegisteredProviders().length).toBe(0);
    });
  });
  
  describe('Configuration Validation', () => {
    beforeEach(() => {
      const factory = (config: ProviderConfig) => new MockEmailProvider(config);
      registerProvider('resend', factory);
      registerProvider('aws-ses', factory);
    });
    
    describe('Resend Configuration', () => {
      it('should validate missing API key', () => {
        const config: ProviderConfig = {
          provider: 'resend',
          isActive: true,
          config: {
            apiKey: '',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('API key is required');
      });
      
      it('should validate API key format', () => {
        const config: ProviderConfig = {
          provider: 'resend',
          isActive: true,
          config: {
            apiKey: 'wrong_format',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('should start with "re_"');
      });
      
      it('should accept valid Resend config', () => {
        const config: ProviderConfig = {
          provider: 'resend',
          isActive: true,
          config: {
            apiKey: 're_valid_key_123',
          },
        };
        
        expect(() => createEmailProvider(config)).not.toThrow();
      });
    });
    
    describe('AWS SES Configuration', () => {
      it('should validate missing access key ID', () => {
        const config: ProviderConfig = {
          provider: 'aws-ses',
          isActive: true,
          config: {
            accessKeyId: '',
            secretAccessKey: 'secret',
            region: 'us-east-1',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('access key ID is required');
      });
      
      it('should validate missing secret access key', () => {
        const config: ProviderConfig = {
          provider: 'aws-ses',
          isActive: true,
          config: {
            accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: '',
            region: 'us-east-1',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('secret access key is required');
      });
      
      it('should validate missing region', () => {
        const config: ProviderConfig = {
          provider: 'aws-ses',
          isActive: true,
          config: {
            accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region: '',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('region is required');
      });
      
      it('should validate region format', () => {
        const config: ProviderConfig = {
          provider: 'aws-ses',
          isActive: true,
          config: {
            accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region: 'invalid-region',
          },
        };
        
        expect(() => createEmailProvider(config)).toThrow('Invalid AWS region format');
      });
      
      it('should accept valid AWS SES config', () => {
        const config: ProviderConfig = {
          provider: 'aws-ses',
          isActive: true,
          config: {
            accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region: 'us-east-1',
          },
        };
        
        expect(() => createEmailProvider(config)).not.toThrow();
      });
      
      it('should accept various valid AWS regions', () => {
        const validRegions = [
          'us-east-1',
          'us-west-2',
          'eu-west-1',
          'ap-southeast-1',
          'sa-east-1',
        ];
        
        validRegions.forEach((region) => {
          const config: ProviderConfig = {
            provider: 'aws-ses',
            isActive: true,
            config: {
              accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
              secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
              region,
            },
          };
          
          expect(() => createEmailProvider(config)).not.toThrow();
        });
      });
    });
  });
});
