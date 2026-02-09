/**
 * Event Photographer Landing Page
 * Persona-specific landing page for event photographers
 * 
 * @module app/(marketing)/for/photographers/event/page
 * Requirements: 2.1, 2.2, 2.4
 */

import { Metadata } from 'next';
import { PersonaLandingPage } from '@/components/landing/persona-landing-page';
import type { Persona } from '@/types/persona';

const persona: Persona = 'event';

export const metadata: Metadata = {
  title: 'PikSend pour Photographes Événementiels | Livraison Ultra-Rapide',
  description: 'Gérez vos événements avec efficacité. Livrez des centaines de photos en quelques minutes. Commission 10%, support 2h.',
  keywords: [
    'photographe événementiel',
    'partage photos événement',
    'galerie photo corporate',
    'livraison photos événement',
    'plugin lightroom événement',
  ],
  openGraph: {
    title: 'PikSend pour Photographes Événementiels',
    description: 'Livrez vos photos d\'événement en 5 minutes. Gérez plusieurs projets simultanément.',
    type: 'website',
  },
};

export default function EventPhotographersPage() {
  return <PersonaLandingPage persona={persona} />;
}
