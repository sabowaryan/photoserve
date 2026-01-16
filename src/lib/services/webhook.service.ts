/**
 * Webhook Service
 * Handles Stripe webhook event processing with idempotency
 * 
 * @module lib/services/webhook.service
 * Requirements: 4.2 - Webhook Service
 */
import { getStripe } from '@/lib/stripe/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import Stripe from 'stripe';
import { createGalleryPurchaseService } from './gallery-purchase.service';
import { createStripeConnectService } from './stripe-connect.service';
import { createInAppNotificationService } from './in-app-notification.service';

/**
 * Webhook event status
 */
export type WebhookEventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/**
 * Webhook event record
 */
export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  apiVersion?: string;
  status: WebhookEventStatus;
  payload: Record<string, unknown>;
  processedAt?: string;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  status: WebhookEventStatus;
  message?: string;
}

/**
 * Maximum retry attempts for failed webhooks
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Webhook Service Interface
 */
export interface IWebhookService {
  processWebhook(event: Stripe.Event): Promise<WebhookProcessingResult>;
  retryFailedWebhook(eventId: string): Promise<WebhookProcessingResult>;
  logWebhookEvent(event: Stripe.Event): Promise<string>;
  updateWebhookStatus(eventId: string, status: WebhookEventStatus, errorMessage?: string): Promise<void>;
  getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | null>;
}

/**
 * Webhook Service Implementation
 */
export class WebhookService implements IWebhookService {
  private stripe: Stripe;

  constructor(private supabase: SupabaseClient) {
    this.stripe = getStripe();
  }

