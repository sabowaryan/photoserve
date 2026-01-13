"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Crown, HardDrive, Images, ImageIcon, ArrowRight, Check, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS, PLAN_PRICING } from "@/config/plans";

type LimitType = "gallery" | "storage" | "images" | "imageSize";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentValue?: number;
  limitValue?: number;
  currentPlan?: string;
}

const LIMIT_CONFIG: Record<LimitType, {
  icon: typeof Images;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  progressColor: string;
}> = {
  gallery: {
    icon: Images,
    title: "Limite de galeries atteinte",
    description: "Vous avez atteint le nombre maximum de galeries pour votre plan.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    progressColor: "bg-amber-500",
  },
  storage: {
    icon: HardDrive,
    title: "Espace de stockage insuffisant",
    description: "Votre espace de stockage est plein ou insuffisant pour cette opération.",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    progressColor: "bg-rose-500",
  },
  images: {
    icon: Images,
    title: "Limite d'images atteinte",
    description: "Cette galerie a atteint le nombre maximum d'images pour votre plan.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    progressColor: "bg-amber-500",
  },
  imageSize: {
    icon: ImageIcon,
    title: "Fichier trop volumineux",
    description: "La taille de ce fichier dépasse la limite autorisée par votre plan.",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    progressColor: "bg-rose-500",
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  limitType,
  currentValue,
  limitValue,
  currentPlan = "free",
}: UpgradeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const config = LIMIT_CONFIG[limitType];
  const Icon = config.icon;

  const recommendedPlan = currentPlan === "free" ? "premium" : "pro";
  const recommendedLimits = PLAN_LIMITS[recommendedPlan as keyof typeof PLAN_LIMITS];
  const recommendedPricing = PLAN_PRICING[recommendedPlan as keyof typeof PLAN_PRICING];

  const getRecommendedLimit = () => {
    switch (limitType) {
      case "gallery":
        return `${recommendedLimits.max_galleries} galeries`;
      case "storage":
        return `${recommendedLimits.storage_limit_mb >= 1024 
          ? `${(recommendedLimits.storage_limit_mb / 1024).toFixed(0)} Go` 
          : `${recommendedLimits.storage_limit_mb} Mo`} de stockage`;
      case "images":
        return `${recommendedLimits.max_images_per_gallery} images par galerie`;
      case "imageSize":
        return `${recommendedLimits.max_image_size_mb} Mo par image`;
      default:
        return "";
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${config.gradient} p-8 pb-6 relative overflow-hidden`}>
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {config.title}
            </h2>
            <p className="text-white/80 font-medium text-sm">
              {config.description}
            </p>
          </div>
        </div>

        {/* Usage indicator */}
        {currentValue !== undefined && limitValue !== undefined && (
          <div className="px-6 -mt-4 relative z-10">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Utilisation actuelle
                </span>
                <span className="font-black text-slate-900">
                  {currentValue} / {limitValue}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.progressColor} transition-all duration-500`}
                  style={{ width: `${Math.min((currentValue / limitValue) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade suggestion */}
        <div className="p-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 mb-5 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
                  {recommendedPlan === "premium" ? (
                    <Zap className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    <Crown className="w-5 h-5" strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white capitalize">
                    Plan {recommendedPlan}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    ${recommendedPricing.monthlyPrice}/mois
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">{getRecommendedLimit()}</span>
                </li>
                {limitType !== "storage" && (
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-medium">
                      {recommendedLimits.storage_limit_mb >= 1024 
                        ? `${(recommendedLimits.storage_limit_mb / 1024).toFixed(0)} Go` 
                        : `${recommendedLimits.storage_limit_mb} Mo`} de stockage
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">
                    Jusqu&apos;à {recommendedLimits.max_expiration_days} jours de validité
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
            >
              Plus tard
            </button>
            <Link
              href="/settings?upgrade=true"
              className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 group"
            >
              Voir les plans
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
