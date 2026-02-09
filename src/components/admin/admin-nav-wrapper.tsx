"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for AdminNav to prevent hydration mismatch
 * 
 * This wrapper component is necessary because:
 * - AdminNav contains dynamic client-side state (badge counts, expanded menus)
 * - The parent layout is a Server Component
 * - We need to disable SSR for AdminNav to prevent hydration errors
 */
const AdminNav = dynamic(
  () => import("@/components/admin/admin-nav").then((mod) => ({ default: mod.AdminNav })),
  { ssr: false }
);

export function AdminNavWrapper() {
  return <AdminNav />;
}