  /**
   * Process a Stripe webhook event
   * Implements idempotency by checking if event was already processed
   * 
   * @param event - The Stripe event
   * @returns Processing result
   */
  async processWebhook(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      // Check if event was already processed (idempotency)
      const existing = await this.getWebhookEvent(event.id);
      if (existing) {
        if (existing.status === 'completed') {
          console.log('[WebhookService] Event already processed:', event.id);
          return {
            success: true,
            eventId: existing.id,
            status: 'skipped',
            message: 'Event already processed',
          };
        }
        // If failed, check retry count
        if (existing.status === 'failed' && existing.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.log('[WebhookService] Max retries exceeded:', event.id);
          return {
            success: false,
            eventId: existing.id,
            status: 'failed',
            message: 'Max retry attempts exceeded',
          };
        }
      }

      // Log the event
      const eventId = existing?.id || await this.logWebhookEvent(event);

      // Update status to processing
      await this.updateWebhookStatus(eventId, 'processing');

      // Process based on event type
      try {
        await this.handleEvent(event);
        await this.updateWebhookStatus(eventId, 'completed');
        
        console.log('[WebhookService] Event processed successfully:', event.id);
        return {
          success: true,
          eventId,
          status: 'completed',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.updateWebhookStatus(eventId, 'failed', errorMessage);
        
        console.error('[WebhookService] Event processing failed:', event.id, error);
        return {
          success: false,
          eventId,
          status: 'failed',
          message: errorMessage,
        };
      }
    } catch (error) {
      console.error('[WebhookService] Error processing webhook:', error);
      throw new AppError(
        'Failed to process webhook',
        'WEBHOOK_PROCESSING_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Retry a failed webhook event
   * 
   * @param eventId - The webhook event ID
   * @returns Processing result
   */
  async retryFailedWebhook(eventId: string): Promise<WebhookProcessingResult> {
    try {
      // Get the event
      const { data: eventRecord, error } = await this.supabase
        .from('webhook_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventRecord) {
        throw new AppError('Webhook event not found', 'NOT_FOUND', 404);
      }

      if (eventRecord.status !== 'failed') {
        return {
          success: false,
          eventId,
          status: eventRecord.status as WebhookEventStatus,
          message: 'Event is not in failed status',
        };
      }

      if (eventRecord.retry_count >= MAX_RETRY_ATTEMPTS) {
        return {
          success: false,
          eventId,
          status: 'failed',
          message: 'Max retry attempts exceeded',
        };
      }

      // Increment retry count
      await this.supabase
        .from('webhook_events')
        .update({
          retry_count: eventRecord.retry_count + 1,
          last_retry_at: new Date().toISOString(),
          status: 'processing',
        })
        .eq('id', eventId);

      // Reconstruct the Stripe event from payload
      const stripeEvent = eventRecord.payload as unknown as Stripe.Event;

      // Process the event
      try {
        await this.handleEvent(stripeEvent);
        await this.updateWebhookStatus(eventId, 'completed');
        
        return {
          success: true,
          eventId,
          status: 'completed',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.updateWebhookStatus(eventId, 'failed', errorMessage);
        
        return {
          success: false,
          eventId,
          status: 'failed',
          message: errorMessage,
        };
      }
    } catch (error) {
      console.error('[WebhookService] Error retrying webhook:', error);
      throw error;
    }
  }

  /**
   * Log a webhook event to the database
   * 
   * @param event - The Stripe event
   * @returns The created event ID
   */
  async logWebhookEvent(event: Stripe.Event): Promise<string> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        api_version: event.api_version || null,
        status: 'pending',
        payload: event as unknown as Record<string, unknown>,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[WebhookService] Failed to log webhook event:', error);
      throw new AppError('Failed to log webhook event', 'WEBHOOK_LOG_ERROR', 500);
    }

    return data.id;
  }

  /**
   * Update webhook event status
   * 
   * @param eventId - The event ID
   * @param status - The new status
   * @param errorMessage - Optional error message
   */
  async updateWebhookStatus(
    eventId: string,
    status: WebhookEventStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      processed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('webhook_events')
      .update(updateData)
      .eq('id', eventId);

    if (error) {
      console.error('[WebhookService] Failed to update webhook status:', error);
    }
  }

  /**
   * Get a webhook event by Stripe event ID
   * 
   * @param stripeEventId - The Stripe event ID
   * @returns The webhook event or null
   */
  async getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | null> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToWebhookEvent(data);
  }

  /**
   * Handle a Stripe event based on its type
   * @private
   */
  private async handleEvent(event: Stripe.Event): Promise<void> {
    console.log('[WebhookService] Handling event:', event.type);

    switch (event.type) {
      // Checkout events
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Connect account events
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // Payment events
      case 'payment_intent.succeeded':
        // Usually handled via checkout.session.completed
        console.log('[WebhookService] Payment intent succeeded:', (event.data.object as Stripe.PaymentIntent).id);
        break;

      case 'payment_intent.payment_failed':
        console.log('[WebhookService] Payment intent failed:', (event.data.object as Stripe.PaymentIntent).id);
        break;

      // Refund events
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // Dispute events
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      // Payout events (for Connect accounts)
      case 'payout.created':
        await this.handlePayoutCreated(event.data.object as Stripe.Payout);
        break;

      case 'payout.paid':
        await this.handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await this.handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      default:
        console.log('[WebhookService] Unhandled event type:', event.type);
    }
  }

  /**
   * Handle checkout.session.completed event
   * Records the purchase and grants access
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('[WebhookService] Handling checkout completed:', session.id);

    // Check if this is a gallery purchase
    const metadata = session.metadata;
    if (metadata?.type !== 'gallery_purchase') {
      console.log('[WebhookService] Not a gallery purchase, skipping');
      return;
    }

    // Get the payment intent
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      console.error('[WebhookService] No payment intent ID in session');
      return;
    }

    // Retrieve the full payment intent
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    // Record the purchase
    const purchaseService = createGalleryPurchaseService(this.supabase);
    const purchase = await purchaseService.recordPurchase(paymentIntent, session);

    console.log('[WebhookService] Purchase recorded for gallery:', metadata.gallery_id);

    // Send in-app notification to photographer
    if (purchase && metadata.photographer_id) {
      try {
        const notificationService = createInAppNotificationService(this.supabase);
        await notificationService.notifySale(
          metadata.photographer_id,
          metadata.gallery_name || 'Galerie',
          session.amount_total || 0,
          session.currency || 'usd',
          purchase.id
        );
        console.log('[WebhookService] Sale notification sent to photographer');
      } catch (notifError) {
        console.error('[WebhookService] Failed to send sale notification:', notifError);
        // Don't throw - notification failure shouldn't fail the webhook
      }
    }
  }

  /**
   * Handle account.updated event
   * Updates Connect account status
   */
  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    console.log('[WebhookService] Handling account updated:', account.id);

    const connectService = createStripeConnectService(this.supabase);
    await connectService.updateAccountStatus(account.id);

    console.log('[WebhookService] Account status updated:', account.id);
  }

