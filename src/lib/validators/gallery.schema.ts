/**
 * Gallery Validation Schemas
 * Zod schemas for validating gallery inputs
 * 
 * @module lib/validators/gallery.schema
 * Requirements: 9.4 - API Input Validation
 * Requirements: 11.3 - Sanitize all user inputs to prevent XSS attacks
 */
import { z } from 'zod';
import { sanitizeForHtml } from '@/lib/security/sanitize';

/**
 * Transform function to sanitize string inputs
 */
const sanitizeString = (val: string) => sanitizeForHtml(val);

/**
 * Create gallery schema - validates new gallery creation
 */
export const createGallerySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre est requis')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .transform(sanitizeString),
  password: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || (val.length >= 4 && val.length <= 50),
      {
        message: 'Le mot de passe doit être vide ou contenir entre 4 et 50 caractères',
      }
    ),
  expirationDays: z
    .number()
    .int('Le nombre de jours doit être un entier')
    .min(1, 'La durée minimale est de 1 jour')
    .max(365, 'La durée maximale est de 365 jours'),
});

/**
 * Update gallery schema - validates gallery updates
 * All fields are optional for partial updates
 */
export const updateGallerySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre est requis')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .transform(sanitizeString)
    .optional(),
  password: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || (val.length >= 4 && val.length <= 50),
      {
        message: 'Le mot de passe doit être vide ou contenir entre 4 et 50 caractères',
      }
    )
    .optional(),
  expirationDays: z
    .number()
    .int('Le nombre de jours doit être un entier')
    .min(1, 'La durée minimale est de 1 jour')
    .max(365, 'La durée maximale est de 365 jours')
    .optional(),
  settings: z
    .object({
      enableFavorites: z.boolean().optional(),
      enableComments: z.boolean().optional(),
      enableDeadline: z.boolean().optional(),
      deadlineDate: z.string().optional(),
      enableLeadMagnet: z.boolean().optional(),
      ctaButton: z
        .object({
          text: z.string(),
          url: z.string().url(),
          style: z.enum(['primary', 'secondary']),
        })
        .optional(),
      videoCoverUrl: z.string().url().optional(),
      audioUrl: z.string().url().optional(),
      customColors: z
        .object({
          primary: z.string(),
          secondary: z.string(),
          accent: z.string(),
        })
        .optional(),
      noindex: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Verify password schema - validates gallery password verification
 */
export const verifyPasswordSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est requis'),
  password: z
    .string()
    .trim()
    .min(1, 'Le mot de passe est requis'),
});

/**
 * Gallery ID param schema - validates gallery ID in URL params
 */
export const galleryIdSchema = z.object({
  id: z.string().trim().uuid('ID de galerie invalide'),
});

/**
 * Gallery slug param schema - validates gallery slug in URL params
 */
export const gallerySlugSchema = z.object({
  slug: z.string().trim().min(1, 'Le slug est requis'),
});

// Type exports
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
export type VerifyPasswordInput = z.infer<typeof verifyPasswordSchema>;
export type GalleryIdParam = z.infer<typeof galleryIdSchema>;
export type GallerySlugParam = z.infer<typeof gallerySlugSchema>;
