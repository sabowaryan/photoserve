"use client";

/**
 * Funnel Tracker Provider
 * 
 * Initializes the global funnel event tracker
 * 
 * Requirements: 16.1, 16.2 (sales-funnel-optimization spec)
 */

import { useEffect } from "react";
import { initializeFunnelTracker } from "@/lib/analytics/funnel-tracker";

export function FunnelTrackerProvider() {
  useEffect(() => {
    initializeFunnelTracker();
  }, []);

  return null;
}
