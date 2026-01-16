/**
 * Gallery Purchase Service
 * Handles gallery purchase operations including checkout, access verification, and refunds
 * 
 * @module lib/services/gallery-purchase.service
 * Requirements: 3.1, 3.2, 3.3 - Payment Processing, Access Grant, Access Verification
 */
import { getStripe } from '@/lib/stripe/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import Stripe from 'stripe';

/**
 * Platform fee percentage (10%)
 */
const PLATFORM_FEE_PERCENT = 10;

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const ACCESS_CACHE_TTL = 5 * 60 * 1000;

/**
 * Purchase record interface
 */
export interface GalleryPurchase {
  id: string;
  galleryId: string;
  photographerId: string;
  buyerEmail: string;
  buyerName?: string | null;
  buyerSessionId?: string | null;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  stripeCustomerId?: string | null;
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  photographerEarningsCents: number;
  status: 'succeeded' | 'refunded' | 'disputed' | 'failed';
  refundReason?: string | null;
  accessGrantedAt?: string | null;
  accessExpiresAt?: string | null;
  purchasedAt: string;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Checkout session result
 */
export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  hasAccess: boolean;
  purchase?: GalleryPurchase;
  expiresAt?: string | null;
}

/**
 * Simple in-memory cache for access verification
 */
interface CacheEntry {
  result: AccessCheckResult;
  expiresAt: number;
}

const accessCache = new Map<string, CacheEntry>();

/**
 * Refundable amount result
 */
export interface RefundableAmountResult {
  purchaseId: string;
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
  isFullyRefunded: boolean;
  canRefund: boolean;
  reason?: string;
}

/**
 * Partial refund result
 */
export interface PartialRefundResult {
  purchase: GalleryPurchase;
  refundId: string;
  refundedAmountCents: number;
  remainingAmountCents: number;
  isFullyRefunded: boolean;
}

/**
 * Gallery Purchase Service Interface
 */
export interface IGalleryPurchaseService {
  createCheckoutSession(galleryId: string, buyerEmail: string, buyerSessionId?: string): Promise<CheckoutSessionResult>;
  recordPurchase(paymentIntent: Stripe.PaymentIntent, session: Stripe.Checkout.Session): Promise<GalleryPurchase>;
  verifyPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null>;
  getPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null>;
  grantAccess(purchaseId: string): Promise<void>;
  revokeAccess(purchaseId: string): Promise<void>;
  checkAccess(galleryId: string, identifier: string): Promise<AccessCheckResult>;
  refundPurchase(purchaseId: string, reason?: string): Promise<GalleryPurchase>;
  getRefundableAmount(purchaseId: string): Promise<RefundableAmountResult>;
  processPartialRefund(purchaseId: string, amountCents: number, reason?: string): Promise<PartialRefundResult>;
}

/**
 * Gallery Purchase Service Implementation
 */
export class GalleryPurchaseService implements IGalleryPurchaseService {
  private stripe: Stripe;

  constructor(private supabase: SupabaseClient<Database>) {
    this.stripe = getStripe();
  }

