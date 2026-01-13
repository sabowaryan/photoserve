'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Crown, Zap, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { PricingButton } from '@/components/pricing/pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_PRICING, PLAN_LIMITS } from '@/config/plans';

const PLANS = [
  {
    key: 'free' as const,
    name: 'Gratuit',
    description: 'Testez la livraison photos HD',
    icon: Sparkles,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    popular: false,
    cta: 'Commencer',
  },
  {
    key: 'premium' as const,
    name: 'Premium',
    description: 'Pour photographes actifs',
    icon: Crown,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    popular: true,
    cta: 'Choisir',
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour professionnels exigeants',
    icon: Zap,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    popular: false,
    cta: 'Choisir',
  },
];

function getFeatures(planKey: 'free' | 'premium' | 'pro') {
  const limits = PLAN_LIMITS[planKey];
  const storage = limits.storage_limit_mb >= 1024 
    ? `${limits.storage_limit_mb / 1024} Go` 
    : `${limits.storage_limit_mb} Mo`;
  
  return [
    { text: `${storage} stockage`, included: true },
    { text: `${limits.max_galleries} galeries`, included: true },
    { text: `${limits.max_images_per_gallery} photos/galerie`, included: true },
    { text: `Expiration ${limits.max_expiration_days}j`, included: true },
    { text: 'Qualité originale', included: true },
    { text: 'Durée personnalisable', included: planKey !== 'free' },
    { text: 'Support prioritaire', included: planKey === 'pro' },
  ];
}

const FAQ_ITEMS = [
  {
    question: 'Puis-je changer de plan ?',
    answer: 'Oui, changez à tout moment. La facturation est ajustée au prorata.',
  },
  {
    question: 'Qualité préservée sur tous les plans ?',
    answer: 'Oui, 100% de la qualité originale. Zéro compression.',
  },
  {
    question: 'Comment fonctionne l\'annuel ?',
    answer: 'Payez 12 mois d\'avance et économisez 20%.',
  },
  {
    question: 'Si j\'annule ?',
    answer: 'Accès actif jusqu\'à la fin de la période payée, puis plan Gratuit.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { plan: currentPlan } = useSubscription();

  const formatPrice = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (pricing.monthlyPrice === 0) return '$0';
    const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
    return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  };

  const getPeriod = (planKey: 'free' | 'premium' | 'pro') => {
    if (PLAN_PRICING[planKey].monthlyPrice === 0) return '/mois';
    return isYearly ? '/an' : '/mois';
  };

  const getMonthlyEquivalent = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const monthlyEquivalent = pricing.yearlyPrice / 12;
    return `$${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    return ((pricing.monthlyPrice * 12) - pricing.yearlyPrice).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">
            <Sparkles size={12} />
            Tarifs transparents
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Choisissez votre plan
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-5">
            Photos HD sans compression. Commencez gratuitement.
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);
            const savings = getSavings(plan.key);
            const features = getFeatures(plan.key);
            
            return (
              <div 
                key={plan.key}
                className={`relative bg-white/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  plan.popular 
                    ? 'border-indigo-300 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20' 
                    : 'border-slate-200/50 shadow'
                }`}
              >
                {/* Popular Badge */}
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
                    <span className="text-2xl font-bold text-slate-900">{formatPrice(plan.key)}</span>
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
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          feature.included ? plan.iconBg : 'bg-slate-100'
                        }`}>
                          <Check size={10} className={feature.included ? plan.iconColor : 'text-slate-300'} />
                        </div>
                        <span className={`text-xs ${feature.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
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
                    className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow shadow-indigo-500/20' 
                        : 'border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {plan.cta}
                  </PricingButton>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <div className="w-8 h-8 mx-auto bg-indigo-100 rounded-xl flex items-center justify-center mb-2">
              <HelpCircle size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">FAQ</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {FAQ_ITEMS.map((item, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-lg p-3 hover:border-indigo-200 transition-all"
              >
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{item.question}</h3>
                <p className="text-xs text-slate-500">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-slate-500 text-xs">
            Besoin d&apos;aide ?{' '}
            <Link href="/contact" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5">
              Contactez-nous <ArrowRight size={10} />
            </Link>
          </p>
          <p className="text-slate-400 text-[10px]">
            Prix en USD. Annulation possible à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
