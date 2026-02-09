# Email Templates Migration Guide

This document explains how the React Email templates have been migrated to the email management system and how to use them.

## Overview

All existing React Email templates have been migrated to the database-backed email management system. This provides:

- **Centralized Management**: All templates are stored in the database with versioning
- **Metadata Tracking**: Each template includes variables, type, category, and description
- **Easy Updates**: Templates can be updated without code changes
- **Consistent API**: Simple functions for sending emails

## Migrated Templates

The following templates have been migrated:

1. **Purchase Confirmation** (`purchase-confirmation`)
   - Sent to clients when they purchase gallery access
   - Type: Transactional

2. **Sale Notification** (`sale-notification`)
   - Sent to photographers when a sale occurs
   - Type: Transactional

3. **Payout Notification** (`payout-notification`)
   - Sent to photographers about payout status
   - Type: Transactional

4. **Dispute Alert** (`dispute-alert`)
   - Sent to photographers when a dispute is filed
   - Type: Transactional

5. **Refund Confirmation** (`refund-confirmation`)
   - Sent to clients when a refund is processed
   - Type: Transactional

## How to Send Emails

### Using Helper Functions (Recommended)

The easiest way to send emails is using the helper functions:

```typescript
import {
  sendPurchaseConfirmation,
  sendSaleNotification,
  sendPayoutNotification,
  sendDisputeAlert,
  sendRefundConfirmation,
} from '@/lib/email/send-template-email';

// Send purchase confirmation
await sendPurchaseConfirmation({
  to: 'customer@example.com',
  buyerEmail: 'customer@example.com',
  galleryName: 'Wedding Photos',
  photoCount: 150,
  amountPaid: '$49.99',
  transactionId: 'pi_123456',
  purchaseDate: 'January 15, 2026',
  accessLink: 'https://piksend.com/g/wedding-photos',
  photographerName: 'Jane Smith Photography',
  photographerEmail: 'jane@photography.com',
});

// Send sale notification
await sendSaleNotification({
  to: 'photographer@example.com',
  photographerName: 'Jane',
  galleryName: 'Wedding Photos',
  photoCount: 150,
  clientEmail: 'customer@example.com',
  grossAmount: '$49.99',
  platformFee: '$5.00',
  netEarnings: '$44.99',
  transactionId: 'pi_123456',
  saleDate: 'January 15, 2026',
  dashboardLink: 'https://piksend.com/revenue',
  saleDetailsLink: 'https://piksend.com/revenue/sales/123',
});
```

### Using the Generic Function

For more control, use the generic `sendTemplateEmail` function:

```typescript
import { sendTemplateEmail } from '@/lib/email/send-template-email';

await sendTemplateEmail({
  templateSlug: 'purchase-confirmation',
  to: 'customer@example.com',
  from: 'PikSend <noreply@piksend.com>',
  replyTo: 'photographer@example.com',
  variables: {
    buyerEmail: 'customer@example.com',
    galleryName: 'Wedding Photos',
    // ... other variables
  },
});
```

### Using the Template Renderer Directly

For advanced use cases, use the template renderer:

```typescript
import { createClient } from '@supabase/supabase-js';
import { createTemplateRenderer } from '@/lib/email/template-renderer';

const supabase = createClient(/* ... */);
const renderer = createTemplateRenderer(supabase);

// Render a template
const rendered = await renderer.renderBySlug('purchase-confirmation', {
  buyerEmail: 'customer@example.com',
  galleryName: 'Wedding Photos',
  // ... other variables
});

// rendered.html - HTML content
// rendered.text - Plain text content
// rendered.subject - Email subject
```

## Template Variables

### Purchase Confirmation

**Required:**
- `buyerEmail` - Customer's email address
- `galleryName` - Name of the gallery
- `photoCount` - Number of photos
- `amountPaid` - Formatted amount (e.g., "$49.99")
- `transactionId` - Payment transaction ID
- `purchaseDate` - Date of purchase
- `accessLink` - Link to access the gallery
- `photographerName` - Photographer's name

**Optional:**
- `buyerName` - Customer's name
- `accessExpiresAt` - Expiration date for access
- `photographerEmail` - Photographer's email
- `photographerLogo` - URL to photographer's logo
- `receiptUrl` - Link to receipt/invoice

### Sale Notification

