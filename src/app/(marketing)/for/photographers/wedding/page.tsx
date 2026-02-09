/**
 * Wedding Photographer Landing Page
 * Persona-specific landing page for wedding photographers
 * 
 * @module app/(marketing)/for/photographers/wedding/page
 * Requirements: 2.1, 2.2, 2.3
 */

import { Metadata } from 'next';
import { PersonaLandingPage } from '@/components/landing/persona-landing-page';
import type { Persona } from '@/types/persona';

const persona: Persona = 'wedding';

export const metadata: Metadata = {
  title: 'PikSend pour Photographes de Mariage | Livrez vos photos en 5 minutes',
  description: 'La plateforme de partage photo conçue pour les photographes de mariage. Commission 10%, plugin Lightroom unique, support 2h. Gardez 90% de vos revenus.',
  keywords: [
    'photographe mariage',
    'partage photos mariage',
    'galerie photo mariage',
    'livraison photos mariage',
    'plugin lightroom mariage',
  ],
  openGraph: {
    title: 'PikSend pour Photographes de Mariage',
    description: 'Livrez vos photos de mariage en 5 minutes. Gardez 90% de vos revenus.',
    type: 'website',
  },
};

export default function WeddingPhotographersPage() {
  return <PersonaLandingPage persona={persona} />;
}
