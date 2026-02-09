'use client';

import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Lock, Sparkles, X, Star, Shield } from 'lucide-react';
import { PricingButton } from './pricing-button';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_PRICING, getPlanFeatures } from '@/config/plans';
import type { LandingContent } from '@/lib/content/landing';
import { ROICalculator } from '@/components/conversion/roi-calculator';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { getPersonaLandingContent } from '@/lib/persona/content';
import type { Persona } from '@/types/persona';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PricingSectionProps {
  content: LandingContent;
  persona?: Persona;
}

const PRICING_PLANS = [
  {
    key: 'free' as const,
    name: 'Gratuit',
    description: 'Testez la livraison photos HD',
    icon: Sparkles,
    iconBg: 'bg-primary/5',
    iconColor: 'text-primary',
    popular: false,
    testimonial: null,
  },
  {
    key: 'premium' as const,
    name: 'Premium',
    description: 'Pour photographes actifs',
    icon: Crown,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    popular: true,
    testimonial: {
      author: 'Julie Renard',
      role: 'Photographe Portrait',
      quote: 'Le plan Premium est parfait pour mon activité. Je gère 15 séances par mois sans limite.',
      photo: '/testimonials/julie-renard.jpg',
    },
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour professionnels exigeants',
    icon: Zap,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    popular: false,
    testimonial: {
      author: 'Sophie Martin',
      role: 'Photographe de Mariage',
      quote: 'Le branding personnalisé et le domaine custom font toute la différence pour mes clients haut de gamme.',
      photo: '/testimonials/sophie-martin.jpg',
    },
  },
];

// Requirement 11.7: Expanded FAQ with 10+ questions
const PRICING_FAQ = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et nous ajustons la facturation au prorata.',
  },
  {
    question: 'Y a-t-il des frais cachés ?',
    answer: 'Non, aucun frais caché. Le prix affiché est le prix que vous payez. La seule commission est de 10% sur les ventes de photos, la plus basse du marché.',
  },
  {
    question: 'Que se passe-t-il si j\'annule mon abonnement ?',
    answer: 'Vous pouvez annuler à tout moment. Vos galeries restent accessibles jusqu\'à la fin de votre période de facturation. Vous pouvez exporter toutes vos données avant l\'annulation.',
  },
  {
    question: 'Proposez-vous une garantie satisfait ou remboursé ?',
    answer: 'Oui ! Garantie 14 jours satisfait ou remboursé sur tous les plans payants. Si vous n\'êtes pas satisfait, nous vous remboursons intégralement, sans question.',
  },
  {
    question: 'Combien de photos puis-je mettre dans une galerie ?',
    answer: 'Illimité sur tous les plans payants ! Mettez 500, 1000 ou même 2000 photos sans frais supplémentaires. Le plan gratuit est limité à 50 photos par galerie.',
  },
  {
    question: 'Y a-t-il une limite de stockage ?',
    answer: 'Non, stockage illimité sur les plans Premium et Pro. Gardez vos galeries en ligne aussi longtemps que nécessaire sans frais supplémentaires.',
  },
  {
    question: 'Le plugin Lightroom est-il inclus ?',
    answer: 'Oui, le plugin Lightroom est inclus gratuitement sur tous les plans. Compatible Lightroom Classic sur Mac et Windows. Installation en 2 minutes.',
  },
  {
    question: 'Puis-je personnaliser les galeries avec mon branding ?',
    answer: 'Oui ! Le plan Pro inclut le branding complet : logo personnalisé, couleurs, domaine custom. Le plan Premium permet d\'ajouter votre logo.',
  },
  {
    question: 'Quelle est la commission sur les ventes ?',
    answer: 'Seulement 10%, la plus basse du marché. Vous gardez 90% de vos revenus, contre 85% chez Pixieset, Pic-Time et ShootProof qui prennent 15%.',
  },
  {
    question: 'Puis-je vendre des tirages et produits dérivés ?',
    answer: 'Oui ! Activez la monétisation et vendez tirages, albums, toiles et plus. Intégration avec les meilleurs labos photo. Vous gardez 90% des revenus.',
  },
  {
    question: 'Le support est-il vraiment en 2h ?',
    answer: 'Oui, nous répondons en moins de 2h en moyenne, 7j/7. Support par email et chat en direct. Les plans Pro bénéficient d\'un support prioritaire.',
  },
  {
    question: 'Puis-je essayer avant de payer ?',
    answer: 'Oui ! Le plan gratuit vous permet de tester toutes les fonctionnalités de base. Les plans payants offrent 14 jours d\'essai gratuit, sans carte bancaire requise.',
  },
  {
    question: 'Les galeries sont-elles sécurisées ?',
    answer: 'Oui, toutes les galeries sont protégées par HTTPS. Vous pouvez ajouter un mot de passe unique à chaque galerie pour plus de sécurité.',
  },
  {
    question: 'Puis-je gérer plusieurs photographes sur un compte ?',
    answer: 'Le plan Pro permet d\'ajouter des sous-comptes pour votre équipe. Pour les studios avec besoins avancés, contactez-nous pour un plan sur mesure.',
  },
];

