import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/shared/logo";
import {
  ArrowLeft,
  Eye,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { formatDistanceFr, isDatePast } from "@/lib/date";
import { GalleryDetailClient } from "./gallery-detail-client";

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
  subscription_plan: "free" | "premium" | "pro";
  max_images_per_gallery: number;
  max_image_size_mb: number;
}

async function getGalleryData(galleryId: string, userId: string) {
  const { supabase, hasRLS } = await requireSupabaseClient();

  // Fetch gallery (excluding password_hash for security)
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

  // Fetch profile for limits
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_plan, max_images_per_gallery, max_image_size_mb")
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
const DURATION_OPTIONS = {
  free: [
    { value: 7, label: "7 jours" },
    { value: 14, label: "14 jours" },
    { value: 30, label: "30 jours" },
  ],
  premium: [
    { value: 7, label: "7 jours" },
    { value: 14, label: "14 jours" },
    { value: 30, label: "30 jours" },
    { value: 60, label: "60 jours" },
    { value: 90, label: "90 jours" },
  ],
  pro: [
    { value: 7, label: "7 jours" },
    { value: 14, label: "14 jours" },
    { value: 30, label: "30 jours" },
    { value: 60, label: "60 jours" },
    { value: 90, label: "90 jours" },
    { value: 180, label: "180 jours" },
    { value: 365, label: "1 an" },
  ],
};

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

  const isExpired = isDatePast(gallery.expires_at);
  const totalImageSize = images.reduce(
    (acc, img) => acc + (img.file_size_mb || 0),
    0
  );

  const plan = (profile?.subscription_plan || "free") as keyof typeof DURATION_OPTIONS;
  const durationOptions = DURATION_OPTIONS[plan] || DURATION_OPTIONS.free;
  const canChangeDuration = plan !== "free";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="font-display text-xl font-bold gradient-text">
              PikSend
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>
        </Button>

        {/* Gallery Header - Server rendered info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-bold">{gallery.title}</h1>
              <Badge variant={isExpired ? "destructive" : "secondary"}>
                {isExpired ? "Expirée" : "Active"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {gallery.views_count} vues
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {isExpired
                  ? "Expirée"
                  : `Expire ${formatDistanceFr(gallery.expires_at)}`}
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {images.length} image{images.length !== 1 ? "s" : ""} (
                {totalImageSize.toFixed(1)} Mo)
              </span>
            </div>
          </div>
        </div>

        {/* Client-side interactive components */}
        <GalleryDetailClient
          gallery={gallery}
          initialImages={images}
          profile={profile}
          durationOptions={durationOptions}
          canChangeDuration={canChangeDuration}
        />
      </main>
    </div>
  );
}
