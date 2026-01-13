/**
 * Services Index
 * Re-exports all service modules for convenient imports
 */

// Auth Service
export { 
  AuthService, 
  createAuthService, 
  authService,
  type IAuthService,
  type AuthResult,
} from './auth.service';

// Gallery Service
export { 
  GalleryService, 
  createGalleryService,
  type IGalleryService,
  type GalleryAccessResult,
} from './gallery.service';

// Image Service
export {
  ImageService,
  createImageService,
  type IImageService,
  type ImageUploadResult,
  type UploadImageInput,
} from './image.service';

// Rate Limiter Service
export { 
  RateLimiterService, 
  createRateLimiterService,
  getRateLimitConfig,
  type IRateLimiterService,
} from './rate-limiter.service';

// Payment Service
export {
  PaymentService,
  createPaymentService,
  type IPaymentService,
  type CreateCheckoutInput,
} from './payment.service';

// SEO Service
export {
  SeoService,
  createSeoService,
  seoService,
  generatePageMetadata,
  generateStructuredData,
  DEFAULT_FAQS,
  type ISeoService,
  type MetadataInput,
  type StructuredDataInput,
} from './seo.service';

// Audit Log Service
export {
  AuditLogService,
  createAuditLogService,
  type IAuditLogService,
} from './audit-log.service';

// Admin Service
export {
  AdminService,
  createAdminService,
  type IAdminService,
} from './admin.service';

// Guest Gallery Service
export {
  GuestGalleryService,
  createGuestGalleryService,
  GUEST_GALLERY_LIMITS,
  type IGuestGalleryService,
  type CreateGuestGalleryInput,
  type GuestImageUploadInput,
  type GuestImageUploadResult,
  type GuestGalleryWithImages,
} from './guest-gallery.service';

// Gallery Migration Service
export {
  GalleryMigrationService,
  createGalleryMigrationService,
  type IGalleryMigrationService,
  type MigrationResult,
} from './gallery-migration.service';
