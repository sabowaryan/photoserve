import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = generatePageMetadata("dashboard");

interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: "free" | "premium" | "pro";
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  onboarding_completed: boolean | null;
}

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
  images?: { cloudinary_url?: string; order_index?: number }[];
}

async function getProfileAndGalleries(userId: string) {
  const { supabase, hasRLS } = await requireSupabaseClient();

  // Fetch profile
  let profileQuery = supabase.from("profiles").select("*");
  if (hasRLS) {
    profileQuery = profileQuery.eq("id", userId);
  } else {
    profileQuery = profileQuery.eq("id", userId);
  }
  const { data: profile, error: profileError } = await profileQuery.maybeSingle();

  if (profileError) {
    return { profile: null, galleries: [] };
  }

  if (!profile) {
    // Try to create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: "", // Will be updated by trigger or manually
      })
      .select()
      .single();
    
    if (createError) {
      // Profile creation failed
    } else {
      return { profile: newProfile as Profile, galleries: [] };
    }
  }

  // Fetch galleries (excluding password_hash for security)
  let galleriesQuery = supabase
    .from("galleries")
    .select(
      "id, title, unique_slug, expires_at, expiration_days, views_count, is_active, created_at, updated_at, user_id, images(cloudinary_url, order_index)"
    )
    .order("created_at", { ascending: false });

  if (!hasRLS) {
    galleriesQuery = galleriesQuery.eq("user_id", userId);
  }

  const { data: galleries, error: galleriesError } = await galleriesQuery;

  if (galleriesError) {
    return { profile: profile as Profile, galleries: [] };
  }

  // Transform galleries to include image_count and preview image
  const galleriesWithCount = (galleries || []).map((gallery: any) => {
    const images = gallery.images || [];
    // Sort images by order_index to get the first one
    const sortedImages = [...images].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const firstImage = sortedImages[0];
    
    return {
      ...gallery,
      image_count: images.length,
      imageUrl: firstImage?.cloudinary_url || undefined,
    };
  });

  return {
    profile: profile as Profile,
    galleries: galleriesWithCount as Gallery[],
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const { profile, galleries } = await getProfileAndGalleries(session.user.id);

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-6 pt-28 pb-16">
        {/* Background Glow Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Pass data to client component */}
        <DashboardClient
          profile={profile}
          galleries={galleries}
          userName={profile?.name || session.user.email?.split("@")[0] || ""}
        />
      </main>
    </>
  );
}
