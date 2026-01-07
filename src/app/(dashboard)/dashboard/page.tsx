import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { LogoIcon } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceFr, isDatePast } from "@/lib/date";
import {
  Plus,
  FolderOpen,
  Eye,
  Clock,
  ChevronRight,
  HardDrive,
  Settings,
} from "lucide-react";
import { GalleryActions } from "./gallery-actions";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = generatePageMetadata("dashboard");

interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: "free" | "premium" | "pro";
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
}

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
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
    console.error("Error fetching profile:", profileError);
    return { profile: null, galleries: [] };
  }

  // Fetch galleries (excluding password_hash for security)
  let galleriesQuery = supabase
    .from("galleries")
    .select(
      "id, title, unique_slug, expires_at, expiration_days, views_count, is_active, created_at, updated_at, user_id"
    )
    .order("created_at", { ascending: false });

  if (!hasRLS) {
    galleriesQuery = galleriesQuery.eq("user_id", userId);
  }

  const { data: galleries, error: galleriesError } = await galleriesQuery;

  if (galleriesError) {
    console.error("Error fetching galleries:", galleriesError);
    return { profile: profile as Profile, galleries: [] };
  }

  return {
    profile: profile as Profile,
    galleries: galleries as Gallery[],
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const { profile, galleries } = await getProfileAndGalleries(session.user.id);

  const storagePercentage = profile
    ? (profile.storage_used_mb / profile.storage_limit_mb) * 100
    : 0;

  const planColors = {
    free: "bg-muted text-muted-foreground",
    premium: "bg-primary/20 text-primary",
    pro: "bg-gradient-to-r from-primary to-purple-500 text-primary-foreground",
  };

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

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Bonjour{profile?.name ? `, ${profile.name}` : ""} 👋
          </h1>
          <p className="text-muted-foreground">
            Gérez vos galeries photo et suivez votre utilisation.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Plan Card */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Plan actuel</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-lg px-3 py-1 ${planColors[profile?.subscription_plan || "free"]}`}
              >
                {profile?.subscription_plan?.toUpperCase() || "FREE"}
              </Badge>
            </CardContent>
          </Card>

          {/* Storage Card */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Stockage utilisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold">
                  {profile?.storage_used_mb?.toFixed(1) || 0}
                </span>
                <span className="text-muted-foreground">
                  / {profile?.storage_limit_mb} Mo
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Galleries Count */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Galeries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold">{galleries.length}</span>
                <span className="text-muted-foreground">
                  / {profile?.max_galleries || 3}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({(profile?.max_galleries || 3) - galleries.length} restantes)
                </span>
              </div>
              <Progress
                value={
                  (galleries.length / (profile?.max_galleries || 3)) * 100
                }
                className={`h-2 ${galleries.length >= (profile?.max_galleries || 3) ? "[&>div]:bg-destructive" : ""}`}
              />
              {galleries.length >= (profile?.max_galleries || 3) && (
                <Link
                  href="/settings?upgrade=true"
                  className="text-xs text-destructive hover:underline mt-2 block"
                >
                  Limite atteinte → Passer à un plan supérieur
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Gallery Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">Vos galeries</h2>
          <Button asChild className="btn-primary">
            <Link href="/dashboard/gallery/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle galerie
            </Link>
          </Button>
        </div>

        {/* Galleries List */}
        {galleries.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">
                Aucune galerie
              </h3>
              <p className="text-muted-foreground mb-6">
                Créez votre première galerie pour commencer à partager vos
                photos.
              </p>
              <Button asChild className="btn-primary">
                <Link href="/dashboard/gallery/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une galerie
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {galleries.map((gallery) => {
              const isExpired = isDatePast(gallery.expires_at);

              return (
                <Card
                  key={gallery.id}
                  className="glass-card group hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-lg font-semibold">
                            {gallery.title}
                          </h3>
                          <Badge variant={isExpired ? "destructive" : "secondary"}>
                            {isExpired ? "Expirée" : "Active"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {gallery.views_count} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {isExpired
                              ? "Expirée"
                              : `Expire ${formatDistanceFr(gallery.expires_at)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <GalleryActions
                          galleryId={gallery.id}
                          gallerySlug={gallery.unique_slug}
                        />
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/gallery/${gallery.id}`}>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
