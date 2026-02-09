"use client";

/**
 * Hook to manage progressive signup triggers
 * 
 * Handles timing and conditions for showing the soft signup modal:
 * - After 2 minutes of viewing a guest gallery
 * - When clicking on a locked feature
 * - When reaching plan limits
 * 
 * Requirements: 5.6, 6.8 (sales-funnel-optimization spec)
 */

import { useState, useEffect, useCallback } from "react";
import type { SignupTrigger } from "@/components/conversion/soft-signup-modal";

interface UseSignupTriggerOptions {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether to enable the time-based trigger (2 minutes) */
  enableTimeTrigger?: boolean;
  /** Time in milliseconds before showing the modal (default: 2 minutes) */
  triggerDelay?: number;
  /** Whether the trigger has been dismissed */
  isDismissed?: boolean;
}

interface SignupTriggerState {
  /** Whether the modal should be shown */
  isOpen: boolean;
  /** What triggered the modal */
  trigger: SignupTrigger | null;
  /** Optional locked feature name */
  lockedFeature?: string;
  /** Function to manually trigger the modal */
  triggerSignup: (trigger: SignupTrigger, lockedFeature?: string) => void;
  /** Function to close the modal */
  closeModal: () => void;
}

const STORAGE_KEY = 'piksend_signup_trigger_dismissed';

/**
 * Check if trigger was recently dismissed (within last 24 hours)
 */
function wasRecentlyDismissed(trigger: SignupTrigger): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const dismissed = JSON.parse(stored);
    const dismissedAt = dismissed[trigger];
    
    if (!dismissedAt) return false;
    
    // Check if dismissed within last 24 hours
    const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
    return hoursSinceDismissed < 24;
  } catch {
    return false;
  }
}

/**
 * Mark trigger as dismissed
 */
function markAsDismissed(trigger: SignupTrigger) {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dismissed = stored ? JSON.parse(stored) : {};
    dismissed[trigger] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to manage signup triggers
 */
export function useSignupTrigger({
  isAuthenticated,
  enableTimeTrigger = false,
  triggerDelay = 2 * 60 * 1000, // 2 minutes
  isDismissed = false
}: UseSignupTriggerOptions): SignupTriggerState {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState<SignupTrigger | null>(null);
  const [lockedFeature, setLockedFeature] = useState<string | undefined>();

  // Time-based trigger (after 2 minutes)
  useEffect(() => {
    // Don't show if authenticated, dismissed, or time trigger disabled
    if (isAuthenticated || isDismissed || !enableTimeTrigger) {
      return;
    }

    // Check if time-based trigger was recently dismissed
    if (wasRecentlyDismissed('time_based')) {
      return;
    }

    const timer = setTimeout(() => {
      setTrigger('time_based');
      setIsOpen(true);
      
      // Track event
      if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
        (window as any).trackFunnelEvent('signup_trigger_shown', {
          trigger: 'time_based',
          delay: triggerDelay
        });
      }
    }, triggerDelay);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isDismissed, enableTimeTrigger, triggerDelay]);

  // Manual trigger function
  const triggerSignup = useCallback((
    triggerType: SignupTrigger,
    feature?: string
  ) => {
    // Don't show if authenticated
    if (isAuthenticated) {
      return;
    }

    // Check if this trigger was recently dismissed
    if (wasRecentlyDismissed(triggerType)) {
      return;
    }

    setTrigger(triggerType);
    setLockedFeature(feature);
    setIsOpen(true);

    // Track event
    if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
      (window as any).trackFunnelEvent('signup_trigger_shown', {
        trigger: triggerType,
        lockedFeature: feature
      });
    }
  }, [isAuthenticated]);

  // Close modal function
  const closeModal = useCallback(() => {
    setIsOpen(false);
    
    // Mark as dismissed
    if (trigger) {
      markAsDismissed(trigger);
      
      // Track dismissal
      if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
        (window as any).trackFunnelEvent('signup_modal_dismissed', {
          trigger,
          lockedFeature
        });
      }
    }
    
    // Reset state after animation
    setTimeout(() => {
      setTrigger(null);
      setLockedFeature(undefined);
    }, 300);
  }, [trigger, lockedFeature]);

  return {
    isOpen,
    trigger,
    lockedFeature,
    triggerSignup,
    closeModal
  };
}
