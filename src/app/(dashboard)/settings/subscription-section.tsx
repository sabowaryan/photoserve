"use client";

import { useState } from "react";
import { Check, Crown, Zap, Sparkles, Star, Info } from "lucide-react";
import { PLAN_LIMITS, PLAN_PRICING } from "@/config/plans";
import { SettingsPricingButton } from "./settings-pricing-button";

interface Profile {
  storage_used_mb?: number | null;
  storage_limit_mb?: number | null;
  max_galleries?: number | null;
  stripe_subscription_id?: string | null;
}

interface SubscriptionSectionProps {
  currentPlan: string;
  profile?: Profile | null;
}

const PRICING_PLANS = [
  {
    key: "free" as const,
    name: "Gratuit",
    description: "Pour découvrir PikSend",
    icon: Sparkles,
    popular: false,
  },
  {
    key: "premium" as const,
    name: "Premium",
    description: "Pour photographes actifs",
    icon: Crown,
    popular: true,
  },
  {
    key: "pro" as const,
    name: "Pro",
    description: "Pour les professionnels",
    icon: Zap,
    popular: false,
  },
];

export function SubscriptionSection({ currentPlan, profile }: SubscriptionSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (planKey: "free" | "premium" | "pro") => {
    const pricing = PLAN_PRICING[planKey];
    if (pricing.monthlyPrice === 0) return "$0";
    const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
    return `$${price.toFixed(2)}`;
  };

  const getPeriod = (planKey: "free" | "premium" | "pro") => {
    if (PLAN_PRICING[planKey].monthlyPrice === 0) return "/mois";
    return isYearly ? "/an" : "/mois";
  };

  const getMonthlyEquivalent = (planKey: "free" | "premium" | "pro") => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const monthlyEquivalent = pricing.yearlyPrice / 12;
    return `$${monthlyEquivalent.toFixed(2)}/mois`;
  };

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
              <Crown size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Abonnement</h2>
              <p className="text-xs text-slate-500">Choisissez le plan adapté à vos besoins</p>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                !isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annuel
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => {
            const limits = PLAN_LIMITS[plan.key];
            const Icon = plan.icon;
            const isPlanSelected = currentPlan === plan.key;
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);

            return (
              <div
                key={plan.key}
                className={`relative p-5 rounded-2xl border-2 transition-all ${
                  plan.popular
                    ? "border-indigo-500 bg-indigo-50/30"
                    : isPlanSelected
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                      <Star size={10} fill="currentColor" />
                      Populaire
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isPlanSelected && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                      <Check size={10} />
                      Actuel
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4 pt-2">
                  <div className={`inline-flex p-2.5 rounded-xl mb-3 ${
                    plan.popular ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-slate-900">{formatPrice(plan.key)}</span>
                    <span className="text-sm text-slate-400 font-medium">{getPeriod(plan.key)}</span>
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-xs text-indigo-600 font-medium mt-1">{monthlyEquivalent}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <Check size={14} className={plan.popular ? "text-indigo-500" : "text-slate-400"} />
                    {limits.storage_limit_mb >= 1024
                      ? `${limits.storage_limit_mb / 1024} Go stockage`
                      : `${limits.storage_limit_mb} Mo stockage`}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <Check size={14} className={plan.popular ? "text-indigo-500" : "text-slate-400"} />
                    {limits.max_galleries === 500 ? "Galeries illimitées" : `${limits.max_galleries} galeries`}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <Check size={14} className={plan.popular ? "text-indigo-500" : "text-slate-400"} />
                    {limits.max_images_per_gallery} photos/galerie
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <Check size={14} className={plan.popular ? "text-indigo-500" : "text-slate-400"} />
                    Validité {limits.max_expiration_days}j
                  </li>
                </ul>

                {/* CTA Button */}
                <SettingsPricingButton
                  planKey={plan.key}
                  interval={isYearly ? "yearly" : "monthly"}
                  currentPlan={currentPlan}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isPlanSelected ? "Plan actuel" : `Choisir ${plan.name}`}
                </SettingsPricingButton>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>Infrastructure Cloudinary HD • Paiement sécurisé Stripe</span>
          </div>
          <span>
            {profile?.stripe_subscription_id
              ? "Gérez votre abonnement via le portail Stripe"
              : "Sans engagement, annulez à tout moment"}
          </span>
        </div>
      </div>
    </section>
  );
}
