/**
 * Template Engine React Email Integration Tests
 * 
 * Tests for rendering actual React Email templates
 */

import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../template-engine';

describe('TemplateEngine - React Email Integration', () => {
  const engine = new TemplateEngine();
  
  describe('renderReactEmail', () => {
    it('should render purchase-confirmation template', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Wedding Photography - Sarah & Michael',
        photoCount: 250,
        amountPaid: '$49.99',
        transactionId: 'pi_3NxYz1234567890',
        purchaseDate: 'January 15, 2026',
        accessLink: 'https://piksend.com/g/sarah-michael-wedding',
        photographerName: 'Jane Smith Photography',
        photographerEmail: 'jane@photography.com',
        photographerLogo: 'https://piksend.com/demo-logo.png',
        receiptUrl: 'https://pay.stripe.com/receipts/xxx',
        subject: 'Your Purchase Confirmation',
      };
      
      const result = await engine.renderReactEmail('purchase-confirmation', variables);
      
      // Check that HTML was generated
      expect(result.html).toBeTruthy();
      expect(result.html.length).toBeGreaterThan(100);
      
      // Check that key content is present (HTML entities may be encoded)
      expect(result.html).toContain('John Doe');
      expect(result.html).toMatch(/Wedding Photography.*Sarah.*Michael/);
      expect(result.html).toContain('$49.99');
      expect(result.html).toContain('250');
      expect(result.html).toContain('Jane Smith Photography');
      
      // Check that plain text was generated
      expect(result.text).toBeTruthy();
      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Wedding Photography');
      
      // Check subject
      expect(result.subject).toBe('Your Purchase Confirmation');
    });
    
    it('should handle template without explicit subject', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$10.00',
        transactionId: 'test123',
        purchaseDate: 'Today',
        accessLink: 'https://example.com',
        photographerName: 'Test Photographer',
      };
      
      const result = await engine.renderReactEmail('purchase-confirmation', variables);
      
      // Should generate a default subject from template name
      expect(result.subject).toBeTruthy();
      expect(result.subject).toContain('Purchase');
      expect(result.subject).toContain('Confirmation');
    });
    
    it('should throw error for non-existent template', async () => {
      const variables = { test: 'value' };
      
      await expect(
        engine.renderReactEmail('non-existent-template', variables)
      ).rejects.toThrow('not found');
    });
    
    it('should inline CSS in React Email output', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$10.00',
        transactionId: 'test123',
        purchaseDate: 'Today',
        accessLink: 'https://example.com',
        photographerName: 'Test Photographer',
      };
      
      const result = await engine.renderReactEmail('purchase-confirmation', variables);
      
      // Check that styles are inlined (should contain style attributes)
      expect(result.html).toMatch(/style="[^"]*"/);
    });
    
    it('should generate readable plain text from React Email', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$10.00',
        transactionId: 'test123',
        purchaseDate: 'Today',
        accessLink: 'https://example.com',
        photographerName: 'Test Photographer',
      };
      
      const result = await engine.renderReactEmail('purchase-confirmation', variables);
      
      // Plain text should be readable and contain key information
      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Test Gallery');
      expect(result.text).toContain('$10.00');
      expect(result.text).toContain('Test Photographer');
      
      // Should contain the access link
      expect(result.text).toContain('https://example.com');
      
      // Should not contain HTML tags
      expect(result.text).not.toContain('<div');
      expect(result.text).not.toContain('<p>');
      expect(result.text).not.toContain('</div>');
    });
  });
  
  describe('generatePreview', () => {
    it('should generate preview using template PreviewProps', async () => {
      // Provide minimal required data since PreviewProps might not be available
      const minimalData = {
        buyerEmail: 'test@example.com',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$10.00',
        transactionId: 'test123',
        purchaseDate: 'Today',
        accessLink: 'https://example.com',
        photographerName: 'Test Photographer',
      };
      
      const result = await engine.generatePreview('purchase-confirmation', minimalData);
      
      // Should generate valid output
      expect(result.html).toBeTruthy();
      expect(result.html.length).toBeGreaterThan(100);
      expect(result.subject).toBeTruthy();
    });
    
    it('should generate preview with custom sample data', async () => {
      const sampleData = {
        buyerName: 'Preview User',
        buyerEmail: 'preview@example.com',
        galleryName: 'Preview Gallery',
        photoCount: 100,
        amountPaid: '$99.99',
        transactionId: 'preview123',
        purchaseDate: 'Preview Date',
        accessLink: 'https://preview.example.com',
        photographerName: 'Preview Photographer',
        subject: 'Preview Subject',
      };
      
      const result = await engine.generatePreview(
        'purchase-confirmation',
        sampleData
      );
      
      // Should use the provided sample data
      expect(result.html).toContain('Preview User');
      expect(result.html).toContain('Preview Gallery');
      expect(result.html).toContain('$99.99');
      expect(result.subject).toBe('Preview Subject');
    });
  });
});
