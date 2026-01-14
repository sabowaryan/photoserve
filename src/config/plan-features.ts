import type { PlanFeatures, SubscriptionPlan } from '@/types';

/**
 * Plan Features Matrix
 * Defines which features are available for each subscription plan.
 * Based on the requirements document feature matrix.
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    slideshow: false,
    favorites: false,
    comments: false,
    detailedAnalytics: false,
    ctaButton: false,
    customWatermark: false,
    bulkDownload: false,
    paywall: false,
    whiteLabel: false,
    customDomain: false,
    brandColors: false,
    profilePage: false,
    deadlineTimer: false,
    leadMagnet: false,
    videoCover: false,
    audioGallery: false,
    testimonials: false,
    lightroomPlugin: false,
    faceRecognition: false,
    autoCaption: false,
    smartCulling: false,
  },
  premium: {
    slideshow: true,
    favorites: true,
    comments: true,
    detailedAnalytics: false, // Basic analytics only
    ctaButton: false,
    customWatermark: true,
    bulkDownload: true,
    paywall: false,
    whiteLabel: false,
    customDomain: false,
    brandColors: false,
    profilePage: false,
    deadlineTimer: true,
    leadMagnet: false,
    videoCover: false,
    audioGallery: false,
    testimonials: true,
    lightroomPlugin: false,
    faceRecognition: false,
    autoCaption: true,
    smartCulling: false,
  },
  pro: {
    slideshow: true,
    favorites: true,
    comments: true,
    detailedAnalytics: true,
    ctaButton: true,
    customWatermark: true,
    bulkDownload: true,
    paywall: true,
    whiteLabel: true,
    customDomain: true,
    brandColors: true,
    profilePage: true,
    deadlineTimer: true,
    leadMagnet: true,
    videoCover: true,
    audioGallery: true,
    testimonials: true,
    lightroomPlugin: true,
    faceRecognition: true,
    autoCaption: true,
    smartCulling: true,
  },
};

/**
 * Feature to minimum required plan mapping
 * Used to determine which plan is needed to access a feature
 */
const FEATURE_REQUIRED_PLAN: Record<keyof PlanFeatures, SubscriptionPlan> = {
  slideshow: 'premium',
  favorites: 'premium',
  comments: 'premium',
  detailedAnalytics: 'pro',
  ctaButton: 'pro',
  customWatermark: 'premium',
  bulkDownload: 'premium',
  paywall: 'pro',
  whiteLabel: 'pro',
  customDomain: 'pro',
  brandColors: 'pro',
  profilePage: 'pro',
  deadlineTimer: 'premium',
  leadMagnet: 'pro',
  videoCover: 'pro',
  audioGallery: 'pro',
  testimonials: 'premium',
  lightroomPlugin: 'pro',
  faceRecognition: 'pro',
  autoCaption: 'premium',
  smartCulling: 'pro',
};

/**
 * Check if a user with a given plan has access to a specific feature
 * @param plan - The user's subscription plan
 * @param feature - The feature to check access for
 * @returns true if the user has access to the feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlan,
  feature: keyof PlanFeatures
): boolean {
  return PLAN_FEATURES[plan][feature];
}

/**
 * Get the minimum required plan for a specific feature
 * @param feature - The feature to check
 * @returns The minimum subscription plan required to access the feature
 */
export function getRequiredPlan(feature: keyof PlanFeatures): SubscriptionPlan {
  return FEATURE_REQUIRED_PLAN[feature];
}

/**
 * Get all features available for a specific plan
 * @param plan - The subscription plan
 * @returns The PlanFeatures object for that plan
 */
export function getPlanFeatures(plan: SubscriptionPlan): PlanFeatures {
  return PLAN_FEATURES[plan];
}

/**
 * Get a list of all features that are enabled for a plan
 * @param plan - The subscription plan
 * @returns Array of feature names that are enabled
 */
export function getEnabledFeatures(plan: SubscriptionPlan): (keyof PlanFeatures)[] {
  const features = PLAN_FEATURES[plan];
  return (Object.keys(features) as (keyof PlanFeatures)[]).filter(
    (feature) => features[feature]
  );
}

/**
 * Get a list of all features that are disabled for a plan
 * @param plan - The subscription plan
 * @returns Array of feature names that are disabled
 */
export function getDisabledFeatures(plan: SubscriptionPlan): (keyof PlanFeatures)[] {
  const features = PLAN_FEATURES[plan];
  return (Object.keys(features) as (keyof PlanFeatures)[]).filter(
    (feature) => !features[feature]
  );
}

/**
 * Check if upgrading from one plan to another would unlock a specific feature
 * @param currentPlan - The user's current plan
 * @param targetPlan - The plan to upgrade to
 * @param feature - The feature to check
 * @returns true if the upgrade would unlock the feature
 */
export function wouldUpgradeUnlockFeature(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
  feature: keyof PlanFeatures
): boolean {
  return !PLAN_FEATURES[currentPlan][feature] && PLAN_FEATURES[targetPlan][feature];
}

/**
 * Get all features that would be unlocked by upgrading to a target plan
 * @param currentPlan - The user's current plan
 * @param targetPlan - The plan to upgrade to
 * @returns Array of feature names that would be unlocked
 */
export function getFeaturesUnlockedByUpgrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): (keyof PlanFeatures)[] {
  const currentFeatures = PLAN_FEATURES[currentPlan];
  const targetFeatures = PLAN_FEATURES[targetPlan];
  
  return (Object.keys(targetFeatures) as (keyof PlanFeatures)[]).filter(
    (feature) => !currentFeatures[feature] && targetFeatures[feature]
  );
}

/**
 * Plan hierarchy for comparison
 */
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

/**
 * Check if a plan is higher or equal to another plan
 * @param plan - The plan to check
 * @param requiredPlan - The minimum required plan
 * @returns true if plan is >= requiredPlan
 */
export function isPlanAtLeast(
  plan: SubscriptionPlan,
  requiredPlan: SubscriptionPlan
): boolean {
  return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Get the next upgrade plan from current plan
 * @param currentPlan - The user's current plan
 * @returns The next plan to upgrade to, or null if already on highest plan
 */
export function getNextUpgradePlan(
  currentPlan: SubscriptionPlan
): SubscriptionPlan | null {
  switch (currentPlan) {
    case 'free':
      return 'premium';
    case 'premium':
      return 'pro';
    case 'pro':
      return null;
  }
}
