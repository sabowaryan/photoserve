/**
 * Email Template Engine
 * 
 * This module provides template rendering capabilities for both React Email templates
 * and custom WYSIWYG templates. It handles variable substitution, CSS inlining,
 * plain text conversion, and template validation.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { render } from '@react-email/components';
import juice from 'juice';
import { convert as htmlToText } from 'html-to-text';
import { createElement } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Rendered email output
 */
export interface RenderedEmail {
  /** HTML content with inlined CSS */
  html: string;
  
  /** Plain text version */
  text: string;
  
  /** Email subject line */
  subject: string;
}

/**
 * Template validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** List of missing required variables */
  missingVariables: string[];
  
  /** List of extra variables provided but not used */
  extraVariables: string[];
  
  /** Validation error messages */
  errors: string[];
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Template name */
  name: string;
  
  /** Template slug/identifier */
  slug: string;
  
  /** Template type */
  type: 'transactional' | 'marketing';
  
  /** Template source */
  source: 'react-email' | 'custom';
  
  /** Subject line template (may contain variables) */
  subject: string;
  
  /** Required variables */
  requiredVariables: string[];
  
  /** Optional variables */
  optionalVariables?: string[];
}

/**
 * Custom template content (for WYSIWYG templates)
 */
export interface CustomTemplateContent {
  /** HTML content */
  html: string;
  
  /** Subject line template */
  subject: string;
  
  /** Required variables */
  requiredVariables: string[];
}

// ============================================================================
// Template Engine Class
// ============================================================================

/**
 * Template engine for rendering email templates
 * 
 * Supports both React Email templates and custom WYSIWYG templates.
 * Provides variable substitution, validation, and format conversion.
 */
