/**
 * Dashboard API Key Management Integration Tests
 * Tests for API key creation, listing, revocation, and deletion endpoints
 * 
 * Requirements: 1.1-1.10, 7.1-7.11
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createPost, GET as listGet } from '../route';
import { DELETE as deleteKey } from '../[id]/route';
import { PATCH as revokeKey } from '../[id]/revoke/route';

// Mock the services and auth
vi.mock('@/lib/services/api-key.service', () => ({
  apiKeyService: {
    createAPIKey: vi.fn(),
    listAPIKeys: vi.fn(),
    deleteAPIKey: vi.fn(),
    revokeAPIKey: vi.fn(),
  },
  createAPIKeySchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

import { apiKeyService, createAPIKeySchema } from '@/lib/services/api-key.service';
import { requireSupabaseClient } from '@/lib/auth';

describe('Dashboard API Key Management Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/settings/api-keys', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Key' }),
      });

      const response = await createPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid request body', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(createAPIKeySchema.safeParse).mockReturnValue({
        success: false,
        error: {
          issues: [{ message: 'Name is required' }],
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ /* missing name */ }),
      });

      const response = await createPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.validationFailed');
      expect(data.code).toBe('VALIDATION_ERROR');
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

      vi.mocked(createAPIKeySchema.safeParse).mockReturnValue({
        success: true,
        data: { name: 'Test Key', scopes: ['plugin:read', 'plugin:write'] },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Key' }),
      });

      const response = await createPost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('api.errors.proPlanRequired');
      expect(data.code).toBe('PRO_PLAN_REQUIRED');
    });

    it('should return 201 with full key for Pro user', async () => {
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

      vi.mocked(createAPIKeySchema.safeParse).mockReturnValue({
        success: true,
        data: { name: 'Test Key', scopes: ['plugin:read', 'plugin:write'] },
      } as any);

      const mockApiKey = {
        id: 'key-123',
        userId: 'user-123',
        name: 'Test Key',
        keyPrefix: 'pk_live_abc1',
        scopes: ['plugin:read', 'plugin:write'],
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        isActive: true,
      };

      vi.mocked(apiKeyService.createAPIKey).mockResolvedValue({
        key: 'pk_live_abc123456789012345678901234567',
        apiKey: mockApiKey,
      });

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Key' }),
      });

      const response = await createPost(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.key).toBe('pk_live_abc123456789012345678901234567');
      expect(data.apiKey).toEqual(mockApiKey);
    });

    it('should handle expiration date in request', async () => {
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

      const expiresAt = '2027-01-15T10:00:00Z'; // Future date

      vi.mocked(createAPIKeySchema.safeParse).mockReturnValue({
        success: true,
        data: { 
          name: 'Test Key', 
          scopes: ['plugin:read', 'plugin:write'],
          expiresAt,
        },
      } as any);

      const mockApiKey = {
        id: 'key-123',
        userId: 'user-123',
        name: 'Test Key',
        keyPrefix: 'pk_live_abc1',
        scopes: ['plugin:read', 'plugin:write'],
        lastUsedAt: null,
        expiresAt,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        isActive: true,
      };

      vi.mocked(apiKeyService.createAPIKey).mockResolvedValue({
        key: 'pk_live_abc123456789012345678901234567',
        apiKey: mockApiKey,
      });

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Key', expiresAt }),
      });

      const response = await createPost(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.apiKey.expiresAt).toBe(expiresAt);
    });
  });

  describe('GET /api/settings/api-keys', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'GET',
      });

      const response = await listGet(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return 200 with array of API keys', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      const mockApiKeys = [
        {
          id: 'key-1',
          userId: 'user-123',
          name: 'Key 1',
          keyPrefix: 'pk_live_abc1',
          scopes: ['plugin:read', 'plugin:write'],
          lastUsedAt: '2024-01-15T10:00:00Z',
          expiresAt: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          isActive: true,
        },
        {
          id: 'key-2',
          userId: 'user-123',
          name: 'Key 2',
          keyPrefix: 'pk_live_def2',
          scopes: ['plugin:read', 'plugin:write'],
          lastUsedAt: null,
          expiresAt: '2025-01-15T10:00:00Z',
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
          isActive: false,
        },
      ];

      vi.mocked(apiKeyService.listAPIKeys).mockResolvedValue(mockApiKeys);

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'GET',
      });

      const response = await listGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apiKeys).toEqual(mockApiKeys);
      expect(data.apiKeys).toHaveLength(2);
    });

    it('should return empty array when user has no keys', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.listAPIKeys).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys', {
        method: 'GET',
      });

      const response = await listGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apiKeys).toEqual([]);
    });
  });

  describe('DELETE /api/settings/api-keys/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-123', {
        method: 'DELETE',
      });

      const response = await deleteKey(request, { params: { id: 'key-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for missing key ID', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/', {
        method: 'DELETE',
      });

      const response = await deleteKey(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.invalidKeyId');
    });

    it('should return 404 when key not found', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.deleteAPIKey).mockRejectedValue(
        new Error('API key not found')
      );

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-999', {
        method: 'DELETE',
      });

      const response = await deleteKey(request, { params: { id: 'key-999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('api.errors.apiKeyNotFound');
    });

    it('should return 404 when user does not own the key', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.deleteAPIKey).mockRejectedValue(
        new Error('Unauthorized: You do not own this API key')
      );

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-456', {
        method: 'DELETE',
      });

      const response = await deleteKey(request, { params: { id: 'key-456' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('api.errors.apiKeyNotFound');
    });

    it('should return 204 on successful deletion', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.deleteAPIKey).mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-123', {
        method: 'DELETE',
      });

      const response = await deleteKey(request, { params: { id: 'key-123' } });

      expect(response.status).toBe(204);
      expect(apiKeyService.deleteAPIKey).toHaveBeenCalledWith('user-123', 'key-123');
    });
  });

  describe('PATCH /api/settings/api-keys/[id]/revoke', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-123/revoke', {
        method: 'PATCH',
      });

      const response = await revokeKey(request, { params: { id: 'key-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for missing key ID', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys//revoke', {
        method: 'PATCH',
      });

      const response = await revokeKey(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('api.errors.invalidKeyId');
    });

    it('should return 404 when key not found', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.revokeAPIKey).mockRejectedValue(
        new Error('API key not found')
      );

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-999/revoke', {
        method: 'PATCH',
      });

      const response = await revokeKey(request, { params: { id: 'key-999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('api.errors.apiKeyNotFound');
    });

    it('should return 404 when user does not own the key', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.revokeAPIKey).mockRejectedValue(
        new Error('Unauthorized: You do not own this API key')
      );

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-456/revoke', {
        method: 'PATCH',
      });

      const response = await revokeKey(request, { params: { id: 'key-456' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('api.errors.apiKeyNotFound');
    });

    it('should return 200 with success on successful revocation', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: true,
        userId: 'user-123',
      });

      vi.mocked(apiKeyService.revokeAPIKey).mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/settings/api-keys/key-123/revoke', {
        method: 'PATCH',
      });

      const response = await revokeKey(request, { params: { id: 'key-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(apiKeyService.revokeAPIKey).toHaveBeenCalledWith('user-123', 'key-123');
    });
  });
});
