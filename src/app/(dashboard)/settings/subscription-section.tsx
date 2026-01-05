'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Crown, Zap, Check } from 'lucide-react';
import { SubscriptionManager } from './subscription-manager';

interface Profile {
  storage_used_mb?: number | null;
  storage_limit_mb?: number | null;
  max_galleries?: number | null;
  stripe_subscription_id?: string | null;
}

interface SubscriptionSectionProps {
  currentPlan: string;
  profile: Profile | null;
}

const STRIPE_PLANS = {
  premium: {
    name: 'Premium',
    monthlyPrice: 9.99,
    yearlyPrice: 95.90,
    features: [
      '5 Go de stockage',
      '50 galeries',
      '500 images par galerie',
      'Taille illimitée par image',
      'Durée jusqu\'à 90 jours',
    ],
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 25.99,
    yearlyPrice: 249.50,
    features: [
      '50 Go de stockage',
      '500 galeries',
      '5000 images par galerie',
      'Taille illimitée par image',
      'Durée jusqu\'à 180 jours',
      'Support prioritaire',
    ],
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

export function SubscriptionSection({ currentPlan, profile }: SubscriptionSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (plan: typeof STRIPE_PLANS.premium) => {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    return price.toFixed(2);
  };

  const getPeriod = () => {
    return isYearly ? '/an' : '/mois';
  };

  const getMonthlyEquivalent = (plan: typeof STRIPE_PLANS.premium) => {
    if (!isYearly) return null;
    const monthlyEquivalent = plan.yearlyPrice / 12;
    return `soit $${monthlyEquivalent.toFixed(2)}/mois`;
  };

  const getSavings = (plan: typeof STRIPE_PLANS.premium) => {
    if (!isYearly) return null;
    const savings = (plan.monthlyPrice * 12) - plan.yearlyPrice;
    return `Économisez $${savings.toFixed(2)}/an`;
  };

  return (
    <Card className="bg-card/50 border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Gérez votre plan et facturation
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Display */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan actuel</p>
              <p className="text-2xl font-display font-bold capitalize">
                {currentPlan === 'free' ? 'Gratuit' : currentPlan}
              </p>
            </div>
            <Badge
              variant={currentPlan !== 'free' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {currentPlan === 'free' ? 'Gratuit' : 'Actif'}
            </Badge>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Stockage</p>
              <p className="text-lg font-semibold">
                {profile?.storage_used_mb?.toFixed(1) || '0'}
                <span className="text-sm text-muted-foreground font-normal">
                  {' '}
                  / {profile?.storage_limit_mb || 20} Mo
                </span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Galeries max</p>
              <p className="text-lg font-semibold">
                {profile?.max_galleries || 3}
              </p>
            </div>
          </div>

          {profile?.stripe_subscription_id && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <SubscriptionManager hasSubscription={true} />
            </div>
          )}
        </div>

        {/* Available Plans */}
        {currentPlan === 'free' && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">
                  Passer à un plan supérieur
                </h3>
                
                {/* Billing Toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Mensuel
                  </span>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={`text-xs font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Annuel
                  </span>
                  {isYearly && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                      -20%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
                  const Icon = plan.icon;
                  const isCurrentPlan = currentPlan === key;
                  const monthlyEquivalent = getMonthlyEquivalent(plan);
                  const savings = getSavings(plan);

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border ${
                        isCurrentPlan
                          ? 'border-primary bg-primary/5'
                          : 'border-border/40 bg-card/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                          <Icon className={`h-5 w-5 ${plan.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-semibold">
                            {plan.name}
                          </h4>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-foreground">
                              ${formatPrice(plan)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getPeriod()}
                            </span>
                          </div>
                          {monthlyEquivalent && (
                            <p className="text-xs text-muted-foreground">
                              {monthlyEquivalent}
                            </p>
                          )}
                          {savings && (
                            <p className="text-xs text-green-500">
                              {savings}
                            </p>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className={`h-4 w-4 ${plan.color}`} />
                            <span className="text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <SubscriptionManager
                        hasSubscription={false}
                        planKey={key as 'premium' | 'pro'}
                        interval={isYearly ? 'yearly' : 'monthly'}
                        isCurrentPlan={isCurrentPlan}
                        variant={key === 'pro' ? 'default' : 'outline'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Upgrade option for premium users */}
        {currentPlan === 'premium' && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">
                  Passer à Pro
                </h3>
                
                {/* Billing Toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Mensuel
                  </span>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={`text-xs font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Annuel
                  </span>
                  {isYearly && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                      -20%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-semibold">
                      {STRIPE_PLANS.pro.name}
                    </h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-foreground">
                        ${formatPrice(STRIPE_PLANS.pro)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPeriod()}
                      </span>
                    </div>
                    {getMonthlyEquivalent(STRIPE_PLANS.pro) && (
                      <p className="text-xs text-muted-foreground">
                        {getMonthlyEquivalent(STRIPE_PLANS.pro)}
                      </p>
                    )}
                    {getSavings(STRIPE_PLANS.pro) && (
                      <p className="text-xs text-green-500">
                        {getSavings(STRIPE_PLANS.pro)}
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {STRIPE_PLANS.pro.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <SubscriptionManager
                  hasSubscription={false}
                  planKey="pro"
                  interval={isYearly ? 'yearly' : 'monthly'}
                  isCurrentPlan={false}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
