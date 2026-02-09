/**
 * Unit Tests for Template Repository
 * 
 * Tests the data access layer for managing email templates with versioning
 * Validates: Requirements 3.6, 3.7, 3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateRepository } from '../template.repository';
import { NotFoundError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type TemplateRow = Database['public']['Tables']['email_templates']['Row'];
type TemplateInsert = Database['public']['Tables']['email_templates']['Insert'];
type TemplateVersionRow = Database['public']['Tables']['template_versions']['Row'];

/**
 * Helper to create a sample template
 */
function createSampleTemplate(overrides?: Partial<TemplateRow>): TemplateRow {
  return {
    id: 'template-123',
    name: 'Purchase Confirmation',
    slug: 'purchase-confirmation',
    type: 'transactional',
    source: 'react-email',
    subject: 'Your purchase is confirmed',
    content: { html: '<p>Thank you for your purchase</p>' },
    variables: ['buyerName', 'galleryName', 'photoCount'],
    active_version: 1,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Helper to create a sample template version
 */
function createSampleVersion(overrides?: Partial<TemplateVersionRow>): TemplateVersionRow {
  return {
    id: 'version-123',
    template_id: 'template-123',
    version: 1,
    subject: 'Your purchase is confirmed',
    content: { html: '<p>Thank you for your purchase</p>' },
    variables: ['buyerName', 'galleryName', 'photoCount'],
    created_by: null,
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('TemplateRepository', () => {
  let mockSupabase: any;
  let repository: TemplateRepository;

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient<Database>;
    repository = new TemplateRepository(mockSupabase);
  });

  describe('createTemplate', () => {
    it('should create a new template with version 1', async () => {
      const newTemplate: TemplateInsert = {
        name: 'Purchase Confirmation',
        slug: 'purchase-confirmation',
        type: 'transactional',
        source: 'react-email',
        subject: 'Your purchase is confirmed',
        content: { html: '<p>Thank you for your purchase</p>' },
        variables: ['buyerName', 'galleryName', 'photoCount'],
      };
      const createdTemplate = createSampleTemplate();

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: createdTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        });

      const result = await repository.createTemplate(newTemplate, 'user-123');

      expect(result).toEqual(createdTemplate);
      expect(result.active_version).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockSupabase.from).toHaveBeenCalledWith('template_versions');
    });

    it('should rollback template creation if version creation fails', async () => {
      const newTemplate: TemplateInsert = {
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Test Subject',
        content: { html: '<p>Test</p>' },
      };
      const createdTemplate = createSampleTemplate();

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: createdTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: { code: 'DB_ERROR', message: 'Version creation failed' },
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        });

      await expect(repository.createTemplate(newTemplate)).rejects.toThrow();
    });

    it('should throw error on database failure', async () => {
      const newTemplate: TemplateInsert = {
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Test Subject',
        content: { html: '<p>Test</p>' },
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.createTemplate(newTemplate)).rejects.toThrow();
    });
  });

  describe('updateTemplate', () => {
    it('should update template and create new version', async () => {
      const currentTemplate = createSampleTemplate({ active_version: 1 });
      const updatedTemplate = createSampleTemplate({
        subject: 'Updated Subject',
        active_version: 2,
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: currentTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedTemplate,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        });

      const result = await repository.updateTemplate(
        'template-123',
        { subject: 'Updated Subject' },
        'user-123'
      );

      expect(result).toEqual(updatedTemplate);
      expect(result.active_version).toBe(2);
    });

    it('should throw NotFoundError when template does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(
        repository.updateTemplate('non-existent', { subject: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle version creation failure', async () => {
      const currentTemplate = createSampleTemplate({ active_version: 1 });
      const updatedTemplate = createSampleTemplate({ active_version: 2 });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: currentTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedTemplate,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: { code: 'DB_ERROR', message: 'Version creation failed' },
          }),
        });

      await expect(
        repository.updateTemplate('template-123', { subject: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('getTemplate', () => {
    it('should get template by ID with active version', async () => {
      const template = createSampleTemplate();

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: template,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.getTemplate('template-123');

      expect(result).toEqual(template);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
    });

    it('should get template at specific version', async () => {
      const template = createSampleTemplate({ active_version: 3 });
      const version2 = createSampleVersion({
        version: 2,
        subject: 'Version 2 Subject',
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version2,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const result = await repository.getTemplate('template-123', 2);

      expect(result?.subject).toBe('Version 2 Subject');
      expect(result?.active_version).toBe(2);
    });

    it('should return null when template does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await repository.getTemplate('non-existent');

      expect(result).toBeNull();
    });

    it('should throw NotFoundError when specific version does not exist', async () => {
      const template = createSampleTemplate({ active_version: 3 });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          }),
        });

      await expect(repository.getTemplate('template-123', 99)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.getTemplate('template-123')).rejects.toThrow();
    });
  });

  describe('listTemplates', () => {
    it('should list all templates without filters', async () => {
      const templates = [
        createSampleTemplate({ id: 'template-1', name: 'Template 1' }),
        createSampleTemplate({ id: 'template-2', name: 'Template 2' }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: templates,
            error: null,
          }),
        }),
      });

      const result = await repository.listTemplates();

      expect(result).toEqual(templates);
      expect(result).toHaveLength(2);
    });

    it('should filter templates by type', async () => {
      const transactionalTemplates = [
        createSampleTemplate({ id: 'template-1', type: 'transactional' }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: transactionalTemplates,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.listTemplates({ type: 'transactional' });

      expect(result).toEqual(transactionalTemplates);
    });

    it('should filter templates by source', async () => {
      const reactTemplates = [
        createSampleTemplate({ id: 'template-1', source: 'react-email' }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: reactTemplates,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.listTemplates({ source: 'react-email' });

      expect(result).toEqual(reactTemplates);
    });

    it('should filter templates by active status', async () => {
      const activeTemplates = [
        createSampleTemplate({ id: 'template-1', is_active: true }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: activeTemplates,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.listTemplates({ status: 'active' });

      expect(result).toEqual(activeTemplates);
    });

    it('should filter templates by search term', async () => {
      const searchResults = [
        createSampleTemplate({ id: 'template-1', name: 'Purchase Confirmation' }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              data: searchResults,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.listTemplates({ search: 'purchase' });

      expect(result).toEqual(searchResults);
    });

    it('should return empty array when no templates exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await repository.listTemplates();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' },
          }),
        }),
      });

      await expect(repository.listTemplates()).rejects.toThrow();
    });
  });

  describe('deleteTemplate', () => {
    it('should soft delete a template by marking it inactive', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(repository.deleteTemplate('template-123')).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
    });

    it('should throw NotFoundError when template does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      });

      await expect(repository.deleteTemplate('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'DB_ERROR', message: 'Database error' },
          }),
        }),
      });

      await expect(repository.deleteTemplate('template-123')).rejects.toThrow();
    });
  });

  describe('getTemplateVersions', () => {
    it('should get all versions of a template', async () => {
      const template = createSampleTemplate();
      const versions = [
        createSampleVersion({ version: 3 }),
        createSampleVersion({ version: 2 }),
        createSampleVersion({ version: 1 }),
      ];

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: versions,
                error: null,
              }),
            }),
          }),
        });

      const result = await repository.getTemplateVersions('template-123');

      expect(result).toEqual(versions);
      expect(result).toHaveLength(3);
      expect(result[0]?.version).toBe(3); // Newest first
    });

    it('should throw NotFoundError when template does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(repository.getTemplateVersions('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should return empty array when template has no versions', async () => {
      const template = createSampleTemplate();

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });

      const result = await repository.getTemplateVersions('template-123');

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      const template = createSampleTemplate();

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Database error' },
              }),
            }),
          }),
        });

      await expect(repository.getTemplateVersions('template-123')).rejects.toThrow();
    });
  });

  describe('publishTemplateVersion', () => {
    it('should publish a specific version as active', async () => {
      const version2 = createSampleVersion({
        version: 2,
        subject: 'Version 2 Subject',
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version2,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        });

      await expect(
        repository.publishTemplateVersion('template-123', 2)
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundError when version does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      await expect(
        repository.publishTemplateVersion('template-123', 99)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when template does not exist during update', async () => {
      const version2 = createSampleVersion({ version: 2 });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version2,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

      await expect(
        repository.publishTemplateVersion('template-123', 2)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      await expect(
        repository.publishTemplateVersion('template-123', 2)
      ).rejects.toThrow();
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback to a previous version by creating a new version', async () => {
      const version1 = createSampleVersion({
        version: 1,
        subject: 'Original Subject',
      });
      const currentTemplate = createSampleTemplate({ active_version: 3 });
      const updatedTemplate = createSampleTemplate({
        subject: 'Original Subject',
        active_version: 4,
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version1,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: currentTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedTemplate,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        });

      const result = await repository.rollbackToVersion('template-123', 1, 'user-123');

      expect(result).toEqual(updatedTemplate);
      expect(result.active_version).toBe(4);
      expect(result.subject).toBe('Original Subject');
    });

    it('should throw NotFoundError when target version does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      await expect(
        repository.rollbackToVersion('template-123', 99)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when template does not exist', async () => {
      const version1 = createSampleVersion({ version: 1 });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version1,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        });

      await expect(
        repository.rollbackToVersion('non-existent', 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when new version creation fails', async () => {
      const version1 = createSampleVersion({ version: 1 });
      const currentTemplate = createSampleTemplate({ active_version: 3 });
      const updatedTemplate = createSampleTemplate({ active_version: 4 });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: version1,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: currentTemplate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedTemplate,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: { code: 'DB_ERROR', message: 'Version creation failed' },
          }),
        });

      await expect(
        repository.rollbackToVersion('template-123', 1)
      ).rejects.toThrow();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      await expect(
        repository.rollbackToVersion('template-123', 1)
      ).rejects.toThrow();
    });
  });
});
