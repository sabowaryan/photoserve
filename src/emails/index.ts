/**
 * Email Templates Index
 * Re-exports all email templates for convenient imports
 * 
 * @module emails
 */

// Components
export { BaseLayout, Button, colors, styles } from './components';
export type { BaseLayoutProps, ButtonProps } from './components';

// Purchase Confirmation Email
export { PurchaseConfirmationEmail } from './purchase-confirmation';
export type { PurchaseConfirmationEmailProps } from './purchase-confirmation';

// Sale Notification Email
export { SaleNotificationEmail } from './sale-notification';
export type { SaleNotificationEmailProps } from './sale-notification';

// Payout Notification Email
export { PayoutNotificationEmail } from './payout-notification';
export type { PayoutNotificationEmailProps, PayoutStatus } from './payout-notification';

// Dispute Alert Email
export { DisputeAlertEmail } from './dispute-alert';
export type { DisputeAlertEmailProps, DisputeReason } from './dispute-alert';

// Refund Confirmation Email
export { RefundConfirmationEmail } from './refund-confirmation';
export type { RefundConfirmationEmailProps, RefundType } from './refund-confirmation';
