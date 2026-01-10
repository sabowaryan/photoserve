"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, ExternalLink, Zap, Crown, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubscribe = async () => {
    if (!planKey) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        showToast("success", `Redirection vers le paiement ${planKey === "pro" ? "Pro" : "Premium"}...`);
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de créer la session de paiement";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      if (data.url) {
        showToast("success", "Redirection vers votre portail client...");
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossible d'accéder au portail de facturation";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Toast Portal Implementation
  const toastEl = mounted && toast ? createPortal(
    <div className="fixed bottom-8 right-8 z-[10000] animate-in slide-in-from-bottom-4 zoom-in duration-300">
      <div className={`px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${
        toast.type === "success"
          ? "bg-slate-900 text-white border-white/10"
          : "bg-rose-500 text-white border-rose-400"
      }`}>
        {toast.type === "success" ? (
          <div className="bg-emerald-500 p-1 rounded-full text-white">
            <CheckCircle2 size={16} strokeWidth={3} />
          </div>
        ) : (
          <AlertCircle size={16} strokeWidth={3} />
        )}
        <span className="text-sm font-bold tracking-tight">{toast.text}</span>
      </div>
    </div>,
    document.body
  ) : null;

  if (isCurrentPlan) {
    return (
      <button
        disabled
        className="w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl cursor-default border border-slate-200 flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={18} />
        Plan actuel
      </button>
    );
  }

  if (hasSubscription) {
    return (
      <>
        {toastEl}
        <button
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ExternalLink size={18} />
          )}
          Gérer l&apos;abonnement
        </button>
      </>
    );
  }

  const baseStyles = "w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 relative overflow-hidden group/btn";
  
  const variants = {
    default: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100",
    outline: "bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-100 hover:border-indigo-300 shadow-none",
  };

  return (
    <>
      {toastEl}
      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={`${baseStyles} ${variants[variant]}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite] pointer-events-none"></div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : planKey === "pro" ? (
          <Zap size={18} fill="currentColor" />
        ) : (
          <Crown size={18} fill="currentColor" />
        )}
        <span>
          {isLoading ? "Chargement..." : `Choisir le plan ${planKey === "pro" ? "Pro" : "Premium"}`}
        </span>
      </button>
    </>
  );
}
