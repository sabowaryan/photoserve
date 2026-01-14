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
  StripeDisabledError,
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

// ZIP Download Service
export {
  ZipService,
  createZipService,
  type IZipService,
  type ZipOptions,
  type ZipResult,
  type ProgressCallback,
} from './zip.service';

// Favorites Service
export {
  FavoritesService,
  createFavoritesService,
  type IFavoritesService,
  type FavoriteExport,
} from './favorites.service';

// Comments Service
export {
  CommentsService,
  createCommentsService,
  type ICommentsService,
} from './comments.service';

// Analytics Service
export {
  AnalyticsService,
  createAnalyticsService,
  type IAnalyticsService,
  type GalleryStats,
  type ViewMetadata,
} from './analytics.service';

// Lead Capture Service
export {
  LeadCaptureService,
  createLeadCaptureService,
  type ILeadCaptureService,
  type LeadCapture,
} from './lead-capture.service';

// QR Code Service
export {
  QRCodeService,
  createQRCodeService,
  type IQRCodeService,
  type QRCodeOptions,
  type QRCodeResult,
} from './qrcode.service';

// Notification Dispatcher Service
export {
  NotificationDispatcherService,
  createNotificationDispatcherService,
  type INotificationDispatcherService,
} from './notification-dispatcher.service';

// Push Notification Service (server-side only)
export {
  sendPushNotification,
  sendCommentNotification,
  sendFavoriteNotification,
  sendExpirationNotification,
  generateVapidKeys,
  type PushSubscription,
  type NotificationPayload,
} from './push-notification.service';
