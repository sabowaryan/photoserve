/**
 * Send Template Email Utility
 * 
 * Convenience functions for sending emails using templates from the database.
 * This provides a simple API for the existing email sending code to use.
 * 
 * Updated to use the new Email Management System with queue processing,
 * provider abstraction, and comprehensive logging.
 * 
 * Requirements: 3.9, 3.10, 10.4, 10.5
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createTemplateRenderer } from './template-renderer';
import { EmailService } from '@/lib/services/email.service';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Send an email using a template from the database
 * 
 * This function now uses the new Email Management System which provides:
 * - Queue-based processing with retry logic
 * - Provider abstraction (Resend or AWS SES)
 * - Comprehensive logging and analytics
 * - Suppression list checking
 * 
 * @param options - Email sending options
 * @returns Promise resolving to email send result
 */
export async function sendTemplateEmail(options: {
  /** Template slug (e.g., 'purchase-confirmation') */
  templateSlug: string;
  
  /** Recipient email address */
  to: string | string[];
  
  /** Sender email address (defaults to configured default sender) */
  from?: string;
  
  /** Template variables */
  variables: Record<string, any>;
  
  /** Reply-to email address */
  replyTo?: string;
  
  /** CC recipients */
  cc?: string[];
  
  /** BCC recipients */
  bcc?: string[];
  
  /** Email type (defaults to 'transactional') */
  type?: 'transactional' | 'marketing';
  
  /** Email priority (defaults to 'high' for transactional, 'normal' for marketing) */
  priority?: 'high' | 'normal' | 'low';
}): Promise<{ id: string; error?: string }> {
  try {
    // Create template renderer
    const renderer = createTemplateRenderer(supabase);

    // Render the template
    const rendered = await renderer.renderBySlug(
      options.templateSlug,
      options.variables
    );

    // Get template ID for logging
    const templates = await supabase
      .from('email_templates')
      .select('id')
      .eq('slug', options.templateSlug)
      .eq('is_active', true)
      .single();

    const templateId = templates.data?.id;

    // Create email service
    const emailService = new EmailService(supabase);

    // Handle multiple recipients
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const results: { id: string; error?: string }[] = [];

    // Send to each recipient
    for (const recipient of recipients) {
      const result = await emailService.sendTransactionalEmail({
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        from: options.from,
        cc: options.cc,
        bcc: options.bcc,
        templateId,
        variables: options.variables,
        priority: options.priority,
        type: options.type || 'transactional',
      });

      results.push({
        id: result.id,
        error: result.error,
      });
    }

    // Return first result (for backward compatibility)
    // In the future, we could return all results
    return results[0] || { id: '', error: 'No recipients provided' };
  } catch (error) {
    console.error('Error sending template email:', error);
    return {
      id: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(options: {
  to: string;
  buyerName?: string;
  buyerEmail: string;
  galleryName: string;
  photoCount: number;
  amountPaid: string;
  transactionId: string;
  purchaseDate: string;
  accessLink: string;
  accessExpiresAt?: string;
  photographerName: string;
  photographerEmail?: string;
  photographerLogo?: string;
  receiptUrl?: string;
  replyTo?: string;
}) {
  return sendTemplateEmail({
    templateSlug: 'purchase-confirmation',
    to: options.to,
    replyTo: options.replyTo || options.photographerEmail,
    variables: {
      buyerName: options.buyerName,
      buyerEmail: options.buyerEmail,
      galleryName: options.galleryName,
      photoCount: options.photoCount,
      amountPaid: options.amountPaid,
      transactionId: options.transactionId,
      purchaseDate: options.purchaseDate,
      accessLink: options.accessLink,
      accessExpiresAt: options.accessExpiresAt,
      photographerName: options.photographerName,
      photographerEmail: options.photographerEmail,
      photographerLogo: options.photographerLogo,
      receiptUrl: options.receiptUrl,
    },
  });
}

/**
 * Send sale notification email
 */
export async function sendSaleNotification(options: {
  to: string;
  photographerName: string;
  galleryName: string;
  photoCount: number;
  clientEmail: string;
  clientName?: string;
  grossAmount: string;
  platformFee: string;
  netEarnings: string;
  transactionId: string;
  saleDate: string;
  dashboardLink: string;
  saleDetailsLink: string;
  totalSalesCount?: number;
  totalRevenue?: string;
}) {
  return sendTemplateEmail({
    templateSlug: 'sale-notification',
    to: options.to,
    variables: options,
  });
}

/**
 * Send payout notification email
 */
export async function sendPayoutNotification(options: {
  to: string;
  photographerName: string;
  payoutId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed';
  bankName?: string;
  bankAccountLast4: string;
  createdDate: string;
  arrivalDate?: string;
  failureReason?: string;
  failureCode?: string;
  dashboardLink: string;
  payoutDetailsLink: string;
  stripeDashboardLink?: string;
  remainingBalance?: string;
}) {
  return sendTemplateEmail({
    templateSlug: 'payout-notification',
    to: options.to,
    variables: options,
  });
}

/**
 * Send dispute alert email
 */
export async function sendDisputeAlert(options: {
  to: string;
  photographerName: string;
  amount: string;
  reason: string;
  reasonDescription?: string;
  galleryName: string;
  clientEmail: string;
  purchaseDate: string;
  transactionId: string;
  responseDeadline: string;
  daysRemaining: number;
  evidenceRequired: string[];
  dashboardLink?: string;
  disputeDetailsLink: string;
  stripeDashboardLink: string;
}) {
  return sendTemplateEmail({
    templateSlug: 'dispute-alert',
    to: options.to,
    variables: options,
  });
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmation(options: {
  to: string;
  buyerName?: string;
  buyerEmail: string;
  galleryName: string;
  refundId: string;
  refundType: 'full' | 'partial';
  refundAmount: string;
  originalAmount: string;
  refundReason?: string;
  purchaseDate: string;
  refundDate: string;
  estimatedArrival: string;
  photographerName: string;
  photographerEmail?: string;
  photographerLogo?: string;
  supportLink?: string;
  replyTo?: string;
}) {
  return sendTemplateEmail({
    templateSlug: 'refund-confirmation',
    to: options.to,
    replyTo: options.replyTo || options.photographerEmail,
    variables: {
      buyerName: options.buyerName,
      buyerEmail: options.buyerEmail,
      galleryName: options.galleryName,
      refundId: options.refundId,
      refundType: options.refundType,
      refundAmount: options.refundAmount,
      originalAmount: options.originalAmount,
      refundReason: options.refundReason,
      purchaseDate: options.purchaseDate,
      refundDate: options.refundDate,
      estimatedArrival: options.estimatedArrival,
      photographerName: options.photographerName,
      photographerEmail: options.photographerEmail,
      photographerLogo: options.photographerLogo,
      supportLink: options.supportLink,
    },
  });
}