export function PricingSection({ content, persona }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { plan: currentPlan } = useSubscription();
  const [storedPersona, setStoredPersona] = useState<Persona | undefined>(persona);
  const [showFounderBadge, setShowFounderBadge] = useState(true); // Initialize to true to match server render
  const [isClient, setIsClient] = useState(false);

  // Requirement 11.2: Get persona from storage if not provided
  useEffect(() => {
    setIsClient(true);
    if (!persona && typeof window !== 'undefined') {
      const stored = localStorage.getItem('piksend_persona');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setStoredPersona(data.persona);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [persona]);

  // Requirement 11.2: Determine recommended plan based on persona
  const getRecommendedPlan = (): 'free' | 'premium' | 'pro' => {
    if (!storedPersona) return 'premium';
    
    const personaContent = getPersonaLandingContent(storedPersona);
    if (personaContent.recommendedPlan === 'custom') return 'pro';
    return personaContent.recommendedPlan as 'free' | 'premium' | 'pro';
  };

  const recommendedPlan = getRecommendedPlan();

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
    <section id="tarifs" className="py-24 md:py-36 px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-[-5%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
            <Sparkles size={14} strokeWidth={3} />
            {content.pricing.badge}
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-foreground leading-[1.1]">
            {content.pricing.title}
          </h2>
          <p className="text-muted-foreground font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {content.pricing.subtitle}
          </p>
        </div>

        {/* Requirement 11.1: ROI Calculator above plans */}
        <div className="mb-16 max-w-2xl mx-auto">
          <ROICalculator persona={storedPersona} variant="inline" />
        </div>

        <div className="text-center mb-12">
          {/* Billing Toggle (Premium Design) */}
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-muted/50 backdrop-blur-xl border border-border rounded-[1.25rem] shadow-sm transform transition-all hover:scale-105 active:scale-100">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isYearly
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${isYearly
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Annuel
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isYearly ? 'bg-white/20 text-white' : 'bg-success/10 text-success'
                }`}>
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const Icon = plan.icon;
            const planFeatures = getPlanFeatures(plan.key, true) as Array<{ text: string; included: boolean }>;
            const monthlyEquivalent = getMonthlyEquivalent(plan.key);
            const savings = getSavings(plan.key);
            const isRecommended = plan.key === recommendedPlan;

            return (
              <div key={plan.key} className="flex flex-col">
                <div
                  className={`relative bg-white/80 backdrop-blur-2xl border rounded-[2.5rem] p-8 md:p-10 flex flex-col transition-all duration-500 group flex-grow ${plan.popular
                      ? 'border-primary ring-2 ring-primary/10 shadow-[0_32px_64px_rgba(0,0,0,0.12)] -translate-y-4 scale-105'
                      : 'border-border shadow-2xl shadow-slate-200/50 hover:-translate-y-2'
                    }`}
                >
                  {/* Requirement 11.2: Recommended badge based on persona */}
                  {isRecommended && storedPersona && (
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Recommandé pour vous
                      </div>
                    </div>
                  )}

                  {plan.popular && !isRecommended && (
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Populaire
                      </div>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="mb-8">
                    <div className={`w-14 h-14 ${plan.iconBg} rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm`}>
                      <Icon size={28} className={plan.iconColor} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-display font-black text-foreground mb-2 tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2">{plan.description}</p>
                  </div>

                  {/* Price (Premium Typography) */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-display font-black text-foreground tracking-tighter">${formatPrice(plan.key)}</span>
                      <span className="text-muted-foreground font-extrabold text-sm uppercase tracking-widest">{getPeriod(plan.key)}</span>
                    </div>
                    <div className="min-h-[2.5rem] mt-2">
                      {monthlyEquivalent && (
                        <p className="text-xs text-muted-foreground font-medium">soit <span className="text-foreground font-bold">{monthlyEquivalent}</span></p>
                      )}
                      {savings && (
                        <p className="text-xs text-success font-black uppercase tracking-tight">🎉 Économisez ${savings} par an</p>
                      )}
                      {/* Requirement 11.8: Prix fondateur badge */}
                      {showFounderBadge && plan.key !== 'free' && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wide rounded-full">
                          <Sparkles size={10} />
                          Prix fondateur
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requirement 11.3: Features reframed as emotional benefits */}
                  <div className="flex-grow mb-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Ce qui est inclus :</p>
                    <ul className="space-y-4">
                      {planFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.included ? 'bg-success/10 text-success' : 'bg-muted/50 text-muted-foreground/30'
                            }`}>
                            {feature.included ? (
                              <Check size={12} strokeWidth={3} />
                            ) : (
                              <X size={12} strokeWidth={3} />
                            )}
                          </div>
                          <span className={`text-sm font-medium ${feature.included ? 'text-foreground' : 'text-muted-foreground/50 line-through decoration-muted-foreground/30'
                            }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button (Consolidated) */}
                  <PricingButton
                    planKey={plan.key}
                    interval={isYearly ? 'yearly' : 'monthly'}
                    currentPlan={currentPlan}
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full py-7 text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${plan.popular
                        ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/95'
                        : 'bg-white text-foreground border-2 border-border hover:border-primary hover:text-primary'
                      }`}
                  >
                    {plan.key === 'free' ? 'Commencer gratuitement' : plan.key === 'premium' ? 'Passer au Premium' : 'Choisir le Pro'}
                  </PricingButton>
                </div>

                {/* Requirement 11.4: Testimonial under each paid plan */}
                {plan.testimonial && (
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 border border-blue-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {plan.testimonial.author.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-gray-900">{plan.testimonial.author}</p>
                        <p className="text-xs text-gray-600">{plan.testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-sm italic text-gray-700 leading-relaxed">
                      "{plan.testimonial.quote}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Requirement 11.5: 14 jours satisfait ou remboursé guarantee */}
        <div className="text-center mt-12 bg-gradient-to-r from-green-50 to-emerald-50 py-6 px-8 rounded-2xl inline-block left-1/2 -translate-x-1/2 relative border border-green-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-green-600" />
            <p className="text-base font-black text-green-900 uppercase tracking-wide">
              Garantie 14 jours satisfait ou remboursé
            </p>
          </div>
          <p className="text-xs text-green-700 font-medium">
            Essayez sans risque. Si vous n'êtes pas satisfait, nous vous remboursons intégralement.
          </p>
        </div>

        {/* Requirement 11.6: Competitor comparison section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-4xl font-display font-black text-foreground mb-4">
              Pourquoi PikSend vs les concurrents ?
            </h3>
            <p className="text-muted-foreground font-medium text-base max-w-2xl mx-auto">
              Commission la plus basse, plugin Lightroom unique, support ultra-rapide
            </p>
          </div>
          <ComparisonTable highlightPikSend={true} variant="full" />
        </div>

        {/* Requirement 11.7: Expanded FAQ with 10+ questions */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-4xl font-display font-black text-foreground mb-4">
              Questions fréquentes
            </h3>
            <p className="text-muted-foreground font-medium text-base max-w-2xl mx-auto">
              Tout ce que vous devez savoir sur nos plans et tarifs
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {PRICING_FAQ.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            {content.pricing.guarantee}
          </p>
        </div>
      </div>
    </section>
  );
}
