/**
 * Portrait Photographer Landing Page
 * Persona-specific landing page for portrait photographers
 * 
 * @module app/(marketing)/for/photographers/portrait/page
 * Requirements: 2.1, 2.2, 2.5
 */

import { Metadata } from 'next';
import { PersonaLandingPage } from '@/components/landing/persona-landing-page';
import type { Persona } from '@/types/persona';

const persona: Persona = 'portrait';

export const metadata: Metadata = {
  title: 'PikSend pour Photographes Portrait | Partagez vos Portraits Facilement',
  description: 'Partagez vos portraits et photos de famille en toute simplicité. Commission 10%, galeries illimitées, support 2h.',
  keywords: [
    'photographe portrait',
    'partage photos portrait',
    'galerie photo famille',
    'livraison photos portrait',
    'plugin lightroom portrait',
  ],
  openGraph: {
    title: 'PikSend pour Photographes Portrait',
    description: 'Livrez vos portraits en 5 minutes. Offrez une expérience client premium.',
    type: 'website',
  },
};

export default function PortraitPhotographersPage() {
  return <PersonaLandingPage persona={persona} />;
}
