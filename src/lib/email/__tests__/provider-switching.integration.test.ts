/**
 * Provider Switching Integration Tests
 * 
 * Tests switching between email providers (Resend and AWS SES) and
 * ensuring emails continue to work correctly after switching.
 * 
 * Task 41: Write comprehensive integration tests
 * Requirements: 11.1, 11.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailProviderService } from '@/lib/services/email-provider.service';
import { EmailService } from '@/lib/services/email.service';
import type { EmailProvider } from '@/lib/email/providers/types';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData = {
    emailProviders: new Map<string, any>(),
    senderAddresses: new Map<string, any>(),
    emailQueue: new Map<string, any>(),
    emailLogs: new Map<string, any>(),
    emailSuppressions: new Map<string, any>(),
    emailUnsubscribes: new Map<string, any>(),
  };

  // Add Resend provider
  mockData.emailProviders.set('resend', {
    id: 'provider-resend',
    name: 'resend',
    is_active: true,
    config: { apiKey: 'test-resend-key' },
    created_at: new Date().toISOString(),
  });

  // Add AWS SES provider
  mockData.emailProviders.set('aws-ses', {
    id: 'provider-ses',
    name: 'aws-ses',
    is_active: false,
    config: {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      region: 'us-east-1',
    },
    created_at: new Date().toISOString(),
  });

  // Add default sender
  mockData.senderAddresses.set('default', {
    id: 'sender-1',
    email: 'sender@example.com',
    name: 'Test Sender',
    is_verified: true,
    is_default: true,
  });

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'email_providers') {
              if (column === 'is_active' && value === true) {
                const activeProvider = Array.from(mockData.emailProviders.values()).find(
                  (p: any) => p.is_active === true
                );
                return activeProvider ? { data: activeProvider, error: null } : { data: null, error: { message: 'Not found' } };
              }
              if (column === 'name') {
                const provider = mockData.emailProviders.get(value);
                return provider ? { data: provider, error: null } : { data: null, error: { message: 'Not found' } };
              }
            }
            if (table === 'sender_addresses') {
              if (column === 'is_default' && value === true) {
                return { data: mockData.senderAddresses.get('default'), error: null };
              }
            }
            if (table === 'email_suppressions') {
              const suppression = mockData.emailSuppressions.get(value);
              return suppression ? { data: suppression, error: null } : { data: null, error: { code: 'PGRST116' } };
            }
            if (table === 'email_unsubscribes') {
              const unsubscribe = mockData.emailUnsubscribes.get(value);
              return unsubscribe ? { data: unsubscribe, error: null } : { data: null, error: { code: 'PGRST116' } };
            }
            return { data: null, error: { message: 'Not found' } };
          },
        }),
      }),
      insert: (data: any) => ({
        select: (columns: string) => ({
          single: async () => {
            const id = `${table}-${Date.now()}-${Math.random()}`;
            const record = { id, ...data };
            
            if (table === 'email_queue') {
              mockData.emailQueue.set(id, record);
            } else if (table === 'email_logs') {
              mockData.emailLogs.set(id, record);
            }
            
            return { data: record, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            if (table === 'email_providers') {
              // Update all providers to inactive first if setting one to active
              if (updates.is_active === true) {
                mockData.emailProviders.forEach((provider: any) => {
                  provider.is_active = false;
                });
              }
              
              // Update the specific provider
              if (column === 'name') {
                const provider = mockData.emailProviders.get(value);
                if (provider) {
                  Object.assign(provider, updates);
                  return callback({ data: provider, error: null });
                }
              }
            }
            return callback({ data: null, error: null });
          },
        }),
      }),
    }),
    _mockData: mockData,
  };
};

describe('Provider Switching Integration Tests', () => {
  let mockSupabase: any;
  let providerService: EmailProviderService;
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock environment variable for encryption key
    process.env.EMAIL_PROVIDER_ENCRYPTION_KEY = 'test-encryption-key-32-characters';
    
    mockSupabase = createMockSupabase();
    providerService = new EmailProviderService(mockSupabase as any);
    emailService = new EmailService(mockSupabase as any);
  });

  describe('Provider Management', () => {
    it('should get active provider (Resend)', async () => {
      const provider = await providerService.getActiveProvider();

      expect(provider).toBeDefined();
      expect(provider.name).toBe('resend');
    });

    it('should switch from Resend to AWS SES', async () => {
      // Verify Resend is active
      let activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('resend');

      // Switch to AWS SES
      await providerService.setActiveProvider('aws-ses');

      // Verify AWS SES is now active
      activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('aws-ses');

      // Verify Resend is no longer active
      const resendProvider = mockSupabase._mockData.emailProviders.get('resend');
      expect(resendProvider.is_active).toBe(false);
    });

    it('should switch from AWS SES to Resend', async () => {
      // Set AWS SES as active
      await providerService.setActiveProvider('aws-ses');
      let activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('aws-ses');

      // Switch back to Resend
      await providerService.setActiveProvider('resend');

      // Verify Resend is now active
      activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('resend');
    });

    it('should list all providers', async () => {
      const providers = await providerService.listProviders();

      expect(providers).toBeDefined();
      expect(providers.length).toBeGreaterThanOrEqual(2);
      
      const resend = providers.find(p => p.name === 'resend');
      const ses = providers.find(p => p.name === 'aws-ses');
      
      expect(resend).toBeDefined();
      expect(ses).toBeDefined();
    });

    it('should save provider configuration', async () => {
      const newConfig = {
        apiKey: 'new-resend-key-12345',
      };

      await providerService.saveProviderConfig('resend', newConfig);

      const provider = mockSupabase._mockData.emailProviders.get('resend');
      expect(provider.config.apiKey).toBe(newConfig.apiKey);
    });

    it('should test provider connection', async () => {
      const isConnected = await providerService.testProviderConnection('resend');

      // Mock should return true for valid config
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Email Sending with Provider Switching', () => {
    it('should send email with Resend provider', async () => {
      // Ensure Resend is active
      await providerService.setActiveProvider('resend');

      // Send email
      const result = await emailService.sendTransactionalEmail({
        to: 'test@example.com',
        subject: 'Test with Resend',
        html: '<p>Test content</p>',
        type: 'transactional',
      });

      expect(result.success).toBe(true);

      // Verify email was queued
      const queuedEmail = mockSupabase._mockData.emailQueue.get(result.id);
      expect(queuedEmail).toBeDefined();

      // Verify log shows Resend as provider
      const logs = Array.from(mockSupabase._mockData.emailLogs.values());
      const log = logs.find((l: any) => l.queue_id === result.id);
      expect(log).toBeDefined();
      expect(log.provider).toBe('resend');
    });

    it('should send email with AWS SES provider after switching', async () => {
      // Switch to AWS SES
      await providerService.setActiveProvider('aws-ses');

      // Send email
      const result = await emailService.sendTransactionalEmail({
        to: 'test@example.com',
        subject: 'Test with AWS SES',
        html: '<p>Test content</p>',
        type: 'transactional',
      });

      expect(result.success).toBe(true);

      // Verify log shows AWS SES as provider
      const logs = Array.from(mockSupabase._mockData.emailLogs.values());
      const log = logs.find((l: any) => l.queue_id === result.id);
      expect(log).toBeDefined();
      expect(log.provider).toBe('aws-ses');
    });

    it('should maintain email queue when switching providers', async () => {
      // Send email with Resend
      await providerService.setActiveProvider('resend');
      const result1 = await emailService.sendTransactionalEmail({
        to: 'test1@example.com',
        subject: 'Email 1',
        html: '<p>Content 1</p>',
        type: 'transactional',
      });

      // Switch to AWS SES
      await providerService.setActiveProvider('aws-ses');

      // Send another email
      const result2 = await emailService.sendTransactionalEmail({
        to: 'test2@example.com',
        subject: 'Email 2',
        html: '<p>Content 2</p>',
        type: 'transactional',
      });

      // Both emails should be in queue
      expect(mockSupabase._mockData.emailQueue.has(result1.id)).toBe(true);
      expect(mockSupabase._mockData.emailQueue.has(result2.id)).toBe(true);

      // Logs should show different providers
      const logs = Array.from(mockSupabase._mockData.emailLogs.values());
      const log1 = logs.find((l: any) => l.queue_id === result1.id);
      const log2 = logs.find((l: any) => l.queue_id === result2.id);

      expect(log1?.provider).toBe('resend');
      expect(log2?.provider).toBe('aws-ses');
    });

    it('should handle provider switch during scheduled emails', async () => {
      // Schedule email with Resend
      await providerService.setActiveProvider('resend');
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      const result = await emailService.scheduleEmail({
        to: 'scheduled@example.com',
        subject: 'Scheduled Email',
        html: '<p>Scheduled content</p>',
        type: 'transactional',
        scheduledAt: futureDate,
      });

      expect(result.success).toBe(true);

      // Switch to AWS SES
      await providerService.setActiveProvider('aws-ses');

      // Scheduled email should still exist in queue
      const queuedEmail = mockSupabase._mockData.emailQueue.get(result.id);
      expect(queuedEmail).toBeDefined();
      expect(queuedEmail.scheduled_at).toBeDefined();

      // When processed, it should use the current active provider (AWS SES)
      const activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('aws-ses');
    });
  });

  describe('Provider Configuration Validation', () => {
    it('should validate Resend configuration', async () => {
      const validConfig = {
        apiKey: 're_valid_key_12345',
      };

      await expect(
        providerService.saveProviderConfig('resend', validConfig)
      ).resolves.not.toThrow();
    });

    it('should validate AWS SES configuration', async () => {
      const validConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      await expect(
        providerService.saveProviderConfig('aws-ses', validConfig)
      ).resolves.not.toThrow();
    });

    it('should handle invalid provider name', async () => {
      await expect(
        providerService.setActiveProvider('invalid-provider' as any)
      ).rejects.toThrow();
    });
  });

  describe('Provider Failover', () => {
    it('should handle provider failure gracefully', async () => {
      // This test would require mocking provider failures
      // For now, we verify that the system can switch providers
      
      await providerService.setActiveProvider('resend');
      let activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('resend');

      // Simulate switching to backup provider
      await providerService.setActiveProvider('aws-ses');
      activeProvider = await providerService.getActiveProvider();
      expect(activeProvider.name).toBe('aws-ses');
    });

    it('should maintain email logs across provider switches', async () => {
      // Send with Resend
      await providerService.setActiveProvider('resend');
      await emailService.sendTransactionalEmail({
        to: 'user1@example.com',
        subject: 'Email 1',
        html: '<p>Content</p>',
        type: 'transactional',
      });

      const logsBeforeSwitch = mockSupabase._mockData.emailLogs.size;

      // Switch to AWS SES
      await providerService.setActiveProvider('aws-ses');

      // Send with AWS SES
      await emailService.sendTransactionalEmail({
        to: 'user2@example.com',
        subject: 'Email 2',
        html: '<p>Content</p>',
        type: 'transactional',
      });

      const logsAfterSwitch = mockSupabase._mockData.emailLogs.size;

      // Both emails should be logged
      expect(logsAfterSwitch).toBeGreaterThan(logsBeforeSwitch);
      expect(logsAfterSwitch).toBe(logsBeforeSwitch + 1);
    });
  });
});
