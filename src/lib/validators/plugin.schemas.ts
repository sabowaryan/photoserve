/**
 * Zod Validation Schemas for Plugin Infrastructure
 * 
 * Comprehensive validation schemas for all API endpoints related to
 * the Lightroom plugin infrastructure.
 * 
 * Requirements: 13.4, 13.6
 */
import { z } from 'zod';

/**
 * Semantic version regex pattern
 * Matches: 1.0.0, 1.2.3-beta, 2.0.0-alpha.1
 */
const SEMANTIC_VERSION_REGEX = /^\d+\.\d+\.\d+(-[a-z]+(\.\d+)?)?$/;

/**
 * Lightroom version regex pattern
 * Matches: 11.0, 13.1, 14.0
 */
const LIGHTROOM_VERSION_REGEX = /^\d+\.\d+$/;

/**
 * API key format regex pattern
 * Matches: pk_live_<32 characters>
 */
const API_KEY_FORMAT_REGEX = /^pk_live_[A-Za-z0-9_-]{32}$/;

/**
 * ISO 8601 date validation helper
 */
const isoDateString = z.string().datetime({ message: 'Must be a valid ISO 8601 date' });

/**
 * API Key Management Schemas
 */

/**
 * Schema for creating a new API key
 * Requirements: 1.5, 1.6
 */
export const createAPIKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  expiresAt: isoDateString.optional(),
  scopes: z.array(z.string()).optional().default(['plugin:read', 'plugin:write']),
}).refine(
  (data) => {
    if (data.expiresAt) {
      const expirationDate = new Date(data.expiresAt);
      const now = new Date();
      return expirationDate > now;
    }
    return true;
  },
  {
    message: 'Expiration date must be in the future',
    path: ['expiresAt'],
  }
);

/**
 * Schema for API key validation
 */
export const validateAPIKeySchema = z.object({
  key: z.string()
    .regex(API_KEY_FORMAT_REGEX, 'Invalid API key format'),
});

/**
 * Plugin Version Management Schemas
 */

/**
 * Schema for creating a new plugin version
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */
export const createPluginVersionSchema = z.object({
  version: z.string()
    .regex(SEMANTIC_VERSION_REGEX, 'Version must follow semantic versioning (e.g., 1.0.0, 1.2.3-beta)'),
  fileUrl: z.string()
    .url('File URL must be a valid URL')
    .refine(
      (url) => url.includes('cloudinary.com') || url.includes('res.cloudinary.com'),
      'File URL must be a Cloudinary URL'
    ),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(104857600, 'File size must not exceed 100MB'), // 100MB in bytes
  changelog: z.string()
    .min(1, 'Changelog is required')
    .max(50000, 'Changelog must be 50,000 characters or less'),
  isStable: z.boolean().default(false),
  minLightroomVersion: z.string()
    .regex(LIGHTROOM_VERSION_REGEX, 'Minimum Lightroom version must be in format X.Y (e.g., 11.0)')
    .default('11.0'),
});

/**
 * Schema for updating a plugin version
 */
export const updatePluginVersionSchema = createPluginVersionSchema.partial();

/**
 * Schema for plugin file upload
 * Requirements: 10.3, 10.4
 */
export const pluginFileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.name.endsWith('.lrplugin') || file.name.endsWith('.zip'),
      'File must have .lrplugin or .zip extension'
    )
    .refine(
      (file) => file.size <= 104857600, // 100MB
      'File size must not exceed 100MB'
    ),
});

/**
 * Usage Tracking Schemas
 */

/**
 * Schema for logging plugin usage
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export const logUsageSchema = z.object({
  action: z.string()
    .min(1, 'Action is required')
    .max(50, 'Action must be 50 characters or less')
    .regex(/^[a-z_]+$/, 'Action must be lowercase letters and underscores only'),
  pluginVersion: z.string()
    .regex(SEMANTIC_VERSION_REGEX, 'Plugin version must follow semantic versioning')
    .optional(),
  lightroomVersion: z.string()
    .max(20, 'Lightroom version must be 20 characters or less')
    .optional(),
  osVersion: z.string()
    .max(50, 'OS version must be 50 characters or less')
    .optional(),
  metadata: z.record(z.string(), z.any())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const jsonString = JSON.stringify(val);
          return jsonString.length <= 10240; // 10KB limit
        } catch {
          return false;
        }
      },
      { message: 'Metadata must be valid JSON and less than 10KB' }
    ),
});

/**
 * Query Parameter Schemas
 */

/**
 * Schema for date range query parameters
 */
export const dateRangeQuerySchema = z.object({
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);

/**
 * Schema for plugin version query parameters
 */
export const versionQuerySchema = z.object({
  version: z.string()
    .regex(SEMANTIC_VERSION_REGEX, 'Version must follow semantic versioning')
    .optional(),
  includeUnstable: z.enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .default('false' as any),
});

/**
 * Schema for pagination query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .optional()
    .default('1' as any),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('20' as any),
});

/**
 * Schema for usage logs filter query parameters
 */
export const usageLogsFilterSchema = z.object({
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  userId: z.string().uuid('User ID must be a valid UUID').optional(),
  action: z.string()
    .max(50, 'Action must be 50 characters or less')
    .optional(),
  page: z.string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .optional()
    .default('1' as any),
  limit: z.string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('20' as any),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);

/**
 * Support Contact Form Schema
 */

/**
 * Schema for support contact form submission
 * Requirements: 9.2, 9.3, 9.4
 */
export const supportContactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  email: z.string()
    .email('Must be a valid email address')
    .max(255, 'Email must be 255 characters or less'),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be 200 characters or less'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be 5,000 characters or less'),
  category: z.enum(['technical', 'billing', 'feature_request', 'other'])
    .optional()
    .default('other'),
});

/**
 * Type exports for TypeScript
 */
export type CreateAPIKeyInput = z.infer<typeof createAPIKeySchema>;
export type ValidateAPIKeyInput = z.infer<typeof validateAPIKeySchema>;
export type CreatePluginVersionInput = z.infer<typeof createPluginVersionSchema>;
export type UpdatePluginVersionInput = z.infer<typeof updatePluginVersionSchema>;
export type LogUsageInput = z.infer<typeof logUsageSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type VersionQuery = z.infer<typeof versionQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UsageLogsFilter = z.infer<typeof usageLogsFilterSchema>;
export type SupportContactInput = z.infer<typeof supportContactSchema>;
