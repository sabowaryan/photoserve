/**
 * Metrics Service Tests
 * 
 * Tests for the metrics tracking service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { metricsService } from '../metrics.service';

describe('MetricsService', () => {
  beforeEach(() => {
    // Reset metrics before each test
    metricsService.reset();
  });
  
  describe('API Key Validation Metrics', () => {
    it('should track API key validation times', () => {
      // Track some validations
      metricsService.trackApiKeyValidation(50, true);
      metricsService.trackApiKeyValidation(100, true);
      metricsService.trackApiKeyValidation(150, false);
      
      const metrics = metricsService.getApiKeyValidationMetrics();
      
      expect(metrics.count).toBe(3);
      expect(metrics.p50).toBeGreaterThan(0);
      expect(metrics.successRate).toBe(2 / 3);
    });
    
    it('should calculate percentiles correctly', () => {
      // Track 100 validations with known values
      for (let i = 1; i <= 100; i++) {
        metricsService.trackApiKeyValidation(i, true);
      }
      
      const metrics = metricsService.getApiKeyValidationMetrics();
      
      expect(metrics.count).toBe(100);
      expect(metrics.p50).toBeGreaterThanOrEqual(49);
      expect(metrics.p50).toBeLessThanOrEqual(51);
      expect(metrics.p95).toBeGreaterThanOrEqual(94);
      expect(metrics.p95).toBeLessThanOrEqual(96);
      expect(metrics.p99).toBeGreaterThanOrEqual(98);
      expect(metrics.p99).toBeLessThanOrEqual(100);
      expect(metrics.successRate).toBe(1);
    });
  });
  
  describe('Plugin Download Metrics', () => {
    it('should track plugin downloads', () => {
      metricsService.trackPluginDownload(true);
      metricsService.trackPluginDownload(true);
      metricsService.trackPluginDownload(false);
      
      const metrics = metricsService.getPluginDownloadMetrics();
      
      expect(metrics.total).toBe(3);
      expect(metrics.failures).toBe(1);
      expect(metrics.failureRate).toBeCloseTo(1 / 3, 2);
    });
  });
  
  describe('Error Metrics', () => {
    it('should track endpoint errors', () => {
      metricsService.trackEndpointError('/api/test', false);
      metricsService.trackEndpointError('/api/test', false);
      metricsService.trackEndpointError('/api/test', true);
      
      const metrics = metricsService.getErrorMetrics();
      
      expect(metrics.length).toBe(1);
      
      const testMetric = metrics[0];
      expect(testMetric).toBeDefined();
      expect(testMetric!.endpoint).toBe('/api/test');
      expect(testMetric!.totalRequests).toBe(3);
      expect(testMetric!.errorCount).toBe(1);
      expect(testMetric!.errorRate).toBeCloseTo(1 / 3, 2);
    });
    
    it('should track multiple endpoints separately', () => {
      metricsService.trackEndpointError('/api/endpoint1', true);
      metricsService.trackEndpointError('/api/endpoint2', false);
      
      const metrics = metricsService.getErrorMetrics();
      
      expect(metrics.length).toBe(2);
      
      const endpoint1Metric = metrics.find(m => m.endpoint === '/api/endpoint1');
      const endpoint2Metric = metrics.find(m => m.endpoint === '/api/endpoint2');
      
      expect(endpoint1Metric).toBeDefined();
      expect(endpoint1Metric!.errorCount).toBe(1);
      
      expect(endpoint2Metric).toBeDefined();
      expect(endpoint2Metric!.errorCount).toBe(0);
    });
  });
  
  describe('Database Query Metrics', () => {
    it('should track database query times', () => {
      metricsService.trackDbQuery(10);
      metricsService.trackDbQuery(20);
      metricsService.trackDbQuery(30);
      
      const metrics = metricsService.getDbQueryMetrics();
      
      expect(metrics.count).toBe(3);
      expect(metrics.p50).toBe(20);
    });
  });
});
