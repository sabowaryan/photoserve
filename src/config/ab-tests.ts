/**
 * A/B Test Configurations
 * 
 * Defines all active A/B tests for the sales funnel optimization.
 * Tests are configured here and can be enabled/disabled by changing status.
 */

import { ABTest } from '@/types/ab-testing';

/**
 * Test 1: Hero Headline
 * 
 * Tests different hero headlines on the homepage to optimize conversion.
 */
export const HERO_HEADLINE_TEST: ABTest = {
  id: 'hero-headline-v1',
  name: 'Hero Headline Test',
  description: 'Test different hero headlines to optimize conversion',
  status: 'draft', // Change to 'running' to activate
  startDate: new Date('2024-01-15'),
  targetMetric: 'signup_rate',
  minimumSampleSize: 1000,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control',
      description: 'Original headline',
      traffic: 0.5,
      config: {
        headline: 'Livrez vos photos en 5 minutes. Vendez vos galeries. Gardez 90%.',
        subheadline: 'La plateforme de partage photo pour photographes professionnels',
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - Benefit Focus',
      description: 'Focus on photographer benefits',
      traffic: 0.5,
      config: {
        headline: 'Gagnez plus avec vos photos. Commission 10% seulement.',
        subheadline: 'Partagez, vendez et gardez 90% de vos revenus',
      },
    },
  ],
};

/**
 * Test 2: Primary CTA
 * 
 * Tests different primary CTA buttons to optimize click-through rate.
 */
export const PRIMARY_CTA_TEST: ABTest = {
  id: 'primary-cta-v1',
  name: 'Primary CTA Test',
  description: 'Test different primary CTA buttons',
  status: 'draft',
  startDate: new Date('2024-01-15'),
  targetMetric: 'cta_click_rate',
  minimumSampleSize: 1000,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control',
      description: 'Original CTA',
      traffic: 0.33,
      config: {
        text: 'Essayer gratuitement',
        style: 'primary',
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - Urgency',
      description: 'Add urgency to CTA',
      traffic: 0.33,
      config: {
        text: 'Commencer maintenant',
        style: 'primary',
      },
    },
    {
      id: 'variant-b',
      name: 'Variant B - Value',
      description: 'Emphasize value',
      traffic: 0.34,
      config: {
        text: 'Tester sans carte bancaire',
        style: 'primary',
      },
    },
  ],
};

/**
 * Test 3: Pricing Display
 * 
 * Tests pricing page with and without ROI calculator.
 */
export const PRICING_DISPLAY_TEST: ABTest = {
  id: 'pricing-display-v1',
  name: 'Pricing Display Test',
  description: 'Test pricing page with/without ROI calculator',
  status: 'draft',
  startDate: new Date('2024-01-15'),
  targetMetric: 'pricing_conversion_rate',
  minimumSampleSize: 1500,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control - Without ROI',
      description: 'Pricing without ROI calculator',
      traffic: 0.5,
      config: {
        showROICalculator: false,
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - With ROI',
      description: 'Pricing with ROI calculator above plans',
      traffic: 0.5,
      config: {
        showROICalculator: true,
      },
    },
  ],
};

/**
 * Test 4: Social Proof Placement
 * 
 * Tests different placements of social proof elements.
 */
export const SOCIAL_PROOF_PLACEMENT_TEST: ABTest = {
  id: 'social-proof-placement-v1',
  name: 'Social Proof Placement Test',
  description: 'Test different placements of testimonials',
  status: 'draft',
  startDate: new Date('2024-01-15'),
  targetMetric: 'engagement_rate',
  minimumSampleSize: 1000,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control - Below Hero',
      description: 'Testimonials below hero section',
      traffic: 0.5,
      config: {
        placement: 'below-hero',
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - Bottom Page',
      description: 'Testimonials at bottom of page',
      traffic: 0.5,
      config: {
        placement: 'bottom-page',
      },
    },
  ],
};

/**
 * Test 5: Signup Flow
 * 
 * Tests progressive signup vs full form.
 */
export const SIGNUP_FLOW_TEST: ABTest = {
  id: 'signup-flow-v1',
  name: 'Signup Flow Test',
  description: 'Test progressive signup vs full form',
  status: 'draft',
  startDate: new Date('2024-01-15'),
  targetMetric: 'signup_completion_rate',
  minimumSampleSize: 1500,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control - Progressive',
      description: 'Progressive 3-step signup',
      traffic: 0.5,
      config: {
        flowType: 'progressive',
        steps: 3,
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - Full Form',
      description: 'Single-page full form',
      traffic: 0.5,
      config: {
        flowType: 'full-form',
        steps: 1,
      },
    },
  ],
};

/**
 * Test 6: Urgency Messaging
 * 
 * Tests different urgency messages on pricing page.
 */
export const URGENCY_MESSAGING_TEST: ABTest = {
  id: 'urgency-messaging-v1',
  name: 'Urgency Messaging Test',
  description: 'Test different urgency messages',
  status: 'draft',
  startDate: new Date('2024-01-15'),
  targetMetric: 'upgrade_rate',
  minimumSampleSize: 1000,
  confidenceLevel: 0.95,
  variants: [
    {
      id: 'control',
      name: 'Control - No Urgency',
      description: 'No urgency message',
      traffic: 0.33,
      config: {
        showUrgency: false,
        message: '',
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - Limited Time',
      description: 'Limited time offer',
      traffic: 0.33,
      config: {
        showUrgency: true,
        message: 'Prix fondateur : 19,99$ pour les 100 premiers',
      },
    },
    {
      id: 'variant-b',
      name: 'Variant B - Social Proof',
      description: 'Social proof urgency',
      traffic: 0.34,
      config: {
        showUrgency: true,
        message: '47 photographes ont rejoint cette semaine',
      },
    },
  ],
};

/**
 * All active A/B tests
 */
export const ALL_AB_TESTS: ABTest[] = [
  HERO_HEADLINE_TEST,
  PRIMARY_CTA_TEST,
  PRICING_DISPLAY_TEST,
  SOCIAL_PROOF_PLACEMENT_TEST,
  SIGNUP_FLOW_TEST,
  URGENCY_MESSAGING_TEST,
];

/**
 * Get a test by ID
 */
export function getTestById(testId: string): ABTest | undefined {
  return ALL_AB_TESTS.find(test => test.id === testId);
}

/**
 * Get all running tests
 */
export function getRunningTests(): ABTest[] {
  return ALL_AB_TESTS.filter(test => test.status === 'running');
}
