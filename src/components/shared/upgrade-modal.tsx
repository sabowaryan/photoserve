"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Crown, HardDrive, Images, ImageIcon, ArrowRight, Check, TrendingUp, BarChart3, Sparkles, Star, Quote } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS, PLAN_PRICING } from "@/config/plans";
import { ROICalculator } from "@/components/conversion/roi-calculator";
import type { Persona } from "@/types/persona";

type LimitType = "gallery" | "storage" | "images" | "imageSize" | "feature";

type FeatureType = "detailedAnalytics" | "customDomain" | "whiteLabel" | "ctaButton" | "leadMagnet" | "paywall" | "zipDownload" | "branding";

// Requirement 8.1, 8.2, 8.3, 8.4, 8.5: Trigger types
export type UpgradeTrigger = 
  | 'limit_reached'
  | 'feature_locked'
  | 'time_based'
  | 'behavior_based';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentValue?: number;
  limitValue?: number;
  currentPlan?: string;
  /** For feature-based upgrades, specify which feature */
  featureType?: FeatureType;
  /** Requirement 8.6: Trigger type for variant support */
  trigger?: UpgradeTrigger;
  /** Persona for ROI calculator defaults */
  persona?: Persona;
  /** Show ROI calculator in modal */
  showROI?: boolean;
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
  feature: {
    icon: Sparkles,
    title: "Fonctionnalité Pro",
    description: "Cette fonctionnalité est réservée aux utilisateurs Pro.",
    gradient: "from-indigo-500 via-violet-500 to-purple-500",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    progressColor: "bg-indigo-500",
  },
};

const FEATURE_CONFIG: Record<FeatureType, {
  icon: typeof BarChart3;
  title: string;
  description: string;
  benefits: string[];
}> = {
  detailedAnalytics: {
    icon: BarChart3,
    title: "Analytics détaillés",
    description: "Accédez aux statistiques complètes de vos galeries : vues, téléchargements, géolocalisation et plus.",
    benefits: [
      "Graphiques de vues en temps réel",
      "Répartition géographique des visiteurs",
      "Statistiques de téléchargement",
      "Suivi des interactions",
    ],
  },
  customDomain: {
    icon: Sparkles,
    title: "Domaine personnalisé",
    description: "Utilisez votre propre nom de domaine pour vos galeries.",
    benefits: [
      "URL personnalisée",
      "Branding professionnel",
      "Certificat SSL inclus",
    ],
  },
  whiteLabel: {
    icon: Sparkles,
    title: "White Label",
    description: "Supprimez la marque PikSend de vos galeries.",
    benefits: [
      "Aucun logo PikSend",
      "Votre marque uniquement",
      "Expérience client premium",
    ],
  },
  ctaButton: {
    icon: Sparkles,
    title: "Bouton d'action",
    description: "Ajoutez un bouton d'appel à l'action personnalisé sur vos galeries.",
    benefits: [
      "Lien personnalisé",
      "Texte configurable",
      "Suivi des clics",
    ],
  },
  leadMagnet: {
    icon: Sparkles,
    title: "Capture de leads",
    description: "Collectez les emails de vos visiteurs avant qu'ils accèdent à la galerie.",
    benefits: [
      "Formulaire personnalisable",
      "Export des contacts",
      "Intégration CRM",
    ],
  },
  paywall: {
    icon: Sparkles,
    title: "Galerie payante",
    description: "Monétisez vos galeries en demandant un paiement pour y accéder.",
    benefits: [
      "Prix personnalisable",
      "Paiement sécurisé Stripe",
      "Revenus directs",
    ],
  },
  zipDownload: {
    icon: HardDrive,
    title: "Téléchargement ZIP",
    description: "Permettez à vos clients de télécharger toutes leurs photos en un clic.",
    benefits: [
      "Téléchargement en masse",
      "Qualité originale préservée",
      "Expérience client améliorée",
    ],
  },
  branding: {
    icon: Sparkles,
    title: "Branding personnalisé",
    description: "Personnalisez entièrement l'apparence de vos galeries avec votre marque.",
    benefits: [
      "Logo personnalisé",
      "Couleurs de marque",
      "Suppression du branding PikSend",
    ],
  },
};

// Requirement 8.6, 8.7: Testimonials for social proof
const TESTIMONIALS = {
  premium: {
    quote: "Le téléchargement ZIP a transformé mon workflow. Mes clients adorent pouvoir récupérer toutes leurs photos en un clic.",
    author: "Sophie Martin",
    role: "Photographe Mariage",
    metric: "Satisfaction client +40%",
  },
  pro: {
    quote: "Le plugin Lightroom et le branding personnalisé ont fait passer mon business au niveau supérieur. Je gagne 3h par semaine.",
    author: "Thomas Dubois",
    role: "Photographe Événementiel",
    metric: "3h économisées/semaine",
  },
  default: {
    quote: "PikSend m'a permis de livrer mes galeries en 5 minutes au lieu de 30. Mes clients sont impressionnés par la qualité.",
    author: "Marie Lefebvre",
    role: "Photographe Portrait",
    metric: "Livraison 6x plus rapide",
  },
} as const;

