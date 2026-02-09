/**
 * Comprehensive Template Rendering Tests
 * 
 * Tests rendering of all migrated React Email templates through the template engine
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../template-engine';

describe('All Templates Rendering', () => {
  const engine = new TemplateEngine();
  
  describe('purchase-confirmation', () => {
    it('should render with all variables', async () => {
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
      
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.subject).toBe('Your Purchase Confirmation');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('$49.99');
      expect(result.text).toContain('John Doe');
    });
  });
  
  describe('sale-notification', () => {
    it('should render with all variables', async () => {
      const variables = {
        photographerName: 'Jane',
        galleryName: 'Wedding Photography',
        photoCount: 250,
        clientEmail: 'john@example.com',
        clientName: 'John Doe',
        grossAmount: '$49.99',
        platformFee: '$5.00',
        netEarnings: '$44.99',
        transactionId: 'pi_123456789',
        saleDate: 'January 15, 2026',
        dashboardLink: 'https://piksend.com/revenue',
        saleDetailsLink: 'https://piksend.com/revenue/sales/123',
        totalSalesCount: 42,
        totalRevenue: '$1,847.50',
        subject: 'You Made a Sale!',
      };
      
      const result = await engine.renderReactEmail('sale-notification', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.subject).toBe('You Made a Sale!');
      expect(result.html).toContain('$44.99');
      expect(result.html).toContain('john@example.com');
    });
  });
  
  describe('payout-notification', () => {
    it('should render paid payout', async () => {
      const variables = {
        photographerName: 'Jane',
        payoutId: 'po_123456789',
        amount: '$1,234.56',
        currency: 'USD',
        status: 'paid',
        bankName: 'Chase Bank',
        bankAccountLast4: '4242',
        createdDate: 'January 15, 2026',
        arrivalDate: 'January 17, 2026',
        dashboardLink: 'https://piksend.com/revenue',
        payoutDetailsLink: 'https://piksend.com/revenue/payouts/123',
        stripeDashboardLink: 'https://dashboard.stripe.com/payouts/123',
        remainingBalance: '$500.00',
        subject: 'Payout Complete',
      };
      
      const result = await engine.renderReactEmail('payout-notification', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.subject).toBe('Payout Complete');
      expect(result.html).toContain('$1,234.56');
      expect(result.html).toContain('4242');
    });
    
    it('should render failed payout', async () => {
      const variables = {
        photographerName: 'Jane',
        payoutId: 'po_123456789',
        amount: '$1,234.56',
        currency: 'USD',
        status: 'failed',
        bankAccountLast4: '4242',
        createdDate: 'January 15, 2026',
        failureReason: 'Bank account not found',
        failureCode: 'account_closed',
        dashboardLink: 'https://piksend.com/revenue',
        payoutDetailsLink: 'https://piksend.com/revenue/payouts/123',
        subject: 'Payout Failed',
      };
      
      const result = await engine.renderReactEmail('payout-notification', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.html).toContain('Bank account not found');
    });
  });
  
  describe('dispute-alert', () => {
    it('should render with all variables', async () => {
      const variables = {
        photographerName: 'Jane',
        amount: '$49.99',
        reason: 'product_not_received',
        reasonDescription: 'Customer claims they did not receive the product',
        galleryName: 'Wedding Photography',
        clientEmail: 'john@example.com',
        purchaseDate: 'January 10, 2026',
        transactionId: 'pi_123456789',
        responseDeadline: 'January 25, 2026',
        daysRemaining: 7,
        evidenceRequired: ['Proof of delivery', 'Purchase confirmation'],
        dashboardLink: 'https://piksend.com/revenue',
        disputeDetailsLink: 'https://piksend.com/revenue/disputes/123',
        stripeDashboardLink: 'https://dashboard.stripe.com/disputes/123',
        subject: 'Urgent: Dispute Received',
      };
      
      const result = await engine.renderReactEmail('dispute-alert', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.subject).toBe('Urgent: Dispute Received');
      expect(result.html).toContain('$49.99');
      expect(result.html).toContain('7');
    });
  });
  
  describe('refund-confirmation', () => {
    it('should render full refund', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Wedding Photography',
        refundId: 're_123456789',
        refundType: 'full',
        refundAmount: '$49.99',
        originalAmount: '$49.99',
        refundReason: 'Customer requested refund',
        purchaseDate: 'January 10, 2026',
        refundDate: 'January 15, 2026',
        estimatedArrival: '5-10 business days',
        photographerName: 'Jane Smith Photography',
        photographerEmail: 'jane@photography.com',
        photographerLogo: 'https://piksend.com/demo-logo.png',
        supportLink: 'https://piksend.com/support',
        subject: 'Your Refund is On Its Way',
      };
      
      const result = await engine.renderReactEmail('refund-confirmation', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.subject).toBe('Your Refund is On Its Way');
      expect(result.html).toContain('$49.99');
      expect(result.html).toContain('John Doe');
    });
    
    it('should render partial refund', async () => {
      const variables = {
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        galleryName: 'Wedding Photography',
        refundId: 're_123456789',
        refundType: 'partial',
        refundAmount: '$25.00',
        originalAmount: '$49.99',
        purchaseDate: 'January 10, 2026',
        refundDate: 'January 15, 2026',
        estimatedArrival: '5-10 business days',
        photographerName: 'Jane Smith Photography',
        subject: 'Partial Refund Processed',
      };
      
      const result = await engine.renderReactEmail('refund-confirmation', variables);
      
      expect(result.html).toBeTruthy();
      expect(result.html).toContain('$25.00');
    });
  });
  
  describe('CSS inlining and plain text conversion', () => {
    it('should inline CSS in all templates', async () => {
      const templates = [
        'purchase-confirmation',
        'sale-notification',
        'payout-notification',
        'dispute-alert',
        'refund-confirmation',
      ];
      
      for (const templateName of templates) {
        const variables = getMinimalVariables(templateName);
        const result = await engine.renderReactEmail(templateName, variables);
        
        // Should have inline styles
        expect(result.html).toMatch(/style="[^"]*"/);
      }
    });
    
    it('should generate plain text for all templates', async () => {
      const templates = [
        'purchase-confirmation',
        'sale-notification',
        'payout-notification',
        'dispute-alert',
        'refund-confirmation',
      ];
      
      for (const templateName of templates) {
        const variables = getMinimalVariables(templateName);
        const result = await engine.renderReactEmail(templateName, variables);
        
        // Should have plain text
        expect(result.text).toBeTruthy();
        expect(result.text.length).toBeGreaterThan(50);
        
        // Should not contain HTML tags
        expect(result.text).not.toContain('<div');
        expect(result.text).not.toContain('<p>');
      }
    });
  });
});

/**
 * Helper function to get minimal required variables for each template
 */
