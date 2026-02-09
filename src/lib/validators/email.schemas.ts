/**
 * Email API Validation Schemas
 * 
 * Zod schemas for validating email API requests
 * Requirements: 10.3
 */

import { z } from 'zod';

/**
 * Email priority values
 */
export const emailPrioritySchema = z.enum(['high', 'normal', 'low']);

/**
 * Email type values
 */
export const emailTypeSchema = z.enum(['transactional', 'marketing']);

/**
 * Email status values
 */
export const emailStatusSchema = z.enum([
  'queued',
  'pending',
  'processing',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'failed',
  'cancelled',
]);

// Helper validators
const emailValidator = z.string().refine(
  (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  { message: 'Invalid email address' }
);

const uuidValidator = z.string().refine(
  (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
  { message: 'Invalid UUID' }
);

/**
 * Schema for sending an immediate email
 */
export const sendEmailSchema = z.object({
  to: emailValidator,
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  from: emailValidator.optional(),
  cc: z.array(emailValidator).optional(),
  bcc: z.array(emailValidator).optional(),
  templateId: uuidValidator.optional(),
  variables: z.record(z.string(), z.any()).optional(),
  priority: emailPrioritySchema.optional(),
  type: emailTypeSchema.default('transactional'),
});

/**
 * Schema for scheduling an email
 */
export const scheduleEmailSchema = sendEmailSchema.extend({
  scheduledAt: z.coerce.date({ message: 'Invalid scheduled date' }),
});

/**
 * Schema for creating a template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: emailTypeSchema.default('transactional'),
  source: z.enum(['react-email', 'custom']),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  content: z.any(), // JSON or HTML content
  variables: z.array(z.string()).default([]),
});

/**
 * Schema for updating a template
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long').optional(),
  content: z.any().optional(), // JSON or HTML content
  variables: z.array(z.string()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Schema for listing templates
 */
export const listTemplatesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: emailTypeSchema.nullable().optional(),
  source: z.enum(['react-email', 'custom']).nullable().optional(),
  status: z.enum(['active', 'inactive']).nullable().optional(),
  search: z.string().nullable().optional(),
});

/**
 * Schema for listing email logs
 */
export const listLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: emailStatusSchema.nullable().optional(),
  from: z.coerce.date({ message: 'Invalid from date' }).nullable().optional(),
  to: z.coerce.date({ message: 'Invalid to date' }).nullable().optional(),
  recipient: emailValidator.nullable().optional(),
  templateId: uuidValidator.nullable().optional(),
});

/**
 * Schema for analytics query
 */
export const analyticsQuerySchema = z.object({
  templateId: uuidValidator.nullable().optional(),
  senderEmail: emailValidator.nullable().optional(),
  from: z.coerce.date({ message: 'Invalid from date' }),
  to: z.coerce.date({ message: 'Invalid to date' }),
  groupBy: z.enum(['day', 'week', 'month']).nullable().optional(),
});

/**
 * Type exports
 */
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ScheduleEmailInput = z.infer<typeof scheduleEmailSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesSchema>;
export type ListLogsQuery = z.infer<typeof listLogsSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
