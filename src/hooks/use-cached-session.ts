"use client";

import { useSession } from "next-auth/react";
import { useRef, useEffect } from "react";

/**
 * Cached session hook that prevents multiple API calls
 * Uses a module-level cache to share session data across components
 */

// Module-level cache for session data
let cachedSession: ReturnType<typeof useSession>["data"] = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCachedSession() {
  const { data: session, status, update } = useSession();
  const hasUpdatedCache = useRef(false);

  // Update cache when session changes
  useEffect(() => {
    if (session && !hasUpdatedCache.current) {
      cachedSession = session;
      cacheTimestamp = Date.now();
      hasUpdatedCache.current = true;
    }
  }, [session]);

  // Return cached session if available and not expired
  const isCacheValid = cachedSession && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  
  return {
    data: session || (isCacheValid ? cachedSession : null),
    status: session ? status : (isCacheValid ? "authenticated" : status),
    update,
  };
}

/**
 * Clear the session cache (call on sign out)
 */
export function clearSessionCache() {
  cachedSession = null;
  cacheTimestamp = 0;
}
