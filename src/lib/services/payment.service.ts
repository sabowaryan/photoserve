/**
 * Payment Service
 * Handles Stripe payment operations including checkout sessions and customer portal
 * 
 * @module lib/services/payment.service
 * Requirements: 6.1, 6.5, 6.7 - Stripe integration for subscriptions
 */
import { stripe, getPriceId, type StripePlan, type StripeBillingInterval } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { SubscriptionStatus, SubscriptionPlan } from '@/types';
import { AppError } from '@/lib/errors';

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
   * Create a Stripe Checkout session for subscription
   * Requirements: 6.1, 6.7 - Support monthly/yearly billing
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
   * 
   * @param customerId - The Stripe customer ID
   * @param returnUrl - URL to return to after portal session
   * @returns The portal session URL
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
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
