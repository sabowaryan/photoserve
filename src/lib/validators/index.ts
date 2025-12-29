/**
 * Validators Index
 * Re-exports all validation schemas for convenient imports
 */

// Auth Schemas
export {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type SignUpInput,
  type SignInInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from './auth.schema';

// Gallery Schemas
export {
  createGallerySchema,
  updateGallerySchema,
  verifyPasswordSchema,
  galleryIdSchema,
  gallerySlugSchema,
  type CreateGalleryInput,
  type UpdateGalleryInput,
  type VerifyPasswordInput,
  type GalleryIdParam,
  type GallerySlugParam,
} from './gallery.schema';

// Image Schemas
export {
  uploadImageSchema,
  ALLOWED_MIME_TYPES,
  IMAGE_MAGIC_NUMBERS,
  isAllowedMimeType,
  detectMimeTypeFromBuffer,
  validateImageFile,
  validateFileSize,
  bytesToMb,
  validateImageOrThrow,
  type UploadImageInput,
  type AllowedMimeType,
  type ImageValidationResult,
} from './image.schema';

// Payment Schemas
export {
  createCheckoutSchema,
  createPortalSchema,
  type CreateCheckoutInput,
  type CreatePortalInput,
} from './payment.schema';
