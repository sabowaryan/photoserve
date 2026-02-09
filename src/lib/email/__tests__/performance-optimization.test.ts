/**
 * Performance Optimization Tests
 * 
 * Tests for caching, batch sizing, and performance monitoring.
 * 
 * Requirements: 11.5, 11.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTemplate,
  setTemplate,
  invalidateTemplate,
  getRenderedTemplate,
  setRenderedTemplate,
  getProviderConfig,
  setProviderConfig,
  clearAll,
  getStats,
} from '@/lib/cache/email-cache';
import {
  getOptimizedBatchSize,
  shouldUseCache,
  getCacheTTL,
  startTimer,
  QUEUE_CONFIG,
  CACHE_CONFIG,
} from '@/lib/email/performance-config';

describe('Email Cache', () => {
  beforeEach(() => {
    clearAll();
  });

  describe('Template Cache', () => {
    it('should cache and retrieve templates', () => {
      const templateId = 'test-template';
      const templateData = {
        id: templateId,
        name: 'Test Template',
        content: '<html>Test</html>',
      };

      // Set template
      setTemplate(templateId, templateData);

      // Get template
      const cached = getTemplate(templateId);
      expect(cached).toEqual(templateData);
    });

    it('should return null for non-existent templates', () => {
      const cached = getTemplate('non-existent');
      expect(cached).toBeNull();
    });

    it('should invalidate templates', () => {
      const templateId = 'test-template';
      const templateData = { id: templateId, name: 'Test' };

      setTemplate(templateId, templateData);
      expect(getTemplate(templateId)).toEqual(templateData);

      invalidateTemplate(templateId);
      expect(getTemplate(templateId)).toBeNull();
    });
  });

  describe('Rendered Template Cache', () => {
    it('should cache and retrieve rendered templates', () => {
      const templateId = 'test-template';
      const variables = { name: 'John', email: 'john@example.com' };
      const rendered = {
        html: '<html>Hello John</html>',
        text: 'Hello John',
        subject: 'Test Email',
      };

      // Set rendered template
      setRenderedTemplate(templateId, variables, rendered);

      // Get rendered template
      const cached = getRenderedTemplate(templateId, variables);
      expect(cached).toEqual(rendered);
    });

    it('should return null for different variables', () => {
      const templateId = 'test-template';
      const variables1 = { name: 'John' };
      const variables2 = { name: 'Jane' };
      const rendered = {
        html: '<html>Hello</html>',
        text: 'Hello',
        subject: 'Test',
      };

      setRenderedTemplate(templateId, variables1, rendered);

      // Different variables should not hit cache
      const cached = getRenderedTemplate(templateId, variables2);
      expect(cached).toBeNull();
    });
  });

  describe('Provider Config Cache', () => {
    it('should cache and retrieve provider configs', () => {
      const providerName = 'resend';
      const config = { apiKey: 'test-key' };

      setProviderConfig(providerName, config);

      const cached = getProviderConfig(providerName);
      expect(cached).toEqual(config);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', () => {
      clearAll();

      // Add some entries
      setTemplate('template1', { id: 'template1' });
      setTemplate('template2', { id: 'template2' });
      setProviderConfig('resend', { apiKey: 'test' });

      const stats = getStats();
      expect(stats.templates).toBe(2);
      expect(stats.providerConfigs).toBe(1);
      expect(stats.totalEntries).toBe(3);
    });
  });
});

describe('Performance Configuration', () => {
  describe('Optimized Batch Sizing', () => {
    it('should return small batch size for small queues', () => {
      const batchSize = getOptimizedBatchSize(50, 'normal');
      expect(batchSize).toBe(5);
    });

    it('should return default batch size for medium queues', () => {
      const batchSize = getOptimizedBatchSize(500, 'normal');
      expect(batchSize).toBe(QUEUE_CONFIG.DEFAULT_BATCH_SIZE);
    });

    it('should return large batch size for large queues', () => {
      const batchSize = getOptimizedBatchSize(2000, 'normal');
      expect(batchSize).toBeGreaterThan(QUEUE_CONFIG.DEFAULT_BATCH_SIZE);
      expect(batchSize).toBeLessThanOrEqual(QUEUE_CONFIG.MAX_BATCH_SIZE);
    });

    it('should use smaller batch size for high priority', () => {
      const normalBatch = getOptimizedBatchSize(500, 'normal');
      const highBatch = getOptimizedBatchSize(500, 'high');
      expect(highBatch).toBeLessThan(normalBatch);
    });
  });

  describe('Cache Configuration', () => {
    it('should determine if caching should be used', () => {
      const shouldCache = shouldUseCache('template');
      expect(typeof shouldCache).toBe('boolean');
    });

    it('should return correct TTL for operations', () => {
      const templateTTL = getCacheTTL('template');
      expect(templateTTL).toBe(CACHE_CONFIG.TEMPLATE_TTL);

      const providerTTL = getCacheTTL('provider');
      expect(providerTTL).toBe(CACHE_CONFIG.PROVIDER_CONFIG_TTL);

      const renderedTTL = getCacheTTL('rendered');
      expect(renderedTTL).toBe(CACHE_CONFIG.RENDERED_TEMPLATE_TTL);
    });
  });

  describe('Performance Timer', () => {
    it('should measure operation duration', async () => {
      const timer = startTimer('test_operation');

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = timer.end();

      expect(metrics.operation).toBe('test_operation');
      expect(metrics.duration).toBeGreaterThanOrEqual(100);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('should include metadata in metrics', () => {
      const timer = startTimer('test_operation');
      const metadata = { templateId: 'test-123', userId: 'user-456' };

      const metrics = timer.end(metadata);

      expect(metrics.metadata).toEqual(metadata);
    });
  });
});

describe('Integration Tests', () => {
  it('should demonstrate cache performance improvement', () => {
    const templateId = 'test-template';
    const templateData = {
      id: templateId,
      name: 'Test Template',
      content: '<html>Test</html>',
    };

    // First access (cache miss)
    const timer1 = startTimer('cache_miss');
    setTemplate(templateId, templateData);
    const result1 = getTemplate(templateId);
    const metrics1 = timer1.end();

    // Second access (cache hit)
    const timer2 = startTimer('cache_hit');
    const result2 = getTemplate(templateId);
    const metrics2 = timer2.end();

    // Cache hit should be faster
    expect(result1).toEqual(result2);
    expect(metrics2.duration).toBeLessThanOrEqual(metrics1.duration);
  });

  it('should handle cache invalidation correctly', () => {
    const templateId = 'test-template';
    const templateData1 = { id: templateId, version: 1 };
    const templateData2 = { id: templateId, version: 2 };

    // Set initial version
    setTemplate(templateId, templateData1);
    expect(getTemplate(templateId)).toEqual(templateData1);

    // Invalidate and set new version
    invalidateTemplate(templateId);
    setTemplate(templateId, templateData2);
    expect(getTemplate(templateId)).toEqual(templateData2);
  });
});