  /**
   * Handle charge.refunded event
   * Updates purchase status
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    console.log('[WebhookService] Handling charge refunded:', charge.id);

    // Find the purchase by charge ID
    const { data: purchase, error } = await this.supabase
      .from('gallery_purchases')
      .select('id, status, photographer_id, amount_cents, currency, galleries(title)')
      .eq('stripe_charge_id', charge.id)
      .single();

    if (error || !purchase) {
      console.log('[WebhookService] No purchase found for charge:', charge.id);
      return;
    }

    // Update purchase status if not already refunded
    if (purchase.status !== 'refunded') {
      await this.supabase
        .from('gallery_purchases')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          access_granted_at: null,
          access_expires_at: null,
        })
        .eq('id', purchase.id);

      console.log('[WebhookService] Purchase marked as refunded:', purchase.id);

      // Send in-app notification to photographer
      if (purchase.photographer_id) {
        try {
          const notificationService = createInAppNotificationService(this.supabase);
          const galleryTitle = (purchase.galleries as any)?.title || 'Galerie';
          await notificationService.notifyRefund(
            purchase.photographer_id,
            galleryTitle,
            purchase.amount_cents,
            purchase.currency || 'usd',
            purchase.id
          );
          console.log('[WebhookService] Refund notification sent to photographer');
        } catch (notifError) {
          console.error('[WebhookService] Failed to send refund notification:', notifError);
        }
      }
    }
  }

  /**
   * Handle charge.dispute.created event
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    console.log('[WebhookService] Handling dispute created:', dispute.id);

    // Find the purchase by charge ID
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    if (!chargeId) return;

    const { data: purchase, error } = await this.supabase
      .from('gallery_purchases')
      .select('id, photographer_id, amount_cents, currency, galleries(title)')
      .eq('stripe_charge_id', chargeId)
      .single();

    if (error || !purchase) {
      console.log('[WebhookService] No purchase found for disputed charge:', chargeId);
      return;
    }

    // Update purchase status to disputed
    await this.supabase
      .from('gallery_purchases')
      .update({ status: 'disputed' })
      .eq('id', purchase.id);

    console.log('[WebhookService] Purchase marked as disputed:', purchase.id);

    // Send in-app notification to photographer
    if (purchase.photographer_id) {
      try {
        const notificationService = createInAppNotificationService(this.supabase);
        const galleryTitle = (purchase.galleries as any)?.title || 'Galerie';
        await notificationService.notifyDispute(
          purchase.photographer_id,
          galleryTitle,
          purchase.amount_cents,
          purchase.currency || 'usd',
          dispute.id
        );
        console.log('[WebhookService] Dispute notification sent to photographer');
      } catch (notifError) {
        console.error('[WebhookService] Failed to send dispute notification:', notifError);
      }
    }
  }

  /**
   * Handle charge.dispute.closed event
   */
  private async handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
    console.log('[WebhookService] Handling dispute closed:', dispute.id, 'Status:', dispute.status);

    // Find the purchase by charge ID
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    if (!chargeId) return;

    const { data: purchase, error } = await this.supabase
      .from('gallery_purchases')
      .select('id')
      .eq('stripe_charge_id', chargeId)
      .single();

    if (error || !purchase) {
      console.log('[WebhookService] No purchase found for disputed charge:', chargeId);
      return;
    }

    // Update status based on dispute outcome
    const newStatus = dispute.status === 'won' ? 'succeeded' : 'refunded';
    await this.supabase
      .from('gallery_purchases')
      .update({
        status: newStatus,
        ...(newStatus === 'refunded' ? {
          refunded_at: new Date().toISOString(),
          access_granted_at: null,
          access_expires_at: null,
        } : {}),
      })
      .eq('id', purchase.id);

