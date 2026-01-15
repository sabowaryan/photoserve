/**
 * Logo Upload API Endpoint Tests
 * Integration tests for logo upload and deletion endpoints
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '../route';
import * as auth from '@/lib/auth';
import * as logoService from '@/lib/services/logo-upload.service';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  requireSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/services/logo-upload.service', () => ({
  createLogoUploadService: vi.fn(),
}));

vi.mock('@/config/plan-features', () => ({
  hasFeatureAccess: vi.fn(),
}));

describe('Logo Upload API Endpoint', () => {
  const mockUserId = 'user-123';
  const mockSession = {
    user: { id: mockUserId, email: 'test@example.com' },
  };

  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock for each test
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
    };
  });

  describe('POST /api/profile/logo', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null);

      const request = new Request('http://localhost/api/profile/logo', {
        method: 'POST',
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 403 if user does not have Pro plan', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const mockProfile = {
        subscription_plan: 'free',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { hasFeatureAccess } = await import('@/config/plan-features');
      vi.mocked(hasFeatureAccess).mockReturnValue(false);

      const formData = new FormData();
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      formData.append('logo', file);

      const request = new Request('http://localhost/api/profile/logo', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe('Custom logo requires Pro plan');
    });

    it('should return 400 if no file is provided', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const mockProfile = {
        subscription_plan: 'pro',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { hasFeatureAccess } = await import('@/config/plan-features');
      vi.mocked(hasFeatureAccess).mockReturnValue(true);

      const formData = new FormData();
      const request = new Request('http://localhost/api/profile/logo', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('No file provided');
    });

    it('should return 400 if file validation fails', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: mockSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const mockProfile = {
        subscription_plan: 'pro',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { hasFeatureAccess } = await import('@/config/plan-features');
      vi.mocked(hasFeatureAccess).mockReturnValue(true);

      const mockLogoService = {
        validateImage: vi.fn().mockReturnValue({
          valid: false,
          error: 'File size exceeds 2MB limit',
        }),
        uploadLogo: vi.fn(),
        deleteLogo: vi.fn(),
      };

      vi.mocked(logoService.createLogoUploadService).mockReturnValue(mockLogoService as any);

      const formData = new FormData();
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      formData.append('logo', file);

      const request = new Request('http://localhost/api/profile/logo', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('File size exceeds 2MB limit');
    });

    it('should successfully upload logo and update database', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);
      
      // Create a fresh mock with proper chaining for this test
      const selectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
            .mockResolvedValueOnce({ 
              data: { subscription_plan: 'pro' }, 
              error: null 
            })
            .mockResolvedValueOnce({ 
              data: { branding: { brandColors: { primary: '#000000' } } }, 
              error: null 
            }),
        })),
      }));

      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      const testSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: selectMock,
              update: updateMock,
            };
          }
          return mockSupabase;
        }),
      };

      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: testSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const { hasFeatureAccess } = await import('@/config/plan-features');
      vi.mocked(hasFeatureAccess).mockReturnValue(true);

      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v1/logo.png',
        publicId: 'photoserve/user-123/logos/abc123',
      };

      const mockLogoService = {
        validateImage: vi.fn().mockReturnValue({ valid: true }),
        uploadLogo: vi.fn().mockResolvedValue(mockUploadResult),
        deleteLogo: vi.fn(),
      };

      vi.mocked(logoService.createLogoUploadService).mockReturnValue(mockLogoService as any);

      const formData = new FormData();
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      formData.append('logo', file);

      const request = new Request('http://localhost/api/profile/logo', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.url).toBe(mockUploadResult.url);
      expect(body.publicId).toBe(mockUploadResult.publicId);
      expect(mockLogoService.uploadLogo).toHaveBeenCalledWith(file, mockUserId);
    });
  });

  describe('DELETE /api/profile/logo', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null);

      const response = await DELETE();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should successfully delete logo and update database', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);

      const mockBranding = {
        customLogo: 'https://res.cloudinary.com/test/image/upload/v1/logo.png',
        customLogoPublicId: 'photoserve/user-123/logos/abc123',
      };

      // Create a fresh mock with proper chaining for this test
      const selectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { branding: mockBranding },
            error: null,
          }),
        })),
      }));

      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      const testSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: selectMock,
              update: updateMock,
            };
          }
          return mockSupabase;
        }),
      };

      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: testSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const mockLogoService = {
        validateImage: vi.fn(),
        uploadLogo: vi.fn(),
        deleteLogo: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(logoService.createLogoUploadService).mockReturnValue(mockLogoService as any);

      const response = await DELETE();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Logo removed successfully');
      expect(mockLogoService.deleteLogo).toHaveBeenCalledWith(mockBranding.customLogoPublicId);
    });

    it('should handle missing public ID gracefully', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(mockSession as any);

      const mockBranding = {
        customLogo: 'https://res.cloudinary.com/test/image/upload/v1/logo.png',
        // No customLogoPublicId
      };

      // Create a fresh mock with proper chaining for this test
      const selectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { branding: mockBranding },
            error: null,
          }),
        })),
      }));

      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      const testSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: selectMock,
              update: updateMock,
            };
          }
          return mockSupabase;
        }),
      };

      vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
        supabase: testSupabase as any,
        hasRLS: false,
        userId: ''
      });

      const mockLogoService = {
        validateImage: vi.fn(),
        uploadLogo: vi.fn(),
        deleteLogo: vi.fn(),
      };

      vi.mocked(logoService.createLogoUploadService).mockReturnValue(mockLogoService as any);

      const response = await DELETE();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockLogoService.deleteLogo).not.toHaveBeenCalled();
    });
  });
});
