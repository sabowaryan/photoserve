'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Zap, Sparkles } from 'lucide-react';
import { PricingButton } from '@/components/pricing/pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_PRICING, PLAN_LIMITS } from '@/config/plans';

const PLANS = [
  {
    key: 'free' as const,
    name: 'Gratuit',
    description: 'Testez la livraison photos HD',
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    popular: false,
    cta: 'Commencer gratuitement',
  },
  {
    key: 'premium' as const,
    name: 'Premium',
    description: 'Pour photographes professionnels actifs',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    popular: true,
    cta: 'Choisir Premium',
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour photographes professionnels exigeants',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    popular: false,
    cta: 'Choisir Pro',
  },
];

// Generate features from PLAN_LIMITS
function getFeatures(planKey: 'free' | 'premium' | 'pro') {
  const limits = PLAN_LIMITS[planKey];
  const storage = limits.storage_limit_mb >= 1024 
    ? `${limits.storage_limit_mb / 1024} Go` 
    : `${limits.storage_limit_mb} Mo`;
  
  return [
    { text: `${storage} de stockage`, included: true },
    { text: `${limits.max_galleries} galeries sécurisées`, included: true },
    { text: `${limits.max_images_per_gallery} photos par galerie`, included: true },
    { text: `Galerie temporaire ${limits.max_expiration_days} jours`, included: true },
    { text: 'Qualité originale préservée', included: true },
    { text: 'Durée personnalisable', included: planKey !== 'free' },
    { text: 'Support prioritaire', included: planKey === 'pro' },
  ];
}

export default function PricingPage() {
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
    return `${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (planKey: 'free' | 'premium' | 'pro') => {
    const pricing = PLAN_PRICING[planKey];
    if (!isYearly || pricing.monthlyPrice === 0) return null;
    return ((pricing.monthlyPrice * 12) - pricing.yearlyPrice).toFixed(2);
  };

  return (
    <>
      {/* Header */}
      <section className="pt-16 pb-8 px-4">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Tarifs pour photographes professionnels
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Livraison photos HD sans compression. Commencez gratuitement, évoluez selon vos besoins de partage photos clients.
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
      </section>

      {/* Pricing Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const monthlyEquivalent = getMonthlyEquivalent(plan.key);
              const savings = getSavings(plan.key);
              const features = getFeatures(plan.key);
              
              return (
                <Card 
                  key={plan.key}
                  className={`relative flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'bg-card/50 border-border/40'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3">Populaire</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-xl ${plan.bgColor} mb-4`}>
                      <Icon className={`h-8 w-8 ${plan.color}`} />
                    </div>
                    <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{formatPrice(plan.key)}</span>
                      <span className="text-muted-foreground">{getPeriod(plan.key)}</span>
                    </div>
                    {monthlyEquivalent && (
                      <p className="text-sm text-muted-foreground mt-1">soit {monthlyEquivalent}</p>
                    )}
                    {savings && (
                      <p className="text-xs text-green-500 mt-1">Économisez ${savings}/an</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 shrink-0 mt-0.5 ${feature.included ? plan.color : 'text-muted-foreground/30'}`} />
                          <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
                            {feature.text}
                          </span>
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
                      {plan.cta}
                    </PricingButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Questions fréquentes sur les tarifs</h2>
          
          <div className="space-y-6">
            <div className="bg-card/50 border border-border/40 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-muted-foreground text-sm">
                Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                Le changement prend effet immédiatement et la facturation est ajustée au prorata.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/40 rounded-lg p-6">
              <h3 className="font-semibold mb-2">La qualité originale est-elle préservée sur tous les plans ?</h3>
              <p className="text-muted-foreground text-sm">
                Oui, tous les plans préservent 100% de la qualité originale de vos photos haute résolution. 
                Zéro compression, contrairement à WhatsApp. La différence entre les plans concerne le stockage et le nombre de galeries.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/40 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Comment fonctionne la facturation annuelle ?</h3>
              <p className="text-muted-foreground text-sm">
                Avec la facturation annuelle, vous payez pour 12 mois d&apos;avance et bénéficiez 
                d&apos;une réduction de 20% par rapport au tarif mensuel.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/40 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Que se passe-t-il si j&apos;annule mon abonnement ?</h3>
              <p className="text-muted-foreground text-sm">
                Votre accès Premium ou Pro reste actif jusqu&apos;à la fin de la période payée. 
                Ensuite, votre compte repasse automatiquement au plan Gratuit avec vos galeries sécurisées existantes.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/40 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Quels moyens de paiement acceptez-vous ?</h3>
              <p className="text-muted-foreground text-sm">
                Nous acceptons les cartes de crédit et de débit (Visa, Mastercard, American Express) 
                via notre partenaire de paiement sécurisé Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Besoin d&apos;aide pour choisir ? <Link href="/contact" className="text-primary hover:underline">Contactez-nous</Link>
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Tous les prix sont en dollars américains (USD). Vous pouvez annuler à tout moment.
          </p>
        </div>
      </section>
    </>
  );
}
