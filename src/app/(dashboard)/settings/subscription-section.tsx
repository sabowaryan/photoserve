"use client";

import { useState } from "react";
import { Check, Crown, Zap, Lock, Sparkles, Star, Info } from "lucide-react";
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
    description: "Testez la livraison photos HD",
    icon: Sparkles,
    popular: false,
    cta: "Plan actuel",
    badge: "Basique",
  },
  {
    key: "premium" as const,
    name: "Premium",
    description: "Pour photographes actifs",
    icon: Crown,
    popular: true,
    cta: "Passer au Premium",
    badge: "Plus choisi",
  },
  {
    key: "pro" as const,
    name: "Pro",
    description: "Le choix des experts",
    icon: Zap,
    popular: false,
    cta: "Devenir Pro",
    badge: "Ultra",
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
    return `soit $${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (planKey: "free" | "premium" | "pro") => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const savings = pricing.monthlyPrice * 12 - pricing.yearlyPrice;
    return `Économisez $${savings.toFixed(2)}/an`;
  };

  return (
    <section
      id="tarifs"
      className="py-20 px-4 relative overflow-hidden bg-white rounded-[3rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-700"
    >
      {/* Mesh Gradients Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-50 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200">
            <Lock size={12} className="text-indigo-600" /> Tarification Flexible
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Le plan idéal pour <span className="text-indigo-600">vos photos</span>
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            Boostez votre workflow et livrez vos projets clients avec une plateforme sécurisée et
            professionnelle.
          </p>

          {/* Billing Toggle UI */}
          <div className="flex items-center justify-center gap-6 pt-6">
            <span className={`text-sm font-bold transition-all ${!isYearly ? "text-slate-900 scale-105" : "text-slate-400"}`}>
              Paiement mensuel
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-9 bg-slate-100 rounded-full p-1.5 transition-all hover:bg-slate-200 shadow-inner group"
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${
                  isYearly ? "translate-x-7" : "translate-x-0"
                }`}
              >
                {isYearly && (
                  <Check size={12} className="text-indigo-600 absolute inset-0 m-auto" strokeWidth={4} />
                )}
              </div>
            </button>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold transition-all ${isYearly ? "text-slate-900 scale-105" : "text-slate-400"}`}>
                Paiement annuel
              </span>
              {isYearly && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-wider animate-in zoom-in">
                  -20%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan) => {
            const limits = PLAN_LIMITS[plan.key];
            const Icon = plan.icon;
            const isPlanSelected = currentPlan === plan.key;
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);
            const savings = getSavings(plan.key);

            return (
              <div
                key={plan.key}
                className={`group relative flex flex-col p-10 rounded-[2.8rem] transition-all duration-500 border-2 bg-white/70 backdrop-blur-xl ${
                  plan.popular
                    ? "border-indigo-600 shadow-2xl shadow-indigo-100 lg:scale-105 z-10"
                    : "border-slate-100 hover:border-slate-300 hover:shadow-xl hover:-translate-y-2"
                } ${isPlanSelected ? "ring-8 ring-indigo-50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ring-4 ring-white animate-bounce-slow">
                      <Star size={12} fill="currentColor" /> {plan.badge}
                    </div>
                  </div>
                )}

                <div className="text-center mb-10">
                  <div
                    className={`mx-auto w-16 h-16 flex items-center justify-center rounded-2xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      plan.popular
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                        : "bg-slate-50 text-slate-400 border border-slate-100"
                    }`}
                  >
                    <Icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm font-bold mb-8 px-4 leading-snug">
                    {plan.description}
                  </p>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">
                        {formatPrice(plan.key)}
                      </span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">
                        {getPeriod(plan.key)}
                      </span>
                    </div>
                    {monthlyEquivalent && (
                      <div className="mt-3 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider animate-in fade-in">
                        {monthlyEquivalent}
                      </div>
                    )}
                    {savings && (
                      <span className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                        <Check size={14} strokeWidth={3} /> {savings}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features Sync with PLAN_LIMITS */}
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-start gap-4 group/item">
                    <div
                      className={`mt-0.5 p-1 rounded-full transition-colors ${
                        plan.popular ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">
                      {limits.storage_limit_mb >= 1024
                        ? `${limits.storage_limit_mb / 1024} Go`
                        : `${limits.storage_limit_mb} Mo`}{" "}
                      stockage
                    </span>
                  </li>
                  <li className="flex items-start gap-4 group/item">
                    <div
                      className={`mt-0.5 p-1 rounded-full transition-colors ${
                        plan.popular ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">
                      {limits.max_galleries === 500
                        ? "Galeries illimitées"
                        : `${limits.max_galleries} galeries actives`}
                    </span>
                  </li>
                  <li className="flex items-start gap-4 group/item">
                    <div
                      className={`mt-0.5 p-1 rounded-full transition-colors ${
                        plan.popular ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">
                      {limits.max_images_per_gallery} photos / galerie
                    </span>
                  </li>
                  <li className="flex items-start gap-4 group/item">
                    <div
                      className={`mt-0.5 p-1 rounded-full transition-colors ${
                        plan.popular ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">
                      Validité : {limits.max_expiration_days} jours
                    </span>
                  </li>
                  {plan.key !== "free" && (
                    <li className="flex items-start gap-4 group/item">
                      <div
                        className={`mt-0.5 p-1 rounded-full transition-colors ${
                          plan.popular ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                        }`}
                      >
                        <Check size={14} strokeWidth={4} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">Protection mot de passe</span>
                    </li>
                  )}
                </ul>

                <SettingsPricingButton
                  planKey={plan.key}
                  interval={isYearly ? "yearly" : "monthly"}
                  currentPlan={currentPlan}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isPlanSelected ? "Plan actuel" : plan.cta}
                </SettingsPricingButton>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Info size={16} className="text-indigo-600" /> Infrastructure Cloudinary HD
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {profile?.stripe_subscription_id
              ? "Abonnement géré via le portail Stripe"
              : "Aucun engagement, annulez à tout moment"}
          </p>
        </div>
      </div>
    </section>
  );
}
