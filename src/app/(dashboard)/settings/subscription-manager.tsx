"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionManagerProps {
  hasSubscription: boolean;
  planKey?: "premium" | "pro";
  interval?: "monthly" | "yearly";
  isCurrentPlan?: boolean;
  variant?: "default" | "outline";
}

export function SubscriptionManager({
  hasSubscription,
  planKey,
  interval = "monthly",
  isCurrentPlan = false,
  variant = "default",
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!planKey) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          plan: planKey,
          interval: interval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de créer la session de paiement";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossible d'accéder au portail";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSubscription) {
    return (
      <Button
        variant="outline"
        onClick={handleManageSubscription}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        Gérer l&apos;abonnement
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading || isCurrentPlan}
      className="w-full"
      variant={variant}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {isCurrentPlan ? "Plan actuel" : "Choisir ce plan"}
    </Button>
  );
}