  /**
   * Create a Stripe Checkout session for gallery purchase
   * Requirements: 3.1 - Create Stripe Checkout session with destination charge
   * 
   * @param galleryId - The gallery ID to purchase
   * @param buyerEmail - The buyer's email address
   * @param buyerSessionId - Optional session ID for guest purchases
   * @returns The checkout session URL
   */
  async createCheckoutSession(
    galleryId: string,
    buyerEmail: string,
    buyerSessionId?: string
  ): Promise<CheckoutSessionResult> {
    try {
      // Validate email
      if (!buyerEmail || !this.isValidEmail(buyerEmail)) {
        throw new ValidationError('Valid email address is required', { buyerEmail });
      }

      // Get gallery monetization config
      const { data: monetization, error: monetizationError } = await this.supabase
        .from('gallery_monetization')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('is_enabled', true)
        .single();

      if (monetizationError || !monetization) {
        throw new NotFoundError('Gallery monetization configuration');
      }

      // Get gallery info
      const { data: gallery, error: galleryError } = await this.supabase
        .from('galleries')
        .select('id, title, user_id, unique_slug')
        .eq('id', galleryId)
        .single();

      if (galleryError || !gallery) {
        throw new NotFoundError('Gallery');
      }

      if (!gallery.user_id) {
        throw new AppError('Gallery has no owner', 'GALLERY_NO_OWNER', 400);
      }

      // Get photographer's Connect account
      const { data: connectAccount, error: connectError } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id, charges_enabled')
        .eq('user_id', gallery.user_id)
        .single();

      if (connectError || !connectAccount) {
        throw new AppError('Photographer has not connected Stripe', 'CONNECT_NOT_FOUND', 400);
      }

      if (!connectAccount.charges_enabled) {
        throw new AppError('Photographer cannot accept payments', 'CHARGES_NOT_ENABLED', 400);
      }

      // Check if buyer already has access
      const existingAccess = await this.checkAccess(galleryId, buyerEmail);
      if (existingAccess.hasAccess) {
        throw new ValidationError('You already have access to this gallery', {
          galleryId,
          buyerEmail,
        });
      }

      // Calculate amounts
      const amountCents = monetization.price_cents;
      const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));

