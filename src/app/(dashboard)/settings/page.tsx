import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { ArrowLeft, User, Shield, Settings } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Retour au dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Settings size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paramètres</h1>
                <p className="text-sm text-slate-500 font-medium">Gérez votre compte et vos préférences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Mon Profil</h2>
              <p className="text-xs text-slate-500">Informations de votre compte</p>
            </div>
          </div>
          <div className="p-6">
            <ProfileForm
              initialEmail={profile?.email || ""}
              initialName={profile?.name || ""}
            />
          </div>
        </section>

        {/* Subscription Section */}
        <div id="subscription-section" className="scroll-mt-28 transition-all duration-500">
          <SubscriptionSection currentPlan={currentPlan} profile={profile as any} />
        </div>

        {/* Security Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Sécurité</h2>
              <p className="text-xs text-slate-500">Gérez l'accès à votre compte</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email & Mot de passe</p>
                  <p className="text-xs text-slate-500">Méthode de connexion</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Vérifié
              </span>
            </div>

            {/* Sign Out */}
            <SignOutSection />
          </div>
        </section>
      </div>
    </div>
  );
}
