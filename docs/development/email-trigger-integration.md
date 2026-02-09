# Email Trigger Integration Guide

This guide explains how to integrate the email management system into your payment, payout, dispute, and refund workflows.

## Overview

The email management system has been updated to use a queue-based architecture with:
- Provider abstraction (Resend or AWS SES)
- Automatic retry logic
- Comprehensive logging and analytics
- Suppression list checking

## Updated Email Functions

All email sending functions in `src/lib/email/send-template-email.ts` now use the new `EmailService` instead of directly calling Resend.

### Available Functions

1. **sendPurchaseConfirmation** - Send purchase confirmation to buyers
2. **sendSaleNotification** - Notify photographers of new sales
3. **sendPayoutNotification** - Notify photographers of payouts
4. **sendDisputeAlert** - Alert photographers of disputes
5. **sendRefundConfirmation** - Confirm refunds to buyers

## Integration Examples

### 1. Purchase Confirmation Email

**When to trigger:** After a successful payment/checkout

```typescript
import { sendPurchaseConfirmation } from '@/lib/email/send-template-email';

// In your payment success handler
async function handlePaymentSuccess(paymentData: PaymentData) {
  // ... process payment ...
  
  // Send purchase confirmation email
  const emailResult = await sendPurchaseConfirmation({
    to: paymentData.buyerEmail,
    buyerName: paymentData.buyerName,
    buyerEmail: paymentData.buyerEmail,
    galleryName: paymentData.galleryName,
    photoCount: paymentData.photoCount,
    amountPaid: formatCurrency(paymentData.amount),
    transactionId: paymentData.transactionId,
    purchaseDate: new Date().toLocaleDateString(),
    accessLink: `${process.env.NEXT_PUBLIC_APP_URL}/gallery/${paymentData.gallerySlug}`,
    photographerName: paymentData.photographerName,
    photographerEmail: paymentData.photographerEmail,
    receiptUrl: paymentData.receiptUrl,
  });
  
  if (emailResult.error) {
    console.error('Failed to send purchase confirmation:', emailResult.error);
    // Email failure doesn't block the payment - it will be retried automatically
  }
}
```

### 2. Sale Notification Email

**When to trigger:** After a successful sale (notify photographer)

```typescript
import { sendSaleNotification } from '@/lib/email/send-template-email';

// In your payment success handler (photographer notification)
async function notifyPhotographerOfSale(saleData: SaleData) {
  const emailResult = await sendSaleNotification({
    to: saleData.photographerEmail,
    photographerName: saleData.photographerName,
    galleryName: saleData.galleryName,
    photoCount: saleData.photoCount,
    clientEmail: saleData.buyerEmail,
    clientName: saleData.buyerName,
    grossAmount: formatCurrency(saleData.grossAmount),
    platformFee: formatCurrency(saleData.platformFee),
    netEarnings: formatCurrency(saleData.netEarnings),
    transactionId: saleData.transactionId,
    saleDate: new Date().toLocaleDateString(),
    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    saleDetailsLink: `${process.env.NEXT_PUBLIC_APP_URL}/sales/${saleData.saleId}`,
  });
  
  if (emailResult.error) {
    console.error('Failed to send sale notification:', emailResult.error);
  }
}
```

### 3. Payout Notification Email

**When to trigger:** When a payout is created, updated, or completed

```typescript
import { sendPayoutNotification } from '@/lib/email/send-template-email';

// In your payout handler
async function handlePayoutEvent(payoutData: PayoutData) {
  const emailResult = await sendPayoutNotification({
    to: payoutData.photographerEmail,
    photographerName: payoutData.photographerName,
    payoutId: payoutData.payoutId,
    amount: formatCurrency(payoutData.amount),
    currency: payoutData.currency,
    status: payoutData.status, // 'pending' | 'in_transit' | 'paid' | 'failed'
    bankAccountLast4: payoutData.bankAccountLast4,
    createdDate: new Date(payoutData.createdAt).toLocaleDateString(),
    arrivalDate: payoutData.arrivalDate ? new Date(payoutData.arrivalDate).toLocaleDateString() : undefined,
    failureReason: payoutData.failureReason,
    failureCode: payoutData.failureCode,
    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    payoutDetailsLink: `${process.env.NEXT_PUBLIC_APP_URL}/payouts/${payoutData.payoutId}`,
    stripeDashboardLink: `https://dashboard.stripe.com/payouts/${payoutData.payoutId}`,
  });
  
  if (emailResult.error) {
    console.error('Failed to send payout notification:', emailResult.error);
  }
}
```

### 4. Dispute Alert Email

**When to trigger:** When a dispute/chargeback is created

```typescript
import { sendDisputeAlert } from '@/lib/email/send-template-email';