    console.log('[WebhookService] Dispute closed, purchase status:', newStatus);
  }

  /**
   * Handle payout.created event
   */
  private async handlePayoutCreated(payout: Stripe.Payout): Promise<void> {
    console.log('[WebhookService] Payout created:', payout.id, 'Amount:', payout.amount);
    
    // Get the connected account ID from the payout
    const accountId = (payout as any).destination || (payout as any).account;
    if (!accountId) {
      console.log('[WebhookService] No account ID found for payout');
      return;
    }

    // Find the photographer by their Stripe account ID
    const { data: connectAccount, error } = await this.supabase
      .from('stripe_connect_accounts')
      .select('user_id')
      .eq('stripe_account_id', accountId)
      .single();

    if (error || !connectAccount) {
      console.log('[WebhookService] No connect account found for:', accountId);
      return;
    }

    // Send in-app notification
    try {
      const notificationService = createInAppNotificationService(this.supabase);
      await notificationService.notifyPayout(
        connectAccount.user_id,
        payout.amount,
        payout.currency,
        'pending',
        payout.id
      );
      console.log('[WebhookService] Payout created notification sent');
    } catch (notifError) {
      console.error('[WebhookService] Failed to send payout notification:', notifError);
    }
  }

  /**
   * Handle payout.paid event
   */
  private async handlePayoutPaid(payout: Stripe.Payout): Promise<void> {
    console.log('[WebhookService] Payout paid:', payout.id);
    
    const accountId = (payout as any).destination || (payout as any).account;
    if (!accountId) return;

    const { data: connectAccount, error } = await this.supabase
      .from('stripe_connect_accounts')
      .select('user_id')
      .eq('stripe_account_id', accountId)
      .single();

    if (error || !connectAccount) return;

    try {
      const notificationService = createInAppNotificationService(this.supabase);
      await notificationService.notifyPayout(
        connectAccount.user_id,
        payout.amount,
        payout.currency,
        'paid',
        payout.id
      );
      console.log('[WebhookService] Payout paid notification sent');
    } catch (notifError) {
      console.error('[WebhookService] Failed to send payout paid notification:', notifError);
    }
  }

  /**
   * Handle payout.failed event
   */
  private async handlePayoutFailed(payout: Stripe.Payout): Promise<void> {
    console.log('[WebhookService] Payout failed:', payout.id, 'Failure:', payout.failure_message);
    
    const accountId = (payout as any).destination || (payout as any).account;
    if (!accountId) return;

    const { data: connectAccount, error } = await this.supabase
      .from('stripe_connect_accounts')
      .select('user_id')
      .eq('stripe_account_id', accountId)
      .single();

    if (error || !connectAccount) return;

    try {
      const notificationService = createInAppNotificationService(this.supabase);
      await notificationService.notifyPayout(
        connectAccount.user_id,
        payout.amount,
        payout.currency,
        'failed',
        payout.id
      );
      console.log('[WebhookService] Payout failed notification sent');
    } catch (notifError) {
      console.error('[WebhookService] Failed to send payout failed notification:', notifError);
    }
  }

  /**
   * Map database record to WebhookEvent interface
   * @private
   */
  private mapToWebhookEvent(data: Record<string, unknown>): WebhookEvent {
    return {
      id: data.id as string,
      stripeEventId: data.stripe_event_id as string,
      eventType: data.event_type as string,
      apiVersion: data.api_version as string | undefined,
      status: data.status as WebhookEventStatus,
      payload: data.payload as Record<string, unknown>,
      processedAt: data.processed_at as string | undefined,
      errorMessage: data.error_message as string | undefined,
      retryCount: data.retry_count as number,
      lastRetryAt: data.last_retry_at as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }
}

/**
 * Factory function to create a WebhookService instance
 */
export function createWebhookService(
  supabase: SupabaseClient
): WebhookService {
  return new WebhookService(supabase);
}
