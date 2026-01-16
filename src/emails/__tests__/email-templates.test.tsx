/**
 * Email Templates Tests
 * Tests for all email templates to ensure they render correctly
 * 
 * @module emails/__tests__/email-templates.test
 */
import { describe, it, expect } from 'vitest';
import { render } from '@react-email/components';
import { PurchaseConfirmationEmail } from '../purchase-confirmation';
import { SaleNotificationEmail } from '../sale-notification';
import { PayoutNotificationEmail } from '../payout-notification';
import { DisputeAlertEmail } from '../dispute-alert';
import { RefundConfirmationEmail } from '../refund-confirmation';

describe('Email Templates', () => {
  describe('PurchaseConfirmationEmail', () => {
    const defaultProps = {
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      galleryName: 'Wedding Photography',
      photoCount: 250,
      amountPaid: '$49.99',
      transactionId: 'pi_123456789',
      purchaseDate: 'January 15, 2026',
      accessLink: 'https://piksend.com/g/wedding',
      photographerName: 'Jane Smith Photography',
    };

    it('should render without errors', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toBeDefined();
      expect(html).toContain('Thank you for your purchase');
    });

    it('should include gallery name', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toContain('Wedding Photography');
    });

    it('should include amount paid', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toContain('$49.99');
    });

    it('should include access link', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toContain('https://piksend.com/g/wedding');
    });

    it('should include photographer name', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toContain('Jane Smith Photography');
    });

    it('should include photo count', async () => {
      const html = await render(PurchaseConfirmationEmail(defaultProps));
      expect(html).toContain('250');
    });

    it('should handle optional photographer logo', async () => {
      const propsWithLogo = {
        ...defaultProps,
        photographerLogo: 'https://example.com/logo.png',
      };
      const html = await render(PurchaseConfirmationEmail(propsWithLogo));
      expect(html).toContain('https://example.com/logo.png');
    });

    it('should handle optional access expiration', async () => {
      const propsWithExpiration = {
        ...defaultProps,
        accessExpiresAt: 'February 15, 2026',
      };
      const html = await render(PurchaseConfirmationEmail(propsWithExpiration));
      expect(html).toContain('February 15, 2026');
    });
  });

  describe('SaleNotificationEmail', () => {
    const defaultProps = {
      photographerName: 'Jane',
      galleryName: 'Wedding Photography',
      photoCount: 250,
      clientEmail: 'john@example.com',
      grossAmount: '$49.99',
      platformFee: '$5.00',
      netEarnings: '$44.99',
      transactionId: 'pi_123456789',
      saleDate: 'January 15, 2026',
      dashboardLink: 'https://piksend.com/revenue',
      saleDetailsLink: 'https://piksend.com/revenue/sales/123',
    };

    it('should render without errors', async () => {
      const html = await render(SaleNotificationEmail(defaultProps));
      expect(html).toBeDefined();
      expect(html).toContain('You made a sale');
    });

    it('should include net earnings', async () => {
      const html = await render(SaleNotificationEmail(defaultProps));
      expect(html).toContain('$44.99');
    });

    it('should include platform fee', async () => {
      const html = await render(SaleNotificationEmail(defaultProps));
      expect(html).toContain('$5.00');
    });

    it('should include client email', async () => {
      const html = await render(SaleNotificationEmail(defaultProps));
      expect(html).toContain('john@example.com');
    });

    it('should include dashboard link', async () => {
      const html = await render(SaleNotificationEmail(defaultProps));
      expect(html).toContain('https://piksend.com/revenue');
    });

    it('should handle optional stats', async () => {
      const propsWithStats = {
        ...defaultProps,
        totalSalesCount: 42,
        totalRevenue: '$1,847.50',
      };
      const html = await render(SaleNotificationEmail(propsWithStats));
      expect(html).toContain('42');
      expect(html).toContain('$1,847.50');
    });
  });

  describe('PayoutNotificationEmail', () => {
    const defaultProps = {
      photographerName: 'Jane',
      payoutId: 'po_123456789',
      amount: '$1,234.56',
      currency: 'USD',
      status: 'paid' as const,
      bankAccountLast4: '4242',
      createdDate: 'January 15, 2026',
      dashboardLink: 'https://piksend.com/revenue',
      payoutDetailsLink: 'https://piksend.com/revenue/payouts/123',
    };

    it('should render without errors', async () => {
      const html = await render(PayoutNotificationEmail(defaultProps));
      expect(html).toBeDefined();
    });

    it('should show correct status for paid payout', async () => {
      const html = await render(PayoutNotificationEmail(defaultProps));
      expect(html).toContain('Payout Complete');
    });

    it('should show correct status for pending payout', async () => {
      const pendingProps = { ...defaultProps, status: 'pending' as const };
      const html = await render(PayoutNotificationEmail(pendingProps));
      expect(html).toContain('Payout Initiated');
    });

    it('should show correct status for failed payout', async () => {
      const failedProps = {
        ...defaultProps,
        status: 'failed' as const,
        failureReason: 'Bank account not found',
      };
      const html = await render(PayoutNotificationEmail(failedProps));
      expect(html).toContain('Payout Failed');
      expect(html).toContain('Bank account not found');
    });

    it('should include amount', async () => {
      const html = await render(PayoutNotificationEmail(defaultProps));
      expect(html).toContain('$1,234.56');
    });

    it('should include bank account last 4', async () => {
      const html = await render(PayoutNotificationEmail(defaultProps));
      expect(html).toContain('4242');
    });
  });

  describe('DisputeAlertEmail', () => {
    const defaultProps = {
      photographerName: 'Jane',
      amount: '$49.99',
      reason: 'product_not_received' as const,
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
    };

    it('should render without errors', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toBeDefined();
      expect(html).toContain('Dispute Received');
    });

    it('should include disputed amount', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toContain('$49.99');
    });

    it('should include days remaining', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toContain('7');
    });

    it('should include response deadline', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toContain('January 25, 2026');
    });

    it('should include evidence required', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toContain('Proof of delivery');
      expect(html).toContain('Purchase confirmation');
    });

    it('should include Stripe dashboard link', async () => {
      const html = await render(DisputeAlertEmail(defaultProps));
      expect(html).toContain('https://dashboard.stripe.com/disputes/123');
    });
  });

  describe('RefundConfirmationEmail', () => {
    const defaultProps = {
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      galleryName: 'Wedding Photography',
      refundId: 're_123456789',
      refundType: 'full' as const,
      refundAmount: '$49.99',
      originalAmount: '$49.99',
      purchaseDate: 'January 10, 2026',
      refundDate: 'January 15, 2026',
      estimatedArrival: '5-10 business days',
      photographerName: 'Jane Smith Photography',
    };

    it('should render without errors', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toBeDefined();
      expect(html).toContain('Your Refund is On Its Way');
    });

    it('should include refund amount', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toContain('$49.99');
    });

    it('should show full refund badge', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toContain('Full Refund');
    });

    it('should show partial refund badge', async () => {
      const partialProps = {
        ...defaultProps,
        refundType: 'partial' as const,
        refundAmount: '$25.00',
      };
      const html = await render(RefundConfirmationEmail(partialProps));
      expect(html).toContain('Partial Refund');
    });

    it('should include estimated arrival', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toContain('5-10 business days');
    });

    it('should include photographer name', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toContain('Jane Smith Photography');
    });

    it('should show access revoked notice for full refund', async () => {
      const html = await render(RefundConfirmationEmail(defaultProps));
      expect(html).toContain('access to the gallery has been revoked');
    });
  });
});
