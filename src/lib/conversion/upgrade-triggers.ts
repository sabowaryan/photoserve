/**
 * Smart Upgrade Triggers Service
 * Detects conditions for showing upgrade prompts
 * 
 * @module lib/conversion/upgrade-triggers
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8
 */

import type { UpgradeTrigger } from '@/components/shared/upgrade-modal';
import type { Subscription } from '@/hooks/use-subscription';

export interface TriggerCondition {
  type: UpgradeTrigger;
  shouldTrigger: boolean;
  priority: number;
  cooldownHours: number;
  messaging: {
    title: string;
    description: string;
    cta: string;
  };
  featureType?: string;
  limitType?: string;
}

export interface UserBehavior {
  galleriesCreated: number;
  daysActive: number;
  lastUpgradePrompt?: Date;
  clickedLockedFeatures: string[];
  currentStorageMb: number;
  totalViews: number;
}

/**
 * Requirement 8.1: Trigger "limite atteinte" using existing subscription hook
 */
export function checkLimitReachedTrigger(
  subscription: Subscription,
  behavior: UserBehavior
): TriggerCondition | null {
  const { plan } = subscription;
  
  // Check gallery limit
  if (plan === 'free' && behavior.galleriesCreated >= 2) {
    return {
      type: 'limit_reached',
      shouldTrigger: true,
      priority: 1, // Highest priority
      cooldownHours: 0, // No cooldown for hard limits
      messaging: {
        title: 'Limite de galeries atteinte',
        description: 'Vous avez atteint la limite de 2 galeries. Passez à Premium pour créer 100 galeries.',
        cta: 'Voir les plans',
      },
      limitType: 'gallery',
    };
  }
  
  if (plan === 'premium' && behavior.galleriesCreated >= 100) {
    return {
      type: 'limit_reached',
      shouldTrigger: true,
      priority: 1,
      cooldownHours: 0,
      messaging: {
        title: 'Limite de galeries atteinte',
        description: 'Vous avez atteint la limite de 100 galeries. Passez à Pro pour des galeries illimitées.',
        cta: 'Passer à Pro',
      },
      limitType: 'gallery',
    };
  }
  
  // Check storage limit
  const storageLimits = {
    free: 500, // MB
    premium: 102400, // 100 GB
    pro: 1024000, // 1 TB
  };
  
  const limit = storageLimits[plan];
  if (behavior.currentStorageMb >= limit * 0.9) { // 90% threshold
    return {
      type: 'limit_reached',
      shouldTrigger: true,
      priority: 2,
      cooldownHours: 24,
      messaging: {
        title: 'Espace de stockage presque plein',
        description: `Vous avez utilisé ${Math.round((behavior.currentStorageMb / limit) * 100)}% de votre stockage. Passez à un plan supérieur pour plus d'espace.`,
        cta: 'Augmenter le stockage',
      },
      limitType: 'storage',
    };
  }
  
  return null;
}

/**
 * Requirement 8.2: Trigger "feature lockée" (clic sur ZIP, branding)
 */
export function checkFeatureLockedTrigger(
  subscription: Subscription,
  behavior: UserBehavior
): TriggerCondition | null {
  const { plan } = subscription;
  
  // Check for clicked locked features
  if (behavior.clickedLockedFeatures.length === 0) {
    return null;
  }
  
  const lastFeature = behavior.clickedLockedFeatures[behavior.clickedLockedFeatures.length - 1];
  
  // ZIP download (Premium+)
  if (lastFeature === 'zip_download' && plan === 'free') {
    return {
      type: 'feature_locked',
      shouldTrigger: true,
      priority: 2,
      cooldownHours: 24,
      messaging: {
        title: 'Téléchargement ZIP',
        description: 'Permettez à vos clients de télécharger toutes leurs photos en un clic avec Premium.',
        cta: 'Débloquer le ZIP',
      },
      featureType: 'zipDownload',
    };
  }
  
  // Branding (Pro only)
  if (lastFeature === 'branding' && (plan === 'free' || plan === 'premium')) {
    return {
      type: 'feature_locked',
      shouldTrigger: true,
      priority: 2,
      cooldownHours: 24,
      messaging: {
        title: 'Branding personnalisé',
        description: 'Personnalisez entièrement vos galeries avec votre marque. Disponible en Pro.',
        cta: 'Passer à Pro',
      },
      featureType: 'branding',
    };
  }
  
  // Custom domain (Pro only)
  if (lastFeature === 'custom_domain' && (plan === 'free' || plan === 'premium')) {
    return {
      type: 'feature_locked',
      shouldTrigger: true,
      priority: 2,
      cooldownHours: 24,
      messaging: {
        title: 'Domaine personnalisé',
        description: 'Utilisez votre propre domaine pour vos galeries. Disponible en Pro.',
        cta: 'Passer à Pro',
      },
      featureType: 'customDomain',
    };
  }
  
  // Analytics (Pro only)
  if (lastFeature === 'analytics' && (plan === 'free' || plan === 'premium')) {
    return {
      type: 'feature_locked',
      shouldTrigger: true,
      priority: 3,
      cooldownHours: 48,
      messaging: {
        title: 'Analytics détaillés',
        description: 'Accédez aux statistiques complètes de vos galeries. Disponible en Pro.',
        cta: 'Voir les analytics',
      },
      featureType: 'detailedAnalytics',
    };
  }
  
  return null;
}

/**
 * Requirement 8.3: Trigger "temps écoulé" (J+7, J+14, J+21)
 */
