'use client';

import { useState } from 'react';
import { Check, Crown, Zap, Lock, Sparkles, X } from 'lucide-react';
import { PricingButton } from './pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_PRICING, getPlanFeatures } from '@/config/plans';
import type { LandingContent } from '@/lib/content/landing';

interface PricingSectionProps {
  content: LandingContent;
}

const PRICING_PLANS = [
  {
    key: 'free' as const,
    name: 'Gratuit',
    description: 'Testez la livraison photos HD',
    icon: Sparkles,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    popular: false,
  },
  {
    key: 'premium' as const,
    name: 'Premium',
    description: 'Pour photographes actifs',
    icon: Crown,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    popular: true,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour professionnels exigeants',
    icon: Zap,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    popular: false,
  },
];

export function PricingSection({ content }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { plan: currentPlan } = useSubscription();

  const formatPrice = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (pricing.monthlyPrice === 0) return '0';
    const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
    return `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  };

  const getPeriod = (planKey: 'free' | 'premium' | 'pro') => {
    if (PLAN_PRICING[planKey].monthlyPrice === 0) return '/mois';
    return isYearly ? '/an' : '/mois';
  };

  const getMonthlyEquivalent = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const monthlyEquivalent = pricing.yearlyPrice / 12;
    return `${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    return ((pricing.monthlyPrice * 12) - pricing.yearlyPrice).toFixed(2);
  };

  return (
    <section id="tarifs" className="py-12 md:py-16 px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-3">
            <Sparkles size={12} />
            {content.pricing.badge}
          </div>
          <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight text-slate-900">
            {content.pricing.title}
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-5">
            {content.pricing.subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isYearly 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isYearly 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Annuel
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                isYearly ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'
              }`}>
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => {
            const Icon = plan.icon;
            const planFeatures = getPlanFeatures(plan.key, true) as Array<{ text: string; included: boolean }>;
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);
            const savings = getSavings(plan.key);
            
            return (
              <div 
                key={plan.key}
                className={`relative bg-white/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  plan.popular 
                    ? 'border-indigo-300 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20' 
                    : 'border-slate-200/50 shadow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <div className="px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold rounded-b-lg">
                      Populaire
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto ${plan.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                    <Icon size={20} className={plan.iconColor} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-slate-900">${formatPrice(plan.key)}</span>
                    <span className="text-slate-500 text-sm">{getPeriod(plan.key)}</span>
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-xs text-slate-400">soit {monthlyEquivalent}</p>
                  )}
                  {savings && (
                    <p className="text-[10px] text-emerald-600 font-medium">-${savings}/an</p>
                  )}
                </div>

                {/* Features */}
                <div className="px-4 pb-4">
                  <ul className="space-y-1.5 mb-4">
                    {planFeatures.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          feature.included ? plan.iconBg : 'bg-slate-100'
                        }`}>
                          {feature.included ? (
                            <Check size={10} className={plan.iconColor} />
                          ) : (
                            <X size={10} className="text-slate-300" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          feature.included ? 'text-slate-700' : 'text-slate-400 line-through'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <PricingButton
                    planKey={plan.key}
                    interval={isYearly ? 'yearly' : 'monthly'}
                    currentPlan={currentPlan}
                    variant={plan.popular ? 'default' : 'outline'}
                    className={
                      plan.popular 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25' 
                        : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'
                    }
                  >
                    {plan.key === 'free' ? 'Commencer gratuitement' : plan.key === 'premium' ? 'Passer à Premium' : 'Passer à Pro'}
                  </PricingButton>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-500">
            <Lock className="h-3 w-3 inline mr-1" />
            {content.pricing.guarantee}
          </p>
        </div>
      </div>
    </section>
  );
}
