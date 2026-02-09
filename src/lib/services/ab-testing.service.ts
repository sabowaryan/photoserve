/**
 * A/B Testing Service
 * 
 * Handles variant assignment, persistence, and tracking for A/B tests.
 * Uses cookies for persistence and ensures consistent variant assignment.
 */

import { ABTestVariant } from '@/types/ab-testing';

const AB_TEST_COOKIE_PREFIX = 'piksend_ab_';
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

/**
 * Get or assign a variant for a test
 * 
 * @param testId - The ID of the test
 * @param variants - Array of variants with traffic allocation
 * @param _sessionId - Session ID for tracking
 * @param _userId - Optional user ID
 * @returns The assigned variant
 */
export function getOrAssignVariant(
  testId: string,
  variants: ABTestVariant[],
  _sessionId: string,
  _userId?: string
): ABTestVariant {
  // Check if already assigned
  const existingVariantId = getAssignedVariant(testId);
  
  if (existingVariantId) {
    const variant = variants.find(v => v.id === existingVariantId);
    if (variant) {
      return variant;
    }
  }
  
  // Assign new variant based on traffic allocation
  const variant = assignVariant(variants);
  
  // Persist assignment
  persistAssignment(testId, variant.id);
  
  // Track assignment event (will be tracked by the component using this service)
  // The component should call the analytics service directly with the result
  
  return variant;
}

/**
 * Assign a variant based on traffic allocation
 * 
 * @param variants - Array of variants with traffic allocation
 * @returns The assigned variant
 */
function assignVariant(variants: ABTestVariant[]): ABTestVariant {
  // Ensure we have at least one variant
  if (variants.length === 0) {
    throw new Error('Cannot assign variant: variants array is empty');
  }
  
  // Normalize traffic to ensure it sums to 1
  const totalTraffic = variants.reduce((sum, v) => sum + v.traffic, 0);
  const normalizedVariants = variants.map(v => ({
    ...v,
    traffic: v.traffic / totalTraffic,
  }));
  
  // Generate random number between 0 and 1
  const random = Math.random();
  
  // Assign variant based on cumulative traffic
  let cumulative = 0;
  for (const variant of normalizedVariants) {
    cumulative += variant.traffic;
    if (random <= cumulative) {
      return variant;
    }
  }
  
  // Fallback to first variant (should never happen due to cumulative logic)
  return variants[0]!;
}

/**
 * Get assigned variant from cookies
 * 
 * @param testId - The ID of the test
 * @returns The variant ID or null if not assigned
 */
function getAssignedVariant(testId: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookieName = `${AB_TEST_COOKIE_PREFIX}${testId}`;
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

/**
 * Persist variant assignment in cookies
 * 
 * @param testId - The ID of the test
 * @param variantId - The ID of the assigned variant
 */
function persistAssignment(testId: string, variantId: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const cookieName = `${AB_TEST_COOKIE_PREFIX}${testId}`;
  const cookieValue = encodeURIComponent(variantId);
  const expires = new Date(Date.now() + COOKIE_MAX_AGE * 1000).toUTCString();
  
  document.cookie = `${cookieName}=${cookieValue}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

/**
 * Track A/B test conversion
 * 
 * Note: This function stores the conversion event data but doesn't directly
 * call the analytics service. The calling code should use the analytics service
 * to track the event with the returned data.
 * 
 * @param testId - The ID of the test
 * @param variantId - The ID of the variant
 * @param metric - The metric being tracked
 * @param value - The value of the metric
 * @param sessionId - Session ID for tracking
 * @param userId - Optional user ID
 * @returns Event data to be tracked
 */
export function getConversionEventData(
  testId: string,
  variantId: string,
  metric: string,
  value: number,
  sessionId: string,
  userId?: string
): Record<string, any> {
  return {
    testId,
    variantId,
    metric,
    value,
    sessionId,
    userId,
  };
}

/**
 * Get all active test assignments for the current session
 * 
 * @returns Object mapping test IDs to variant IDs
 */
export function getAllAssignments(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }
  
  const assignments: Record<string, string> = {};
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name && name.startsWith(AB_TEST_COOKIE_PREFIX)) {
      const testId = name.substring(AB_TEST_COOKIE_PREFIX.length);
      assignments[testId] = decodeURIComponent(value || '');
    }
  }
  
  return assignments;
}

/**
 * Clear all A/B test assignments (useful for testing)
 */
export function clearAllAssignments(): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name] = cookie.trim().split('=');
    if (name && name.startsWith(AB_TEST_COOKIE_PREFIX)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}