      // Create Stripe Checkout Session with destination charge
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: buyerEmail,
        line_items: [
          {
            price_data: {
              currency: monetization.currency || 'usd',
              unit_amount: amountCents,
              product_data: {
                name: `Gallery Access: ${gallery.title || 'Untitled'}`,
                description: 'Full access to high-resolution photos',
                metadata: {
                  gallery_id: galleryId,
                  platform: 'piksend',
                },
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFeeCents,
          transfer_data: {
            destination: connectAccount.stripe_account_id,
          },
          metadata: {
            gallery_id: galleryId,
            buyer_email: buyerEmail,
            photographer_id: gallery.user_id,
            buyer_session_id: buyerSessionId || '',
            platform: 'piksend',
            type: 'gallery_purchase',
          },
        },
        metadata: {
          gallery_id: galleryId,
          buyer_email: buyerEmail,
          photographer_id: gallery.user_id,
          buyer_session_id: buyerSessionId || '',
          platform: 'piksend',
          type: 'gallery_purchase',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${gallery.unique_slug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${gallery.unique_slug}?purchase=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      });

      console.log('[GalleryPurchaseService] Created checkout session:', {
        sessionId: session.id,
        galleryId,
        buyerEmail,
        amountCents,
        platformFeeCents,
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error creating checkout session:', error);
      throw new AppError(
        'Failed to create checkout session',
        'CHECKOUT_CREATE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Record a purchase after successful payment
   * Requirements: 3.2 - Record purchase and grant access
   * 
   * @param paymentIntent - The Stripe PaymentIntent
   * @param session - The Stripe Checkout Session
   * @returns The created purchase record
   */
  async recordPurchase(
    paymentIntent: Stripe.PaymentIntent,
    session: Stripe.Checkout.Session
  ): Promise<GalleryPurchase> {
    try {
      const metadata = session.metadata || paymentIntent.metadata;
      const galleryId = metadata?.gallery_id;
      const buyerEmail = metadata?.buyer_email || session.customer_email;
      const photographerId = metadata?.photographer_id;
      const buyerSessionId = metadata?.buyer_session_id || null;

      if (!galleryId || !buyerEmail || !photographerId) {
        throw new ValidationError('Missing required metadata', {
          galleryId,
          buyerEmail,
          photographerId,
        });
      }

      // Check for duplicate purchase (idempotency)
      const { data: existing } = await this.supabase
        .from('gallery_purchases')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();

      if (existing) {
        console.log('[GalleryPurchaseService] Purchase already recorded:', {
          paymentIntentId: paymentIntent.id,
        });
        return this.getPurchaseById(existing.id);
      }

      // Get monetization config for access duration
      const { data: monetization } = await this.supabase
        .from('gallery_monetization')
        .select('access_duration_days')
        .eq('gallery_id', galleryId)
        .single();

      // Calculate amounts
      const amountCents = paymentIntent.amount;
      const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
      const photographerEarningsCents = amountCents - platformFeeCents;

      // Calculate access expiration
      const accessGrantedAt = new Date().toISOString();
      let accessExpiresAt: string | null = null;
      if (monetization?.access_duration_days) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + monetization.access_duration_days);
        accessExpiresAt = expirationDate.toISOString();
      }

      // Get charge ID if available
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id || null;

      // Create purchase record
      const { data: purchase, error: insertError } = await this.supabase
        .from('gallery_purchases')
        .insert({
          gallery_id: galleryId,
          photographer_id: photographerId,
          buyer_email: buyerEmail,
          buyer_name: session.customer_details?.name || null,
          buyer_session_id: buyerSessionId || null,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: chargeId,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
          amount_cents: amountCents,
          currency: paymentIntent.currency,
          platform_fee_cents: platformFeeCents,
          photographer_earnings_cents: photographerEarningsCents,
          status: 'succeeded',
          access_granted_at: accessGrantedAt,
          access_expires_at: accessExpiresAt,
          purchased_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !purchase) {
        console.error('[GalleryPurchaseService] Failed to record purchase:', insertError);
        throw new AppError('Failed to record purchase', 'PURCHASE_RECORD_ERROR', 500);
      }

      // Update gallery monetization stats
      await this.updateGalleryStats(galleryId, amountCents);

      // Invalidate access cache
      this.invalidateAccessCache(galleryId, buyerEmail);
      if (buyerSessionId) {
        this.invalidateAccessCache(galleryId, buyerSessionId);
      }

      console.log('[GalleryPurchaseService] Recorded purchase:', {
        purchaseId: purchase.id,
        galleryId,
        buyerEmail,
        amountCents,
      });

      return this.mapToPurchase(purchase);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error recording purchase:', error);
      throw new AppError(
        'Failed to record purchase',
        'PURCHASE_RECORD_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Verify if a purchase exists for a gallery
   * Requirements: 3.3 - Verify purchase by email or session ID
   * 
   * @param galleryId - The gallery ID
   * @param identifier - Email or session ID
   * @returns The purchase record or null
   */
  async verifyPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null> {
    try {
      // Try to find by email first
      let { data: purchase, error } = await this.supabase
        .from('gallery_purchases')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('buyer_email', identifier)
        .eq('status', 'succeeded')
        .single();

      // If not found by email, try session ID
      if (!purchase || error) {
        const result = await this.supabase
          .from('gallery_purchases')
          .select('*')
          .eq('gallery_id', galleryId)
          .eq('buyer_session_id', identifier)
          .eq('status', 'succeeded')
          .single();

        purchase = result.data;
        error = result.error;
      }

      if (!purchase || error) {
        return null;
      }

      return this.mapToPurchase(purchase);
    } catch (error) {
      console.error('[GalleryPurchaseService] Error verifying purchase:', error);
      return null;
    }
  }

  /**
   * Get purchase details
   * Requirements: 3.3 - Get full purchase record
   * 
   * @param galleryId - The gallery ID
   * @param identifier - Email or session ID
   * @returns The purchase record or null
   */
  async getPurchase(galleryId: string, identifier: string): Promise<GalleryPurchase | null> {
    return this.verifyPurchase(galleryId, identifier);
  }

  /**
   * Grant access to a purchase
   * Requirements: 3.2 - Grant gallery access
   * 
   * @param purchaseId - The purchase ID
   */
  async grantAccess(purchaseId: string): Promise<void> {
    try {
      // Get purchase to check monetization config
      const { data: purchase, error: getError } = await this.supabase
        .from('gallery_purchases')
        .select('gallery_id, buyer_email, buyer_session_id')
        .eq('id', purchaseId)
        .single();

      if (getError || !purchase) {
        throw new NotFoundError('Purchase');
      }

      // Get monetization config for access duration
      const { data: monetization } = await this.supabase
        .from('gallery_monetization')
        .select('access_duration_days')
        .eq('gallery_id', purchase.gallery_id)
        .single();

      // Calculate access expiration
      const accessGrantedAt = new Date().toISOString();
      let accessExpiresAt: string | null = null;
      if (monetization?.access_duration_days) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + monetization.access_duration_days);
        accessExpiresAt = expirationDate.toISOString();
      }

      // Update purchase
      const { error: updateError } = await this.supabase
        .from('gallery_purchases')
        .update({
          access_granted_at: accessGrantedAt,
          access_expires_at: accessExpiresAt,
        })
        .eq('id', purchaseId);

      if (updateError) {
        console.error('[GalleryPurchaseService] Failed to grant access:', updateError);
        throw new AppError('Failed to grant access', 'ACCESS_GRANT_ERROR', 500);
      }

      // Invalidate cache
      this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_email);
      if (purchase.buyer_session_id) {
        this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_session_id);
      }

      console.log('[GalleryPurchaseService] Granted access:', { purchaseId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error granting access:', error);
      throw new AppError('Failed to grant access', 'ACCESS_GRANT_ERROR', 500);
    }
  }

  /**
   * Revoke access for a purchase
   * Requirements: 3.2 - Revoke gallery access (for refunds)
   * 
   * @param purchaseId - The purchase ID
   */
  async revokeAccess(purchaseId: string): Promise<void> {
    try {
      // Get purchase info for cache invalidation
      const { data: purchase, error: getError } = await this.supabase
        .from('gallery_purchases')
        .select('gallery_id, buyer_email, buyer_session_id')
        .eq('id', purchaseId)
        .single();

      if (getError || !purchase) {
        throw new NotFoundError('Purchase');
      }

      // Clear access timestamps
      const { error: updateError } = await this.supabase
        .from('gallery_purchases')
        .update({
          access_granted_at: null,
          access_expires_at: null,
        })
        .eq('id', purchaseId);

      if (updateError) {
        console.error('[GalleryPurchaseService] Failed to revoke access:', updateError);
        throw new AppError('Failed to revoke access', 'ACCESS_REVOKE_ERROR', 500);
      }

      // Invalidate cache
      this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_email);
      if (purchase.buyer_session_id) {
        this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_session_id);
      }

      console.log('[GalleryPurchaseService] Revoked access:', { purchaseId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error revoking access:', error);
      throw new AppError('Failed to revoke access', 'ACCESS_REVOKE_ERROR', 500);
    }
  }

  /**
   * Check if buyer has valid access to a gallery
   * Requirements: 3.3 - Check access with caching
   * 
   * @param galleryId - The gallery ID
   * @param identifier - Email or session ID
   * @returns Access check result
   */
  async checkAccess(galleryId: string, identifier: string): Promise<AccessCheckResult> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(galleryId, identifier);
      const cached = accessCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result;
      }

      // Query database
      const purchase = await this.verifyPurchase(galleryId, identifier);

      if (!purchase) {
        const result: AccessCheckResult = { hasAccess: false };
        this.setAccessCache(cacheKey, result);
        return result;
      }

      // Check if access has been granted
      if (!purchase.accessGrantedAt) {
        const result: AccessCheckResult = { hasAccess: false, purchase };
        this.setAccessCache(cacheKey, result);
        return result;
      }

      // Check if access has expired
      if (purchase.accessExpiresAt) {
        const expiresAt = new Date(purchase.accessExpiresAt);
        if (expiresAt < new Date()) {
          const result: AccessCheckResult = {
            hasAccess: false,
            purchase,
            expiresAt: purchase.accessExpiresAt,
          };
          this.setAccessCache(cacheKey, result);
          return result;
        }
      }

      // Access is valid
      const result: AccessCheckResult = {
        hasAccess: true,
        purchase,
        expiresAt: purchase.accessExpiresAt,
      };
      this.setAccessCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[GalleryPurchaseService] Error checking access:', error);
      // Return no access on error (fail secure)
      return { hasAccess: false };
    }
  }

  /**
   * Process a refund for a purchase
   * Requirements: 7.1 - Refund management
   * 
   * @param purchaseId - The purchase ID
   * @param reason - Optional refund reason
   * @returns The updated purchase record
   */
  async refundPurchase(purchaseId: string, reason?: string): Promise<GalleryPurchase> {
    try {
      // Get purchase
      const { data: purchase, error: getError } = await this.supabase
        .from('gallery_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (getError || !purchase) {
        throw new NotFoundError('Purchase');
      }

      if (purchase.status === 'refunded') {
        throw new ValidationError('Purchase has already been refunded', { purchaseId });
      }

      if (purchase.status !== 'succeeded') {
        throw new ValidationError('Only succeeded purchases can be refunded', {
          purchaseId,
          currentStatus: purchase.status,
        });
      }

      // Process refund via Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: purchase.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          purchase_id: purchaseId,
          gallery_id: purchase.gallery_id,
          refund_reason: reason || 'Customer requested refund',
        },
      });

      if (refund.status !== 'succeeded' && refund.status !== 'pending') {
        throw new AppError('Refund failed', 'REFUND_FAILED', 500, {
          refundStatus: refund.status,
        });
      }

      // Update purchase record
      const { data: updated, error: updateError } = await this.supabase
        .from('gallery_purchases')
        .update({
          status: 'refunded',
          refund_reason: reason || 'Customer requested refund',
          refunded_at: new Date().toISOString(),
          access_granted_at: null,
          access_expires_at: null,
        })
        .eq('id', purchaseId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('[GalleryPurchaseService] Failed to update purchase after refund:', updateError);
        throw new AppError('Failed to update purchase after refund', 'REFUND_UPDATE_ERROR', 500);
      }

      // Invalidate cache
      this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_email);
      if (purchase.buyer_session_id) {
        this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_session_id);
      }

