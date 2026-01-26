/**
 * Tests for Analytics Export API Route
 * 
 * Requirement 13.6: THE Système SHALL permettre au Photographe_Pro d'exporter ses données analytics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock repositories
vi.mock('@/lib/repositories/public-profile.repository', () => ({
  createPublicProfileRepository: vi.fn(),
}));

vi.mock('@/lib/repositories/profile-views.repository', () => ({
  createProfileViewsRepository: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createPublicProfileRepository } from '@/lib/repositories/public-profile.repository';
import { createProfileViewsRepository } from '@/lib/repositories/profile-views.repository';

describe('Analytics Export API Route', () => {
  let mockSupabase: any;
  let mockProfileRepo: any;
  let mockViewsRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };

    // Setup mock repositories
    mockProfileRepo = {
      findByUserId: vi.fn(),
    };

    mockViewsRepo = {
      findByProfileAndDateRange: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createPublicProfileRepository).mockReturnValue(mockProfileRepo);
    vi.mocked(createProfileViewsRepository).mockReturnValue(mockViewsRepo);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 400 if startDate is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?endDate=2024-12-31'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if endDate is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if date format is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=invalid&endDate=2024-12-31'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Profile Not Found', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if user has no public profile', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockProfileRepo.findByUserId.mockResolvedValue({
        id: 'profile-123',
        slug: 'john-doe',
        user_id: 'user-123',
      });
    });

    it('should generate CSV with anonymized data', async () => {
      const mockViews = [
        {
          id: 'view-1',
          profile_id: 'profile-123',
          visitor_ip_hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          referrer: 'https://google.com/search',
          country: 'FR',
          city: 'Paris',
          galleries_viewed: ['gallery-1', 'gallery-2'],
          cta_clicked: true,
          social_links_clicked: ['instagram', 'facebook'],
          session_duration: 120,
          viewed_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 'view-2',
          profile_id: 'profile-123',
          visitor_ip_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
          referrer: null,
          country: 'US',
          city: 'New York',
          galleries_viewed: ['gallery-1'],
          cta_clicked: false,
          social_links_clicked: [],
          session_duration: 60,
          viewed_at: '2024-01-16T14:20:00Z',
        },
      ];

      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue(mockViews);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('analytics-john-doe');

      const csvContent = await response.text();

      // Check CSV structure
      expect(csvContent).toContain('Date,Heure,Visiteur ID (Anonymisé)');
      expect(csvContent).toContain('Pays,Ville,Navigateur');
      expect(csvContent).toContain('Galeries Consultées,CTA Cliqué');

      // Check data anonymization
      expect(csvContent).toContain('abcdef12...'); // IP hash truncated
      expect(csvContent).toContain('12345678...'); // IP hash truncated
      expect(csvContent).not.toContain('abcdef1234567890abcdef1234567890'); // Full hash not present

      // Check data content
      expect(csvContent).toContain('FR');
      expect(csvContent).toContain('Paris');
      expect(csvContent).toContain('Chrome');
      expect(csvContent).toContain('Oui'); // CTA clicked
      expect(csvContent).toContain('Non'); // CTA not clicked
      expect(csvContent).toContain('google.com'); // Referrer domain only
      expect(csvContent).toContain('Direct'); // No referrer
    });

    it('should handle empty analytics data', async () => {
      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);

      const csvContent = await response.text();

      // Should only contain headers
      const lines = csvContent.split('\n');
      expect(lines.length).toBe(1); // Only header line
      expect(lines[0]).toContain('Date,Heure,Visiteur ID');
    });

    it('should properly escape CSV special characters', async () => {
      const mockViews = [
        {
          id: 'view-1',
          profile_id: 'profile-123',
          visitor_ip_hash: 'abc123',
          user_agent: 'Mozilla/5.0, "Special" Browser',
          referrer: 'https://example.com/path,with,commas',
          country: 'FR',
          city: 'Paris, France',
          galleries_viewed: [],
          cta_clicked: false,
          social_links_clicked: [],
          session_duration: 0,
          viewed_at: '2024-01-15T10:30:00Z',
        },
      ];

      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue(mockViews);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const csvContent = await response.text();

      // Check that commas in data are properly escaped with quotes
      expect(csvContent).toContain('"Paris, France"');
    });
  });

  describe('GDPR Compliance', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockProfileRepo.findByUserId.mockResolvedValue({
        id: 'profile-123',
        slug: 'john-doe',
        user_id: 'user-123',
      });
    });

    it('should only include anonymized visitor IDs (truncated hash)', async () => {
      const mockViews = [
        {
          id: 'view-1',
          profile_id: 'profile-123',
          visitor_ip_hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          user_agent: 'Mozilla/5.0',
          referrer: null,
          country: null,
          city: null,
          galleries_viewed: [],
          cta_clicked: false,
          social_links_clicked: [],
          session_duration: 0,
          viewed_at: '2024-01-15T10:30:00Z',
        },
      ];

      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue(mockViews);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const csvContent = await response.text();

      // Should only show first 8 characters + "..."
      expect(csvContent).toContain('abcdef12...');
      // Should NOT contain full hash
      expect(csvContent).not.toContain('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });

    it('should only include referrer domain, not full URL', async () => {
      const mockViews = [
        {
          id: 'view-1',
          profile_id: 'profile-123',
          visitor_ip_hash: 'abc123',
          user_agent: 'Mozilla/5.0',
          referrer: 'https://google.com/search?q=photographer&source=web',
          country: null,
          city: null,
          galleries_viewed: [],
          cta_clicked: false,
          social_links_clicked: [],
          session_duration: 0,
          viewed_at: '2024-01-15T10:30:00Z',
        },
      ];

      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue(mockViews);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const csvContent = await response.text();

      // Should only show domain
      expect(csvContent).toContain('google.com');
      // Should NOT contain query parameters or path
      expect(csvContent).not.toContain('search?q=photographer');
      expect(csvContent).not.toContain('source=web');
    });

    it('should not include any personally identifiable information', async () => {
      const mockViews = [
        {
          id: 'view-1',
          profile_id: 'profile-123',
          visitor_ip_hash: 'abc123',
          user_agent: 'Mozilla/5.0',
          referrer: 'https://example.com',
          country: 'FR',
          city: 'Paris',
          galleries_viewed: [],
          cta_clicked: false,
          social_links_clicked: [],
          session_duration: 0,
          viewed_at: '2024-01-15T10:30:00Z',
        },
      ];

      mockViewsRepo.findByProfileAndDateRange.mockResolvedValue(mockViews);

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/analytics/export?startDate=2024-01-01&endDate=2024-12-31'
      );

      const response = await GET(request);
      const csvContent = await response.text();

      // Should NOT contain any email addresses, names, or full IP addresses
      expect(csvContent).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      expect(csvContent).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    });
  });
});
