'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Zap, Lock, Sparkles } from 'lucide-react';
import { PricingButton } from './pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_PRICING } from '@/config/plans';
import type { LandingContent } from '@/lib/content/landing';

interface PricingSectionProps {
  content: LandingContent;
}

// Plans metadata (prices come from PLAN_PRICING)
const PRICING_PLANS = [
  {
    key: 'free' as const,
    name: 'Gratuit',
    description: 'Testez la livraison photos HD',
    icon: Sparkles,
    popular: false,
  },
  {
    key: 'premium' as const,
    name: 'Premium',
    description: 'Pour photographes professionnels actifs',
    icon: Crown,
    popular: true,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour photographes professionnels exigeants',
    icon: Zap,
    popular: false,
  },
];

export function PricingSection({ content }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { plan: currentPlan } = useSubscription();

  const formatPrice = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (pricing.monthlyPrice === 0) return '$0';
    const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
    return `${price.toFixed(2)}`;
  };

  const getPeriod = (planKey: 'free' | 'premium' | 'pro') => {
    if (PLAN_PRICING[planKey].monthlyPrice === 0) return '/mois';
    return isYearly ? '/an' : '/mois';
  };

  const getMonthlyEquivalent = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const monthlyEquivalent = pricing.yearlyPrice / 12;
    return `soit ${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    const savings = (pricing.monthlyPrice * 12) - pricing.yearlyPrice;
    return `Économisez ${savings.toFixed(2)}/an`;
  };

  return (
    <section id="tarifs" className="py-16 sm:py-24 px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-4">{content.pricing.badge}</Badge>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {content.pricing.title}<br />{content.pricing.titleLine2}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            {content.pricing.subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensuel
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annuel
            </span>
            {isYearly && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                -20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const Icon = plan.icon;
            const contentPlan = content.plans.find(p => 
              p.name.toLowerCase() === plan.name.toLowerCase() || 
              (plan.key === 'free' && p.name === 'Free')
            );
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);
            const savings = getSavings(plan.key);
            
            return (
              <Card 
                key={plan.key} 
                className={`glass-card relative flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular ? 'border-primary glow-effect' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">
                      Le plus choisi
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto p-3 rounded-xl ${plan.popular ? 'bg-amber-500/10' : 'bg-muted/50'} mb-4`}>
                    <Icon className={`h-6 w-6 ${plan.popular ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="font-display text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.key)}</span>
                    <span className="text-muted-foreground text-sm">{getPeriod(plan.key)}</span>
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-sm text-muted-foreground mt-1">{monthlyEquivalent}</p>
                  )}
                  {savings && (
                    <p className="text-xs text-green-500 mt-1">{savings}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {contentPlan?.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <PricingButton
                    planKey={plan.key}
                    interval={isYearly ? 'yearly' : 'monthly'}
                    currentPlan={currentPlan}
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                  >
                    {contentPlan?.cta || 'Choisir ce plan'}
                  </PricingButton>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            <Lock className="h-4 w-4 inline mr-1" />
            {content.pricing.guarantee}
          </p>
        </div>
      </div>
    </section>
  );
}
