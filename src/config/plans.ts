import type { PlanLimits, SubscriptionPlan } from '@/types';

/**
 * Plan Limits Configuration
 * Defines the limits for each subscription plan
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    storage_limit_mb: 20,
    max_galleries: 3,
    max_images_per_gallery: 30,
    max_image_size_mb: 1,
    max_expiration_days: 14,
  },
  premium: {
    storage_limit_mb: 5120, // 5 GB
    max_galleries: 50,
    max_images_per_gallery: 500,
    max_image_size_mb: 50,
    max_expiration_days: 90,
  },
  pro: {
    storage_limit_mb: 51200, // 50 GB
    max_galleries: 500,
    max_images_per_gallery: 5000,
    max_image_size_mb: 100,
    max_expiration_days: 180,
  },
};

/**
 * Plan Pricing Configuration
 * Defines the pricing for each subscription plan
 */
export const PLAN_PRICING: Record<SubscriptionPlan, {
  monthlyPrice: number;
  yearlyPrice: number;
}> = {
  free: {
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  premium: {
    monthlyPrice: 9.99,
    yearlyPrice: 95.90, // ~20% discount
  },
  pro: {
    monthlyPrice: 25.99,
    yearlyPrice: 249.50, // ~20% discount
  },
};

/**
 * Get plan limits for a given subscription plan
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Check if a user can create a new gallery based on their plan
 */
export function canCreateGallery(
  currentCount: number,
  plan: SubscriptionPlan
): boolean {
  return currentCount < PLAN_LIMITS[plan].max_galleries;
}

/**
 * Check if a user can upload an image based on their plan
 */
export function canUploadImage(
  currentStorageMb: number,
  fileSizeMb: number,
  plan: SubscriptionPlan
): boolean {
  const limits = PLAN_LIMITS[plan];
  return (
    fileSizeMb <= limits.max_image_size_mb &&
    currentStorageMb + fileSizeMb <= limits.storage_limit_mb
  );
}

/**
 * Check if a gallery can have more images based on the plan
 */
export function canAddImageToGallery(
  currentImageCount: number,
  plan: SubscriptionPlan
): boolean {
  return currentImageCount < PLAN_LIMITS[plan].max_images_per_gallery;
}

/**
 * Validate expiration days based on plan
 */
export function isValidExpirationDays(
  days: number,
  plan: SubscriptionPlan
): boolean {
  return days >= 1 && days <= PLAN_LIMITS[plan].max_expiration_days;
}
