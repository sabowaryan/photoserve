'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Crown, Zap, Sparkles, ArrowRight, HelpCircle, X } from 'lucide-react';
import { PricingButton } from '@/components/pricing/pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/lib/i18n/context';
import { PLAN_PRICING, getPlanFeatures } from '@/config/plans';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { plan: currentPlan } = useSubscription();
  const { t } = useTranslation();

  const PLANS = [
    {
      key: 'free' as const,
      name: t('pricing.plans.free.name'),
      description: t('common.testHdDelivery'),
      icon: Sparkles,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      popular: false,
      cta: t('common.getStarted'),
    },
    {
      key: 'premium' as const,
      name: t('pricing.plans.premium.name'),
      description: t('common.forActivePhotographers'),
      icon: Crown,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      popular: true,
      cta: t('pricing.selectPlan'),
    },
    {
      key: 'pro' as const,
      name: t('pricing.plans.pro.name'),
      description: t('common.forDemandingProfessionals'),
      icon: Zap,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      popular: false,
      cta: t('pricing.selectPlan'),
    },
  ];

  const FAQ_ITEMS = [
    {
      question: t('pricing.faq.changePlan.question'),
      answer: t('pricing.faq.changePlan.answer'),
    },
    {
      question: t('pricing.faq.quality.question'),
      answer: t('pricing.faq.quality.answer'),
    },
    {
      question: t('pricing.faq.yearly.question'),
      answer: t('pricing.faq.yearly.answer'),
    },
    {
      question: t('pricing.faq.cancel.question'),
      answer: t('pricing.faq.cancel.answer'),
    },
  ];

  const formatPrice = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (pricing.monthlyPrice === 0) return '$0';
    const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
    return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  };

  const getPeriod = (planKey: 'free' | 'premium' | 'pro') => {
    if (PLAN_PRICING[planKey].monthlyPrice === 0) return t('pricing.perMonth');
    return isYearly ? t('pricing.perYear') : t('pricing.perMonth');
  };

  const getMonthlyEquivalent = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const monthlyEquivalent = pricing.yearlyPrice / 12;
    return `$${monthlyEquivalent.toFixed(2)}${t('pricing.perMonth')}`;
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
            {t('pricing.badge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t('pricing.title')}
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-5">
            {t('pricing.subtitle')}
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
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isYearly 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('pricing.yearly')}
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
            const features = getPlanFeatures(plan.key, true) as Array<{ text: string; included: boolean }>;
            
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
                      {t('pricing.popular')}
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
                    <p className="text-xs text-slate-400">{t('pricing.equivalent')} {monthlyEquivalent}</p>
                  )}
                  {savings && (
                    <p className="text-[10px] text-emerald-600 font-medium">-${savings}/{t('pricing.perYear').replace('/', '')}</p>
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
                          {feature.included ? (
                            <Check size={10} className={plan.iconColor} />
                          ) : (
                            <X size={10} className="text-slate-300" />
                          )}
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
            <h2 className="text-lg font-bold text-slate-900">{t('pricing.faqTitle')}</h2>
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
            {t('pricing.needHelp')}{' '}
            <Link href="/contact" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5">
              {t('common.contactUs')} <ArrowRight size={10} />
            </Link>
          </p>
          <p className="text-slate-400 text-[10px]">
            {t('pricing.priceNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
