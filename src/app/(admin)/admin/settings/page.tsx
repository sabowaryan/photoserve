import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "./settings-form";

/**
 * Loading skeleton for settings page
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Fetch admin settings from database
 */
async function getAdminSettings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_settings")
    .select("key, value, description")
    .in("key", ["stripe_enabled", "ai_features_enabled"]);

  if (error) {
    console.error("Error fetching admin settings:", error);
    return {
      stripe_enabled: true,
      ai_features_enabled: true,
    };
  }

  // Convert array to object
  const settings: Record<string, boolean> = {};
  data?.forEach((setting) => {
    settings[setting.key] = setting.value === true || setting.value === "true";
  });

  return {
    stripe_enabled: settings.stripe_enabled ?? true,
    ai_features_enabled: settings.ai_features_enabled ?? true,
  };
}

/**
 * Settings content component
 */
async function SettingsContent() {
  const settings = await getAdminSettings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Paramètres Administrateur
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Gérer les fonctionnalités globales de la plateforme
        </p>
      </div>

      {/* Settings Form */}
      <SettingsForm initialSettings={settings} />
    </div>
  );
}

/**
 * Admin Settings Page
 * 
 * Allows admins to toggle global platform features:
 * - Stripe payment processing (enable/disable paywall features)
 * - AI features (face recognition, auto-caption, smart culling)
 * 
 * Requirements: A.1.1, A.1.2
 */
export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