// In your Stripe webhook handler for dispute.created
async function handleDisputeCreated(disputeData: DisputeData) {
  const emailResult = await sendDisputeAlert({
    to: disputeData.photographerEmail,
    photographerName: disputeData.photographerName,
    amount: formatCurrency(disputeData.amount),
    reason: disputeData.reason,
    reasonDescription: disputeData.reasonDescription,
    galleryName: disputeData.galleryName,
    clientEmail: disputeData.clientEmail,
    purchaseDate: new Date(disputeData.purchaseDate).toLocaleDateString(),
    transactionId: disputeData.transactionId,
    responseDeadline: new Date(disputeData.responseDeadline).toLocaleDateString(),
    daysRemaining: disputeData.daysRemaining,
    evidenceRequired: disputeData.evidenceRequired,
    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    disputeDetailsLink: `${process.env.NEXT_PUBLIC_APP_URL}/disputes/${disputeData.disputeId}`,
    stripeDashboardLink: `https://dashboard.stripe.com/disputes/${disputeData.disputeId}`,
  });
  
  if (emailResult.error) {
    console.error('Failed to send dispute alert:', emailResult.error);
  }
}
```

### 5. Refund Confirmation Email

**When to trigger:** When a refund is processed

```typescript
import { sendRefundConfirmation } from '@/lib/email/send-template-email';

// In your refund handler
async function handleRefundProcessed(refundData: RefundData) {
  const emailResult = await sendRefundConfirmation({
    to: refundData.buyerEmail,
    buyerName: refundData.buyerName,
    buyerEmail: refundData.buyerEmail,
    galleryName: refundData.galleryName,
    refundId: refundData.refundId,
    refundType: refundData.refundType, // 'full' | 'partial'
    refundAmount: formatCurrency(refundData.refundAmount),
    originalAmount: formatCurrency(refundData.originalAmount),
    refundReason: refundData.refundReason,
    purchaseDate: new Date(refundData.purchaseDate).toLocaleDateString(),
    refundDate: new Date().toLocaleDateString(),
    estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 5 days
    photographerName: refundData.photographerName,
    photographerEmail: refundData.photographerEmail,
    supportLink: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
  });
  
  if (emailResult.error) {
    console.error('Failed to send refund confirmation:', emailResult.error);
  }
}
```

## Stripe Webhook Integration

### Example: Integrating into stripe-webhook edge function

```typescript
// In supabase/functions/stripe-webhook/index.ts

// Add at the top
import { sendPurchaseConfirmation, sendSaleNotification } from '../../src/lib/email/send-template-email';

// In your checkout.session.completed handler
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // ... existing payment processing ...
  
  // Send purchase confirmation to buyer
  await sendPurchaseConfirmation({
    to: session.customer_email!,
    buyerEmail: session.customer_email!,
    galleryName: session.metadata?.gallery_name || 'Gallery',
    photoCount: parseInt(session.metadata?.photo_count || '0'),
    amountPaid: formatCurrency(session.amount_total || 0),
    transactionId: session.payment_intent as string,
    purchaseDate: new Date().toLocaleDateString(),
    accessLink: `${process.env.NEXT_PUBLIC_APP_URL}/gallery/${session.metadata?.gallery_slug}`,
    photographerName: session.metadata?.photographer_name || 'Photographer',
  });
  
  // Send sale notification to photographer
  await sendSaleNotification({
    to: session.metadata?.photographer_email!,
    photographerName: session.metadata?.photographer_name || 'Photographer',
    galleryName: session.metadata?.gallery_name || 'Gallery',
    photoCount: parseInt(session.metadata?.photo_count || '0'),
    clientEmail: session.customer_email!,
    grossAmount: formatCurrency(session.amount_total || 0),
    platformFee: formatCurrency((session.amount_total || 0) * 0.1), // 10% fee
    netEarnings: formatCurrency((session.amount_total || 0) * 0.9),
    transactionId: session.payment_intent as string,
    saleDate: new Date().toLocaleDateString(),
    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    saleDetailsLink: `${process.env.NEXT_PUBLIC_APP_URL}/sales/${session.id}`,
  });
  
  break;
}
```

## Gallery Expiration Notification

The gallery expiration notification edge function has been updated to use the email queue system. It now:

1. Queries galleries expiring in 24-25 hours
2. Inserts emails directly into the `email_queue` table
3. Lets the queue processor handle sending with retries

No additional integration needed - the edge function is already updated.

## Benefits of the New System

1. **Automatic Retries**: Failed emails are automatically retried up to 3 times with exponential backoff
2. **Provider Flexibility**: Switch between Resend and AWS SES without code changes
3. **Comprehensive Logging**: All emails are logged with delivery status tracking
4. **Analytics**: Track open rates, click rates, and delivery metrics
5. **Suppression Management**: Automatically handle bounces and complaints
6. **Queue-Based**: Emails are processed asynchronously, improving response times

## Testing

Run the test suite to verify email integration:

```bash
npm test src/lib/email/__tests__/send-template-email.test.ts
```

## Monitoring

Monitor email delivery in the admin dashboard:

- **Email Logs**: `/admin/emails/logs`
- **Analytics**: `/admin/emails/analytics`
- **Queue Status**: `/admin/emails` (main dashboard)

## Troubleshooting

### Emails not being sent

1. Check the email queue: `SELECT * FROM email_queue WHERE status = 'pending'`
2. Check for errors: `SELECT * FROM email_logs WHERE status = 'failed'`
3. Verify the queue processor is running (edge function)
4. Check provider configuration in admin UI

### Email delivery failures

1. Check suppression list: `SELECT * FROM email_suppressions`
2. Verify sender address is verified
3. Check provider API status
4. Review error messages in email logs

## Next Steps

1. Integrate email triggers into your payment flows
2. Test email delivery in development
3. Configure webhooks for your email provider
4. Monitor email analytics in production
5. Set up alerting for high bounce/failure rates
