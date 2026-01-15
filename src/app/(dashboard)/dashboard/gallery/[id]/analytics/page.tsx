/**
 * Gallery Analytics Page
 * Displays comprehensive analytics for a gallery
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/page
 * Requirement 3.3.4: THE Dashboard SHALL display analytics per gallery
 */
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { getTranslation, getServerLocale } from "@/lib/i18n/server";
import { AnalyticsClient } from "./analytics-client";
import { hasFeatureAccess } from "@/config/plan-features";
import type { SubscriptionPlan } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
  return {
    title: t('seo.galleryAnalytics.title') || 'Gallery Analytics',
    description: t('seo.galleryAnalytics.description') || 'View detailed analytics for your gallery',
  };
}

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  user_id: string;
  created_at: string;
}

async function getGalleryData(galleryId: string, userId: string) {
  const { supabase, hasRLS } = await requireSupabaseClient();

  // Fetch gallery
  let galleryQuery = supabase
    .from("galleries")
    .select("id, title, unique_slug, user_id, created_at")
    .eq("id", galleryId);

  if (!hasRLS) {
    galleryQuery = galleryQuery.eq("user_id", userId);
  }

  const { data: gallery, error: galleryError } = await galleryQuery.single();

  if (galleryError || !gallery) {
    return { gallery: null, userPlan: "free" as SubscriptionPlan };
  }

  // Verify ownership
  if ((gallery as any).user_id !== userId) {
    return { gallery: null, userPlan: "free" as SubscriptionPlan };
  }

  // Fetch user's subscription plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  const userPlan = (profile?.subscription_plan || "free") as SubscriptionPlan;

  return { gallery: gallery as Gallery, userPlan };
}

export default async function GalleryAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const { id } = await params;
  const { gallery, userPlan } = await getGalleryData(id, session.user.id);

  if (!gallery) {
    notFound();
  }

  // Check if user has access to detailed analytics (Pro plan only)
  if (!hasFeatureAccess(userPlan, "detailedAnalytics")) {
    redirect(`/dashboard/gallery/${id}?upgrade=analytics`);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-10 pt-28 pb-20">
      <AnalyticsClient gallery={gallery} />
    </main>
  );
}
