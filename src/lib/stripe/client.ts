/**
 * Stripe Client Configuration
 * Provides Stripe SDK instance for server-side operations
 * 
 * @module lib/stripe/client
 * Requirements: 6.1 - Stripe integration for payment processing
 */
import Stripe from 'stripe';

/**
 * Lazy-initialized Stripe client instance for server-side operations
 * Uses the latest API version for consistency
 * Defers validation to runtime to allow builds without env vars
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Stripe client instance for server-side operations (legacy export)
 * Note: Prefer using getStripe() for lazy initialization
 */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : (null as unknown as Stripe);

/**
 * Stripe Price IDs for subscription plans
 * These should match the prices configured in Stripe Dashboard
 */
export const STRIPE_PRICES = {
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_1ShV7vAmXOVRZkyi0kWAZ49r',
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1ShV8EAmXOVRZkyiQ1ub2vqi',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
} as const;

/**
 * Stripe Product IDs for subscription plans
 */
export const STRIPE_PRODUCTS = {
  premium: process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_TeoloHfEgmqI5Z',
  pro: process.env.STRIPE_PRO_PRODUCT_ID || 'prod_TeoltbJQw5IZv5',
} as const;

export type StripePlan = keyof typeof STRIPE_PRICES;
export type StripeBillingInterval = 'monthly' | 'yearly';

/**
 * Get the price ID for a given plan and billing interval
 */
export function getPriceId(plan: StripePlan, interval: StripeBillingInterval): string {
  const priceId = STRIPE_PRICES[plan][interval];
  if (!priceId) {
    throw new Error(`No price ID configured for ${plan} ${interval}`);
  }
  return priceId;
}

/**
 * Check if a price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return Object.values(STRIPE_PRICES).some(
    (prices) => prices.monthly === priceId || prices.yearly === priceId
  );
}

export default stripe;
