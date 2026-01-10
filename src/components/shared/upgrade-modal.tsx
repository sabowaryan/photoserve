"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Crown, AlertTriangle, HardDrive, Images, ImageIcon, ArrowRight } from "lucide-react";
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
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  gallery: {
    icon: Images,
    title: "Limite de galeries atteinte",
    description: "Vous avez atteint le nombre maximum de galeries pour votre plan.",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  storage: {
    icon: HardDrive,
    title: "Espace de stockage insuffisant",
    description: "Votre espace de stockage est plein ou insuffisant pour cette opération.",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  images: {
    icon: Images,
    title: "Limite d'images atteinte",
    description: "Cette galerie a atteint le nombre maximum d'images pour votre plan.",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  imageSize: {
    icon: ImageIcon,
    title: "Fichier trop volumineux",
    description: "La taille de ce fichier dépasse la limite autorisée par votre plan.",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
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

  // Determine recommended plan based on current plan
  const recommendedPlan = currentPlan === "free" ? "premium" : "pro";
  const recommendedLimits = PLAN_LIMITS[recommendedPlan as keyof typeof PLAN_LIMITS];
  const recommendedPricing = PLAN_PRICING[recommendedPlan as keyof typeof PLAN_PRICING];

  // Get the relevant limit for the recommended plan
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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header with icon */}
        <div className={`${config.bgColor} p-8 pb-6`}>
          <div className={`w-16 h-16 rounded-2xl ${config.bgColor} border-2 border-white shadow-lg flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {config.title}
          </h2>
          <p className="text-slate-600 font-medium">
            {config.description}
          </p>
          {currentValue !== undefined && limitValue !== undefined && (
            <div className="mt-4 p-3 bg-white/80 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Utilisation actuelle</span>
                <span className="font-black text-slate-900">
                  {currentValue} / {limitValue}
                </span>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.color.replace("text-", "bg-")}`}
                  style={{ width: `${Math.min((currentValue / limitValue) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Upgrade suggestion */}
        <div className="p-8 pt-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                {recommendedPlan === "premium" ? (
                  <Zap className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <Crown className="w-5 h-5" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <h3 className="font-black text-slate-900 capitalize">
                  Plan {recommendedPlan}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  À partir de ${recommendedPricing.monthlyPrice}/mois
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span className="font-medium">{getRecommendedLimit()}</span>
              </li>
              {limitType !== "storage" && (
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span className="font-medium">
                    {recommendedLimits.storage_limit_mb >= 1024 
                      ? `${(recommendedLimits.storage_limit_mb / 1024).toFixed(0)} Go` 
                      : `${recommendedLimits.storage_limit_mb} Mo`} de stockage
                  </span>
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span className="font-medium">
                  Jusqu'à {recommendedLimits.max_expiration_days} jours de validité
                </span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Plus tard
            </button>
            <Link
              href="/settings?upgrade=true"
              className="flex-1 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              Voir les plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
