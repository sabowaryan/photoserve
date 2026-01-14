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
import { getTranslation } from "@/lib/i18n/server";
import { FALLBACK_LOCALE } from "@/lib/i18n/types";
import { AnalyticsClient } from "./analytics-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
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
    return null;
  }

  // Verify ownership
  if ((gallery as any).user_id !== userId) {
    return null;
  }

  return gallery as Gallery;
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
  const gallery = await getGalleryData(id, session.user.id);

  if (!gallery) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-10 pt-28 pb-20">
      <AnalyticsClient gallery={gallery} />
    </main>
  );
}
