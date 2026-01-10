import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { ArrowLeft, User, Shield } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { SubscriptionSection } from "./subscription-section";
import { SignOutSection } from "./sign-out-section";
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
    <div className="pt-32 pb-20">
      {/* Scroll handler for upgrade param */}
      <Suspense fallback={null}>
        <SettingsScrollHandler />
      </Suspense>

      {/* Sections with max-w-4xl */}
      <div className="max-w-4xl mx-auto px-4 sm:px-10 space-y-8">
        {/* Navigation back */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-4 transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-all">
            <ArrowLeft size={16} />
          </div>
          Retour au tableau de bord
        </Link>

        {/* Section Profil */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Mon Profil
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Gérez vos informations de compte PikSend
                </p>
              </div>
            </div>
            <ProfileForm
              initialEmail={profile?.email || ""}
              initialName={profile?.name || ""}
            />
          </div>
        </section>
      </div>

      {/* Subscription Section - Full width container */}
      <div id="subscription-section" className="max-w-7xl mx-auto px-4 sm:px-10 mt-8 scroll-mt-24 transition-all duration-500">
        <SubscriptionSection currentPlan={currentPlan} profile={profile as any} />
      </div>

      {/* Security Section with max-w-4xl */}
      <div className="max-w-4xl mx-auto px-4 sm:px-10 mt-8">

        {/* Section Sécurité & Déconnexion */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Sécurité
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Gérez l&apos;accès et votre session
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Connecté via
                  </p>
                  <p className="text-lg font-bold text-slate-900 tracking-tight">
                    Email & Mot de Passe
                  </p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Vérifié
                </div>
              </div>
              <SignOutSection />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
