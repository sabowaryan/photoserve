import type { PlanLimits, SubscriptionPlan } from '@/types';

/**
 * Plan Limits Configuration
 * Optimisé pour la conversion :
 * - Free : Vitrine de qualité (Images HD autorisées)
 * - Premium : Efficacité (ZIP activé)
 * - Pro : Prestige (Branding activé + Stockage massif)
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    storage_limit_mb: 500,           // 500 MB : Assez pour tester une vraie galerie HD
    max_galleries: 2,
    max_images_per_gallery: 50,
    max_image_size_mb: 25,           // Permet la HD (crucial pour le "Wow" effect)
    max_expiration_days: 7,          // Court pour créer l'urgence
    can_download_zip: false,         // ZIP désactivé en Free
    has_custom_branding: false,      // Branding désactivé
  },
  premium: {
    storage_limit_mb: 102400,        // 100 GB : Le standard pour un photographe actif
    max_galleries: 100,
    max_images_per_gallery: 500,
    max_image_size_mb: 100,          // Supporte les fichiers très lourds
    max_expiration_days: 90,
    can_download_zip: true,          // ZIP activé (Argument de vente principal)
    has_custom_branding: false,
  },
  pro: {
    storage_limit_mb: 1024000,       // 1 TB (1000 GB) : Pour les studios pro
    max_galleries: 9999,             // Illimité en pratique
    max_images_per_gallery: 2000,
    max_image_size_mb: 500,          // Supporte quasiment tout (même RAW/TIFF)
    max_expiration_days: 365,
    can_download_zip: true,
    has_custom_branding: true,       // Branding activé (Argument de prestige)
  },
};

/**
 * Plan Pricing Configuration
 * Pro ajusté à 19.99$ pour être plus compétitif que la concurrence lourde.
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
    yearlyPrice: 95.90,  // ~20% de réduction
  },
  pro: {
    monthlyPrice: 19.99, // Prix agressif pour le lancement
    yearlyPrice: 191.90, // ~20% de réduction
  },
};

/**
 * Helper functions pour la logique métier
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canCreateGallery(currentCount: number, plan: SubscriptionPlan): boolean {
  return currentCount < PLAN_LIMITS[plan].max_galleries;
}

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

export function canAddImageToGallery(currentImageCount: number, plan: SubscriptionPlan): boolean {
  return currentImageCount < PLAN_LIMITS[plan].max_images_per_gallery;
}

export function isValidExpirationDays(days: number, plan: SubscriptionPlan): boolean {
  return days >= 1 && days <= PLAN_LIMITS[plan].max_expiration_days;
}

/**
 * Nouvelles fonctions de vérification des features
 */
export function hasZipAccess(plan: SubscriptionPlan): boolean {
  return PLAN_LIMITS[plan].can_download_zip;
}

export function hasBrandingAccess(plan: SubscriptionPlan): boolean {
  return PLAN_LIMITS[plan].has_custom_branding;
}
