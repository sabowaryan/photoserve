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
