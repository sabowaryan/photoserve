/**
 * Persona Landing Page Component
 * Complete landing page with persona-specific content
 * 
 * @module components/landing/persona-landing-page
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.9
 */

'use client';

import { useEffect } from 'react';
import { HeroSectionPersona } from './hero-section-persona';
import { TestimonialVideo } from './testimonial-video';
import { ROICalculator } from '@/components/conversion/roi-calculator';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { PersonaQuiz } from '@/components/conversion/persona-quiz';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { Persona } from '@/types/persona';
import { getPersonaLandingContent } from '@/lib/persona/content';
import { hasCompletedQuiz } from '@/lib/persona/storage';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { createClient } from '@/lib/supabase/client';
import { useVisitorFingerprint } from '@/hooks/use-visitor-fingerprint';

interface PersonaLandingPageProps {
  persona: Persona;
}

export function PersonaLandingPage({ persona }: PersonaLandingPageProps) {
  const content = getPersonaLandingContent(persona);
  const visitorId = useVisitorFingerprint();
  const showQuiz = !hasCompletedQuiz();

  // Track page view
  useEffect(() => {
    if (visitorId) {
      const supabase = createClient();
      const analytics = createAnalyticsService(supabase);
      analytics.trackFunnelEvent('page_view', {
        page: 'persona_landing',
        persona,
      }, visitorId);
    }
  }, [persona, visitorId]);

  return (
    <div className="min-h-screen bg-white">
      {/* Show quiz if not completed */}
      {showQuiz && <PersonaQuiz trigger="time" delay={3000} />}

      {/* Hero Section */}
      <HeroSectionPersona persona={persona} />

      {/* ROI Calculator Section */}
      <section id="roi-calculator" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Calculez votre retour sur investissement
              </h2>
              <p className="text-lg text-gray-600">
                Découvrez combien vous pourriez gagner avec PikSend
              </p>
            </div>
            <ROICalculator
              persona={persona}
              defaultValues={content.roiDefaults}
              variant="inline"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-lg text-gray-600">
                Une plateforme complète pour {content.displayName.toLowerCase()}s
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {content.features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Check className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{feature}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-4">
                Témoignage
              </Badge>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Ce que disent nos clients
              </h2>
            </div>
            <TestimonialVideo
              videoUrl={content.testimonial.videoUrl}
              thumbnail={content.testimonial.thumbnail}
              author={content.testimonial.author}
              quote={content.testimonial.quote}
              metrics={content.testimonial.metrics}
              variant="featured"
            />
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Pourquoi PikSend vs les concurrents ?
              </h2>
              <p className="text-lg text-gray-600">
                Comparez et voyez la différence
              </p>
            </div>
            <ComparisonTable highlightPikSend variant="full" />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Les avantages pour vous
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {content.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Choisissez votre plan
              </h2>
              <p className="text-lg text-gray-600">
                Plan recommandé pour {content.displayName.toLowerCase()}s: {' '}
                <span className="font-semibold capitalize">{content.recommendedPlan}</span>
              </p>
            </div>
            {/* Note: PricingSection will be integrated with proper content structure in a future task */}
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">
                Section de tarification à intégrer avec le contenu existant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Questions fréquentes
              </h2>
              <p className="text-lg text-gray-600">
                Tout ce que vous devez savoir
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {content.faqQuestions.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Prêt à transformer votre activité ?
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Rejoignez 500+ photographes qui ont choisi PikSend
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/api/guest/upload"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all hover:bg-gray-100"
              >
                Essayer gratuitement
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
              >
                Nous contacter
              </a>
            </div>
            <p className="mt-6 text-sm text-blue-100">
              Pas de carte bancaire requise • Essai gratuit • Annulation à tout moment
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