export class TemplateEngine {
  /**
   * Render a React Email template
   * 
   * @param templateName - Name of the React Email template component
   * @param variables - Variables to pass to the template
   * @returns Promise resolving to rendered email
   */
  async renderReactEmail(
    templateName: string,
    variables: Record<string, any>
  ): Promise<RenderedEmail> {
    try {
      // Check cache first
      const { getRenderedTemplate, setRenderedTemplate, shouldUseCache } = await import('@/lib/cache/email-cache');
      
      if (shouldUseCache('rendered')) {
        const cached = getRenderedTemplate(templateName, variables);
        if (cached) {
          return cached;
        }
      }
      
      // Dynamically import the template
      const templateModule = await this.loadReactEmailTemplate(templateName);
      
      if (!templateModule) {
        throw new Error(`Template "${templateName}" not found`);
      }
      
      // Get the template component
      const TemplateComponent = templateModule.default || templateModule;
      
      // Render the React component to HTML
      const html = await render(createElement(TemplateComponent, variables));
      
      // Inline CSS for email client compatibility
      const htmlWithInlinedCSS = this.inlineCSS(html);
      
      // Convert to plain text
      const text = this.convertToPlainText(htmlWithInlinedCSS);
      
      // Extract subject from variables or use default
      const subject = variables.subject || this.extractSubjectFromTemplate(templateName);
      
      const result = {
        html: htmlWithInlinedCSS,
        text,
        subject,
      };
      
      // Cache the rendered result
      if (shouldUseCache('rendered')) {
        setRenderedTemplate(templateName, variables, result);
      }
      
      return result;
    } catch (error) {
      throw new Error(
        `Failed to render React Email template "${templateName}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Render a custom template from WYSIWYG editor
   * 
   * @param content - Custom template content
   * @param variables - Variables to substitute
   * @returns Promise resolving to rendered email
   */
  async renderCustomTemplate(
    content: CustomTemplateContent,
    variables: Record<string, any>
  ): Promise<RenderedEmail> {
    try {
      // Check cache first (use content hash as template ID)
      const { getRenderedTemplate, setRenderedTemplate, shouldUseCache } = await import('@/lib/cache/email-cache');
      const templateId = this.hashContent(content);
      
      if (shouldUseCache('rendered')) {
        const cached = getRenderedTemplate(templateId, variables);
        if (cached) {
          return cached;
        }
      }
      
      // Substitute variables in HTML content
      const htmlWithVariables = this.substituteVariables(content.html, variables);
      
      // Substitute variables in subject
      const subject = this.substituteVariables(content.subject, variables);
      
      // Inline CSS for email client compatibility
      const html = this.inlineCSS(htmlWithVariables);
      
      // Convert to plain text
      const text = this.convertToPlainText(html);
      
      const result = {
        html,
        text,
        subject,
      };
      
      // Cache the rendered result
      if (shouldUseCache('rendered')) {
        setRenderedTemplate(templateId, variables, result);
      }
      
      return result;
    } catch (error) {
      throw new Error(
        `Failed to render custom template: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Substitute variables in template content
   * 
   * Supports Handlebars-like syntax: {{variableName}} or {variableName}
   * Also supports nested properties: {{user.name}} or {user.name}
   * 
   * @param template - Template string with variable placeholders
   * @param variables - Variables to substitute
   * @returns Template with variables substituted
   */
  substituteVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    // Replace {{variableName}} and {variableName} patterns
    return template.replace(
      /\{\{?\s*([a-zA-Z0-9_.]+)\s*\}?\}/g,
      (_match, variablePath) => {
        // Get nested property value (e.g., "user.name" -> variables.user.name)
        const value = this.getNestedProperty(variables, variablePath);
        
        // Return the value or empty string if not found
        return value !== undefined && value !== null ? String(value) : '';
      }
    );
  }
  
  /**
   * Validate that all required variables are provided
   * 
   * @param requiredVariables - List of required variable names
   * @param providedVariables - Variables provided for rendering
   * @returns Validation result
   */
  validateVariables(
    requiredVariables: string[],
    providedVariables: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    const missingVariables: string[] = [];
    const extraVariables: string[] = [];
    
    // Check for missing required variables
    for (const varName of requiredVariables) {
      if (!(varName in providedVariables)) {
        missingVariables.push(varName);
        errors.push(`Missing required variable: ${varName}`);
      }
    }
    
    // Check for extra variables (informational only, not an error)
    const providedKeys = Object.keys(providedVariables);
    for (const varName of providedKeys) {
      if (!requiredVariables.includes(varName)) {
        extraVariables.push(varName);
      }
    }
    
    return {
      valid: missingVariables.length === 0,
      missingVariables,
      extraVariables,
      errors,
    };
  }
  
  /**
   * Generate a preview of a template with sample data
   * 
   * @param templateIdOrName - Template ID (for database templates) or name (for React Email)
   * @param sampleData - Sample data for preview (optional)
   * @returns Promise resolving to rendered preview
   */
  async generatePreview(
    templateIdOrName: string,
    sampleData?: Record<string, any>
  ): Promise<RenderedEmail> {
    // Generate sample data with common variables
    const defaultSampleData = {
      appName: 'PikSend',
      appUrl: 'https://piksend.com',
      supportEmail: 'support@piksend.com',
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      photographerName: 'Jane Smith',
      galleryName: 'Sample Gallery',
      ...sampleData,
    };

    // Try to render as React Email template first
    try {
      const templateModule = await this.loadReactEmailTemplate(templateIdOrName);
      const previewProps = templateModule?.PreviewProps || defaultSampleData;
      
      return this.renderReactEmail(templateIdOrName, previewProps);
    } catch {
      // If not a React Email template, render as custom template
      // For now, return a simple preview with the sample data
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Template Preview</h1>
            <p>This is a preview of template: ${templateIdOrName}</p>
            <p>Sample data provided:</p>
            <pre>${JSON.stringify(defaultSampleData, null, 2)}</pre>
          </body>
        </html>
      `;
      
      return {
        html,
        text: this.convertToPlainText(html),
        subject: 'Template Preview',
      };
    }
  }
  
  /**
   * Convert HTML to plain text
   * 
   * @param html - HTML content
   * @returns Plain text version
   */
  convertToPlainText(html: string): string {
    return htmlToText(html, {
      wordwrap: 80,
      selectors: [
        // Preserve links with their URLs
        { selector: 'a', options: { ignoreHref: false } },
        // Remove images but keep alt text
        { selector: 'img', format: 'skip' },
        // Format headings with line breaks
        { selector: 'h1', options: { uppercase: false } },
        { selector: 'h2', options: { uppercase: false } },
        { selector: 'h3', options: { uppercase: false } },
        // Preserve list formatting
        { selector: 'ul', options: { itemPrefix: '• ' } },
        { selector: 'ol', options: { itemPrefix: '' } },
      ],
    });
  }
  
  /**
   * Inline CSS styles for email client compatibility
   * 
   * @param html - HTML content with external/internal CSS
   * @returns HTML with inlined CSS
   */
  inlineCSS(html: string): string {
    try {
      return juice(html, {
        // Preserve important declarations
        preserveImportant: true,
        // Remove style tags after inlining
        removeStyleTags: true,
        // Preserve media queries for responsive design
        preserveMediaQueries: true,
        // Preserve font faces
        preserveFontFaces: true,
      });
    } catch (error) {
      // If CSS inlining fails, return original HTML
      console.error('Failed to inline CSS:', error);
      return html;
    }
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Load a React Email template dynamically
   * 
   * @param templateName - Name of the template
   * @returns Template module
   */
  private async loadReactEmailTemplate(templateName: string): Promise<any> {
    try {
      // Try to import from emails directory
      const module = await import(`@/emails/${templateName}`);
      return module;
    } catch (error) {
      // Try alternative naming conventions
      try {
        const module = await import(`@/emails/${templateName}.tsx`);
        return module;
      } catch {
        throw new Error(`Template "${templateName}" not found in emails directory`);
      }
    }
  }
  
  /**
   * Get nested property from object using dot notation
   * 
   * @param obj - Object to get property from
   * @param path - Property path (e.g., "user.name")
   * @returns Property value or undefined
   */
  private getNestedProperty(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Extract subject line from template name
   * 
   * @param templateName - Template name
   * @returns Default subject line
   */
  private extractSubjectFromTemplate(templateName: string): string {
    // Convert kebab-case or camelCase to Title Case
    return templateName
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
  
  /**
   * Hash content for cache key generation
   * 
   * @param content - Content to hash
   * @returns Hash string
   */
  private hashContent(content: CustomTemplateContent): string {
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `custom-${Math.abs(hash).toString(36)}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton instance of the template engine
 */
export const templateEngine = new TemplateEngine();

/**
 * Factory function to create a TemplateEngine instance
 * 
 * @param supabase - Supabase client (for database access)
 * @returns TemplateEngine instance
 */
export function createTemplateEngine(supabase?: any): TemplateEngine {
  return new TemplateEngine();
}