**Required:**
- `photographerName` - Photographer's name
- `galleryName` - Name of the gallery
- `photoCount` - Number of photos
- `clientEmail` - Customer's email
- `grossAmount` - Total amount paid
- `platformFee` - Platform fee amount
- `netEarnings` - Net earnings after fee
- `transactionId` - Payment transaction ID
- `saleDate` - Date of sale
- `dashboardLink` - Link to revenue dashboard
- `saleDetailsLink` - Link to sale details

**Optional:**
- `clientName` - Customer's name
- `totalSalesCount` - Total number of sales
- `totalRevenue` - Total revenue to date

### Payout Notification

**Required:**
- `photographerName` - Photographer's name
- `payoutId` - Payout ID
- `amount` - Payout amount
- `currency` - Currency code (e.g., "USD")
- `status` - Payout status (pending, in_transit, paid, failed)
- `bankAccountLast4` - Last 4 digits of bank account
- `createdDate` - Date payout was created
- `dashboardLink` - Link to revenue dashboard
- `payoutDetailsLink` - Link to payout details

**Optional:**
- `bankName` - Name of the bank
- `arrivalDate` - Expected/actual arrival date
- `failureReason` - Reason for failure (if failed)
- `failureCode` - Error code (if failed)
- `stripeDashboardLink` - Link to Stripe dashboard
- `remainingBalance` - Remaining balance

### Dispute Alert

**Required:**
- `photographerName` - Photographer's name
- `amount` - Disputed amount
- `reason` - Dispute reason code
- `galleryName` - Name of the gallery
- `clientEmail` - Customer's email
- `purchaseDate` - Date of original purchase
- `transactionId` - Payment transaction ID
- `responseDeadline` - Deadline to respond
- `daysRemaining` - Days remaining to respond
- `evidenceRequired` - Array of required evidence
- `disputeDetailsLink` - Link to dispute details
- `stripeDashboardLink` - Link to Stripe dashboard

**Optional:**
- `reasonDescription` - Customer's description
- `dashboardLink` - Link to revenue dashboard

### Refund Confirmation

**Required:**
- `buyerEmail` - Customer's email
- `galleryName` - Name of the gallery
- `refundId` - Refund ID
- `refundType` - Type of refund (full, partial)
- `refundAmount` - Refund amount
- `originalAmount` - Original purchase amount
- `purchaseDate` - Date of original purchase
- `refundDate` - Date refund was processed
- `estimatedArrival` - Estimated arrival time
- `photographerName` - Photographer's name

**Optional:**
- `buyerName` - Customer's name
- `refundReason` - Reason for refund
- `photographerEmail` - Photographer's email
- `photographerLogo` - URL to photographer's logo
- `supportLink` - Link to support

## Migration Scripts

### Initial Migration

To migrate templates to the database:

```bash
npx tsx scripts/migrate-email-templates.ts
```

This script:
- Creates template records in the database
- Adds metadata (variables, type, category, description)
- Creates initial version records

### Update Metadata

To update template metadata:

```bash
npx tsx scripts/update-template-metadata.ts
```

### Test Templates

To test that all templates render correctly:

```bash
npx tsx scripts/test-migrated-templates.ts
```

## Database Schema

Templates are stored in two tables:

### `email_templates`

- `id` - UUID primary key
- `name` - Human-readable name
- `slug` - URL-safe identifier
- `type` - Template type (transactional, marketing)
- `source` - Template source (react-email, custom)
- `subject` - Subject line template
- `content` - Template content (JSONB)
- `variables` - Array of all variables
- `active_version` - Currently active version
- `is_active` - Whether template is active

### `template_versions`

- `id` - UUID primary key
- `template_id` - Foreign key to email_templates
- `version` - Version number
- `subject` - Subject line for this version
- `content` - Content for this version
- `variables` - Variables for this version
- `created_by` - Admin user who created version
- `created_at` - Creation timestamp

## Backward Compatibility

The original React Email templates in `src/emails/` are still available and can be used directly if needed. However, it's recommended to use the new system for:

- Centralized management
- Version tracking
- Easier updates
- Consistent API

## Future Enhancements

The email management system supports:

- **Custom Templates**: Create templates using a WYSIWYG editor
- **Version History**: Track and rollback template changes
- **A/B Testing**: Test different versions of templates
- **Analytics**: Track open rates, click rates, etc.
- **Scheduling**: Schedule emails for future delivery
- **Queue Management**: Automatic retry on failure

See the full design document at `.kiro/specs/email-management-system/design.md` for more details.
