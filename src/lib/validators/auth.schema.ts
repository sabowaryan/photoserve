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
 * Password validation function with complexity requirements
 * Requirements: 4.4 - Password strength enforcement
 */
const passwordSchema = z
  .string()
  .trim()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

/**
 * Sign up schema - validates new user registration
 */
export const signUpSchema = z.object({
  email: z.string().trim().email({ message: 'Adresse email invalide' }),
  password: passwordSchema,
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .transform(sanitizeString)
    .optional(),
});

/**
 * Sign in schema - validates user login
 */
export const signInSchema = z.object({
  email: z.string().trim().email({ message: 'Adresse email invalide' }),
  password: z.string().trim().min(1, 'Le mot de passe est requis'),
});

/**
 * Forgot password schema - validates password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Adresse email invalide' }),
});

/**
 * Reset password schema - validates new password
 */
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token invalide'),
  password: passwordSchema,
  confirmPassword: z.string().trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Update password schema - validates password change
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
  confirmPassword: z.string().trim(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Verify email schema - validates email verification token
 */
export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Token invalide'),
});

/**
 * Resend verification schema - validates resend verification request
 */
export const resendVerificationSchema = z.object({
  email: z.string().trim().email({ message: 'Adresse email invalide' }),
});

/**
 * Request password reset schema - validates password reset request
 * (Alias for forgotPasswordSchema for consistency)
 */
export const requestPasswordResetSchema = forgotPasswordSchema;

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
