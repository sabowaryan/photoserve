"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Zap, Crown, ArrowRight, Sparkles, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface SettingsPricingButtonProps {
  planKey: "free" | "premium" | "pro";
  interval?: "monthly" | "yearly";
  currentPlan?: string;
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

// Plan hierarchy for upgrade/downgrade detection
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

export function SettingsPricingButton({
  planKey,
  interval = "monthly",
  currentPlan,
  variant = "default",
  className = "",
  children,
}: SettingsPricingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isCurrentPlan = currentPlan === planKey;
  const isPro = planKey === "pro";
  const isFree = planKey === "free";
  
  // Determine if this is an upgrade or downgrade
  const currentPlanLevel = PLAN_HIERARCHY[currentPlan || "free"] ?? 0;
  const targetPlanLevel = PLAN_HIERARCHY[planKey] ?? 0;
  const isDowngrade = targetPlanLevel < currentPlanLevel;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentPlan || isLoading) return;

    // For downgrade to free, redirect to Stripe portal to cancel
    if (isDowngrade && isFree) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'accès au portail");
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Impossible d'accéder au portail";
        toast.error(errorMessage);
        setIsLoading(false);
      }
      return;
    }

    // For downgrade to premium (from pro), also use portal
    if (isDowngrade) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'accès au portail");
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Impossible d'accéder au portail";
        toast.error(errorMessage);
        setIsLoading(false);
      }
      return;
    }

    // For free plan without subscription, just go to dashboard
    if (isFree && currentPlan === "free") {
      router.push("/dashboard");
      return;
    }

    // For upgrades, create checkout session
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de créer la session de paiement";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const getButtonStyles = () => {
    const base =
      "relative flex items-center justify-center gap-3 px-8 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.18em] transition-all duration-500 overflow-hidden active:scale-95 group disabled:cursor-default disabled:active:scale-100 w-full";

    if (isCurrentPlan) {
      return `${base} bg-slate-50 text-slate-400 border border-slate-200 shadow-inner cursor-default`;
    }

    // Downgrade style - more subtle/warning
    if (isDowngrade) {
      return `${base} bg-white text-slate-500 border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-lg`;
    }

    if (variant === "outline") {
      return `${base} bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50/30 hover:shadow-lg hover:shadow-indigo-500/10`;
    }

    if (isPro) {
      return `${base} bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1.5 ring-offset-2 hover:ring-4 hover:ring-indigo-500/20`;
    }

    return `${base} bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-500/40 hover:-translate-y-1.5 ring-offset-2 hover:ring-4 hover:ring-indigo-500/20`;
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (isCurrentPlan) return <Check className="h-5 w-5 animate-in zoom-in duration-500" strokeWidth={3} />;
    if (isDowngrade) return <ArrowDown className="h-5 w-5" />;
    if (planKey === "pro")
      return (
        <div className="relative">
          <Zap className="h-5 w-5 group-hover:scale-125 transition-transform duration-500 fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]" />
          <Sparkles className="absolute -top-3 -right-3 h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
        </div>
      );
    if (planKey === "premium")
      return <Crown className="h-5 w-5 group-hover:rotate-12 transition-transform duration-500 fill-white/20" />;
    return <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />;
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Plan Actuel";
    if (isLoading) return "Chargement...";
    if (isDowngrade) return isFree ? "Annuler l'abonnement" : "Rétrograder";
    return children;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      className={`${getButtonStyles()} ${className}`}
    >
      {!isCurrentPlan && !isLoading && !isDowngrade && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_2s_infinite] pointer-events-none" />
          <div className="absolute inset-[1px] rounded-[1.7rem] border border-white/10 pointer-events-none transition-opacity group-hover:opacity-50" />
        </>
      )}
      {isPro && !isCurrentPlan && !isDowngrade && (
        <div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
      )}
      <div className="relative z-10 flex items-center gap-3">
        {getIcon()}
        <span className="relative">
          {getButtonText()}
          {!isCurrentPlan && !isLoading && !isDowngrade && (
            <div className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-white/30 group-hover:w-full transition-all duration-500" />
          )}
        </span>
      </div>
    </button>
  );
}
