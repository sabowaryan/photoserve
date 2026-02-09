/**
 * Template Repository
 * Data access layer for managing email templates with versioning support
 * 
 * Requirements: 3.6, 3.7, 3.8
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError } from '@/lib/errors';

type TemplateRow = Database['public']['Tables']['email_templates']['Row'];
type TemplateInsert = Database['public']['Tables']['email_templates']['Insert'];
type TemplateUpdate = Database['public']['Tables']['email_templates']['Update'];
type TemplateVersionRow = Database['public']['Tables']['template_versions']['Row'];
type TemplateVersionInsert = Database['public']['Tables']['template_versions']['Insert'];

export interface TemplateFilters {
  type?: 'transactional' | 'marketing';
  source?: 'react-email' | 'custom';
  status?: 'active' | 'inactive';
  search?: string;
}

export interface ITemplateRepository {
  // Basic CRUD operations
  createTemplate(data: TemplateInsert, createdBy?: string): Promise<TemplateRow>;
  updateTemplate(id: string, data: TemplateUpdate, createdBy?: string): Promise<TemplateRow>;
  getTemplate(id: string, version?: number): Promise<TemplateRow | null>;
  listTemplates(filters?: TemplateFilters): Promise<TemplateRow[]>;
  deleteTemplate(id: string): Promise<void>;
  
  // Version management
  getTemplateVersions(templateId: string): Promise<TemplateVersionRow[]>;
  publishTemplateVersion(templateId: string, version: number): Promise<void>;
  rollbackToVersion(templateId: string, version: number, createdBy?: string): Promise<TemplateRow>;
}

export class TemplateRepository implements ITemplateRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new email template
   * Automatically creates version 1
   * Requirements: 3.6
   */
  async createTemplate(data: TemplateInsert, createdBy?: string): Promise<TemplateRow> {
    // Start a transaction by creating the template first
    const { data: template, error: templateError } = await this.supabase
      .from('email_templates')
      .insert({
        ...data,
        active_version: 1,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Create the initial version
    const versionData: TemplateVersionInsert = {
      template_id: template.id,
      version: 1,
      subject: data.subject,
      content: data.content,
      variables: data.variables || [],
      created_by: createdBy || null,
    };

    const { error: versionError } = await this.supabase
      .from('template_versions')
      .insert(versionData);

    if (versionError) {
      // Rollback: delete the template if version creation fails
      await this.supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id);
      throw versionError;
    }

    return template;
  }

  /**
   * Update an existing email template
   * Automatically creates a new version with incremented version number
   * Requirements: 3.7
   */
  async updateTemplate(id: string, data: TemplateUpdate, createdBy?: string): Promise<TemplateRow> {
    // Get the current template to determine next version number
    const currentTemplate = await this.getTemplate(id);
    if (!currentTemplate) {
      throw new NotFoundError('Email template');
    }

    const nextVersion = (currentTemplate.active_version ?? 0) + 1;

    // Update the template
    const { data: updatedTemplate, error: updateError } = await this.supabase
      .from('email_templates')
      .update({
        ...data,
        active_version: nextVersion,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new NotFoundError('Email template');
      }
      throw updateError;
    }

    // Create a new version record
    const versionData: TemplateVersionInsert = {
      template_id: id,
      version: nextVersion,
      subject: data.subject || currentTemplate.subject,
      content: data.content || currentTemplate.content,
      variables: data.variables || currentTemplate.variables,
      created_by: createdBy || null,
    };

    const { error: versionError } = await this.supabase
      .from('template_versions')
      .insert(versionData);

    if (versionError) {
      // Note: In a production system, you might want to handle this more gracefully
      // For now, we'll throw the error but the template update has already been committed
      throw versionError;
    }

    return updatedTemplate;
  }

  /**
   * Get a template by ID, optionally at a specific version
   * If version is not specified, returns the template with active version content
   * Requirements: 3.6
   */
  async getTemplate(id: string, version?: number): Promise<TemplateRow | null> {
    const { data: template, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // If a specific version is requested and it's not the active version,
    // fetch that version's content
    if (version !== undefined && version !== template.active_version) {
      const { data: versionData, error: versionError } = await this.supabase
        .from('template_versions')
        .select('*')
        .eq('template_id', id)
        .eq('version', version)
        .single();

      if (versionError) {
        if (versionError.code === 'PGRST116') {
          throw new NotFoundError(`Template version ${version}`);
        }
        throw versionError;
      }

      // Return template with version-specific content
      return {
        ...template,
        subject: versionData.subject,
        content: versionData.content,
        variables: versionData.variables,
        active_version: version,
      };
    }

    return template;
  }

  /**
   * List templates with optional filters
   * Supports filtering by type, source, status, and search
   * Requirements: 3.6
   */
  async listTemplates(filters?: TemplateFilters): Promise<TemplateRow[]> {
    let query = this.supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.search) {
      // Search in name, slug, and subject
      query = query.or(
        `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Soft delete a template by marking it as inactive
   * Requirements: 3.6
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Email template');
      }
      throw error;
    }
  }

  /**
   * Get all versions of a template
   * Returns versions in descending order (newest first)
   * Requirements: 3.7
   */
  async getTemplateVersions(templateId: string): Promise<TemplateVersionRow[]> {
    // First verify the template exists
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new NotFoundError('Email template');
    }

    const { data, error } = await this.supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Publish a specific version as the active version
   * Updates the template's active_version field
   * Requirements: 3.8
   */
  async publishTemplateVersion(templateId: string, version: number): Promise<void> {
    // Verify the version exists
    const { data: versionData, error: versionError } = await this.supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .eq('version', version)
      .single();

    if (versionError) {
      if (versionError.code === 'PGRST116') {
        throw new NotFoundError(`Template version ${version}`);
      }
      throw versionError;
    }

    // Update the template to use this version
    const { error: updateError } = await this.supabase
      .from('email_templates')
      .update({
        active_version: version,
        subject: versionData.subject,
        content: versionData.content,
        variables: versionData.variables,
      })
      .eq('id', templateId);

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new NotFoundError('Email template');
      }
      throw updateError;
    }
  }

  /**
   * Rollback to a previous version
   * Creates a new version with the content from the specified version
   * Requirements: 3.8
   */
  async rollbackToVersion(
    templateId: string,
    version: number,
    createdBy?: string
  ): Promise<TemplateRow> {
    // Get the version to rollback to
    const { data: targetVersion, error: versionError } = await this.supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .eq('version', version)
      .single();

    if (versionError) {
      if (versionError.code === 'PGRST116') {
        throw new NotFoundError(`Template version ${version}`);
      }
      throw versionError;
    }

    // Get the current template to determine next version number
    const currentTemplate = await this.getTemplate(templateId);
    if (!currentTemplate) {
      throw new NotFoundError('Email template');
    }

    const nextVersion = (currentTemplate.active_version ?? 0) + 1;

    // Update the template with content from the target version
    const { data: updatedTemplate, error: updateError } = await this.supabase
      .from('email_templates')
      .update({
        subject: targetVersion.subject,
        content: targetVersion.content,
        variables: targetVersion.variables,
        active_version: nextVersion,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new NotFoundError('Email template');
      }
      throw updateError;
    }

    // Create a new version record (rollback creates a new version)
    const newVersionData: TemplateVersionInsert = {
      template_id: templateId,
      version: nextVersion,
      subject: targetVersion.subject,
      content: targetVersion.content,
      variables: targetVersion.variables,
      created_by: createdBy || null,
    };

    const { error: newVersionError } = await this.supabase
      .from('template_versions')
      .insert(newVersionData);

    if (newVersionError) {
      throw newVersionError;
    }

    return updatedTemplate;
  }
}

/**
 * Factory function to create a TemplateRepository instance
 */
export function createTemplateRepository(
  supabase: SupabaseClient<Database>
): ITemplateRepository {
  return new TemplateRepository(supabase);
}
