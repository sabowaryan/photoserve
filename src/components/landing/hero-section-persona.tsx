/**
 * Persona-Specific Hero Section Component
 * Hero section with persona-customized headlines and badges
 * 
 * @module components/landing/hero-section-persona
 * Requirements: 2.2, 10.1, 10.2
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Zap, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import type { Persona } from '@/types/persona';

interface HeroSectionPersonaProps {
  persona: Persona;
}

interface PersonaHeroContent {
  headline: string;
  subheadline: string;
  badges: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  trustIndicators: string[];
  ctaPrimary: {
    text: string;
    href: string;
  };
  ctaSecondary: {
    text: string;
    href: string;
  };
}

const PERSONA_CONTENT: Record<Persona, PersonaHeroContent> = {
  wedding: {
    headline: 'Livrez vos photos de mariage en 5 minutes. Gardez 90%.',
    subheadline: 'La plateforme préférée des photographes de mariage. Plugin Lightroom unique, commission 10%, support 2h. Concentrez-vous sur votre art, pas sur la technique.',
    badges: [
      { icon: <Zap className="h-4 w-4" />, text: 'Plugin Lightroom Unique' },
      { icon: <DollarSign className="h-4 w-4" />, text: 'Commission 10%' },
      { icon: <Clock className="h-4 w-4" />, text: 'Support 2h' },
    ],
    trustIndicators: [
      '500+ photographes de mariage',
      '4,8/5 étoiles',
      'Commission la plus basse',
    ],
    ctaPrimary: {
      text: 'Essayer gratuitement',
      href: '/api/guest/upload',
    },
    ctaSecondary: {
      text: 'Voir la démo',
      href: '/demo',
    },
  },
  event: {
    headline: 'Livrez des centaines de photos en quelques minutes.',
    subheadline: 'Gérez plusieurs événements simultanément avec efficacité. Plugin Lightroom, livraison ultra-rapide, commission 10%. Parfait pour les photographes événementiels.',
    badges: [
      { icon: <Zap className="h-4 w-4" />, text: 'Livraison Ultra-Rapide' },
      { icon: <DollarSign className="h-4 w-4" />, text: 'Commission 10%' },
      { icon: <Clock className="h-4 w-4" />, text: 'Support 2h' },
    ],
    trustIndicators: [
      '500+ photographes événementiels',
      '4,8/5 étoiles',
      'Volumes illimités',
    ],
    ctaPrimary: {
      text: 'Essayer gratuitement',
      href: '/api/guest/upload',
    },
    ctaSecondary: {
      text: 'Calculer mon ROI',
      href: '#roi-calculator',
    },
  },
  portrait: {
    headline: 'Partagez vos portraits en 5 minutes. Offrez une expérience premium.',
    subheadline: 'La solution idéale pour photographes portrait et famille. Galeries illimitées, branding personnalisé, commission 10%. Vos clients vont adorer.',
    badges: [
      { icon: <Zap className="h-4 w-4" />, text: 'Galeries Illimitées' },
      { icon: <DollarSign className="h-4 w-4" />, text: 'Commission 10%' },
      { icon: <Clock className="h-4 w-4" />, text: 'Support 2h' },
    ],
    trustIndicators: [
      '500+ photographes portrait',
      '4,8/5 étoiles',
      'Branding personnalisé',
    ],
    ctaPrimary: {
      text: 'Essayer gratuitement',
      href: '/api/guest/upload',
    },
    ctaSecondary: {
      text: 'Voir les tarifs',
      href: '#pricing',
    },
  },
  studio: {
    headline: 'Solution professionnelle pour studios photo.',
    subheadline: 'Volumes élevés, branding personnalisé, support prioritaire. Tarifs sur mesure pour studios et agences. Contactez-nous pour une démo personnalisée.',
    badges: [
      { icon: <Zap className="h-4 w-4" />, text: 'Volumes Élevés' },
      { icon: <DollarSign className="h-4 w-4" />, text: 'Tarifs sur Mesure' },
      { icon: <Clock className="h-4 w-4" />, text: 'Support Prioritaire' },
    ],
    trustIndicators: [
      '50+ studios partenaires',
      '4,9/5 étoiles',
      'Solution entreprise',
    ],
    ctaPrimary: {
      text: 'Demander une démo',
      href: '/contact',
    },
    ctaSecondary: {
      text: 'Voir les fonctionnalités',
      href: '#features',
    },
  },
};

export function HeroSectionPersona({ persona }: HeroSectionPersonaProps) {
  const content = PERSONA_CONTENT[persona];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 transform">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-100 opacity-20 blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badges */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            {content.badges.map((badge, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
              >
                {badge.icon}
                {badge.text}
              </Badge>
            ))}
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            {content.headline}
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-gray-600 sm:text-xl">
            {content.subheadline}
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={content.ctaPrimary.href}>
                {content.ctaPrimary.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href={content.ctaSecondary.href}>
                {content.ctaSecondary.text}
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            {content.trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>

          {/* No credit card required */}
          <p className="mt-6 text-sm text-gray-500">
            Pas de carte bancaire requise • Essai gratuit • Annulation à tout moment
          </p>
        </div>
      </div>
    </section>
  );
}
