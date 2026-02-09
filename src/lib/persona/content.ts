/**
 * Persona Content Configuration
 * Content and configuration for each persona
 * 
 * @module lib/persona/content
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import type { Persona, PersonaContent } from '@/types/persona';
import type { TestimonialAuthor, TestimonialMetrics } from '@/components/landing/testimonial-video';

export interface PersonaTestimonial {
  videoUrl: string;
  thumbnail: string;
  author: TestimonialAuthor;
  quote: string;
  metrics?: TestimonialMetrics;
}

export interface PersonaFAQ {
  question: string;
  answer: string;
}

export interface PersonaLandingContent extends PersonaContent {
  testimonial: PersonaTestimonial;
  faqQuestions: PersonaFAQ[];
  features: string[];
  benefits: string[];
}

/**
 * Complete content configuration for all personas
 */
export const PERSONA_LANDING_CONTENT: Record<Persona, PersonaLandingContent> = {
  wedding: {
    persona: 'wedding',
    displayName: 'Photographe de Mariage',
    landingPageUrl: '/for/photographers/wedding',
    heroHeadline: 'Livrez vos photos de mariage en 5 minutes. Gardez 90%.',
    heroSubheadline: 'La plateforme préférée des photographes de mariage. Plugin Lightroom unique, commission 10%, support 2h.',
    recommendedPlan: 'pro',
    roiDefaults: {
      projectsPerMonth: 3,
      averagePrice: 2500,
      salesPerProject: 1,
    },
    testimonial: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: '/testimonials/wedding-photographer.jpg',
      author: {
        name: 'Sophie Martin',
        role: 'Photographe de Mariage',
        location: 'Paris, France',
        photo: '/testimonials/sophie-martin.jpg',
        persona: 'wedding',
      },
      quote: 'PikSend a transformé ma façon de livrer les photos. Mes clients adorent la simplicité et moi j\'économise 10h par semaine.',
      metrics: {
        revenue: '+45%',
        timeSaved: '10h/semaine',
        roi: '850%',
      },
    },
    faqQuestions: [
      {
        question: 'Comment PikSend facilite-t-il la livraison de photos de mariage ?',
        answer: 'Avec le plugin Lightroom, exportez directement depuis votre workflow habituel. Vos photos sont en ligne en 5 minutes avec une galerie magnifique et personnalisée.',
      },
      {
        question: 'Puis-je personnaliser les galeries avec mon branding ?',
        answer: 'Oui ! Avec le plan Pro, ajoutez votre logo, vos couleurs et même votre domaine personnalisé pour une expérience 100% à votre image.',
      },
      {
        question: 'Quelle est la commission sur les ventes ?',
        answer: 'Seulement 10%, la plus basse du marché. Vous gardez 90% de vos revenus, contre 85% chez les concurrents.',
      },
      {
        question: 'Combien de photos puis-je mettre dans une galerie de mariage ?',
        answer: 'Illimité ! Mettez 500, 1000 ou même 2000 photos sans frais supplémentaires. Vos clients peuvent tout télécharger en un clic.',
      },
      {
        question: 'Mes clients peuvent-ils commander des tirages ?',
        answer: 'Oui, activez la monétisation et vos clients peuvent commander des tirages, albums et produits dérivés directement depuis la galerie.',
      },
      {
        question: 'Le support est-il vraiment en 2h ?',
        answer: 'Oui, nous répondons en moins de 2h en moyenne, 7j/7. Vous avez une question avant un mariage ? On est là.',
      },
    ],
    features: [
      'Plugin Lightroom unique',
      'Galeries illimitées',
      'Photos illimitées par galerie',
      'Branding personnalisé (Pro)',
      'Domaine personnalisé (Pro)',
      'Monétisation intégrée',
      'Support 2h',
      'Commission 10%',
    ],
    benefits: [
      'Livrez vos mariages en 5 minutes au lieu de 2h',
      'Gardez 90% de vos revenus',
      'Offrez une expérience premium à vos clients',
      'Concentrez-vous sur votre art, pas sur la technique',
    ],
  },
  event: {
    persona: 'event',
    displayName: 'Photographe Événementiel',
    landingPageUrl: '/for/photographers/event',
    heroHeadline: 'Livrez des centaines de photos en quelques minutes.',
    heroSubheadline: 'Gérez plusieurs événements simultanément avec efficacité. Plugin Lightroom, livraison ultra-rapide, commission 10%.',
    recommendedPlan: 'pro',
    roiDefaults: {
      projectsPerMonth: 8,
      averagePrice: 800,
      salesPerProject: 1,
    },
    testimonial: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: '/testimonials/event-photographer.jpg',
      author: {
        name: 'Marc Dubois',
        role: 'Photographe Événementiel',
        location: 'Lyon, France',
        photo: '/testimonials/marc-dubois.jpg',
        persona: 'event',
      },
      quote: 'Je gère 10 événements par mois. PikSend me permet de livrer le soir même, mes clients corporate adorent la rapidité.',
      metrics: {
        revenue: '+60%',
        timeSaved: '15h/semaine',
        customMetric: {
          label: 'Événements/mois',
          value: '10',
        },
      },
    },
    faqQuestions: [
      {
        question: 'Puis-je gérer plusieurs événements en même temps ?',
        answer: 'Absolument ! Créez autant de galeries que nécessaire. Beaucoup de nos clients gèrent 10+ événements par mois sans problème.',
      },
      {
        question: 'La livraison est-elle vraiment rapide pour de gros volumes ?',
        answer: 'Oui ! Avec le plugin Lightroom, exportez 500 photos en quelques minutes. Notre infrastructure gère les gros volumes sans ralentissement.',
      },
      {
        question: 'Puis-je protéger les galeries par mot de passe ?',
        answer: 'Oui, chaque galerie peut avoir un mot de passe unique. Parfait pour les événements corporate confidentiels.',
      },
      {
        question: 'Y a-t-il une limite de stockage ?',
        answer: 'Non ! Stockage illimité sur tous les plans payants. Gardez vos galeries en ligne aussi longtemps que nécessaire.',
      },
      {
        question: 'Puis-je facturer mes clients pour l\'accès aux photos ?',
        answer: 'Oui, activez la monétisation et définissez un prix d\'accès ou vendez des produits dérivés. Vous gardez 90%.',
      },
      {
        question: 'Le plugin Lightroom fonctionne-t-il sur Mac et PC ?',
        answer: 'Oui, compatible Lightroom Classic sur Mac et Windows. Installation en 2 minutes.',
      },
    ],
    features: [
      'Plugin Lightroom unique',
      'Volumes illimités',
      'Livraison ultra-rapide',
      'Protection par mot de passe',
      'Stockage illimité',
      'Monétisation intégrée',
      'Support 2h',
      'Commission 10%',
    ],
    benefits: [
      'Livrez le soir même de l\'événement',
      'Gérez 10+ événements par mois facilement',
      'Impressionnez vos clients corporate',
      'Augmentez vos revenus de 60%',
    ],
  },
  portrait: {
    persona: 'portrait',
    displayName: 'Photographe Portrait',
    landingPageUrl: '/for/photographers/portrait',
    heroHeadline: 'Partagez vos portraits en 5 minutes. Offrez une expérience premium.',
    heroSubheadline: 'La solution idéale pour photographes portrait et famille. Galeries illimitées, branding personnalisé, commission 10%.',
    recommendedPlan: 'premium',
    roiDefaults: {
      projectsPerMonth: 10,
      averagePrice: 350,
      salesPerProject: 1,
    },
    testimonial: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: '/testimonials/portrait-photographer.jpg',
      author: {
        name: 'Julie Renard',
        role: 'Photographe Portrait & Famille',
        location: 'Bordeaux, France',
        photo: '/testimonials/julie-renard.jpg',
        persona: 'portrait',
      },
      quote: 'Mes clients adorent recevoir leurs photos le jour même. PikSend m\'a permis de doubler mon nombre de séances.',
      metrics: {
        revenue: '+120%',
        timeSaved: '8h/semaine',
        customMetric: {
          label: 'Séances/mois',
          value: '20',
        },
      },
    },
    faqQuestions: [
      {
        question: 'Combien de galeries puis-je créer par mois ?',
        answer: 'Illimité avec le plan Premium ! Créez autant de galeries que vous avez de séances, sans frais supplémentaires.',
      },
      {
        question: 'Puis-je personnaliser les galeries avec mon logo ?',
        answer: 'Oui ! Ajoutez votre logo, vos couleurs et créez une expérience cohérente avec votre marque.',
      },
      {
        question: 'Mes clients peuvent-ils sélectionner leurs photos préférées ?',
        answer: 'Oui, ils peuvent marquer leurs favoris et vous recevez la liste. Parfait pour les sélections avant retouche.',
      },
      {
        question: 'Puis-je vendre des tirages et albums ?',
        answer: 'Absolument ! Activez la boutique intégrée et vendez tirages, albums, toiles et plus. Vous gardez 90%.',
      },
      {
        question: 'Les galeries expirent-elles ?',
        answer: 'Vous choisissez ! Définissez une date d\'expiration ou gardez les galeries en ligne indéfiniment.',
      },
      {
        question: 'Le plan Premium suffit-il pour débuter ?',
        answer: 'Oui ! Le plan Premium à 9,99$/mois est parfait pour les photographes portrait avec 5-15 séances/mois.',
      },
    ],
    features: [
      'Galeries illimitées',
      'Branding personnalisé',
      'Sélection de favoris',
      'Boutique intégrée',
      'Expiration personnalisable',
      'Plugin Lightroom',
      'Support 2h',
      'Commission 10%',
    ],
    benefits: [
      'Livrez vos séances le jour même',
      'Doublez votre nombre de clients',
      'Vendez plus de tirages et albums',
      'Offrez une expérience premium',
    ],
  },
  studio: {
    persona: 'studio',
    displayName: 'Studio Photo',
    landingPageUrl: '/for/studios',
    heroHeadline: 'Solution professionnelle pour studios photo.',
    heroSubheadline: 'Volumes élevés, branding personnalisé, support prioritaire. Tarifs sur mesure pour studios et agences.',
    recommendedPlan: 'custom',
    roiDefaults: {
      projectsPerMonth: 20,
      averagePrice: 500,
      salesPerProject: 1,
    },
    testimonial: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: '/testimonials/studio.jpg',
      author: {
        name: 'Studio Lumière',
        role: 'Studio Photo Commercial',
        location: 'Paris, France',
        photo: '/testimonials/studio-lumiere.jpg',
        persona: 'studio',
      },
      quote: 'PikSend gère nos 50+ projets mensuels sans effort. Le support prioritaire et les tarifs sur mesure sont parfaits pour notre studio.',
      metrics: {
        revenue: '+200%',
        customMetric: {
          label: 'Projets/mois',
          value: '50+',
        },
      },
    },
    faqQuestions: [
      {
        question: 'Quels sont les tarifs pour studios ?',
        answer: 'Nous proposons des tarifs sur mesure selon vos volumes et besoins. Contactez-nous pour une offre personnalisée.',
      },
      {
        question: 'Puis-je avoir plusieurs utilisateurs sur le compte ?',
        answer: 'Oui ! Les plans studio incluent plusieurs sièges utilisateurs avec gestion des permissions.',
      },
      {
        question: 'Proposez-vous un support prioritaire ?',
        answer: 'Oui, support prioritaire avec temps de réponse <1h et gestionnaire de compte dédié.',
      },
      {
        question: 'Puis-je intégrer PikSend à mes outils existants ?',
        answer: 'Oui, API complète pour intégration avec vos systèmes CRM, facturation et workflow.',
      },
      {
        question: 'Y a-t-il des limites de stockage ou de bande passante ?',
        answer: 'Non, stockage et bande passante illimités sur les plans studio. Gérez des milliers de projets.',
      },
      {
        question: 'Proposez-vous un SLA ?',
        answer: 'Oui, SLA 99,9% de disponibilité avec compensation en cas de non-respect.',
      },
    ],
    features: [
      'Volumes illimités',
      'Multi-utilisateurs',
      'Support prioritaire <1h',
      'API complète',
      'Stockage illimité',
      'Branding white-label',
      'SLA 99,9%',
      'Tarifs sur mesure',
    ],
    benefits: [
      'Gérez 50+ projets par mois',
      'Équipe complète avec permissions',
      'Intégration avec vos outils',
      'Support dédié et prioritaire',
    ],
  },
};

/**
 * Get complete landing page content for a persona
 */
export function getPersonaLandingContent(persona: Persona): PersonaLandingContent {
  return PERSONA_LANDING_CONTENT[persona];
}
