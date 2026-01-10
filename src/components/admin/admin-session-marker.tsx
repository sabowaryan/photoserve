"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Admin Session Marker Component
 * 
 * Marks the admin session as logged on first access.
 * This ensures admin_login is only logged once per session.
 */
export function AdminSessionMarker() {
  const { data: session, update } = useSession();
  const hasMarked = useRef(false);

  useEffect(() => {
    // Only mark once per component lifecycle and if not already logged
    if (hasMarked.current || session?.adminSessionLogged) {
      return;
    }

    const markSession = async () => {
      try {
        hasMarked.current = true;
        const response = await fetch("/api/admin/session", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          // Update the client-side session
          await update();
        }
      } catch (error) {
        console.error("Failed to mark admin session:", error);
        hasMarked.current = false;
      }
    };

    markSession();
  }, [session?.adminSessionLogged, update]);

  return null;
}
