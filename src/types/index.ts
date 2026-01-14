/**
 * TypeScript Type Definitions for PikSend
 */

// Subscription Plans
export type SubscriptionPlan = 'free' | 'premium' | 'pro';

// Payment Types for Guest Galleries (Requirements 9.2, 9.3)
export type PaymentType = 'free' | 'one_time' | 'subscription';

// Supported Locales for Translation System
// Re-export from i18n module for consistency across the application
export type { SupportedLocale, LocaleConfig } from '@/lib/i18n/types';
export { SUPPORTED_LOCALES } from '@/lib/i18n/types';

// User Profile
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_plan: SubscriptionPlan;
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  onboarding_completed: boolean;
  branding: ProfileBranding | null;
  created_at: string;
  updated_at: string;
}

// Gallery
export interface Gallery {
  id: string;
  user_id: string | null;
  title: string;
  unique_slug: string;
  password_hash: string;
  expiration_days: number;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  guest_session_id: string | null;
  is_unlocked: boolean;
  payment_type: PaymentType;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Guest Gallery - Gallery created by a visitor without an account (Requirement 9.1)
export interface GuestGallery extends Gallery {
  guest_session_id: string;
  user_id: null;
}

// Gallery Payment - Tracks one-time payments for gallery unlock (Requirement 9.5)
export interface GalleryPayment {
  id: string;
  gallery_id: string;
  stripe_payment_intent_id: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

// Image
export interface Image {
  id: string;
  gallery_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_mb: number;
  order_index: number;
  created_at: string;
}

// Rate Limit
export interface RateLimitAttempt {
  id: string;
  key: string;
  attempts: number;
  first_attempt_at: string;
  expires_at: string;
  created_at: string;
}

// Plan Limits
export interface PlanLimits {
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
  max_expiration_days: number;
  can_download_zip: boolean;
  has_custom_branding: boolean;
}

export interface SubscriptionPlanLimits extends PlanLimits {
  name: SubscriptionPlan;
  price_monthly: number;
  price_yearly: number;
}

// API Response Types
export interface ApiErrorResponse {
  error: string;
  details?: object;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

// Auth Types
export interface AuthResult {
  success: boolean;
  user?: Profile;
  error?: string;
}

// Gallery Types
export interface CreateGalleryInput {
  title: string;
  password: string;
  expirationDays: number;
}

export interface UpdateGalleryInput {
  title?: string;
  password?: string;
  expirationDays?: number;
}

export interface GalleryAccessResult {
  success: boolean;
  gallery?: Gallery;
  images?: Image[];
  error?: string;
}

// Rate Limit Types
export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
}

// Cloudinary Types
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}

// SEO Types
export type PageType = 
  | 'landing'
  | 'pricing'
  | 'features'
  | 'help'
  | 'contact'
  | 'auth'
  | 'dashboard'
  | 'gallery'
  | 'settings'
  | 'legal';

export type StructuredDataType = 
  | 'Organization'
  | 'FAQPage'
  | 'ImageGallery'
  | 'SoftwareApplication';

export interface FAQ {
  question: string;
  answer: string;
}

// Subscription Status
export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: string;
}

// ============================================
// PikSend Complete Features - Extended Types
// ============================================

// Image with metadata for enhanced gallery features
export interface ImageWithMeta extends Image {
  isFavorite?: boolean;
  comments?: Comment[];
  altText?: string;
  qualityScore?: number;
}

// Comment on an image
export interface Comment {
  id: string;
  imageId: string;
  sessionId: string;
  content: string;
  createdAt: string;
}

// Gallery statistics for analytics
export interface GalleryStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByCountry: Record<string, number>;
  viewsByDate: { date: string; count: number }[];
  ctaClicks: number;
  favoritesCount: number;
  commentsCount: number;
}

// View metadata for analytics tracking
export interface ViewMetadata {
  ip?: string;
  userAgent?: string;
  countryCode?: string;
}

// Face detection result from AI
export interface FaceDetection {
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  embedding?: number[];
}

// Quality analysis result from AI
export interface QualityAnalysis {
  isBlurry: boolean;
  hasClosedEyes: boolean;
  isDuplicate: boolean;
  duplicateOf?: string;
  overallScore: number;
}

// Plan features matrix - defines what features are available per plan
export interface PlanFeatures {
  slideshow: boolean;
  favorites: boolean;
  comments: boolean;
  detailedAnalytics: boolean;
  ctaButton: boolean;
  customWatermark: boolean;
  bulkDownload: boolean;
  paywall: boolean;
  whiteLabel: boolean;
  customDomain: boolean;
  brandColors: boolean;
  profilePage: boolean;
  deadlineTimer: boolean;
  leadMagnet: boolean;
  videoCover: boolean;
  audioGallery: boolean;
  testimonials: boolean;
  lightroomPlugin: boolean;
  faceRecognition: boolean;
  autoCaption: boolean;
  smartCulling: boolean;
}

// CTA Button configuration
export interface CTAButtonConfig {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

// Brand colors configuration
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

// Gallery settings - extended configuration for galleries
export interface GallerySettings {
  enableFavorites: boolean;
  enableComments: boolean;
  enableDeadline: boolean;
  deadlineDate?: string;
  enableLeadMagnet: boolean;
  ctaButton?: CTAButtonConfig;
  videoCoverUrl?: string;
  audioUrl?: string;
  customColors?: BrandColors;
  noindex: boolean;
}

// Profile branding configuration
export interface ProfileBranding {
  customLogo?: string;
  customDomain?: string;
  brandColors?: BrandColors;
  profileSlug?: string;
  profileBio?: string;
}

// Favorite record
export interface Favorite {
  id: string;
  galleryId: string;
  imageId: string;
  sessionId: string;
  createdAt: string;
}

// Favorite export for photographer
export interface FavoriteExport {
  galleryId: string;
  galleryTitle: string;
  favorites: {
    imageId: string;
    imageUrl: string;
    addedAt: string;
  }[];
  exportedAt: string;
}

// Lead capture record
export interface LeadCapture {
  id: string;
  galleryId: string;
  email: string;
  capturedAt: string;
}

// Testimonial record
export interface Testimonial {
  id: string;
  galleryId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  authorName?: string;
  isPublic: boolean;
  createdAt: string;
}

// Gallery analytics record
export interface GalleryAnalyticsRecord {
  id: string;
  galleryId: string;
  visitorIp?: string;
  countryCode?: string;
  userAgent?: string;
  viewedAt: string;
}

// Admin settings
export interface AdminSettings {
  stripeEnabled: boolean;
  aiFeaturesEnabled: boolean;
}

// API Error codes for feature access
export type FeatureErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_REQUIRED'
  | 'FEATURE_DISABLED'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

// Feature access error response
export interface FeatureAccessError {
  error: string;
  code: FeatureErrorCode;
  details?: {
    feature?: keyof PlanFeatures;
    requiredPlan?: SubscriptionPlan;
    [key: string]: unknown;
  };
}
