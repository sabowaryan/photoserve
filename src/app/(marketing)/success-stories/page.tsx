'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Filter, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Persona } from '@/types/persona';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  location: string;
  photo: string;
  persona: Persona;
  story: string;
  challenge: string;
  solution: string;
  results: {
    revenue: string;
    timeSaved: string;
    roi: string;
    customMetric?: {
      label: string;
      value: string;
    };
  };
  quote: string;
  videoUrl?: string;
  featured?: boolean;
}

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: '1',
    name: 'Marie Dubois',
    role: 'Photographe de mariage',
    location: 'Paris, France',
    photo: '/images/testimonials/marie-wedding.jpg',
    persona: 'wedding',
    story: 'Marie photographiait 25 mariages par an et passait 3h par galerie à exporter et uploader ses photos manuellement. Elle perdait du temps précieux qu\'elle aurait pu consacrer à ses clients ou à sa famille.',
    challenge: 'Workflow manuel fastidieux, commission 15% chez Pixieset, support lent',
    solution: 'Plugin Lightroom PikSend pour upload direct, commission 10%, support réactif',
    results: {
      revenue: '+6000$/an',
      timeSaved: '2h/galerie',
      roi: '400%',
      customMetric: {
        label: 'Galeries créées',
        value: '25/an',
      },
    },
    quote: 'PikSend m\'a fait gagner 50h par an et 6000$ de plus dans ma poche. Le plugin Lightroom est magique.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
  },
  {
    id: '2',
    name: 'Thomas Martin',
    role: 'Photographe événementiel',
    location: 'Lyon, France',
    photo: '/images/testimonials/thomas-event.jpg',
    persona: 'event',
    story: 'Thomas couvre 40 événements corporate par an. Avec Pic-Time, il payait 24$/mois + 15% de commission. Les coûts s\'accumulaient rapidement.',
    challenge: 'Coûts élevés, pas d\'intégration Lightroom, workflow lent',
    solution: 'PikSend à 19,99$/mois, commission 10%, plugin Lightroom',
    results: {
      revenue: '+4800$/an',
      timeSaved: '1.5h/galerie',
      roi: '350%',
      customMetric: {
        label: 'Événements',
        value: '40/an',
      },
    },
    quote: 'J\'économise 400$/mois entre l\'abonnement et les commissions. C\'est énorme pour mon business.',
    featured: true,
  },
  {
    id: '3',
    name: 'Sophie Laurent',
    role: 'Photographe portrait',
    location: 'Marseille, France',
    photo: '/images/testimonials/sophie-portrait.jpg',
    persona: 'portrait',
    story: 'Sophie fait des séances portrait famille et enfants. ShootProof était trop cher (30$/mois) pour son volume d\'activité.',
    challenge: 'Prix trop élevé, stockage limité à 50 GB, pas de plugin Lightroom',
    solution: 'PikSend à 19,99$/mois, stockage illimité, plugin Lightroom',
    results: {
      revenue: '+3600$/an',
      timeSaved: '2h/galerie',
      roi: '280%',
      customMetric: {
        label: 'Séances',
        value: '60/an',
      },
    },
    quote: 'Enfin une plateforme adaptée aux photographes portrait. Prix juste, fonctionnalités complètes.',
  },
  {
    id: '4',
    name: 'Jean Dupont',
    role: 'Photographe de mariage',
    location: 'Bordeaux, France',
    photo: '/images/testimonials/jean-wedding.jpg',
    persona: 'wedding',
    story: 'Jean débutait dans la photo de mariage. Il cherchait une solution abordable mais professionnelle pour livrer ses galeries.',
    challenge: 'Budget limité, besoin de fonctionnalités pro, apprentissage rapide',
    solution: 'PikSend avec onboarding guidé, support réactif, prix accessible',
    results: {
      revenue: '+2400$/an',
      timeSaved: '1h/galerie',
      roi: '200%',
      customMetric: {
        label: 'Mariages',
        value: '12/an',
      },
    },
    quote: 'Parfait pour débuter. Interface simple, support au top, prix accessible.',
  },
  {
    id: '5',
    name: 'Camille Rousseau',
    role: 'Photographe événementiel',
    location: 'Toulouse, France',
    photo: '/images/testimonials/camille-event.jpg',
    persona: 'event',
    story: 'Camille couvre des événements sportifs et culturels. Elle avait besoin d\'une solution rapide pour livrer des centaines de photos rapidement.',
    challenge: 'Volume élevé de photos, délais serrés, clients impatients',
    solution: 'Plugin Lightroom PikSend, upload rapide, galeries illimitées',
    results: {
      revenue: '+5200$/an',
      timeSaved: '3h/événement',
      roi: '380%',
      customMetric: {
        label: 'Événements',
        value: '50/an',
      },
    },
    quote: 'Je livre mes galeries 2x plus vite. Mes clients sont ravis de la rapidité.',
  },
  {
    id: '6',
    name: 'Lucas Bernard',
    role: 'Photographe portrait',
    location: 'Nantes, France',
    photo: '/images/testimonials/lucas-portrait.jpg',
    persona: 'portrait',
    story: 'Lucas fait des portraits corporate et LinkedIn. Il avait besoin d\'une solution simple et rapide pour livrer quelques photos par client.',
    challenge: 'Petites galeries, besoin de simplicité, budget serré',
    solution: 'PikSend avec interface simple, galeries illimitées, prix bas',
    results: {
      revenue: '+1800$/an',
      timeSaved: '30min/séance',
      roi: '150%',
      customMetric: {
        label: 'Séances',
        value: '80/an',
      },
    },
    quote: 'Simple, rapide, efficace. Exactement ce dont j\'avais besoin.',
  },
  {
    id: '7',
    name: 'Emma Petit',
    role: 'Photographe de mariage',
    location: 'Nice, France',
    photo: '/images/testimonials/emma-wedding.jpg',
    persona: 'wedding',
    story: 'Emma est photographe de mariage depuis 10 ans. Elle cherchait à réduire ses coûts sans compromettre la qualité du service.',
    challenge: 'Coûts élevés avec Pixieset, commission 15%, pas de différenciation',
    solution: 'Migration vers PikSend, économies immédiates, plugin Lightroom',
    results: {
      revenue: '+7200$/an',
      timeSaved: '2.5h/galerie',
      roi: '450%',
      customMetric: {
        label: 'Mariages',
        value: '30/an',
      },
    },
    quote: 'Meilleure décision business de l\'année. ROI incroyable.',
  },
  {
    id: '8',
    name: 'Alexandre Moreau',
    role: 'Photographe événementiel',
    location: 'Strasbourg, France',
    photo: '/images/testimonials/alex-event.jpg',
    persona: 'event',
    story: 'Alexandre couvre des conférences et séminaires d\'entreprise. Il avait besoin d\'une solution professionnelle avec branding personnalisé.',
    challenge: 'Image de marque importante, besoin de branding, clients exigeants',
    solution: 'PikSend Pro avec domaine custom, branding complet, support prioritaire',
    results: {
      revenue: '+6400$/an',
      timeSaved: '2h/événement',
      roi: '420%',
      customMetric: {
        label: 'Conférences',
        value: '35/an',
      },
    },
    quote: 'Le branding personnalisé fait toute la différence auprès de mes clients corporate.',
  },
  {
    id: '9',
    name: 'Léa Fontaine',
    role: 'Photographe portrait',
    location: 'Lille, France',
    photo: '/images/testimonials/lea-portrait.jpg',
    persona: 'portrait',
    story: 'Léa se spécialise dans les portraits de grossesse et nouveau-nés. Elle cherchait une plateforme douce et élégante pour ses galeries.',
    challenge: 'Esthétique importante, expérience client premium, budget limité',
    solution: 'PikSend avec templates élégants, personnalisation complète, prix accessible',
    results: {
      revenue: '+2800$/an',
      timeSaved: '1.5h/séance',
      roi: '220%',
      customMetric: {
        label: 'Séances',
        value: '45/an',
      },
    },
    quote: 'Mes clientes adorent l\'expérience. Élégant, simple, professionnel.',
  },
  {
    id: '10',
    name: 'Studio PhotoPro',
    role: 'Studio photo commercial',
    location: 'Paris, France',
    photo: '/images/testimonials/studio-photopro.jpg',
    persona: 'studio',
    story: 'Studio de 5 photographes spécialisé en photo corporate et produit. Ils géraient 200+ projets par an avec des outils disparates.',
    challenge: 'Gestion multi-photographes, volume élevé, besoin de centralisation',
    solution: 'PikSend avec comptes multiples, API, support prioritaire',
    results: {
      revenue: '+15000$/an',
      timeSaved: '5h/semaine',
      roi: '600%',
      customMetric: {
        label: 'Projets',
        value: '200+/an',
      },
    },
    quote: 'Solution parfaite pour notre studio. Centralisation, efficacité, économies.',
    featured: true,
  },
];

