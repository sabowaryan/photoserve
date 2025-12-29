/**
 * Payment Validation Schemas
 * Zod schemas for payment-related API requests
 * 
 * @module lib/validators/payment.schema
 * Requirements: 9.4 - API input validation with Zod
 */
import { z } from 'zod';

/**
 * Schema for creating a checkout session
 */
export const createCheckoutSchema = z.object({
  plan: z.enum(['premium', 'pro'], {
    message: 'Plan must be either "premium" or "pro"',
  }),
  interval: z.enum(['monthly', 'yearly'], {
    message: 'Interval must be either "monthly" or "yearly"',
  }).default('monthly'),
});

/**
 * Schema for creating a portal session
 */
export const createPortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
