/**
 * Authentication Validation Schemas
 * Zod schemas for validating authentication inputs
 * 
 * Requirements: 11.3 - Sanitize all user inputs to prevent XSS attacks
 */
import { z } from 'zod';
import { sanitizeForHtml } from '@/lib/security/sanitize';

/**
 * Transform function to sanitize string inputs
 */
const sanitizeString = (val: string) => sanitizeForHtml(val);

/**
 * Sign up schema - validates new user registration
 */
export const signUpSchema = z.object({
  email: z.email({ message: 'Adresse email invalide' }),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .transform(sanitizeString)
    .optional(),
});

/**
 * Sign in schema - validates user login
 */
export const signInSchema = z.object({
  email: z.email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

/**
 * Forgot password schema - validates password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Adresse email invalide' }),
});

/**
 * Reset password schema - validates new password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Update password schema - validates password change
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