export default function SuccessStoriesPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | 'all'>('all');

  const filteredStories = selectedPersona === 'all' 
    ? SUCCESS_STORIES 
    : SUCCESS_STORIES.filter(story => story.persona === selectedPersona);

  const featuredStories = filteredStories.filter(story => story.featured);
  const regularStories = filteredStories.filter(story => !story.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-4 bg-green-600">Success Stories</Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Ils ont transformé leur business avec PikSend
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Découvrez comment 500+ photographes économisent du temps et de l'argent
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Photographes</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">3000$</div>
                <div className="text-sm text-gray-600">Économie moyenne/an</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">2h</div>
                <div className="text-sm text-gray-600">Gagnées/galerie</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="border-b bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtrer par type</span>
            </div>
            <Select value={selectedPersona} onValueChange={(value) => setSelectedPersona(value as Persona | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les photographes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les photographes</SelectItem>
                <SelectItem value="wedding">Mariage</SelectItem>
                <SelectItem value="event">Événementiel</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="studio">Studios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      {featuredStories.length > 0 && (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
              Stories en vedette
            </h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {featuredStories.map((story) => (
                <Card key={story.id} className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Image
                        src={story.photo}
                        alt={story.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-xl">{story.name}</CardTitle>
                        <CardDescription className="text-base">
                          {story.role} • {story.location}
                        </CardDescription>
                        <Badge className="mt-2 bg-blue-600">
                          {story.persona === 'wedding' && 'Mariage'}
                          {story.persona === 'event' && 'Événementiel'}
                          {story.persona === 'portrait' && 'Portrait'}
                          {story.persona === 'studio' && 'Studio'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <blockquote className="border-l-4 border-blue-600 pl-4 italic text-gray-700">
                      "{story.quote}"
                    </blockquote>

                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900">Le défi</h4>
                      <p className="text-sm text-gray-600">{story.challenge}</p>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900">La solution</h4>
                      <p className="text-sm text-gray-600">{story.solution}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                        <DollarSign className="mx-auto mb-1 h-5 w-5 text-green-600" />
                        <p className="text-lg font-bold text-green-600">{story.results.revenue}</p>
                        <p className="text-xs text-gray-600">Revenus</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                        <Clock className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                        <p className="text-lg font-bold text-blue-600">{story.results.timeSaved}</p>
                        <p className="text-xs text-gray-600">Temps gagné</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                        <TrendingUp className="mx-auto mb-1 h-5 w-5 text-purple-600" />
                        <p className="text-lg font-bold text-purple-600">{story.results.roi}</p>
                        <p className="text-xs text-gray-600">ROI</p>
                      </div>
                      {story.results.customMetric && (
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                          <p className="text-lg font-bold text-orange-600">{story.results.customMetric.value}</p>
                          <p className="text-xs text-gray-600">{story.results.customMetric.label}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Stories */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            Toutes les success stories
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularStories.map((story) => (
              <Card key={story.id}>
                <CardHeader>
                  <div className="mb-3 flex items-center gap-3">
                    <Image
                      src={story.photo}
                      alt={story.name}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                    <div>
                      <CardTitle className="text-lg">{story.name}</CardTitle>
                      <CardDescription>
                        {story.role}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {story.persona === 'wedding' && 'Mariage'}
                    {story.persona === 'event' && 'Événementiel'}
                    {story.persona === 'portrait' && 'Portrait'}
                    {story.persona === 'studio' && 'Studio'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <blockquote className="text-sm italic text-gray-700">
                    "{story.quote}"
                  </blockquote>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded bg-green-50 p-2 text-center">
                      <p className="text-sm font-bold text-green-600">{story.results.revenue}</p>
                      <p className="text-xs text-gray-600">Revenus</p>
                    </div>
                    <div className="rounded bg-blue-50 p-2 text-center">
                      <p className="text-sm font-bold text-blue-600">{story.results.timeSaved}</p>
                      <p className="text-xs text-gray-600">Temps</p>
                    </div>
                    <div className="rounded bg-purple-50 p-2 text-center">
                      <p className="text-sm font-bold text-purple-600">{story.results.roi}</p>
                      <p className="text-xs text-gray-600">ROI</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{story.story}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Prêt à écrire votre success story ?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Rejoignez 500+ photographes qui ont transformé leur business
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth">
                Essayer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/contact">
                Parler à un expert
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Pas de carte bancaire requise • 14 jours d'essai gratuit
          </p>
        </div>
      </section>
    </div>
  );
}
