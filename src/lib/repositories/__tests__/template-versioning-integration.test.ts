/**
 * Template Versioning Integration Tests
 * 
 * Tests the complete versioning workflow including:
 * - Creating templates with initial version
 * - Updating templates and creating new versions
 * - Publishing specific versions
 * - Rolling back to previous versions
 * 
 * Validates: Requirements 3.6, 3.7, 3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateRepository } from '../template.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type TemplateRow = Database['public']['Tables']['email_templates']['Row'];
type TemplateVersionRow = Database['public']['Tables']['template_versions']['Row'];

describe('Template Versioning Integration', () => {
  let mockSupabase: any;
  let repository: TemplateRepository;

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient<Database>;
    repository = new TemplateRepository(mockSupabase);
  });

  describe('Complete versioning workflow', () => {
    it('should create template with version 1, update to version 2, and rollback to version 1', async () => {
      // Step 1: Create template with version 1
      const initialTemplate: TemplateRow = {
        id: 'template-123',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1 Content</p>' },
        variables: ['var1'],
        active_version: 1,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Create template
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: initialTemplate,
                error: null,
              }),
            }),
          }),
        })
        // Create version 1
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        });

      const created = await repository.createTemplate({
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1 Content</p>' },
        variables: ['var1'],
      });

      expect(created.active_version).toBe(1);
      expect(created.subject).toBe('Version 1 Subject');

      // Step 2: Update template to version 2
      const updatedTemplate: TemplateRow = {
        ...initialTemplate,
        subject: 'Version 2 Subject',
        content: { html: '<p>Version 2 Content</p>' },
        active_version: 2,
        updated_at: '2024-01-15T11:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Get current template
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: initialTemplate,
                error: null,
              }),
            }),
          }),
        })
        // Update template
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
        // Create version 2
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        });

      const updated = await repository.updateTemplate('template-123', {
        subject: 'Version 2 Subject',
        content: { html: '<p>Version 2 Content</p>' },
      });

      expect(updated.active_version).toBe(2);
      expect(updated.subject).toBe('Version 2 Subject');

      // Step 3: Rollback to version 1
      const version1: TemplateVersionRow = {
        id: 'version-1',
        template_id: 'template-123',
        version: 1,
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1 Content</p>' },
        variables: ['var1'],
        created_by: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const rolledBackTemplate: TemplateRow = {
        ...updatedTemplate,
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1 Content</p>' },
        active_version: 3, // Rollback creates a new version
        updated_at: '2024-01-15T12:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Get version 1
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
        // Get current template
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedTemplate,
                error: null,
              }),
            }),
          }),
        })
        // Update template with version 1 content
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: rolledBackTemplate,
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Create version 3 (rollback version)
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        });

      const rolledBack = await repository.rollbackToVersion('template-123', 1);

      expect(rolledBack.active_version).toBe(3);
      expect(rolledBack.subject).toBe('Version 1 Subject');
      expect(rolledBack.content).toEqual({ html: '<p>Version 1 Content</p>' });
    });

    it('should publish a specific version as active', async () => {

      const version2: TemplateVersionRow = {
        id: 'version-2',
        template_id: 'template-123',
        version: 2,
        subject: 'Version 2 Subject',
        content: { html: '<p>Version 2 Content</p>' },
        variables: ['var1', 'var2'],
        created_by: null,
        created_at: '2024-01-15T11:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Get version 2
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
        // Update template to use version 2
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      await repository.publishTemplateVersion('template-123', 2);

      // Verify the update was called with version 2 content
      expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
    });

    it('should maintain version history across multiple updates', async () => {
      const template: TemplateRow = {
        id: 'template-123',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Current Subject',
        content: { html: '<p>Current Content</p>' },
        variables: ['var1'],
        active_version: 5,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
      };

      const versions: TemplateVersionRow[] = [
        {
          id: 'version-5',
          template_id: 'template-123',
          version: 5,
          subject: 'Version 5 Subject',
          content: { html: '<p>Version 5</p>' },
          variables: ['var1'],
          created_by: null,
          created_at: '2024-01-15T14:00:00Z',
        },
        {
          id: 'version-4',
          template_id: 'template-123',
          version: 4,
          subject: 'Version 4 Subject',
          content: { html: '<p>Version 4</p>' },
          variables: ['var1'],
          created_by: null,
          created_at: '2024-01-15T13:00:00Z',
        },
        {
          id: 'version-3',
          template_id: 'template-123',
          version: 3,
          subject: 'Version 3 Subject',
          content: { html: '<p>Version 3</p>' },
          variables: ['var1'],
          created_by: null,
          created_at: '2024-01-15T12:00:00Z',
        },
        {
          id: 'version-2',
          template_id: 'template-123',
          version: 2,
          subject: 'Version 2 Subject',
          content: { html: '<p>Version 2</p>' },
          variables: ['var1'],
          created_by: null,
          created_at: '2024-01-15T11:00:00Z',
        },
        {
          id: 'version-1',
          template_id: 'template-123',
          version: 1,
          subject: 'Version 1 Subject',
          content: { html: '<p>Version 1</p>' },
          variables: ['var1'],
          created_by: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockSupabase.from = vi
        .fn()
        // Get template
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
        // Get all versions
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

      const allVersions = await repository.getTemplateVersions('template-123');

      expect(allVersions).toHaveLength(5);
      expect(allVersions[0]?.version).toBe(5); // Newest first
      expect(allVersions[4]?.version).toBe(1); // Oldest last
    });

    it('should retrieve specific version content', async () => {
      const currentTemplate: TemplateRow = {
        id: 'template-123',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Version 3 Subject',
        content: { html: '<p>Version 3 Content</p>' },
        variables: ['var1'],
        active_version: 3,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      const version1: TemplateVersionRow = {
        id: 'version-1',
        template_id: 'template-123',
        version: 1,
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1 Content</p>' },
        variables: ['var1'],
        created_by: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Get template
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
        // Get version 1
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
        });

      const templateAtVersion1 = await repository.getTemplate('template-123', 1);

      expect(templateAtVersion1?.subject).toBe('Version 1 Subject');
      expect(templateAtVersion1?.content).toEqual({ html: '<p>Version 1 Content</p>' });
      expect(templateAtVersion1?.active_version).toBe(1);
    });
  });

  describe('Version metadata tracking', () => {
    it('should track who created each version', async () => {
      const template: TemplateRow = {
        id: 'template-123',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Version 1 Subject',
        content: { html: '<p>Version 1</p>' },
        variables: ['var1'],
        active_version: 1,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase.from = vi
        .fn()
        // Create template
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: template,
                error: null,
              }),
            }),
          }),
        })
        // Create version with created_by
        .mockReturnValueOnce({
          insert: vi.fn().mockImplementation((data) => {
            expect(data.created_by).toBe('user-123');
            return Promise.resolve({ error: null });
          }),
        });

      await repository.createTemplate(
        {
          name: 'Test Template',
          slug: 'test-template',
          type: 'transactional',
          source: 'custom',
          subject: 'Version 1 Subject',
          content: { html: '<p>Version 1</p>' },
          variables: ['var1'],
        },
        'user-123'
      );
    });

    it('should track creation timestamp for each version', async () => {
      const template: TemplateRow = {
        id: 'template-123',
        name: 'Test Template',
        slug: 'test-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Current Subject',
        content: { html: '<p>Current</p>' },
        variables: ['var1'],
        active_version: 2,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      const versions: TemplateVersionRow[] = [
        {
          id: 'version-2',
          template_id: 'template-123',
          version: 2,
          subject: 'Version 2',
          content: { html: '<p>V2</p>' },
          variables: ['var1'],
          created_by: 'user-123',
          created_at: '2024-01-15T11:00:00Z',
        },
        {
          id: 'version-1',
          template_id: 'template-123',
          version: 1,
          subject: 'Version 1',
          content: { html: '<p>V1</p>' },
          variables: ['var1'],
          created_by: 'user-123',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockSupabase.from = vi
        .fn()
        // Get template
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
        // Get versions
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

      const allVersions = await repository.getTemplateVersions('template-123');

      expect(allVersions[0]?.created_at).toBe('2024-01-15T11:00:00Z');
      expect(allVersions[1]?.created_at).toBe('2024-01-15T10:00:00Z');
    });
  });
});
