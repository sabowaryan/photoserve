import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { ArrowLeft, ChevronRight, HardDrive, AlertTriangle, Sparkles, Zap, TrendingUp } from "lucide-react";
import { GalleryCreateForm } from "./gallery-create-form";

export const metadata: Metadata = {
  title: "Nouvelle galerie | PikSend",
  description: "Créez une nouvelle galerie photo sécurisée",
};

// All possible duration options
const ALL_DURATION_OPTIONS = [
  { value: 1, label: "1 jour" },
  { value: 3, label: "3 jours" },
  { value: 7, label: "7 jours" },
  { value: 14, label: "14 jours" },
  { value: 30, label: "30 jours" },
  { value: 60, label: "60 jours" },
  { value: 90, label: "90 jours" },
  { value: 180, label: "180 jours" },
  { value: 365, label: "1 an" },
];

async function getProfileAndLimits(userId: string) {
  const { supabase } = await requireSupabaseClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { profile: null, planDetails: null, galleryCount: 0 };
  }

  // Fetch subscription plan details for max expiration days
  const { data: planDetails, error: planError } = await supabase
    .from("subscription_plans")
    .select("max_expiration_days")
    .eq("name", profile?.subscription_plan || "free")
    .single();

  if (planError) {
    console.error("Error fetching plan details:", planError);
  }

  // Fetch current gallery count
  const { count: galleryCount, error: countError } = await supabase
    .from("galleries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("Error fetching gallery count:", countError);
  }

  return {
    profile,
    planDetails,
    galleryCount: galleryCount || 0,
  };
}

export default async function GalleryCreatePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const { profile, planDetails, galleryCount } = await getProfileAndLimits(
    session.user.id
  );

  const maxGalleries = profile?.max_galleries || 3;
  const isGalleryLimitReached = galleryCount >= maxGalleries;
  const storageLimit = profile?.storage_limit_mb || 20;
  const currentStorageUsed = profile?.storage_used_mb || 0;
  const storagePercentage = (currentStorageUsed / storageLimit) * 100;

  // Get duration options based on plan's max_expiration_days
  const maxExpirationDays = planDetails?.max_expiration_days || 30;
  const durationOptions = ALL_DURATION_OPTIONS.filter(
    (option) => option.value <= maxExpirationDays
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-all group"
          >
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-sm font-bold text-slate-400">Nouvelle galerie</span>
        </div>

        {/* Hero Header */}
        <div className="relative mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Nouvelle création
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                  Créer une galerie
                </h1>
                <p className="text-indigo-100/70 font-medium max-w-md">
                  Partagez vos photos en qualité HD avec vos clients en toute sécurité.
                </p>
              </div>

              {/* Storage Card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${storagePercentage >= 90 ? 'bg-rose-500/20' : 'bg-white/10'}`}>
                    <HardDrive size={18} className={storagePercentage >= 90 ? 'text-rose-300' : 'text-white'} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Stockage</p>
                    <p className="text-sm font-black">
                      {currentStorageUsed.toFixed(1)} / {storageLimit} Mo
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      storagePercentage >= 90 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Plan {profile?.subscription_plan || 'free'}
                  </span>
                  <span className="text-[10px] font-bold text-white/70">
                    {Math.round(storagePercentage)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(storagePercentage >= 100 || isGalleryLimitReached) && (
          <div className="mb-6 space-y-3 animate-in slide-in-from-bottom-4 duration-500">
            {storagePercentage >= 100 && (
              <Link
                href="/settings?upgrade=true"
                className="flex items-center gap-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl hover:bg-rose-100 transition-all group"
              >
                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Espace de stockage insuffisant</p>
                  <p className="text-sm text-rose-700">Passez à un plan supérieur pour continuer</p>
                </div>
                <Zap size={18} className="text-rose-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            
            {isGalleryLimitReached && (
              <Link
                href="/settings?upgrade=true"
                className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-all group"
              >
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900">Limite de galeries atteinte</p>
                  <p className="text-sm text-amber-700">{galleryCount}/{maxGalleries} galeries • Passez à Premium</p>
                </div>
                <Zap size={18} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        )}

        {/* Main Form */}
        <GalleryCreateForm
          maxImagesPerGallery={profile?.max_images_per_gallery || 30}
          maxImageSizeMb={profile?.max_image_size_mb || 1}
          storageLimit={storageLimit}
          currentStorageUsed={currentStorageUsed}
          isGalleryLimitReached={isGalleryLimitReached}
          durationOptions={durationOptions}
          subscriptionPlan={profile?.subscription_plan || "free"}
        />
      </div>
    </main>
  );
}
