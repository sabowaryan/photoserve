import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Shield } from "lucide-react";
import { LogoIcon } from "@/components/shared/logo";
import { ProfileForm } from "./profile-form";
import { SubscriptionSection } from "./subscription-section";
import { SignOutSection } from "./sign-out-section";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <LogoIcon size={24} />
              <span className="text-xl font-display font-bold">Paramètres</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Profile Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initialEmail={profile?.email || ""}
                initialName={profile?.name || ""}
              />
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <SubscriptionSection 
            currentPlan={currentPlan} 
            profile={profile as any} 
          />

          {/* Security Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Gérez votre compte et sessions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-sm text-muted-foreground mb-1">
                  Connecté via
                </p>
                <p className="font-medium">
                  {session.user.image ? "Google" : "Email"}
                </p>
              </div>

              <Separator />

              <SignOutSection />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
