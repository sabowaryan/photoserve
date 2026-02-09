/**
 * Template Engine Unit Tests
 * 
 * Tests for the email template engine including:
 * - Variable substitution
 * - Template validation
 * - CSS inlining
 * - Plain text conversion
 * - React Email rendering
 * - Custom template rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../template-engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;
  
  beforeEach(() => {
    engine = new TemplateEngine();
  });
  
  // ============================================================================
  // Variable Substitution Tests
  // ============================================================================
  
  describe('substituteVariables', () => {
    it('should substitute simple variables with double braces', () => {
      const template = 'Hello {{name}}, welcome to {{appName}}!';
      const variables = { name: 'John', appName: 'PikSend' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello John, welcome to PikSend!');
    });
    
    it('should substitute simple variables with single braces', () => {
      const template = 'Hello {name}, welcome to {appName}!';
      const variables = { name: 'John', appName: 'PikSend' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello John, welcome to PikSend!');
    });
    
    it('should substitute nested properties', () => {
      const template = 'Hello {{user.name}}, your email is {{user.email}}';
      const variables = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello John Doe, your email is john@example.com');
    });
    
    it('should handle missing variables by replacing with empty string', () => {
      const template = 'Hello {{name}}, welcome to {{appName}}!';
      const variables = { name: 'John' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello John, welcome to !');
    });
    
    it('should handle variables with whitespace', () => {
      const template = 'Hello {{ name }}, welcome to {{ appName }}!';
      const variables = { name: 'John', appName: 'PikSend' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello John, welcome to PikSend!');
    });
    
    it('should convert non-string values to strings', () => {
      const template = 'Count: {{count}}, Price: {{price}}, Active: {{active}}';
      const variables = { count: 42, price: 29.99, active: true };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Count: 42, Price: 29.99, Active: true');
    });
    
    it('should handle null and undefined values', () => {
      const template = 'Value1: {{value1}}, Value2: {{value2}}';
      const variables = { value1: null, value2: undefined };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Value1: , Value2: ');
    });
    
    it('should handle multiple occurrences of the same variable', () => {
      const template = '{{name}} is {{name}}, not {{other}}';
      const variables = { name: 'John', other: 'Jane' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('John is John, not Jane');
    });
    
    it('should handle variables in HTML attributes', () => {
      const template = '<a href="{{url}}">{{linkText}}</a>';
      const variables = { url: 'https://example.com', linkText: 'Click here' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('<a href="https://example.com">Click here</a>');
    });
  });
  
  // ============================================================================
  // Variable Validation Tests
  // ============================================================================
  
  describe('validateVariables', () => {
    it('should pass validation when all required variables are provided', () => {
      const required = ['name', 'email', 'subject'];
      const provided = {
        name: 'John',
        email: 'john@example.com',
        subject: 'Test',
      };
      
      const result = engine.validateVariables(required, provided);
      
      expect(result.valid).toBe(true);
      expect(result.missingVariables).toEqual([]);
      expect(result.errors).toEqual([]);
    });
    
    it('should fail validation when required variables are missing', () => {
      const required = ['name', 'email', 'subject'];
      const provided = { name: 'John' };
      
      const result = engine.validateVariables(required, provided);
      
      expect(result.valid).toBe(false);
      expect(result.missingVariables).toEqual(['email', 'subject']);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('email');
      expect(result.errors[1]).toContain('subject');
    });
    
    it('should identify extra variables', () => {
      const required = ['name', 'email'];
      const provided = {
        name: 'John',
        email: 'john@example.com',
        extra1: 'value1',
        extra2: 'value2',
      };
      
      const result = engine.validateVariables(required, provided);
      
      expect(result.valid).toBe(true);
      expect(result.extraVariables).toEqual(['extra1', 'extra2']);
    });
    
    it('should handle empty required variables list', () => {
      const required: string[] = [];
      const provided = { name: 'John' };
      
      const result = engine.validateVariables(required, provided);
      
      expect(result.valid).toBe(true);
      expect(result.missingVariables).toEqual([]);
      expect(result.extraVariables).toEqual(['name']);
    });
    
    it('should handle empty provided variables', () => {
      const required = ['name', 'email'];
      const provided = {};
      
      const result = engine.validateVariables(required, provided);
      
      expect(result.valid).toBe(false);
      expect(result.missingVariables).toEqual(['name', 'email']);
    });
  });
  
  // ============================================================================
  // Plain Text Conversion Tests
  // ============================================================================
  
  describe('convertToPlainText', () => {
    it('should convert simple HTML to plain text', () => {
      const html = '<p>Hello World</p>';
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Hello World');
    });
    
    it('should preserve links with URLs', () => {
      const html = '<a href="https://example.com">Click here</a>';
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Click here');
      expect(result).toContain('https://example.com');
    });
    
    it('should handle headings', () => {
      const html = '<h1>Main Title</h1><h2>Subtitle</h2><p>Content</p>';
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Main Title');
      expect(result).toContain('Subtitle');
      expect(result).toContain('Content');
    });
    
    it('should format unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
    });
    
    it('should format ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('First');
      expect(result).toContain('Second');
      expect(result).toContain('Third');
    });
    
    it('should remove style and script tags', () => {
      const html = `
        <style>body { color: red; }</style>
        <p>Content</p>
        <script>alert('test');</script>
      `;
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Content');
      expect(result).not.toContain('color: red');
      expect(result).not.toContain('alert');
    });
    
    it('should handle complex nested HTML', () => {
      const html = `
        <div>
          <h1>Welcome</h1>
          <p>Hello <strong>John</strong>,</p>
          <p>Your order details:</p>
          <ul>
            <li>Item: <em>Product A</em></li>
            <li>Price: $29.99</li>
          </ul>
          <a href="https://example.com/order">View Order</a>
        </div>
      `;
      
      const result = engine.convertToPlainText(html);
      
      expect(result).toContain('Welcome');
      expect(result).toContain('Hello John');
      expect(result).toContain('Your order details');
      expect(result).toContain('Product A');
      expect(result).toContain('$29.99');
      expect(result).toContain('View Order');
      expect(result).toContain('https://example.com/order');
    });
  });
  
  // ============================================================================
  // CSS Inlining Tests
  // ============================================================================
  
  describe('inlineCSS', () => {
    it('should inline CSS from style tags', () => {
      const html = `
        <style>
          .red { color: red; }
          .bold { font-weight: bold; }
        </style>
        <p class="red bold">Hello</p>
      `;
      
      const result = engine.inlineCSS(html);
      
      expect(result).toContain('color: red');
      expect(result).toContain('font-weight: bold');
      expect(result).toContain('Hello');
    });
    
    it('should preserve important declarations', () => {
      const html = `
        <style>
          .important { color: red !important; }
        </style>
        <p class="important">Text</p>
      `;
      
      const result = engine.inlineCSS(html);
      
      expect(result).toContain('!important');
    });
    
    it('should handle multiple CSS rules', () => {
      const html = `
        <style>
          p { margin: 0; padding: 10px; }
          .highlight { background: yellow; }
        </style>
        <p class="highlight">Content</p>
      `;
      
      const result = engine.inlineCSS(html);
      
      expect(result).toContain('margin');
      expect(result).toContain('padding');
      expect(result).toContain('background');
    });
    
    it('should handle HTML without CSS gracefully', () => {
      const html = '<p>Simple text</p>';
      
      const result = engine.inlineCSS(html);
      
      expect(result).toContain('Simple text');
    });
    
    it('should preserve existing inline styles', () => {
      const html = '<p style="color: blue;">Text</p>';
      
      const result = engine.inlineCSS(html);
      
      expect(result).toContain('color: blue');
      expect(result).toContain('Text');
    });
  });
  
  // ============================================================================
  // Custom Template Rendering Tests
  // ============================================================================
  
  describe('renderCustomTemplate', () => {
    it('should render custom template with variable substitution', async () => {
      const content = {
        html: '<p>Hello {{name}}, your order #{{orderId}} is ready!</p>',
        subject: 'Order {{orderId}} Confirmation',
        requiredVariables: ['name', 'orderId'],
      };
      const variables = { name: 'John', orderId: '12345' };
      
      const result = await engine.renderCustomTemplate(content, variables);
      
      expect(result.html).toContain('Hello John');
      expect(result.html).toContain('order #12345');
      expect(result.subject).toBe('Order 12345 Confirmation');
      expect(result.text).toContain('Hello John');
    });
    
    it('should inline CSS in custom templates', async () => {
      const content = {
        html: `
          <style>.red { color: red; }</style>
          <p class="red">Hello {{name}}</p>
        `,
        subject: 'Test',
        requiredVariables: ['name'],
      };
      const variables = { name: 'John' };
      
      const result = await engine.renderCustomTemplate(content, variables);
      
      expect(result.html).toContain('color: red');
      expect(result.html).toContain('Hello John');
    });
    
    it('should generate plain text from custom templates', async () => {
      const content = {
        html: '<h1>Welcome</h1><p>Hello {{name}}</p>',
        subject: 'Welcome',
        requiredVariables: ['name'],
      };
      const variables = { name: 'John' };
      
      const result = await engine.renderCustomTemplate(content, variables);
      
      expect(result.text).toContain('Welcome');
      expect(result.text).toContain('Hello John');
    });
    
    it('should handle complex HTML with multiple variables', async () => {
      const content = {
        html: `
          <div>
            <h1>Order Confirmation</h1>
            <p>Dear {{customerName}},</p>
            <p>Your order #{{orderId}} for {{productName}} has been confirmed.</p>
            <p>Total: {{total}}</p>
            <a href="{{orderUrl}}">View Order</a>
          </div>
        `,
        subject: 'Order {{orderId}} Confirmed',
        requiredVariables: ['customerName', 'orderId', 'productName', 'total', 'orderUrl'],
      };
      const variables = {
        customerName: 'Jane Doe',
        orderId: 'ORD-123',
        productName: 'Premium Package',
        total: '$99.99',
        orderUrl: 'https://example.com/orders/123',
      };
      
      const result = await engine.renderCustomTemplate(content, variables);
      
      expect(result.html).toContain('Jane Doe');
      expect(result.html).toContain('ORD-123');
      expect(result.html).toContain('Premium Package');
      expect(result.html).toContain('$99.99');
      expect(result.html).toContain('https://example.com/orders/123');
      expect(result.subject).toBe('Order ORD-123 Confirmed');
    });
  });
  
  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================
  
  describe('edge cases', () => {
    it('should handle empty template', () => {
      const template = '';
      const variables = { name: 'John' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('');
    });
    
    it('should handle template with no variables', () => {
      const template = 'Hello World!';
      const variables = { name: 'John' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello World!');
    });
    
    it('should handle empty variables object', () => {
      const template = 'Hello {{name}}!';
      const variables = {};
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Hello !');
    });
    
    it('should handle special characters in variable values', () => {
      const template = 'Message: {{message}}';
      const variables = { message: 'Hello <world> & "friends"' };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Message: Hello <world> & "friends"');
    });
    
    it('should handle deeply nested properties', () => {
      const template = 'Value: {{a.b.c.d.e}}';
      const variables = {
        a: {
          b: {
            c: {
              d: {
                e: 'deep value',
              },
            },
          },
        },
      };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Value: deep value');
    });
    
    it('should handle missing nested properties gracefully', () => {
      const template = 'Value: {{a.b.c}}';
      const variables = { a: { b: {} } };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toBe('Value: ');
    });
    
    it('should handle array values', () => {
      const template = 'Items: {{items}}';
      const variables = { items: ['apple', 'banana', 'orange'] };
      
      const result = engine.substituteVariables(template, variables);
      
      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('orange');
    });
  });
});
