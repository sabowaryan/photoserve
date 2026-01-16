"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Zap, Crown, ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SettingsPricingButtonProps {
  planKey: "free" | "premium" | "pro";
  interval?: "monthly" | "yearly";
  currentPlan?: string;
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

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
  const isPremium = planKey === "premium";
  const isFree = planKey === "free";
  
  const currentPlanLevel = PLAN_HIERARCHY[currentPlan || "free"] ?? 0;
  const targetPlanLevel = PLAN_HIERARCHY[planKey] ?? 0;
  const isUpgrade = targetPlanLevel > currentPlanLevel;
  const isDowngrade = targetPlanLevel < currentPlanLevel;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentPlan || isLoading) return;

    // Pour rétrograder (vers free ou premium depuis pro), utiliser le portail Stripe
    if (isDowngrade) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur lors de l'accès au portail");
        if (data.url) window.location.href = data.url;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'accéder au portail");
        setIsLoading(false);
      }
      return;
    }

    // Pour le plan gratuit sans abonnement
    if (isFree && currentPlan === "free") {
      router.push("/dashboard");
      return;
    }

    // Pour les upgrades, créer une session checkout
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de la création de la session");
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la session de paiement");
      setIsLoading(false);
    }
  };

  const getButtonStyles = () => {
    const base = "relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 w-full";

    // Plan actuel - style désactivé
    if (isCurrentPlan) {
      return `${base} bg-emerald-50 text-emerald-600 border-2 border-emerald-200 cursor-default`;
    }

    // Rétrogradation - style discret/warning
    if (isDowngrade) {
      return `${base} bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-600 cursor-pointer`;
    }

    // Upgrade vers Pro - style premium avec gradient
    if (isPro && isUpgrade) {
      return `${base} bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] hover:from-indigo-500 hover:to-violet-500 cursor-pointer`;
    }

    // Upgrade vers Premium - style accentué
    if (isPremium && isUpgrade) {
      return `${base} bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:scale-[1.02] cursor-pointer`;
    }

    // Style outline par défaut
    if (variant === "outline") {
      return `${base} bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 cursor-pointer`;
    }

    return `${base} bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer`;
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    if (isCurrentPlan) return <Check className="h-4 w-4" strokeWidth={2.5} />;
    
    if (isDowngrade) return <ArrowDown className="h-4 w-4" />;
    
    if (isPro && isUpgrade) {
      return (
        <span className="relative">
          <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
          <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-amber-200 animate-pulse" />
        </span>
      );
    }
    
    if (isPremium && isUpgrade) {
      return <Crown className="h-4 w-4" />;
    }
    
    return <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />;
  };

  const getButtonText = () => {
    if (isLoading) return "Chargement...";
    
    if (isCurrentPlan) return "Plan actuel";
    
    if (isDowngrade) {
      if (isFree) return "Rétrograder";
      return "Changer de plan";
    }
    
    if (isUpgrade) {
      if (isPro) return "Passer au Pro";
      if (isPremium) return "Passer au Premium";
    }
    
    return children;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      className={`${getButtonStyles()} ${className} group`}
    >
      <span className="flex items-center gap-2">
        {getIcon()}
        <span>{getButtonText()}</span>
      </span>
    </button>
  );
}
