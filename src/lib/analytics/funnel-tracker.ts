/**
 * Funnel Event Tracker
 * 
 * Global utility to track funnel events for conversion optimization
 * 
 * Requirements: 16.1, 16.2 (sales-funnel-optimization spec)
 */

import { createClient } from "@/lib/supabase/client";
import { createAnalyticsService } from "@/lib/services/analytics.service";

/**
 * Track a funnel event
 * 
 * This function is exposed globally on the window object for easy access
 * from any component without prop drilling.
 */
export async function trackFunnelEvent(
  eventType: string,
  eventData?: Record<string, any>,
  visitorId?: string
): Promise<void> {
  try {
    const supabase = createClient();
    const analyticsService = createAnalyticsService(supabase);
    
    await analyticsService.trackFunnelEvent(eventType, eventData, visitorId);
  } catch (error) {
    console.error('Failed to track funnel event:', error);
    // Don't throw - tracking failures shouldn't break user experience
  }
}

/**
 * Initialize global funnel tracker
 * 
 * Call this once in the app layout or root component to expose
 * trackFunnelEvent globally.
 */
export function initializeFunnelTracker() {
  if (typeof window !== 'undefined') {
    (window as any).trackFunnelEvent = trackFunnelEvent;
  }
}
