import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { apiKeyService } from "@/lib/services/api-key.service";
import { ProPlanGate } from "@/components/settings/pro-plan-gate";
import { APIKeysManager } from "@/components/settings/api-keys-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "API Keys - Settings | PikSend",
  description: "Manage API keys for Lightroom plugin integration",
};

/**
 * Fetch user's API keys
 */
async function getApiKeys(userId: string) {
  try {
    const apiKeys = await apiKeyService.listAPIKeys(userId);
    return apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return [];
  }
}

/**
 * API Keys Settings Page
 * 
 * Allows Pro users to manage API keys for the Lightroom plugin
 * Requirements: 7.1, 7.2, 7.3, 7.8, 7.9
 */
export default async function APIKeysPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  // Fetch API keys
  const apiKeys = await getApiKeys(session.user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-24 pb-16 font-['Plus_Jakarta_Sans']">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/20 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
        </div>

        {/* Pro Plan Gate */}
        <ProPlanGate>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <APIKeysManager initialApiKeys={apiKeys} />
          </div>

          {/* Documentation Link */}
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">
              Need help getting started?
            </h3>
            <p className="text-indigo-800 mb-4">
              Learn how to install and configure the Lightroom plugin with your API key.
            </p>
            <Button variant="outline" asChild>
              <Link href="/docs/lightroom">
                View Documentation
              </Link>
            </Button>
          </div>
        </ProPlanGate>
      </div>
    </div>
  );
}
