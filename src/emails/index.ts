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

// Verification Email
export { VerificationEmail } from './verification-email';
export type { VerificationEmailProps } from './verification-email';

// Password Reset Email
export { PasswordResetEmail } from './password-reset-email';
export type { PasswordResetEmailProps } from './password-reset-email';

// Password Changed Email
export { PasswordChangedEmail } from './password-changed-email';
export type { PasswordChangedEmailProps } from './password-changed-email';

// I18n Verification Email
export { I18nVerificationEmail } from './i18n-verification-email';
export type { I18nVerificationEmailProps } from './i18n-verification-email';
