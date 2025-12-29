import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Shield, Crown, Zap, Check } from "lucide-react";
import { LogoIcon } from "@/components/shared/logo";
import { ProfileForm } from "./profile-form";
import { SubscriptionManager } from "./subscription-manager";
import { SignOutSection } from "./sign-out-section";

export const metadata: Metadata = generatePageMetadata("settings");

const STRIPE_PLANS = {
  premium: {
    name: "Premium",
    price: 9.99,
    features: [
      "5 Go de stockage",
      "50 galeries",
      "500 images par galerie",
      "Taille illimitée par image",
      "Durée jusqu'à 90 jours",
    ],
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  pro: {
    name: "Pro",
    price: 25.99,
    features: [
      "50 Go de stockage",
      "500 galeries",
      "5000 images par galerie",
      "Taille illimitée par image",
      "Durée jusqu'à 180 jours",
      "Support prioritaire",
    ],
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

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
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Abonnement</CardTitle>
                    <CardDescription>
                      Gérez votre plan et facturation
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Display */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan actuel</p>
                    <p className="text-2xl font-display font-bold capitalize">
                      {currentPlan === "free" ? "Gratuit" : currentPlan}
                    </p>
                  </div>
                  <Badge
                    variant={currentPlan !== "free" ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {currentPlan === "free" ? "Gratuit" : "Actif"}
                  </Badge>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground">Stockage</p>
                    <p className="text-lg font-semibold">
                      {profile?.storage_used_mb?.toFixed(1) || "0"}
                      <span className="text-sm text-muted-foreground font-normal">
                        {" "}
                        / {profile?.storage_limit_mb || 20} Mo
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground">Galeries max</p>
                    <p className="text-lg font-semibold">
                      {profile?.max_galleries || 3}
                    </p>
                  </div>
                </div>

                {profile?.stripe_subscription_id && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <SubscriptionManager hasSubscription={true} />
                  </div>
                )}
              </div>

              {/* Available Plans */}
              {currentPlan === "free" && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-display font-semibold mb-4">
                      Passer à un plan supérieur
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
                        const Icon = plan.icon;
                        const isCurrentPlan = currentPlan === key;

                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border ${
                              isCurrentPlan
                                ? "border-primary bg-primary/5"
                                : "border-border/40 bg-card/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                                <Icon className={`h-5 w-5 ${plan.color}`} />
                              </div>
                              <div>
                                <h4 className="font-display font-semibold">
                                  {plan.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  <span className="text-lg font-bold text-foreground">
                                    ${plan.price}
                                  </span>
                                  /mois
                                </p>
                              </div>
                            </div>

                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Check className={`h-4 w-4 ${plan.color}`} />
                                  <span className="text-muted-foreground">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>

                            <SubscriptionManager
                              hasSubscription={false}
                              planKey={key as "premium" | "pro"}
                              isCurrentPlan={isCurrentPlan}
                              variant={key === "pro" ? "default" : "outline"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Upgrade option for premium users */}
              {currentPlan === "premium" && (
                <>
                  <Separator />
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold">
                          Passer à Pro
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          <span className="text-lg font-bold text-foreground">
                            $25.99
                          </span>
                          /mois
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {STRIPE_PLANS.pro.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <SubscriptionManager
                      hasSubscription={false}
                      planKey="pro"
                      isCurrentPlan={false}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
