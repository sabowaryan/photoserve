'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Lock } from 'lucide-react';
import { PricingButton } from './pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import type { LandingContent } from '@/lib/content/landing';

interface PricingSectionProps {
  content: LandingContent;
}

export function PricingSection({ content }: PricingSectionProps) {
  const { plan: currentPlan } = useSubscription();

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
          <p className="text-muted-foreground max-w-xl mx-auto">
            {content.pricing.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {content.plans.map((plan, index) => {
            const Icon = plan.popular ? Crown : Zap;
            const planKey = plan.name === 'Gratuit' ? 'free' : plan.name === 'Premium' ? 'premium' : 'pro';
            
            return (
              <Card 
                key={index} 
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
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <PricingButton
                    planKey={planKey}
                    interval="monthly"
                    currentPlan={currentPlan}
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                  >
                    {plan.cta}
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
