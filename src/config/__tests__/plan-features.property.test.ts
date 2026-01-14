/**
 * Property-Based Tests for Plan Features
 * 
 * Feature: piksend-complete-features
 * Property 1: Plan-Based Feature Access
 * 
 * Tests that feature access is correctly determined based on subscription plan.
 * Validates: Requirements 1.4.6, 3.1.5, 3.2.5, 3.3.5, 3.4.5, 4.1.5, 4.2.5, 4.4.6,
 *            5.1.5, 5.2.5, 5.3.5, 5.4.5, 7.1.5, 7.2.5, 8.1.5, 8.2.5, 8.3.5,
 *            9.1.5, 10.1.5, 10.2.5, 10.3.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  PLAN_FEATURES,
  hasFeatureAccess,
  getRequiredPlan,
  getPlanFeatures,
  getEnabledFeatures,
  getDisabledFeatures,
  wouldUpgradeUnlockFeature,
  getFeaturesUnlockedByUpgrade,
  isPlanAtLeast,
  getNextUpgradePlan,
} from '../plan-features';
import type { PlanFeatures, SubscriptionPlan } from '@/types';

/**
 * Arbitrary generators for test data
 */
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>('free', 'premium', 'pro');

const featureNameArb = fc.constantFrom<keyof PlanFeatures>(
  'slideshow',
  'favorites',
  'comments',
  'detailedAnalytics',
  'ctaButton',
  'customWatermark',
  'bulkDownload',
  'paywall',
  'whiteLabel',
  'customDomain',
  'brandColors',
  'profilePage',
  'deadlineTimer',
  'leadMagnet',
  'videoCover',
  'audioGallery',
  'testimonials',
  'lightroomPlugin',
  'faceRecognition',
  'autoCaption',
  'smartCulling'
);

/**
 * Plan hierarchy for comparison
 */
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

