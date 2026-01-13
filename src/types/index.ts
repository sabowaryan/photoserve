/**
 * TypeScript Type Definitions for PikSend
 */

// Subscription Plans
export type SubscriptionPlan = 'free' | 'premium' | 'pro';

// Payment Types for Guest Galleries (Requirements 9.2, 9.3)
export type PaymentType = 'free' | 'one_time' | 'subscription';

// Supported Locales for Translation System
export type SupportedLocale = 'en' | 'fr';

// Locale Configuration
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

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
  | 'ImageGallery';

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
