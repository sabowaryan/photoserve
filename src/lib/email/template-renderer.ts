/**
 * Template Renderer
 * 
 * Integrates the template repository with the template engine to render
 * email templates from the database. Supports both React Email and custom templates.
 * 
 * Requirements: 3.9, 3.10
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createTemplateRepository } from '@/lib/repositories/template.repository';
import { templateEngine, type RenderedEmail } from './template-engine';
import { NotFoundError } from '@/lib/errors';

/**
 * Template renderer that loads templates from database and renders them
 */
export class TemplateRenderer {
  private templateRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.templateRepository = createTemplateRepository(supabase);
  }

  /**
   * Render a template by slug
   * 
   * @param slug - Template slug (e.g., 'purchase-confirmation')
   * @param variables - Variables to pass to the template
   * @param version - Optional specific version to render
   * @returns Promise resolving to rendered email
   */
  async renderBySlug(
    slug: string,
    variables: Record<string, any>,
    version?: number
  ): Promise<RenderedEmail> {
    // Find template by slug
    const templates = await this.templateRepository.listTemplates({
      search: slug,
      status: 'active',
    });

    const template = templates.find((t) => t.slug === slug);

    if (!template) {
      throw new NotFoundError(`Email template with slug "${slug}"`);
    }

    return this.renderById(template.id, variables, version);
  }

  /**
   * Render a template by ID
   * 
   * @param templateId - Template ID
   * @param variables - Variables to pass to the template
   * @param version - Optional specific version to render
   * @returns Promise resolving to rendered email
   */
  async renderById(
    templateId: string,
    variables: Record<string, any>,
    version?: number
  ): Promise<RenderedEmail> {
    // Get template from database
    const template = await this.templateRepository.getTemplate(templateId, version);

    if (!template) {
      throw new NotFoundError(`Email template with ID "${templateId}"`);
    }

    // Get required variables from content metadata
    const content = template.content as any;
    const requiredVariables = content.requiredVariables || [];

    // Validate only required variables
    const validation = templateEngine.validateVariables(
      requiredVariables,
      variables
    );

    if (!validation.valid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Render based on template source
    if (template.source === 'react-email') {
      return this.renderReactEmailTemplate(template, variables);
    } else {
      return this.renderCustomTemplate(template, variables);
    }
  }

  /**
   * Render a React Email template
   * 
   * @param template - Template record from database
   * @param variables - Variables to pass to the template
   * @returns Promise resolving to rendered email
   */
  private async renderReactEmailTemplate(
    template: any,
    variables: Record<string, any>
  ): Promise<RenderedEmail> {
    // Extract component path from content
    const content = template.content as any;
    const componentPath = content.componentPath;

    if (!componentPath) {
      throw new Error('React Email template missing componentPath in content');
    }

    // Extract the template name from the path
    // e.g., 'src/emails/purchase-confirmation.tsx' -> 'purchase-confirmation'
    const templateName = componentPath
      .replace(/^src\/emails\//, '')
      .replace(/\.tsx?$/, '');

    // Render using template engine
    const rendered = await templateEngine.renderReactEmail(templateName, variables);

    // Substitute variables in subject line
    const subject = templateEngine.substituteVariables(template.subject, variables);

    return {
      ...rendered,
      subject,
    };
  }

  /**
   * Render a custom WYSIWYG template
   * 
   * @param template - Template record from database
   * @param variables - Variables to pass to the template
   * @returns Promise resolving to rendered email
   */
  private async renderCustomTemplate(
    template: any,
    variables: Record<string, any>
  ): Promise<RenderedEmail> {
    // Extract HTML content from template
    const content = template.content as any;
    const html = content.html || '';

    // Render using template engine
    return templateEngine.renderCustomTemplate(
      {
        html,
        subject: template.subject,
        requiredVariables: template.variables as string[],
      },
      variables
    );
  }

  /**
   * Generate a preview of a template
   * 
   * @param slug - Template slug
   * @param sampleData - Sample data for preview
   * @returns Promise resolving to rendered preview
   */
  async generatePreview(
    slug: string,
    sampleData?: Record<string, any>
  ): Promise<RenderedEmail> {
    // Find template by slug
    const templates = await this.templateRepository.listTemplates({
      search: slug,
      status: 'active',
    });

    const template = templates.find((t) => t.slug === slug);

    if (!template) {
      throw new NotFoundError(`Email template with slug "${slug}"`);
    }

    // Use provided sample data or generate default values
    const variables = sampleData || this.generateSampleData(template);

    return this.renderById(template.id, variables);
  }

  /**
   * Generate sample data for a template
   * 
   * @param template - Template record
   * @returns Sample data object
   */
  private generateSampleData(template: any): Record<string, any> {
    const sampleData: Record<string, any> = {};
    const variables = template.variables as string[];

    for (const varName of variables) {
      // Generate sample values based on variable name
      if (varName.includes('email') || varName.includes('Email')) {
        sampleData[varName] = 'example@example.com';
      } else if (varName.includes('name') || varName.includes('Name')) {
        sampleData[varName] = 'John Doe';
      } else if (varName.includes('amount') || varName.includes('Amount')) {
        sampleData[varName] = '$99.99';
      } else if (varName.includes('date') || varName.includes('Date')) {
        sampleData[varName] = new Date().toLocaleDateString();
      } else if (varName.includes('count') || varName.includes('Count')) {
        sampleData[varName] = 42;
      } else if (varName.includes('link') || varName.includes('Link') || varName.includes('url') || varName.includes('Url')) {
        sampleData[varName] = 'https://example.com';
      } else if (varName.includes('id') || varName.includes('Id') || varName.includes('ID')) {
        sampleData[varName] = 'abc123xyz';
      } else {
        sampleData[varName] = `Sample ${varName}`;
      }
    }

    return sampleData;
  }
}

/**
 * Factory function to create a TemplateRenderer instance
 */
export function createTemplateRenderer(
  supabase: SupabaseClient<Database>
): TemplateRenderer {
  return new TemplateRenderer(supabase);
}
