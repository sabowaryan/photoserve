/**
 * useABTest Hook
 * 
 * React hook for using A/B tests in components.
 * Handles variant assignment and provides the assigned variant configuration.
 */

'use client';

import { useState, useEffect } from 'react';
import { ABTest, ABTestVariant } from '@/types/ab-testing';
import { getOrAssignVariant } from '@/lib/services/ab-testing.service';
import { useVisitorFingerprint } from './use-visitor-fingerprint';

interface UseABTestResult {
  variant: ABTestVariant | null;
  isLoading: boolean;
  config: Record<string, any>;
}

/**
 * Hook to use an A/B test
 * 
 * @param test - The A/B test configuration
 * @param userId - Optional user ID
 * @returns The assigned variant and its configuration
 */
export function useABTest(test: ABTest, userId?: string): UseABTestResult {
  const fingerprint = useVisitorFingerprint();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!fingerprint) {
      return;
    }
    
    // Only assign variant if test is running
    if (test.status !== 'running') {
      setIsLoading(false);
      return;
    }
    
    // Get or assign variant
    const assignedVariant = getOrAssignVariant(
      test.id,
      test.variants,
      fingerprint,
      userId
    );
    
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [test, fingerprint, userId]);
  
  return {
    variant,
    isLoading,
    config: variant?.config || {},
  };
}

/**
 * Hook to check if a specific variant is active
 * 
 * @param test - The A/B test configuration
 * @param variantId - The variant ID to check
 * @param userId - Optional user ID
 * @returns True if the variant is active
 */
export function useIsVariant(
  test: ABTest,
  variantId: string,
  userId?: string
): boolean {
  const { variant } = useABTest(test, userId);
  return variant?.id === variantId;
}
