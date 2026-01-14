/**
 * Payment Service
 * Handles Stripe payment operations including checkout sessions and customer portal
 * 
 * @module lib/services/payment.service
 * Requirements: 6.1, 6.5, 6.7 - Stripe integration for subscriptions
 * Requirements: 4.4.1, 4.4.5 - Paywall with Stripe toggle from admin_settings
 */
import { stripe, getPriceId, type StripePlan, type StripeBillingInterval } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { SubscriptionStatus, SubscriptionPlan } from '@/types';
import { AppError } from '@/lib/errors';

/**
 * Error thrown when Stripe is disabled by admin
 * Requirements: 4.4.5 - Display message when Stripe is disabled
 */
export class StripeDisabledError extends AppError {
  constructor() {
    super('Payments are temporarily unavailable', 'STRIPE_DISABLED', 503);
    this.name = 'StripeDisabledError';
  }
}

/**
 * Payment Service Interface
 */
export interface IPaymentService {
  createCheckoutSession(
    userId: string,
    userEmail: string,
    plan: StripePlan,
    interval: StripeBillingInterval,
    successUrl: string,
    cancelUrl: string
  ): Promise<string>;
  createPortalSession(customerId: string, returnUrl: string): Promise<string>;
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null>;
  isStripeEnabled(): Promise<boolean>;
  checkStripeEnabled(): Promise<void>;
}

/**
 * Input for creating a checkout session
 */
export interface CreateCheckoutInput {
  plan: StripePlan;
  interval: StripeBillingInterval;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Payment Service Implementation
 */
export class PaymentService implements IPaymentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Check if Stripe is enabled in admin settings
   * Requirements: 4.4.5 - Check admin_settings for Stripe toggle
   * 
   * @returns true if Stripe is enabled, false otherwise
   */
  async isStripeEnabled(): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_enabled')
      .single();

    if (error || !data) {
      // Default to enabled if setting not found
      return true;
    }

    // The value is stored as JSONB, could be boolean or string
    const value = data.value;
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === 'true';
    }
    return true;
  }

  /**
   * Check if Stripe is enabled and throw error if not
   * Requirements: 4.4.5 - Display message when Stripe is disabled
   * 
   * @throws StripeDisabledError if Stripe is disabled
   */
  async checkStripeEnabled(): Promise<void> {
    const enabled = await this.isStripeEnabled();
    if (!enabled) {
      throw new StripeDisabledError();
    }
  }

  /**
   * Create a Stripe Checkout session for subscription
   * Requirements: 6.1, 6.7 - Support monthly/yearly billing
   * Requirements: 4.4.1, 4.4.5 - Check Stripe enabled before creating session
   * 
   * @param userId - The user's ID
   * @param userEmail - The user's email
   * @param plan - The subscription plan (premium or pro)
   * @param interval - Billing interval (monthly or yearly)
   * @param successUrl - URL to redirect on successful payment
   * @param cancelUrl - URL to redirect on cancelled payment
   * @returns The checkout session URL
   */
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    plan: StripePlan,
    interval: StripeBillingInterval,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    // Check if Stripe is enabled before proceeding
    await this.checkStripeEnabled();
    // Get the price ID for the selected plan and interval
    const priceId = getPriceId(plan, interval);

    // Check if customer already exists in Stripe
    let customerId: string | undefined;
    
    // First, check if user has a stripe_customer_id in their profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Search for existing customer by email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const foundCustomer = customers.data[0];
        if (foundCustomer) {
          customerId = foundCustomer.id;
          
          // Update profile with the found customer ID
          await this.supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan: plan,
        interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan: plan,
        },
      },
    });

    if (!session.url) {
      throw new AppError('Failed to create checkout session', 'CHECKOUT_ERROR', 500);
    }

    return session.url;
  }

  /**
   * Create a Stripe Customer Portal session
   * Requirements: 6.5 - Customer portal for subscription management
   * Requirements: 4.4.5 - Check Stripe enabled before creating session
   * 
   * @param customerId - The Stripe customer ID
   * @param returnUrl - URL to return to after portal session
   * @returns The portal session URL
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    // Check if Stripe is enabled before proceeding
    await this.checkStripeEnabled();

    if (!customerId) {
      throw new AppError('No Stripe customer ID found', 'NO_CUSTOMER', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get the subscription status for a user
   * 
   * @param userId - The user's ID
   * @returns The subscription status or null if no subscription
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    // Get user profile with subscription info
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('subscription_plan, stripe_subscription_id, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // If no subscription ID, return free plan status
    if (!profile.stripe_subscription_id) {
      return {
        plan: profile.subscription_plan as SubscriptionPlan,
        status: 'active',
      };
    }

    // Get subscription details from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(
        profile.stripe_subscription_id
      );

      // Access the subscription data
      const subscriptionData = subscription as unknown as {
        status: string;
        current_period_end: number;
      };

      return {
        plan: profile.subscription_plan as SubscriptionPlan,
        status: this.mapStripeStatus(subscriptionData.status),
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      };
    } catch {
      // If subscription not found in Stripe, return profile data
      return {
        plan: profile.subscription_plan as SubscriptionPlan,
        status: 'active',
      };
    }
  }

  /**
   * Map Stripe subscription status to our status type
   */
  private mapStripeStatus(
    stripeStatus: string
  ): 'active' | 'canceled' | 'past_due' | 'trialing' {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'trialing':
        return 'trialing';
      case 'past_due':
        return 'past_due';
      case 'canceled':
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
        return 'canceled';
      default:
        return 'active';
    }
  }
}

/**
 * Factory function to create a PaymentService instance
 */
export function createPaymentService(
  supabase: SupabaseClient<Database>
): PaymentService {
  return new PaymentService(supabase);
}