export function checkTimeBasedTrigger(
  subscription: Subscription,
  behavior: UserBehavior
): TriggerCondition | null {
  const { plan } = subscription;
  
  // Only for free users
  if (plan !== 'free') {
    return null;
  }
  
  const { daysActive } = behavior;
  
  // Day 7: First gentle nudge
  if (daysActive === 7) {
    return {
      type: 'time_based',
      shouldTrigger: true,
      priority: 4,
      cooldownHours: 168, // 7 days
      messaging: {
        title: 'Prêt pour Premium ?',
        description: 'Vous utilisez PikSend depuis une semaine. Débloquez toutes les fonctionnalités pour faire passer votre activité au niveau supérieur.',
        cta: 'Découvrir Premium',
      },
    };
  }
  
  // Day 14: More specific benefits
  if (daysActive === 14) {
    return {
      type: 'time_based',
      shouldTrigger: true,
      priority: 4,
      cooldownHours: 168,
      messaging: {
        title: 'Voici ce que vous manquez',
        description: 'Téléchargement ZIP, 100 galeries, 100 Go de stockage et bien plus. Essayez Premium gratuitement pendant 14 jours.',
        cta: 'Essayer gratuitement',
      },
    };
  }
  
  // Day 21: Final push with urgency
  if (daysActive === 21) {
    return {
      type: 'time_based',
      shouldTrigger: true,
      priority: 4,
      cooldownHours: 168,
      messaging: {
        title: 'Dernière chance',
        description: 'Profitez de notre offre de lancement : 14 jours d\'essai gratuit Premium. Sans engagement.',
        cta: 'Commencer l\'essai',
      },
    };
  }
  
  return null;
}

/**
 * Requirement 8.4: Trigger "comportement" (5+ galeries, power user)
 */
export function checkBehaviorBasedTrigger(
  subscription: Subscription,
  behavior: UserBehavior
): TriggerCondition | null {
  const { plan } = subscription;
  
  // Power user detection: 5+ galleries created
  if (plan === 'free' && behavior.galleriesCreated >= 5) {
    return {
      type: 'behavior_based',
      shouldTrigger: true,
      priority: 3,
      cooldownHours: 72,
      messaging: {
        title: 'Vous adorez PikSend !',
        description: 'Vous avez créé 5 galeries. Vous êtes un power user ! Passez à Premium pour débloquer tout le potentiel.',
        cta: 'Passer à Premium',
      },
    };
  }
  
  // High engagement: Many views
  if (plan === 'free' && behavior.totalViews >= 100) {
    return {
      type: 'behavior_based',
      shouldTrigger: true,
      priority: 3,
      cooldownHours: 72,
      messaging: {
        title: 'Vos galeries sont populaires !',
        description: 'Vos galeries ont reçu plus de 100 vues. Passez à Premium pour des analytics détaillés et plus de fonctionnalités.',
        cta: 'Voir les analytics',
      },
    };
  }
  
  // Premium to Pro upgrade: Heavy usage
  if (plan === 'premium' && behavior.galleriesCreated >= 50) {
    return {
      type: 'behavior_based',
      shouldTrigger: true,
      priority: 3,
      cooldownHours: 168,
      messaging: {
        title: 'Prêt pour Pro ?',
        description: 'Vous utilisez intensivement PikSend. Passez à Pro pour des galeries illimitées, le branding personnalisé et le plugin Lightroom.',
        cta: 'Découvrir Pro',
      },
    };
  }
  
  return null;
}

/**
 * Requirement 8.5: Add cooldown between triggers (avoid spam)
 */
export function shouldShowTrigger(
  trigger: TriggerCondition,
  lastPromptDate?: Date
): boolean {
  if (!lastPromptDate) {
    return true;
  }
  
  const hoursSinceLastPrompt = (Date.now() - lastPromptDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastPrompt >= trigger.cooldownHours;
}

/**
 * Main function to detect which trigger should be shown
 * Returns the highest priority trigger that should be shown
 */
export function detectUpgradeTrigger(
  subscription: Subscription,
  behavior: UserBehavior
): TriggerCondition | null {
  const triggers: (TriggerCondition | null)[] = [
    checkLimitReachedTrigger(subscription, behavior),
    checkFeatureLockedTrigger(subscription, behavior),
    checkTimeBasedTrigger(subscription, behavior),
    checkBehaviorBasedTrigger(subscription, behavior),
  ];
  
  // Filter out null triggers and check cooldown
  const validTriggers = triggers
    .filter((t): t is TriggerCondition => t !== null)
    .filter(t => shouldShowTrigger(t, behavior.lastUpgradePrompt));
  
  if (validTriggers.length === 0) {
    return null;
  }
  
  // Return highest priority trigger
  return validTriggers.sort((a, b) => a.priority - b.priority)[0] || null;
}

/**
 * Helper to track that a locked feature was clicked
 */
export function trackLockedFeatureClick(featureName: string): void {
  // Store in localStorage for persistence
  const key = 'piksend_locked_features';
  const stored = localStorage.getItem(key);
  const features = stored ? JSON.parse(stored) : [];
  
  if (!features.includes(featureName)) {
    features.push(featureName);
    localStorage.setItem(key, JSON.stringify(features));
  }
}

/**
 * Helper to get clicked locked features from localStorage
 */
export function getClickedLockedFeatures(): string[] {
  const key = 'piksend_locked_features';
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Helper to clear clicked features (after upgrade)
 */
export function clearClickedLockedFeatures(): void {
  localStorage.removeItem('piksend_locked_features');
}