export function UpgradeModal({
  isOpen,
  onClose,
  limitType,
  currentValue,
  limitValue,
  currentPlan = "free",
  featureType,
  trigger = 'limit_reached',
  persona,
  showROI = false,
}: UpgradeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showCalculator, setShowCalculator] = useState(showROI);

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

  // For feature-based upgrades, use feature config
  const isFeatureUpgrade = limitType === "feature" && featureType;
  const featureConfig = featureType ? FEATURE_CONFIG[featureType] : null;
  
  const config = LIMIT_CONFIG[limitType];
  const Icon = isFeatureUpgrade && featureConfig ? featureConfig.icon : config.icon;
  
  // Requirement 8.6: Display upgrade reason clearly based on trigger type
  const getTitle = () => {
    if (isFeatureUpgrade && featureConfig) return featureConfig.title;
    
    switch (trigger) {
      case 'limit_reached':
        return config.title;
      case 'feature_locked':
        return "Fonctionnalité Premium";
      case 'time_based':
        return "Prêt pour Premium ?";
      case 'behavior_based':
        return "Vous adorez PikSend !";
      default:
        return config.title;
    }
  };
  
  const getDescription = () => {
    if (isFeatureUpgrade && featureConfig) return featureConfig.description;
    
    switch (trigger) {
      case 'limit_reached':
        return config.description;
      case 'feature_locked':
        return "Cette fonctionnalité est disponible avec un plan payant.";
      case 'time_based':
        return "Débloquez toutes les fonctionnalités pour faire passer votre activité au niveau supérieur.";
      case 'behavior_based':
        return "Vous utilisez PikSend intensivement. Passez à un plan payant pour débloquer tout le potentiel.";
      default:
        return config.description;
    }
  };

  const title = getTitle();
  const description = getDescription();

  // Requirement 8.6: Show recommended plan vs current plan comparison
  // For feature upgrades, always recommend Pro
  const recommendedPlan = isFeatureUpgrade ? "pro" : (currentPlan === "free" ? "premium" : "pro");
  const recommendedLimits = PLAN_LIMITS[recommendedPlan as keyof typeof PLAN_LIMITS];
  const recommendedPricing = PLAN_PRICING[recommendedPlan as keyof typeof PLAN_PRICING];
  
  // Get appropriate testimonial
  const testimonial = (recommendedPlan in TESTIMONIALS 
    ? TESTIMONIALS[recommendedPlan as keyof typeof TESTIMONIALS]
    : TESTIMONIALS.default);

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

      {/* Modal - Requirement 8.6, 8.7: Enhanced with ROI calculator and testimonial */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/20 transition-colors z-10"
          aria-label="Fermer"
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
              {title}
            </h2>
            <p className="text-white/80 font-medium text-sm">
              {description}
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

        {/* Main content */}
        <div className="p-6 space-y-5">
          {/* Requirement 8.6: Show recommended plan vs current plan comparison */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
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
              
              {/* Requirement 8.6, 8.7: List benefits to be unlocked */}
              <ul className="space-y-2">
                {isFeatureUpgrade && featureConfig ? (
                  // Show feature-specific benefits
                  featureConfig.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))
                ) : (
                  // Show limit-based benefits
                  <>
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
                    {recommendedLimits.can_download_zip && (
                      <li className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-medium">Téléchargement ZIP</span>
                      </li>
                    )}
                    {recommendedLimits.has_custom_branding && (
                      <li className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-medium">Branding personnalisé</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Requirement 8.6: Integrate ROI Calculator component */}
          {showCalculator && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 hover:text-slate-900 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Calculer votre ROI
              </button>
              <ROICalculator 
                persona={persona}
                variant="modal"
              />
            </div>
          )}

          {/* Requirement 8.6, 8.7: Add relevant testimonial */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
            <div className="flex items-start gap-3">
              <Quote className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-700 font-medium mb-3 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold">{testimonial.author}</span>
                    <span className="text-slate-400"> · </span>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
                {testimonial.metric && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                    <TrendingUp className="w-3 h-3" />
                    {testimonial.metric}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requirement 8.7: Add "Essayer 14 jours gratuits" CTA */}
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
              Essayer 14 jours gratuits
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
