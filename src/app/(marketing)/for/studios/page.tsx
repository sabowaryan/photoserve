/**
 * Studio Landing Page
 * Persona-specific landing page for photo studios
 * 
 * @module app/(marketing)/for/studios/page
 * Requirements: 2.1, 2.2, 2.6
 */

import { Metadata } from 'next';
import { PersonaLandingPage } from '@/components/landing/persona-landing-page';
import type { Persona } from '@/types/persona';

const persona: Persona = 'studio';

export const metadata: Metadata = {
  title: 'PikSend pour Studios Photo | Solution Professionnelle sur Mesure',
  description: 'Solution professionnelle pour studios photo et agences. Volumes élevés, branding personnalisé, support prioritaire.',
  keywords: [
    'studio photo',
    'partage photos studio',
    'galerie photo commercial',
    'solution studio photo',
    'plugin lightroom studio',
  ],
  openGraph: {
    title: 'PikSend pour Studios Photo',
    description: 'Solution professionnelle pour studios. Volumes élevés, branding personnalisé.',
    type: 'website',
  },
};

export default function StudiosPage() {
  return <PersonaLandingPage persona={persona} />;
}
