/**
 * Email API Integration Tests
 * 
 * Tests for email API routes with authentication, rate limiting, and validation
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as sendEmail } from '../send/route';
import { POST as scheduleEmail } from '../schedule/route';
import { GET as listTemplates, POST as createTemplate } from '../templates/route';
import { GET as getTemplate, PUT as updateTemplate, DELETE as deleteTemplate } from '../templates/[id]/route';
import { GET as listLogs } from '../logs/route';
import { GET as getAnalytics } from '../analytics/route';

// Mock dependencies
vi.mock('@/lib/middleware/admin-auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimitMiddleware: vi.fn(() => null),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/services/email.service');
vi.mock('@/lib/services/email-analytics.service');
vi.mock('@/lib/repositories/template.repository');
vi.mock('@/lib/email/template-engine');

import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email.service';
import { AnalyticsService } from '@/lib/services/email-analytics.service';
import { createTemplateRepository } from '@/lib/repositories/template.repository';

describe('Email API Routes', () => {
  const mockUserId = 'user-123';
  
  // Create a chainable query builder mock
  const createQueryBuilder = () => {
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
    };
    return builder;
  };

  const mockSupabase = {
    from: vi.fn(() => createQueryBuilder()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful admin authentication by default
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: mockUserId,
      isAdmin: true,
      isFirstAdminAccess: false,
    });
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
  });

  describe('POST /api/emails/send', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        status: 401,
      });

      const request = new NextRequest('http://localhost:3000/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
          type: 'transactional',
        }),
      });

      const response = await sendEmail(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should send transactional email successfully', async () => {
      const mockEmailService = {
        sendTransactionalEmail: vi.fn().mockResolvedValue({
          id: 'email-123',
          success: true,
        }),
      };
      
      vi.mocked(EmailService).mockImplementation(function(this: any) {
        return mockEmailService;
      } as any);

      const request = new NextRequest('http://localhost:3000/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          type: 'transactional',
        }),
      });

      const response = await sendEmail(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('email-123');
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalled();
    });

    it('should validate email parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'invalid-email',
          subject: 'Test',
          html: '<p>Test</p>',
          type: 'transactional',
        }),
      });

      const response = await sendEmail(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('POST /api/emails/schedule', () => {
    it('should schedule email successfully', async () => {
      const mockEmailService = {
        scheduleEmail: vi.fn().mockResolvedValue({
          id: 'email-123',
          success: true,
        }),
      };
      
      vi.mocked(EmailService).mockImplementation(function(this: any) {
        return mockEmailService;
      } as any);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const request = new NextRequest('http://localhost:3000/api/emails/schedule', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Scheduled Email',
          html: '<p>Test content</p>',
          type: 'transactional',
          scheduledAt: futureDate,
        }),
      });

      const response = await scheduleEmail(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('email-123');
      expect(mockEmailService.scheduleEmail).toHaveBeenCalled();
    });

    it('should reject past scheduled times', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const request = new NextRequest('http://localhost:3000/api/emails/schedule', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Scheduled Email',
          html: '<p>Test content</p>',
          type: 'transactional',
          scheduledAt: pastDate,
        }),
      });

      const response = await scheduleEmail(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('future');
    });
  });

  describe('GET /api/emails/templates', () => {
    it('should list templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Welcome Email',
          slug: 'welcome-email',
          type: 'transactional',
          source: 'custom',
          subject: 'Welcome!',
          content: {},
          variables: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockRepo = {
        listTemplates: vi.fn().mockResolvedValue(mockTemplates),
      };

      vi.mocked(createTemplateRepository).mockReturnValue(mockRepo as any);

      const request = new NextRequest('http://localhost:3000/api/emails/templates?page=1&limit=20');

      const response = await listTemplates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(mockRepo.listTemplates).toHaveBeenCalled();
    });
  });

  describe('POST /api/emails/templates', () => {
    it('should create template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'New Template',
        slug: 'new-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Test Subject',
        content: {},
        variables: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockRepo = {
        createTemplate: vi.fn().mockResolvedValue(mockTemplate),
      };

      vi.mocked(createTemplateRepository).mockReturnValue(mockRepo as any);

      const request = new NextRequest('http://localhost:3000/api/emails/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Template',
          slug: 'new-template',
          type: 'transactional',
          source: 'custom',
          subject: 'Test Subject',
          content: {},
          variables: [],
        }),
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.template.name).toBe('New Template');
      expect(mockRepo.createTemplate).toHaveBeenCalled();
    });

    it('should validate template slug format', async () => {
      const request = new NextRequest('http://localhost:3000/api/emails/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Template',
          slug: 'Invalid Slug!',
          type: 'transactional',
          source: 'custom',
          subject: 'Test Subject',
          content: {},
        }),
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/emails/templates/[id]', () => {
    it('should get template by ID', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Test Subject',
        content: {},
        variables: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockRepo = {
        getTemplate: vi.fn().mockResolvedValue(mockTemplate),
      };

      vi.mocked(createTemplateRepository).mockReturnValue(mockRepo as any);

      const request = new NextRequest('http://localhost:3000/api/emails/templates/template-1');
      const params = Promise.resolve({ id: 'template-1' });

      const response = await getTemplate(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.id).toBe('template-1');
      expect(mockRepo.getTemplate).toHaveBeenCalledWith('template-1', undefined);
    });
  });

  describe('PUT /api/emails/templates/[id]', () => {
    it('should update template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Updated Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Updated Subject',
        content: {},
        variables: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockRepo = {
        updateTemplate: vi.fn().mockResolvedValue(mockTemplate),
      };

      vi.mocked(createTemplateRepository).mockReturnValue(mockRepo as any);

      const request = new NextRequest('http://localhost:3000/api/emails/templates/template-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Template',
          subject: 'Updated Subject',
        }),
      });
      const params = Promise.resolve({ id: 'template-1' });

      const response = await updateTemplate(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.name).toBe('Updated Template');
      expect(mockRepo.updateTemplate).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/emails/templates/[id]', () => {
    it('should delete template successfully', async () => {
      const mockRepo = {
        deleteTemplate: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(createTemplateRepository).mockReturnValue(mockRepo as any);

      const request = new NextRequest('http://localhost:3000/api/emails/templates/template-1', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: 'template-1' });

      const response = await deleteTemplate(request, { params });

      expect(response.status).toBe(204);
      expect(mockRepo.deleteTemplate).toHaveBeenCalledWith('template-1');
    });
  });

  describe('GET /api/emails/logs', () => {
    it('should list email logs successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/emails/logs?page=1&limit=20');

      const response = await listLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logs');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
    });

    it('should filter logs by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/emails/logs?status=sent&page=1&limit=20');

      const response = await listLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logs');
    });
  });

  describe('GET /api/emails/analytics', () => {
    it('should get system analytics successfully', async () => {
      const mockAnalytics = {
        sent: 100,
        delivered: 95,
        opened: 50,
        clicked: 20,
        bounced: 5,
        complained: 0,
        failed: 0,
        openRate: 52.63,
        clickRate: 21.05,
        bounceRate: 5.0,
        complaintRate: 0,
        deliveryRate: 95.0,
        uniqueTemplates: 5,
        uniqueSenders: 2,
        averagePerDay: 10.5,
      };

      const mockService = {
        getSystemAnalytics: vi.fn().mockResolvedValue(mockAnalytics),
      };

      vi.mocked(AnalyticsService).mockImplementation(function(this: any) {
        return mockService;
      } as any);

      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();

      const request = new NextRequest(
        `http://localhost:3000/api/emails/analytics?from=${from}&to=${to}`
      );

      const response = await getAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics).toEqual(mockAnalytics);
      expect(mockService.getSystemAnalytics).toHaveBeenCalled();
    });

    it('should get template-specific analytics', async () => {
      const mockAnalytics = {
        templateId: '550e8400-e29b-41d4-a716-446655440000',
        templateName: 'Welcome Email',
        sent: 50,
        delivered: 48,
        opened: 30,
        clicked: 15,
        bounced: 2,
        complained: 0,
        failed: 0,
        openRate: 62.5,
        clickRate: 31.25,
        bounceRate: 4.0,
        complaintRate: 0,
        deliveryRate: 96.0,
      };

      const mockService = {
        getTemplateAnalytics: vi.fn().mockResolvedValue(mockAnalytics),
      };

      vi.mocked(AnalyticsService).mockImplementation(function(this: any) {
        return mockService;
      } as any);

      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      const templateId = '550e8400-e29b-41d4-a716-446655440000';

      const request = new NextRequest(
        `http://localhost:3000/api/emails/analytics?from=${from}&to=${to}&templateId=${templateId}`
      );

      const response = await getAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.templateId).toBe(templateId);
      expect(mockService.getTemplateAnalytics).toHaveBeenCalledWith(
        templateId,
        expect.any(Object)
      );
    });
  });
});
