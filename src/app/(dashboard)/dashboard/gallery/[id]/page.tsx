import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { GalleryDetailClient } from "./gallery-detail-client";
import { GalleryHero } from "@/components/gallery-detail";
import { PLAN_LIMITS } from "@/config/plans";

export const metadata: Metadata = {
  title: "Détails de la galerie | PikSend",
  description: "Gérez votre galerie photo",
};

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  expiration_days: number;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_mb: number;
  order_index: number;
}

interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: "free" | "premium" | "pro";
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
}

async function getGalleryData(galleryId: string, userId: string) {
  const { supabase, hasRLS } = await requireSupabaseClient();

  // Fetch gallery
  let galleryQuery = supabase
    .from("galleries")
    .select(
      "id, title, unique_slug, expires_at, expiration_days, views_count, is_active, created_at, updated_at, user_id"
    )
    .eq("id", galleryId);

  if (!hasRLS) {
    galleryQuery = galleryQuery.eq("user_id", userId);
  }

  const { data: gallery, error: galleryError } = await galleryQuery.single();

  if (galleryError || !gallery) {
    return { gallery: null, images: [], profile: null };
  }

  // Verify ownership
  if (gallery.user_id !== userId) {
    return { gallery: null, images: [], profile: null };
  }

  // Fetch images
  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("order_index");

  if (imagesError) {
    console.error("Error fetching images:", imagesError);
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  return {
    gallery: gallery as Gallery,
    images: (images || []) as GalleryImage[],
    profile: profile as Profile | null,
  };
}

// Duration options by plan
const ALL_DURATION_OPTIONS = [
  { value: 1, label: "1 jour" },
  { value: 3, label: "3 jours" },
  { value: 7, label: "7 jours" },
  { value: 14, label: "14 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
  { value: 180, label: "180 jours" },
  { value: 365, label: "1 an" },
];

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const { id } = await params;
  const { gallery, images, profile } = await getGalleryData(id, session.user.id);

  if (!gallery) {
    notFound();
  }

  const plan = profile?.subscription_plan || "free";
  const limits = PLAN_LIMITS[plan];
  
  // Filter duration options based on plan
  const durationOptions = ALL_DURATION_OPTIONS.filter(
    (opt) => opt.value <= limits.max_expiration_days
  );
  
  const canChangeDuration = plan !== "free";
  const isExpired = new Date(gallery.expires_at) < new Date();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-10 pt-28 pb-20">
      {/* Hero Section with Breadcrumb */}
      <GalleryHero
          title={gallery.title}
          uniqueSlug={gallery.unique_slug}
          viewsCount={gallery.views_count}
          expiresAt={gallery.expires_at}
          createdAt={gallery.created_at}
          imageCount={images.length}
          isExpired={isExpired}
        />

        {/* Gallery Detail Client */}
        <GalleryDetailClient
          gallery={gallery}
          initialImages={images}
          profile={profile}
          durationOptions={durationOptions}
          canChangeDuration={canChangeDuration}
        />
      </main>
  );
}