function getMinimalVariables(templateName: string): Record<string, any> {
  const baseVariables = {
    subject: 'Test Subject',
  };
  
  switch (templateName) {
    case 'purchase-confirmation':
      return {
        ...baseVariables,
        buyerEmail: 'test@example.com',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$10.00',
        transactionId: 'test123',
        purchaseDate: 'Today',
        accessLink: 'https://example.com',
        photographerName: 'Test Photographer',
      };
      
    case 'sale-notification':
      return {
        ...baseVariables,
        photographerName: 'Test',
        galleryName: 'Test Gallery',
        photoCount: 10,
        clientEmail: 'client@example.com',
        grossAmount: '$10.00',
        platformFee: '$1.00',
        netEarnings: '$9.00',
        transactionId: 'test123',
        saleDate: 'Today',
        dashboardLink: 'https://example.com',
        saleDetailsLink: 'https://example.com/sale',
      };
      
    case 'payout-notification':
      return {
        ...baseVariables,
        photographerName: 'Test',
        payoutId: 'po_test123',
        amount: '$100.00',
        currency: 'USD',
        status: 'paid',
        bankAccountLast4: '1234',
        createdDate: 'Today',
        dashboardLink: 'https://example.com',
        payoutDetailsLink: 'https://example.com/payout',
      };
      
    case 'dispute-alert':
      return {
        ...baseVariables,
        photographerName: 'Test',
        amount: '$10.00',
        reason: 'product_not_received',
        galleryName: 'Test Gallery',
        clientEmail: 'client@example.com',
        purchaseDate: 'Yesterday',
        transactionId: 'test123',
        responseDeadline: 'Next Week',
        daysRemaining: 7,
        evidenceRequired: ['Proof'],
        dashboardLink: 'https://example.com',
        disputeDetailsLink: 'https://example.com/dispute',
        stripeDashboardLink: 'https://stripe.com',
      };
      
    case 'refund-confirmation':
      return {
        ...baseVariables,
        buyerEmail: 'buyer@example.com',
        galleryName: 'Test Gallery',
        refundId: 're_test123',
        refundType: 'full',
        refundAmount: '$10.00',
        originalAmount: '$10.00',
        purchaseDate: 'Yesterday',
        refundDate: 'Today',
        estimatedArrival: '5-10 days',
        photographerName: 'Test Photographer',
      };
      
    default:
      return baseVariables;
  }
}
