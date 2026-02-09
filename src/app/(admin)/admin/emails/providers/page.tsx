import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderConfigFormWrapper } from "./provider-config-form-wrapper";

/**
 * Loading skeleton for provider configuration page
 */
function ProviderConfigSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Fetch provider configurations from database
 */
async function getProviderConfigs() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_providers")
    .select("id, name, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching provider configs:", error);
    return [];
  }

  return data || [];
}

/**
 * Provider configuration content component
 */
async function ProviderConfigContent() {
  const providers = await getProviderConfigs();

  // Find active provider
  const activeProvider = providers.find((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Email Provider Configuration
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Configure and manage email service providers (Resend or AWS SES)
        </p>
      </div>

      {/* Provider Configuration Form */}
      <ProviderConfigFormWrapper
        providers={providers}
        activeProviderName={activeProvider?.name || null}
      />
    </div>
  );
}

/**
 * Email Provider Configuration Page
 * 
 * Allows admins to:
 * - Select email provider (Resend or AWS SES)
 * - Configure provider credentials
 * - Test provider connection
 * - Switch between providers
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export default function EmailProvidersPage() {
  return (
    <Suspense fallback={<ProviderConfigSkeleton />}>
      <ProviderConfigContent />
    </Suspense>
  );
}
