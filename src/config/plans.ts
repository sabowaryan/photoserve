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
    // Storage & Capacity
    storage_limit_mb: 500,           // 500 MB : Assez pour tester une vraie galerie HD
    max_galleries: 2,
    max_images_per_gallery: 50,
    max_image_size_mb: 25,           // Permet la HD (crucial pour le "Wow" effect)
    max_expiration_days: 7,          // Court pour créer l'urgence
    
    // Download Features
    can_download_zip: false,         // ZIP désactivé en Free
    
    // Branding & Customization
    has_custom_branding: false,      // Branding désactivé
    has_custom_watermark: false,     // Watermark PikSend par défaut
    
    // Advanced Features
    has_slideshow: false,            // Slideshow désactivé
    has_favorites: false,            // Favoris désactivés
    has_comments: false,             // Commentaires désactivés
    has_detailed_analytics: false,   // Analytics basiques seulement
    
    // Pro Features
    has_priority_support: false,     // Support standard
    has_custom_domain: false,        // Domaine personnalisé désactivé
    has_lightroom_plugin: false,     // Plugin Lightroom désactivé
    has_gallery_monetization: false, // Monétisation désactivée
  },
  premium: {
    // Storage & Capacity
    storage_limit_mb: 102400,        // 100 GB : Le standard pour un photographe actif
    max_galleries: 100,
    max_images_per_gallery: 500,
    max_image_size_mb: 100,          // Supporte les fichiers très lourds
    max_expiration_days: 90,
    
    // Download Features
    can_download_zip: true,          // ZIP activé (Argument de vente principal)
    
    // Branding & Customization
    has_custom_branding: false,      // Branding désactivé
    has_custom_watermark: true,      // Watermark personnalisé
    
    // Advanced Features
    has_slideshow: true,             // Slideshow activé
    has_favorites: true,             // Favoris activés
    has_comments: true,              // Commentaires activés
    has_detailed_analytics: false,   // Analytics basiques
    
    // Pro Features
    has_priority_support: false,     // Support standard
    has_custom_domain: false,        // Domaine personnalisé désactivé
    has_lightroom_plugin: false,     // Plugin Lightroom désactivé
    has_gallery_monetization: false, // Monétisation désactivée
  },
  pro: {
    // Storage & Capacity
    storage_limit_mb: 1024000,       // 1 TB (1000 GB) : Pour les studios pro
    max_galleries: 9999,             // Illimité en pratique
    max_images_per_gallery: 2000,
    max_image_size_mb: 500,          // Supporte quasiment tout (même RAW/TIFF)
    max_expiration_days: 365,
    
    // Download Features
    can_download_zip: true,          // ZIP activé
    
    // Branding & Customization
    has_custom_branding: true,       // Branding activé (Argument de prestige)
    has_custom_watermark: true,      // Watermark personnalisé
    
    // Advanced Features
    has_slideshow: true,             // Slideshow activé
    has_favorites: true,             // Favoris activés
    has_comments: true,              // Commentaires activés
    has_detailed_analytics: true,    // Analytics détaillées
    
    // Pro Features
    has_priority_support: true,      // Support prioritaire sous 2h
    has_custom_domain: true,         // Domaine personnalisé activé
    has_lightroom_plugin: true,      // Plugin Lightroom activé (Feature majeure Pro)
    has_gallery_monetization: true,  // Monétisation activée (Stripe Connect + Paywall)
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

/**
 * Plan Features Configuration
 * Define which features to display and how to format them
 * Add new features here and they will automatically appear in all pricing displays
 */
export const PLAN_FEATURES_CONFIG = [
  {
    key: 'galleries',
    getLabel: (limits: PlanLimits) => 
      limits.max_galleries >= 9999 
        ? 'Galeries illimitées' 
        : `${limits.max_galleries} galerie${limits.max_galleries > 1 ? 's' : ''} active${limits.max_galleries > 1 ? 's' : ''}`,
    priority: 1,
  },
  {
    key: 'images_per_gallery',
    getLabel: (limits: PlanLimits) => `${limits.max_images_per_gallery} photos par galerie`,
    priority: 2,
  },
  {
    key: 'expiration',
    getLabel: (limits: PlanLimits) => 
      limits.max_expiration_days >= 365 
        ? 'Accès jusqu\'à 1 an' 
        : `Accès jusqu'à ${limits.max_expiration_days} jours`,
    priority: 3,
  },
  {
    key: 'image_size',
    getLabel: (limits: PlanLimits) => 
      limits.max_image_size_mb >= 100 
        ? 'Fichiers HD sans limite' 
        : `Fichiers jusqu'à ${limits.max_image_size_mb} Mo`,
    priority: 4,
  },
  {
    key: 'original_quality',
    getLabel: () => 'Qualité originale préservée',
    priority: 5,
    alwaysShow: true, // Core value prop
  },
  {
    key: 'slideshow',
    getLabel: () => 'Mode diaporama',
    condition: (limits: PlanLimits) => limits.has_slideshow,
    priority: 6,
  },
  {
    key: 'favorites',
    getLabel: () => 'Système de favoris',
    condition: (limits: PlanLimits) => limits.has_favorites,
    priority: 7,
  },
  {
    key: 'zip_download',
    getLabel: () => 'Téléchargement ZIP',
    condition: (limits: PlanLimits) => limits.can_download_zip,
    priority: 8,
  },
  {
    key: 'custom_watermark',
    getLabel: () => 'Watermark personnalisé',
    condition: (limits: PlanLimits) => limits.has_custom_watermark,
    priority: 9,
  },
  {
    key: 'custom_branding',
    getLabel: () => 'Branding personnalisé',
    condition: (limits: PlanLimits) => limits.has_custom_branding,
    priority: 10,
  },
  {
    key: 'custom_domain',
    getLabel: () => 'Domaine personnalisé',
    condition: (limits: PlanLimits) => limits.has_custom_domain,
    priority: 11,
  },
  {
    key: 'lightroom_plugin',
    getLabel: () => 'Plugin Adobe Lightroom',
    condition: (limits: PlanLimits) => limits.has_lightroom_plugin,
    priority: 12,
  },
  {
    key: 'gallery_monetization',
    getLabel: () => 'Vente de galeries (Stripe)',
    condition: (limits: PlanLimits) => limits.has_gallery_monetization,
    priority: 13,
  },
  {
    key: 'priority_support',
    getLabel: () => 'Support prioritaire sous 2h',
    condition: (limits: PlanLimits) => limits.has_priority_support,
    priority: 14,
  },
] as const;

/**
 * Generate plan features for display
 * Centralized function to ensure consistency across all pricing displays
 * Features are automatically generated from PLAN_FEATURES_CONFIG
 * 
 * @param planKey - The plan to get features for
 * @param showAll - If true, shows all features with included/excluded status
 * @returns Array of feature strings or objects with status
 */
export function getPlanFeatures(planKey: SubscriptionPlan, showAll = false): string[] | Array<{ text: string; included: boolean }> {
  const limits = PLAN_LIMITS[planKey];
  
  if (!showAll) {
    // Original behavior: only show included features
    return PLAN_FEATURES_CONFIG
      .filter(feature => {
        const hasAlwaysShow = 'alwaysShow' in feature && feature.alwaysShow;
        const hasCondition = 'condition' in feature;
        return hasAlwaysShow || !hasCondition || (hasCondition && feature.condition && feature.condition(limits));
      })
      .sort((a, b) => a.priority - b.priority)
      .map(feature => feature.getLabel(limits));
  }
  
  // New behavior: show all features with included status
  return [...PLAN_FEATURES_CONFIG]
    .sort((a, b) => a.priority - b.priority)
    .map(feature => {
      const hasAlwaysShow = 'alwaysShow' in feature && feature.alwaysShow;
      const hasCondition = 'condition' in feature;
      const included = hasAlwaysShow || !hasCondition || (hasCondition && feature.condition && feature.condition(limits));
      
      return {
        text: feature.getLabel(limits),
        included,
      };
    });
}
