import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { ArrowLeft, HardDrive, AlertTriangle } from "lucide-react";
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
  
      
      

      <main className="max-w-7xl mx-auto px-4 sm:px-10 pt-28 pb-20">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>
        </Button>

        <div className="grid min-w-0 gap-6">
          {/* Storage Indicator */}
          <Card className={`glass-card ${storagePercentage >= 100 ? "border-destructive" : ""}`}>
            <CardContent className="pt-6">
              <div className="flex min-w-0 items-center justify-between mb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Espace de stockage
                  </span>
                </div>
                <Badge
                  variant={
                    profile?.subscription_plan === "free"
                      ? "secondary"
                      : "default"
                  }
                >
                  {profile?.subscription_plan?.toUpperCase() || "FREE"}
                </Badge>
              </div>
              <div className="flex min-w-0 items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold">
                  {currentStorageUsed.toFixed(1)}
                </span>
                <span className="text-muted-foreground">/ {storageLimit} Mo</span>
              </div>
              <Progress
                value={Math.min(storagePercentage, 100)}
                className={`h-2 ${storagePercentage >= 100 ? "[&>div]:bg-destructive" : ""}`}
              />
              {storagePercentage >= 100 && (
                <Link
                  href="/settings?upgrade=true"
                  className="flex items-center gap-2 mt-2 text-destructive text-sm hover:underline"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Espace insuffisant. Passez à un plan supérieur →
                </Link>
              )}
              {isGalleryLimitReached && (
                <Link
                  href="/settings?upgrade=true"
                  className="flex min-w-0 items-center gap-2 mt-2 text-destructive text-sm hover:underline"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Limite de galeries atteinte ({galleryCount}/{maxGalleries}).
                  Passez à un plan supérieur →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Main Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl">
                Nouvelle galerie
              </CardTitle>
              <CardDescription>
                Créez une galerie photo sécurisée à partager avec vos clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryCreateForm
                maxImagesPerGallery={profile?.max_images_per_gallery || 30}
                maxImageSizeMb={profile?.max_image_size_mb || 1}
                storageLimit={storageLimit}
                currentStorageUsed={currentStorageUsed}
                isGalleryLimitReached={isGalleryLimitReached}
                durationOptions={durationOptions}
                subscriptionPlan={profile?.subscription_plan || "free"}
              />
            </CardContent>
          </Card>
        </div>
      </main>
  
  );
}
