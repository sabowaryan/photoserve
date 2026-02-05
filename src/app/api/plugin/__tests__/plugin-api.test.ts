/**
 * Plugin API Integration Tests
 * Tests for plugin authentication, version checking, download, and usage logging endpoints
 * 
 * Requirements: 2.1-2.8, 5.1-5.10, 6.1-6.10, 11.1-11.4
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as validatePost } from '../auth/validate/route';
import { GET as versionGet } from '../version/route';
import { GET as downloadGet } from '../download/route';
import { POST as usagePost } from '../usage/route';

// Mock the services
vi.mock('@/lib/services/api-key.service', () => ({
  apiKeyService: {
    validateAPIKey: vi.fn(),
  },
}));

vi.mock('@/lib/services/plugin-version.service', () => ({
  pluginVersionService: {
    getLatestStableVersion: vi.fn(),
    getAllVersions: vi.fn(),
    recordDownload: vi.fn(),
  },
}));

vi.mock('@/lib/services/usage-tracking.service', () => ({
  usageTrackingService: {
    logUsage: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

import { apiKeyService } from '@/lib/services/api-key.service';
import { pluginVersionService } from '@/lib/services/plugin-version.service';
import { usageTrackingService } from '@/lib/services/usage-tracking.service';
import { requireSupabaseClient } from '@/lib/auth';

describe('Plugin API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/plugin/auth/validate', () => {
    it('should return 400 when Authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/plugin/auth/validate', {
        method: 'POST',
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Missing Authorization header');
    });

    it('should return 400 when Authorization header format is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/plugin/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': 'InvalidFormat pk_live_test',
        },
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Invalid Authorization header format');
    });

    it('should return 401 for invalid API key', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: false,
        error: 'Invalid or expired API key',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_invalid123456789012345678',
        },
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should return 403 for non-Pro user', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: false,
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          planType: 'free',
        },
        error: 'Pro plan required',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_valid1234567890123456789012',
        },
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Pro plan required');
      expect(data.user).toBeDefined();
      expect(data.user.planType).toBe('free');
    });

    it('should return 200 with user info for valid Pro user', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: true,
        user: {
          id: 'user-123',
          name: 'Pro User',
          email: 'pro@example.com',
          planType: 'pro',
        },
        apiKeyId: 'key-123',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_valid1234567890123456789012',
        },
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('user-123');
      expect(data.user.planType).toBe('pro');
    });
  });

  describe('GET /api/plugin/version', () => {
    it('should return 404 when no stable version exists', async () => {
      vi.mocked(pluginVersionService.getLatestStableVersion).mockResolvedValue(null);

      const response = await versionGet();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No stable version available');
    });

    it('should return 200 with version info when stable version exists', async () => {
      vi.mocked(pluginVersionService.getLatestStableVersion).mockResolvedValue({
        id: 'version-123',
        version: '1.0.0',
        fileUrl: 'https://res.cloudinary.com/test/piksend.lrplugin',
        fileSize: 1048576,
        changelog: 'Initial release',
        isStable: true,
        minLightroomVersion: '11.0',
        releaseDate: '2024-01-15T10:00:00Z',
        downloadCount: 100,
        createdAt: '2024-01-15T10:00:00Z',
      });

      const response = await versionGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe('1.0.0');
      expect(data.downloadUrl).toBe('https://res.cloudinary.com/test/piksend.lrplugin');
      expect(data.fileSize).toBe(1048576);
      expect(data.changelog).toBe('Initial release');
      expect(data.releaseDate).toBe('2024-01-15T10:00:00Z');
      expect(data.minLightroomVersion).toBe('11.0');
    });

    it('should include cache headers in response', async () => {
      vi.mocked(pluginVersionService.getLatestStableVersion).mockResolvedValue({
        id: 'version-123',
        version: '1.0.0',
        fileUrl: 'https://res.cloudinary.com/test/piksend.lrplugin',
        fileSize: 1048576,
        changelog: 'Initial release',
        isStable: true,
        minLightroomVersion: '11.0',
        releaseDate: '2024-01-15T10:00:00Z',
        downloadCount: 100,
        createdAt: '2024-01-15T10:00:00Z',
      });

      const response = await versionGet();

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
    });
  });

  describe('GET /api/plugin/download', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/plugin/download', {
        method: 'GET',
      });

      const response = await downloadGet(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should return 403 when user is not Pro', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { subscription_plan: 'free' },
                error: null,
              })),
            })),
          })),
        })),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/download', {
        method: 'GET',
      });

      const response = await downloadGet(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Pro plan required');
    });

    it('should return 404 when no stable version exists', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { subscription_plan: 'pro' },
                error: null,
              })),
            })),
          })),
        })),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(pluginVersionService.getLatestStableVersion).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/plugin/download', {
        method: 'GET',
      });

      const response = await downloadGet(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No stable version available');
    });
  });

  describe('POST /api/plugin/usage', () => {
    it('should return 400 when Authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/plugin/usage', {
        method: 'POST',
        body: JSON.stringify({ action: 'upload' }),
      });

      const response = await usagePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing Authorization header');
    });

    it('should return 401 for invalid API key', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: false,
        error: 'Invalid or expired API key',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/usage', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_invalid123456789012345678',
        },
        body: JSON.stringify({ action: 'upload' }),
      });

      const response = await usagePost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid request body', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: true,
        user: {
          id: 'user-123',
          name: 'Pro User',
          email: 'pro@example.com',
          planType: 'pro',
        },
        apiKeyId: 'key-123',
      });

      const request = new NextRequest('http://localhost:3000/api/plugin/usage', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_valid1234567890123456789012',
        },
        body: JSON.stringify({ /* missing action */ }),
      });

      const response = await usagePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid request body');
    });

    it('should return 200 and log usage for valid request', async () => {
      vi.mocked(apiKeyService.validateAPIKey).mockResolvedValue({
        valid: true,
        user: {
          id: 'user-123',
          name: 'Pro User',
          email: 'pro@example.com',
          planType: 'pro',
        },
        apiKeyId: 'key-123',
      });

      vi.mocked(usageTrackingService.logUsage).mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/plugin/usage', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_valid1234567890123456789012',
        },
        body: JSON.stringify({
          action: 'upload',
          pluginVersion: '1.0.0',
          lightroomVersion: '13.1',
          osVersion: 'Windows 11',
          metadata: { imageCount: 5 },
        }),
      });

      const response = await usagePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(usageTrackingService.logUsage).toHaveBeenCalledWith({
        userId: 'user-123',
        apiKeyId: 'key-123',
        action: 'upload',
        pluginVersion: '1.0.0',
        lightroomVersion: '13.1',
        osVersion: 'Windows 11',
        metadata: { imageCount: 5 },
      });
    });
  });
});

