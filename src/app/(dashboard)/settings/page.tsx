import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { SettingsHeader } from "./settings-header";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";
import { SubscriptionSection } from "./subscription-section";
import { SettingsScrollHandler } from "./settings-client";

export const metadata: Metadata = generatePageMetadata("settings");

async function getProfile(userId: string) {
  const { supabase } = await requireSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const profile = await getProfile(session.user.id);
  const currentPlan = profile?.subscription_plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-24 pb-16 font-['Plus_Jakarta_Sans']">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/20 rounded-full blur-[80px]" />
      </div>

      <Suspense fallback={null}>
        <SettingsScrollHandler />
      </Suspense>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <SettingsHeader />

        {/* Profile Section */}
        <ProfileSection
          initialEmail={profile?.email || ""}
          initialName={profile?.name || ""}
        />

        {/* Subscription Section */}
        <div id="subscription-section" className="scroll-mt-28 transition-all duration-500">
          <SubscriptionSection currentPlan={currentPlan} profile={profile as any} />
        </div>

        {/* Security Section */}
        <SecuritySection />
      </div>
    </div>
  );
}