describe('Plan Features - Plan-Based Feature Access (Property 1)', () => {
  /**
   * Feature: piksend-complete-features, Property 1: Plan-Based Feature Access
   * Validates: Requirements 1.4.6, 3.1.5, 3.2.5, etc.
   * 
   * For any user with a given subscription plan, accessing a feature SHALL return
   * the correct availability based on the plan feature matrix.
   */

  it('should correctly determine feature availability for any plan and feature combination', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        featureNameArb,
        (plan, feature) => {
          const result = hasFeatureAccess(plan, feature);
          const expected = PLAN_FEATURES[plan][feature];
          
          // The result should exactly match the plan feature matrix
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent results for getPlanFeatures', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        (plan) => {
          const features = getPlanFeatures(plan);
          
          // Should return the exact same object as PLAN_FEATURES[plan]
          expect(features).toEqual(PLAN_FEATURES[plan]);
          
          // All feature keys should be present
          const expectedKeys: (keyof PlanFeatures)[] = [
            'slideshow', 'favorites', 'comments', 'detailedAnalytics',
            'ctaButton', 'customWatermark', 'bulkDownload', 'paywall',
            'whiteLabel', 'customDomain', 'brandColors', 'profilePage',
            'deadlineTimer', 'leadMagnet', 'videoCover', 'audioGallery',
            'testimonials', 'lightroomPlugin', 'faceRecognition',
            'autoCaption', 'smartCulling'
          ];
          
          for (const key of expectedKeys) {
            expect(key in features).toBe(true);
            expect(typeof features[key]).toBe('boolean');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly partition features into enabled and disabled sets', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        (plan) => {
          const enabled = getEnabledFeatures(plan);
          const disabled = getDisabledFeatures(plan);
          const features = getPlanFeatures(plan);
          
          // Enabled and disabled should be disjoint
          const enabledSet = new Set(enabled);
          const disabledSet = new Set(disabled);
          
          for (const feature of enabled) {
            expect(disabledSet.has(feature)).toBe(false);
          }
          
          // Together they should cover all features
          const allFeatures = Object.keys(features) as (keyof PlanFeatures)[];
          expect(enabled.length + disabled.length).toBe(allFeatures.length);
          
          // Each enabled feature should have true in the matrix
          for (const feature of enabled) {
            expect(features[feature]).toBe(true);
          }
          
          // Each disabled feature should have false in the matrix
          for (const feature of disabled) {
            expect(features[feature]).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Plan Features - Plan Hierarchy (Property 1 Extension)', () => {
  /**
   * Tests that plan hierarchy is correctly implemented.
   * Higher plans should have access to all features of lower plans.
   */

  it('should correctly compare plan hierarchy with isPlanAtLeast', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        subscriptionPlanArb,
        (plan, requiredPlan) => {
          const result = isPlanAtLeast(plan, requiredPlan);
          const expected = PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[requiredPlan];
          
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure Pro plan has access to all features', () => {
    fc.assert(
      fc.property(
        featureNameArb,
        (feature) => {
          // Pro plan should have access to all features
          expect(hasFeatureAccess('pro', feature)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure higher plans have at least the features of lower plans', () => {
    fc.assert(
      fc.property(
        featureNameArb,
        (feature) => {
          const freeHas = hasFeatureAccess('free', feature);
          const premiumHas = hasFeatureAccess('premium', feature);
          const proHas = hasFeatureAccess('pro', feature);
          
          // If free has it, premium and pro must have it
          if (freeHas) {
            expect(premiumHas).toBe(true);
            expect(proHas).toBe(true);
          }
          
          // If premium has it, pro must have it
          if (premiumHas) {
            expect(proHas).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Plan Features - Required Plan Mapping', () => {
  /**
   * Tests that getRequiredPlan returns the minimum plan needed for each feature.
   */

  it('should return a valid plan for any feature', () => {
    fc.assert(
      fc.property(
        featureNameArb,
        (feature) => {
          const requiredPlan = getRequiredPlan(feature);
          
          // Should be a valid plan
          expect(['free', 'premium', 'pro']).toContain(requiredPlan);
          
          // The required plan should have access to the feature
          expect(hasFeatureAccess(requiredPlan, feature)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the minimum required plan (no lower plan has access)', () => {
    fc.assert(
      fc.property(
        featureNameArb,
        (feature) => {
          const requiredPlan = getRequiredPlan(feature);
          
          // Plans below the required plan should NOT have access
          if (requiredPlan === 'premium') {
            expect(hasFeatureAccess('free', feature)).toBe(false);
          } else if (requiredPlan === 'pro') {
            expect(hasFeatureAccess('free', feature)).toBe(false);
            expect(hasFeatureAccess('premium', feature)).toBe(false);
          }
          // If requiredPlan is 'free', all plans should have access (tested elsewhere)
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Plan Features - Upgrade Logic', () => {
  /**
   * Tests upgrade-related functions for correctness.
   */

  it('should correctly determine if upgrade would unlock a feature', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        subscriptionPlanArb,
        featureNameArb,
        (currentPlan, targetPlan, feature) => {
          const wouldUnlock = wouldUpgradeUnlockFeature(currentPlan, targetPlan, feature);
          
          const currentHas = hasFeatureAccess(currentPlan, feature);
          const targetHas = hasFeatureAccess(targetPlan, feature);
          
          // Should unlock if: current doesn't have it AND target has it
          const expected = !currentHas && targetHas;
          expect(wouldUnlock).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all features unlocked by upgrade', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        subscriptionPlanArb,
        (currentPlan, targetPlan) => {
          const unlockedFeatures = getFeaturesUnlockedByUpgrade(currentPlan, targetPlan);
          
          // Each unlocked feature should satisfy the unlock condition
          for (const feature of unlockedFeatures) {
            expect(hasFeatureAccess(currentPlan, feature)).toBe(false);
            expect(hasFeatureAccess(targetPlan, feature)).toBe(true);
          }
          
          // No feature that current plan has should be in the list
          const currentFeatures = getEnabledFeatures(currentPlan);
          for (const feature of currentFeatures) {
            expect(unlockedFeatures).not.toContain(feature);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct next upgrade plan', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb,
        (plan) => {
          const nextPlan = getNextUpgradePlan(plan);
          
          if (plan === 'free') {
            expect(nextPlan).toBe('premium');
          } else if (plan === 'premium') {
            expect(nextPlan).toBe('pro');
          } else if (plan === 'pro') {
            expect(nextPlan).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure upgrading always unlocks at least some features (except pro)', () => {
    fc.assert(
      fc.property(
        subscriptionPlanArb.filter(p => p !== 'pro'),
        (currentPlan) => {
          const nextPlan = getNextUpgradePlan(currentPlan);
          if (nextPlan) {
            const unlockedFeatures = getFeaturesUnlockedByUpgrade(currentPlan, nextPlan);
            // Upgrading should unlock at least one feature
            expect(unlockedFeatures.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Plan Features - Specific Feature Requirements', () => {
  /**
   * Tests specific feature availability as per requirements document.
   */

  it('should have slideshow available only for Premium and Pro', () => {
    expect(hasFeatureAccess('free', 'slideshow')).toBe(false);
    expect(hasFeatureAccess('premium', 'slideshow')).toBe(true);
    expect(hasFeatureAccess('pro', 'slideshow')).toBe(true);
  });

  it('should have favorites available only for Premium and Pro', () => {
    expect(hasFeatureAccess('free', 'favorites')).toBe(false);
    expect(hasFeatureAccess('premium', 'favorites')).toBe(true);
    expect(hasFeatureAccess('pro', 'favorites')).toBe(true);
  });

  it('should have paywall available only for Pro', () => {
    expect(hasFeatureAccess('free', 'paywall')).toBe(false);
    expect(hasFeatureAccess('premium', 'paywall')).toBe(false);
    expect(hasFeatureAccess('pro', 'paywall')).toBe(true);
  });

  it('should have whiteLabel available only for Pro', () => {
    expect(hasFeatureAccess('free', 'whiteLabel')).toBe(false);
    expect(hasFeatureAccess('premium', 'whiteLabel')).toBe(false);
    expect(hasFeatureAccess('pro', 'whiteLabel')).toBe(true);
  });

  it('should have detailedAnalytics available only for Pro', () => {
    expect(hasFeatureAccess('free', 'detailedAnalytics')).toBe(false);
    expect(hasFeatureAccess('premium', 'detailedAnalytics')).toBe(false);
    expect(hasFeatureAccess('pro', 'detailedAnalytics')).toBe(true);
  });

  it('should have leadMagnet available only for Pro', () => {
    expect(hasFeatureAccess('free', 'leadMagnet')).toBe(false);
    expect(hasFeatureAccess('premium', 'leadMagnet')).toBe(false);
    expect(hasFeatureAccess('pro', 'leadMagnet')).toBe(true);
  });
});