      console.log('[GalleryPurchaseService] Processed refund:', {
        purchaseId,
        refundId: refund.id,
        reason,
      });

      return this.mapToPurchase(updated);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error processing refund:', error);
      throw new AppError(
        'Failed to process refund',
        'REFUND_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get the refundable amount for a purchase
   * Requirements: 7.1 - Refund management (check refundable amount)
   * 
   * @param purchaseId - The purchase ID
   * @returns The refundable amount details
   */
  async getRefundableAmount(purchaseId: string): Promise<RefundableAmountResult> {
    try {
      // Get purchase
      const { data: purchase, error: getError } = await this.supabase
        .from('gallery_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (getError || !purchase) {
        throw new NotFoundError('Purchase');
      }

      // Check if purchase can be refunded
      if (purchase.status === 'refunded') {
        return {
          purchaseId,
          originalAmountCents: purchase.amount_cents,
          refundedAmountCents: purchase.amount_cents,
          refundableAmountCents: 0,
          currency: purchase.currency || 'usd',
          isFullyRefunded: true,
          canRefund: false,
          reason: 'Purchase has already been fully refunded',
        };
      }

      if (purchase.status !== 'succeeded') {
        return {
          purchaseId,
          originalAmountCents: purchase.amount_cents,
          refundedAmountCents: 0,
          refundableAmountCents: 0,
          currency: purchase.currency || 'usd',
          isFullyRefunded: false,
          canRefund: false,
          reason: `Cannot refund purchase with status: ${purchase.status}`,
        };
      }

      // Get existing refunds from Stripe to calculate already refunded amount
      let refundedAmountCents = 0;
      try {
        const refunds = await this.stripe.refunds.list({
          payment_intent: purchase.stripe_payment_intent_id,
          limit: 100,
        });

        refundedAmountCents = refunds.data
          .filter(r => r.status === 'succeeded' || r.status === 'pending')
          .reduce((sum, r) => sum + r.amount, 0);
      } catch (stripeError) {
        console.warn('[GalleryPurchaseService] Could not fetch refunds from Stripe:', stripeError);
        // Continue with 0 refunded amount if Stripe call fails
      }

      const refundableAmountCents = Math.max(0, purchase.amount_cents - refundedAmountCents);
      const isFullyRefunded = refundableAmountCents === 0;

      return {
        purchaseId,
        originalAmountCents: purchase.amount_cents,
        refundedAmountCents,
        refundableAmountCents,
        currency: purchase.currency || 'usd',
        isFullyRefunded,
        canRefund: refundableAmountCents > 0,
        reason: isFullyRefunded ? 'Purchase has already been fully refunded' : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error getting refundable amount:', error);
      throw new AppError(
        'Failed to get refundable amount',
        'REFUNDABLE_AMOUNT_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Process a partial refund for a purchase
   * Requirements: 7.1 - Refund management (partial refund support)
   * 
   * @param purchaseId - The purchase ID
   * @param amountCents - The amount to refund in cents
   * @param reason - Optional refund reason
   * @returns The partial refund result
   */
  async processPartialRefund(
    purchaseId: string,
    amountCents: number,
    reason?: string
  ): Promise<PartialRefundResult> {
    try {
      // Validate amount
      if (amountCents <= 0) {
        throw new ValidationError('Refund amount must be greater than 0', { amountCents });
      }

      // Get refundable amount
      const refundableInfo = await this.getRefundableAmount(purchaseId);

      if (!refundableInfo.canRefund) {
        throw new ValidationError(
          refundableInfo.reason || 'Purchase cannot be refunded',
          { purchaseId }
        );
      }

      if (amountCents > refundableInfo.refundableAmountCents) {
        throw new ValidationError(
          `Refund amount (${amountCents}) exceeds refundable amount (${refundableInfo.refundableAmountCents})`,
          {
            requestedAmount: amountCents,
            refundableAmount: refundableInfo.refundableAmountCents,
          }
        );
      }

      // Get purchase for payment intent ID
      const { data: purchase, error: getError } = await this.supabase
        .from('gallery_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (getError || !purchase) {
        throw new NotFoundError('Purchase');
      }

      // Process partial refund via Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: purchase.stripe_payment_intent_id,
        amount: amountCents,
        reason: 'requested_by_customer',
        metadata: {
          purchase_id: purchaseId,
          gallery_id: purchase.gallery_id,
          refund_reason: reason || 'Partial refund requested',
          refund_type: 'partial',
        },
      });

      if (refund.status !== 'succeeded' && refund.status !== 'pending') {
        throw new AppError('Partial refund failed', 'PARTIAL_REFUND_FAILED', 500, {
          refundStatus: refund.status,
        });
      }

      // Calculate remaining amount after this refund
      const totalRefundedAfter = refundableInfo.refundedAmountCents + amountCents;
      const remainingAmountCents = refundableInfo.originalAmountCents - totalRefundedAfter;
      const isFullyRefunded = remainingAmountCents <= 0;

      // Update purchase record if fully refunded
      let updatedPurchase = purchase;
      if (isFullyRefunded) {
        const { data: updated, error: updateError } = await this.supabase
          .from('gallery_purchases')
          .update({
            status: 'refunded',
            refund_reason: reason || 'Partial refunds completed full refund',
            refunded_at: new Date().toISOString(),
            access_granted_at: null,
            access_expires_at: null,
          })
          .eq('id', purchaseId)
          .select()
          .single();

        if (updateError || !updated) {
          console.error('[GalleryPurchaseService] Failed to update purchase after full refund:', updateError);
          throw new AppError('Failed to update purchase after refund', 'REFUND_UPDATE_ERROR', 500);
        }

        updatedPurchase = updated;

        // Invalidate cache when fully refunded
        this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_email);
        if (purchase.buyer_session_id) {
          this.invalidateAccessCache(purchase.gallery_id, purchase.buyer_session_id);
        }
      } else {
        // For partial refunds that don't complete the full refund, 
        // update the refund reason but keep status as succeeded
        const { data: updated, error: updateError } = await this.supabase
          .from('gallery_purchases')
          .update({
            refund_reason: reason || `Partial refund: ${amountCents} cents`,
          })
          .eq('id', purchaseId)
          .select()
          .single();

        if (!updateError && updated) {
          updatedPurchase = updated;
        }
      }

      console.log('[GalleryPurchaseService] Processed partial refund:', {
        purchaseId,
        refundId: refund.id,
        amountCents,
        remainingAmountCents,
        isFullyRefunded,
        reason,
      });

      return {
        purchase: this.mapToPurchase(updatedPurchase),
        refundId: refund.id,
        refundedAmountCents: amountCents,
        remainingAmountCents: Math.max(0, remainingAmountCents),
        isFullyRefunded,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryPurchaseService] Error processing partial refund:', error);
      throw new AppError(
        'Failed to process partial refund',
        'PARTIAL_REFUND_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get purchase by ID
   * @private
   */
  private async getPurchaseById(purchaseId: string): Promise<GalleryPurchase> {
    const { data, error } = await this.supabase
      .from('gallery_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Purchase');
    }

    return this.mapToPurchase(data);
  }

  /**
   * Update gallery monetization stats after a sale
   * @private
   */
  private async updateGalleryStats(galleryId: string, salePriceCents: number): Promise<void> {
    try {
      const { data: current, error: getError } = await this.supabase
        .from('gallery_monetization')
        .select('total_sales, total_revenue_cents')
        .eq('gallery_id', galleryId)
        .single();

      if (getError || !current) {
        console.warn('[GalleryPurchaseService] Could not get current stats:', getError);
        return;
      }

      const { error: updateError } = await this.supabase
        .from('gallery_monetization')
        .update({
          total_sales: (current.total_sales ?? 0) + 1,
          total_revenue_cents: (current.total_revenue_cents ?? 0) + salePriceCents,
        })
        .eq('gallery_id', galleryId);

      if (updateError) {
        console.warn('[GalleryPurchaseService] Could not update stats:', updateError);
      }
    } catch (error) {
      console.warn('[GalleryPurchaseService] Error updating gallery stats:', error);
    }
  }

  /**
   * Validate email format
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get cache key for access check
   * @private
   */
  private getCacheKey(galleryId: string, identifier: string): string {
    return `${galleryId}:${identifier.toLowerCase()}`;
  }

  /**
   * Set access cache entry
   * @private
   */
  private setAccessCache(key: string, result: AccessCheckResult): void {
    accessCache.set(key, {
      result,
      expiresAt: Date.now() + ACCESS_CACHE_TTL,
    });
  }

  /**
   * Invalidate access cache for a gallery/identifier
   * @private
   */
  private invalidateAccessCache(galleryId: string, identifier: string): void {
    const key = this.getCacheKey(galleryId, identifier);
    accessCache.delete(key);
  }

  /**
   * Map database record to GalleryPurchase interface
   * @private
   */
  private mapToPurchase(data: any): GalleryPurchase {
    return {
      id: data.id,
      galleryId: data.gallery_id,
      photographerId: data.photographer_id,
      buyerEmail: data.buyer_email,
      buyerName: data.buyer_name,
      buyerSessionId: data.buyer_session_id,
      stripePaymentIntentId: data.stripe_payment_intent_id,
      stripeChargeId: data.stripe_charge_id,
      stripeCustomerId: data.stripe_customer_id,
      amountCents: data.amount_cents,
      currency: data.currency,
      platformFeeCents: data.platform_fee_cents,
      photographerEarningsCents: data.photographer_earnings_cents,
      status: data.status,
      refundReason: data.refund_reason,
      accessGrantedAt: data.access_granted_at,
      accessExpiresAt: data.access_expires_at,
      purchasedAt: data.purchased_at,
      refundedAt: data.refunded_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

/**
 * Factory function to create a GalleryPurchaseService instance
 */
export function createGalleryPurchaseService(
  supabase: SupabaseClient<Database>
): GalleryPurchaseService {
  return new GalleryPurchaseService(supabase);
}

/**
 * Clear the access cache (for testing)
 */
export function clearAccessCache(): void {
  accessCache.clear();
}
