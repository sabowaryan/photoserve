# Email Migration Example

This document shows how to update existing email sending code to use the new template system.

## Before: Direct Resend Usage

```typescript
// Old way - directly using Resend with inline HTML
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { PurchaseConfirmationEmail } from '@/emails/purchase-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPurchaseEmail(data: any) {
  const html = await render(
    PurchaseConfirmationEmail({
      buyerEmail: data.email,
      galleryName: data.galleryName,
      photoCount: data.photoCount,
      amountPaid: data.amount,
      transactionId: data.transactionId,
      purchaseDate: new Date().toLocaleDateString(),
      accessLink: data.accessLink,
      photographerName: data.photographerName,
    })
  );

  await resend.emails.send({
    from: 'PikSend <onboarding@resend.dev>',
    to: data.email,
    subject: `Your purchase of "${data.galleryName}" is confirmed!`,
    html,
  });
}
```

## After: Using Template System

```typescript
// New way - using the template system
import { sendPurchaseConfirmation } from '@/lib/email/send-template-email';

async function sendPurchaseEmail(data: any) {
  await sendPurchaseConfirmation({
    to: data.email,
    buyerEmail: data.email,
    galleryName: data.galleryName,
    photoCount: data.photoCount,
    amountPaid: data.amount,
    transactionId: data.transactionId,
    purchaseDate: new Date().toLocaleDateString(),
    accessLink: data.accessLink,
    photographerName: data.photographerName,
    photographerEmail: data.photographerEmail,
  });
}
```

## Benefits of the New System

1. **Simpler Code**: No need to manually render templates or construct subjects
2. **Type Safety**: Helper functions provide TypeScript types for all variables
3. **Centralized Management**: Templates can be updated in the database without code changes
4. **Version Control**: Template changes are tracked with version history
5. **Validation**: Automatic validation of required variables
6. **Consistent Formatting**: Subject lines and content are managed centrally

## Migration Checklist

When migrating email sending code:

1. ✅ Replace direct Resend calls with helper functions
2. ✅ Remove manual template rendering code
3. ✅ Remove hardcoded subject lines
4. ✅ Update variable names to match template requirements
5. ✅ Add error handling for email sending
6. ✅ Test with real data to ensure emails render correctly

## Example: Webhook Handler

### Before

```typescript
// In webhook handler - old way
import { render } from '@react-email/components';
import { SaleNotificationEmail } from '@/emails/sale-notification';

async function handlePaymentSuccess(event: any) {
  const html = await render(
    SaleNotificationEmail({
      photographerName: event.photographerName,
      galleryName: event.galleryName,
      photoCount: event.photoCount,
      clientEmail: event.clientEmail,
      grossAmount: event.grossAmount,
      platformFee: event.platformFee,
      netEarnings: event.netEarnings,
      transactionId: event.transactionId,
      saleDate: new Date().toLocaleString(),
      dashboardLink: 'https://piksend.com/revenue',
      saleDetailsLink: `https://piksend.com/revenue/sales/${event.saleId}`,
    })
  );

  await resend.emails.send({
    from: 'PikSend <onboarding@resend.dev>',
    to: event.photographerEmail,
    subject: `🎉 New sale! You earned ${event.netEarnings} from "${event.galleryName}"`,
    html,
  });
}
```

### After

```typescript
// In webhook handler - new way
import { sendSaleNotification } from '@/lib/email/send-template-email';

async function handlePaymentSuccess(event: any) {
  await sendSaleNotification({
    to: event.photographerEmail,
    photographerName: event.photographerName,
    galleryName: event.galleryName,
    photoCount: event.photoCount,
    clientEmail: event.clientEmail,
    grossAmount: event.grossAmount,
    platformFee: event.platformFee,
    netEarnings: event.netEarnings,
    transactionId: event.transactionId,
    saleDate: new Date().toLocaleString(),
    dashboardLink: 'https://piksend.com/revenue',
    saleDetailsLink: `https://piksend.com/revenue/sales/${event.saleId}`,
  });
}
```

## Error Handling

The new system returns a result object with error information:

```typescript
const result = await sendPurchaseConfirmation({
  // ... options
});

if (result.error) {
  console.error('Failed to send email:', result.error);
  // Handle error (retry, log, notify admin, etc.)
} else {
  console.log('Email sent successfully:', result.id);
}
```

## Testing

Test your migrated code with the test script:

```bash
npx tsx scripts/test-migrated-templates.ts
```

This ensures all templates render correctly with sample data.

## Rollback Plan

If you need to rollback to the old system:

1. The original React Email templates are still in `src/emails/`
2. You can import and use them directly
3. The database templates don't affect the original files

However, the new system is recommended for all the benefits listed above.
