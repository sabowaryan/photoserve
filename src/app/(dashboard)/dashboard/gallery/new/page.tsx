import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { getTranslation } from "@/lib/i18n/server";
import { FALLBACK_LOCALE } from "@/lib/i18n/types";
import { GalleryCreateForm } from "./gallery-create-form";
import { GalleryHeader } from "./gallery-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
  return {
    title: t('seo.newGallery.title'),
    description: t('seo.newGallery.description'),
  };
}

// All possible duration options
const ALL_DURATION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year" },
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
        <GalleryHeader
          currentStorageUsed={currentStorageUsed}
          storageLimit={storageLimit}
          storagePercentage={storagePercentage}
          subscriptionPlan={profile?.subscription_plan || "free"}
          isGalleryLimitReached={isGalleryLimitReached}
          galleryCount={galleryCount}
          maxGalleries={maxGalleries}
        />

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
