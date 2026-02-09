"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for ProviderConfigForm to prevent hydration mismatch
 * 
 * This wrapper is necessary because:
 * - ProviderConfigForm has dynamic client-side state (isConfigured, isMounted)
 * - Conditional rendering of buttons causes server/client HTML differences
 * - We need to disable SSR to prevent hydration errors
 */
const ProviderConfigForm = dynamic(
  () => import("./provider-config-form").then((mod) => ({ default: mod.ProviderConfigForm })),
  { ssr: false }
);

interface Provider {
  id: string;
  name: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProviderConfigFormWrapperProps {
  providers: Provider[];
  activeProviderName: string | null;
}

export function ProviderConfigFormWrapper({ providers, activeProviderName }: ProviderConfigFormWrapperProps) {
  return <ProviderConfigForm providers={providers} activeProviderName={activeProviderName} />;
}
