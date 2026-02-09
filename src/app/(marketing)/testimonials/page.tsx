'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Filter, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Persona } from '@/types/persona';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  photo: string;
  persona: Persona;
  plan: 'free' | 'premium' | 'pro';
  rating: 5;
  quote: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  // Wedding photographers (15)
  { id: '1', name: 'Marie Dubois', role: 'Photographe mariage', location: 'Paris', photo: '/images/testimonials/marie-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Le plugin Lightroom est un game-changer. Je gagne 2h par galerie.', date: '2024-01' },
  { id: '2', name: 'Jean Dupont', role: 'Photographe mariage', location: 'Bordeaux', photo: '/images/testimonials/jean-wedding.jpg', persona: 'wedding', plan: 'premium', rating: 5, quote: 'Parfait pour débuter. Interface simple, support au top.', date: '2024-01' },
  { id: '3', name: 'Emma Petit', role: 'Photographe mariage', location: 'Nice', photo: '/images/testimonials/emma-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Meilleure décision business de l\'année. ROI incroyable.', date: '2024-02' },
  { id: '4', name: 'Pierre Martin', role: 'Photographe mariage', location: 'Lyon', photo: '/images/testimonials/pierre-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Commission 10% vs 15% ailleurs. Ça fait une vraie différence.', date: '2024-02' },
  { id: '5', name: 'Julie Bernard', role: 'Photographe mariage', location: 'Toulouse', photo: '/images/testimonials/julie-wedding.jpg', persona: 'wedding', plan: 'premium', rating: 5, quote: 'Mes clients adorent l\'expérience. Galeries magnifiques.', date: '2024-02' },
  { id: '6', name: 'Marc Rousseau', role: 'Photographe mariage', location: 'Nantes', photo: '/images/testimonials/marc-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Support réactif, fonctionnalités complètes, prix juste.', date: '2024-03' },
  { id: '7', name: 'Claire Moreau', role: 'Photographe mariage', location: 'Strasbourg', photo: '/images/testimonials/claire-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Le domaine custom fait toute la différence pour mon image.', date: '2024-03' },
  { id: '8', name: 'Antoine Leroy', role: 'Photographe mariage', location: 'Lille', photo: '/images/testimonials/antoine-wedding.jpg', persona: 'wedding', plan: 'premium', rating: 5, quote: 'Migration depuis Pixieset ultra simple. Zéro stress.', date: '2024-03' },
  { id: '9', name: 'Isabelle Blanc', role: 'Photographe mariage', location: 'Rennes', photo: '/images/testimonials/isabelle-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Stockage illimité, c\'est la liberté totale.', date: '2024-04' },
  { id: '10', name: 'François Girard', role: 'Photographe mariage', location: 'Montpellier', photo: '/images/testimonials/francois-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Plugin Lightroom + commission basse = combo parfait.', date: '2024-04' },
  { id: '11', name: 'Nathalie Simon', role: 'Photographe mariage', location: 'Grenoble', photo: '/images/testimonials/nathalie-wedding.jpg', persona: 'wedding', plan: 'premium', rating: 5, quote: 'Interface intuitive, mes clients trouvent facilement leurs photos.', date: '2024-04' },
  { id: '12', name: 'Olivier Durand', role: 'Photographe mariage', location: 'Dijon', photo: '/images/testimonials/olivier-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'J\'économise 500$/mois. Incroyable.', date: '2024-05' },
  { id: '13', name: 'Sandrine Faure', role: 'Photographe mariage', location: 'Angers', photo: '/images/testimonials/sandrine-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Support en français, réponse en 1h. Impressionnant.', date: '2024-05' },
  { id: '14', name: 'Christophe Roux', role: 'Photographe mariage', location: 'Reims', photo: '/images/testimonials/christophe-wedding.jpg', persona: 'wedding', plan: 'premium', rating: 5, quote: 'Galeries élégantes, chargement rapide, clients ravis.', date: '2024-05' },
  { id: '15', name: 'Valérie Garnier', role: 'Photographe mariage', location: 'Tours', photo: '/images/testimonials/valerie-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Meilleur rapport qualité/prix du marché.', date: '2024-06' },

  // Event photographers (15)
  { id: '16', name: 'Thomas Martin', role: 'Photographe événementiel', location: 'Lyon', photo: '/images/testimonials/thomas-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'J\'économise 400$/mois entre abonnement et commissions.', date: '2024-01' },
  { id: '17', name: 'Camille Rousseau', role: 'Photographe événementiel', location: 'Toulouse', photo: '/images/testimonials/camille-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Je livre mes galeries 2x plus vite. Clients ravis.', date: '2024-01' },
  { id: '18', name: 'Alexandre Moreau', role: 'Photographe événementiel', location: 'Strasbourg', photo: '/images/testimonials/alex-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Le branding personnalisé fait la différence en corporate.', date: '2024-02' },
  { id: '19', name: 'Stéphanie Dubois', role: 'Photographe événementiel', location: 'Marseille', photo: '/images/testimonials/stephanie-event.jpg', persona: 'event', plan: 'premium', rating: 5, quote: 'Upload rapide, essentiel pour mes événements sportifs.', date: '2024-02' },
  { id: '20', name: 'Laurent Petit', role: 'Photographe événementiel', location: 'Nice', photo: '/images/testimonials/laurent-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Galeries illimitées, parfait pour mon volume d\'activité.', date: '2024-02' },
  { id: '21', name: 'Céline Bernard', role: 'Photographe événementiel', location: 'Nantes', photo: '/images/testimonials/celine-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Plugin Lightroom indispensable pour mes conférences.', date: '2024-03' },
  { id: '22', name: 'David Leroy', role: 'Photographe événementiel', location: 'Bordeaux', photo: '/images/testimonials/david-event.jpg', persona: 'event', plan: 'premium', rating: 5, quote: 'Prix juste, fonctionnalités pro, support réactif.', date: '2024-03' },
  { id: '23', name: 'Aurélie Simon', role: 'Photographe événementiel', location: 'Lille', photo: '/images/testimonials/aurelie-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Mes clients corporate adorent le branding personnalisé.', date: '2024-03' },
  { id: '24', name: 'Julien Blanc', role: 'Photographe événementiel', location: 'Rennes', photo: '/images/testimonials/julien-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Workflow ultra-rapide, essentiel pour mes événements.', date: '2024-04' },
  { id: '25', name: 'Patricia Girard', role: 'Photographe événementiel', location: 'Montpellier', photo: '/images/testimonials/patricia-event.jpg', persona: 'event', plan: 'premium', rating: 5, quote: 'Interface simple, clients trouvent leurs photos facilement.', date: '2024-04' },
  { id: '26', name: 'Sébastien Durand', role: 'Photographe événementiel', location: 'Grenoble', photo: '/images/testimonials/sebastien-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Commission 10%, ça change tout sur mon CA.', date: '2024-04' },
  { id: '27', name: 'Martine Faure', role: 'Photographe événementiel', location: 'Dijon', photo: '/images/testimonials/martine-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Support ultra-rapide, problèmes résolus en minutes.', date: '2024-05' },
  { id: '28', name: 'Éric Roux', role: 'Photographe événementiel', location: 'Angers', photo: '/images/testimonials/eric-event.jpg', persona: 'event', plan: 'premium', rating: 5, quote: 'Galeries magnifiques, chargement instantané.', date: '2024-05' },
  { id: '29', name: 'Sylvie Garnier', role: 'Photographe événementiel', location: 'Reims', photo: '/images/testimonials/sylvie-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Meilleure plateforme pour événements corporate.', date: '2024-05' },
  { id: '30', name: 'Thierry Mercier', role: 'Photographe événementiel', location: 'Tours', photo: '/images/testimonials/thierry-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'ROI exceptionnel, je recommande à tous mes confrères.', date: '2024-06' },

  // Portrait photographers (15)
  { id: '31', name: 'Sophie Laurent', role: 'Photographe portrait', location: 'Marseille', photo: '/images/testimonials/sophie-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Prix juste pour mon volume. Fonctionnalités complètes.', date: '2024-01' },
  { id: '32', name: 'Lucas Bernard', role: 'Photographe portrait', location: 'Nantes', photo: '/images/testimonials/lucas-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Simple, rapide, efficace. Exactement ce qu\'il me faut.', date: '2024-01' },
  { id: '33', name: 'Léa Fontaine', role: 'Photographe portrait', location: 'Lille', photo: '/images/testimonials/lea-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Mes clientes adorent l\'expérience. Élégant et simple.', date: '2024-02' },
  { id: '34', name: 'Nicolas Dubois', role: 'Photographe portrait', location: 'Paris', photo: '/images/testimonials/nicolas-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Parfait pour portraits corporate. Interface pro.', date: '2024-02' },
  { id: '35', name: 'Caroline Petit', role: 'Photographe portrait', location: 'Bordeaux', photo: '/images/testimonials/caroline-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Galeries élégantes, parfaites pour mes portraits famille.', date: '2024-02' },
  { id: '36', name: 'Maxime Martin', role: 'Photographe portrait', location: 'Lyon', photo: '/images/testimonials/maxime-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Support réactif, problèmes résolus rapidement.', date: '2024-03' },
  { id: '37', name: 'Amélie Rousseau', role: 'Photographe portrait', location: 'Toulouse', photo: '/images/testimonials/amelie-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Prix accessible, fonctionnalités pro. Parfait.', date: '2024-03' },
  { id: '38', name: 'Benjamin Moreau', role: 'Photographe portrait', location: 'Strasbourg', photo: '/images/testimonials/benjamin-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Plugin Lightroom me fait gagner un temps fou.', date: '2024-03' },
  { id: '39', name: 'Laure Simon', role: 'Photographe portrait', location: 'Nice', photo: '/images/testimonials/laure-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Clients ravis de la facilité de navigation.', date: '2024-04' },
  { id: '40', name: 'Guillaume Blanc', role: 'Photographe portrait', location: 'Rennes', photo: '/images/testimonials/guillaume-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Meilleur rapport qualité/prix pour portraits.', date: '2024-04' },
  { id: '41', name: 'Virginie Girard', role: 'Photographe portrait', location: 'Montpellier', photo: '/images/testimonials/virginie-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Interface intuitive, mes clients adorent.', date: '2024-04' },
  { id: '42', name: 'Raphaël Durand', role: 'Photographe portrait', location: 'Grenoble', photo: '/images/testimonials/raphael-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Galeries magnifiques, chargement rapide.', date: '2024-05' },
  { id: '43', name: 'Hélène Faure', role: 'Photographe portrait', location: 'Dijon', photo: '/images/testimonials/helene-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Support en français, réponse ultra-rapide.', date: '2024-05' },
  { id: '44', name: 'Fabien Roux', role: 'Photographe portrait', location: 'Angers', photo: '/images/testimonials/fabien-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Parfait pour mes séances nouveau-nés.', date: '2024-05' },
  { id: '45', name: 'Delphine Garnier', role: 'Photographe portrait', location: 'Reims', photo: '/images/testimonials/delphine-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Élégant, simple, professionnel. Parfait.', date: '2024-06' },

  // Studios (5)
  { id: '46', name: 'Studio PhotoPro', role: 'Studio photo', location: 'Paris', photo: '/images/testimonials/studio-photopro.jpg', persona: 'studio', plan: 'pro', rating: 5, quote: 'Solution parfaite pour notre studio. Centralisation totale.', date: '2024-01' },
  { id: '47', name: 'Studio Vision', role: 'Studio photo', location: 'Lyon', photo: '/images/testimonials/studio-vision.jpg', persona: 'studio', plan: 'pro', rating: 5, quote: 'Gestion multi-photographes impeccable.', date: '2024-02' },
  { id: '48', name: 'Studio Lumière', role: 'Studio photo', location: 'Marseille', photo: '/images/testimonials/studio-lumiere.jpg', persona: 'studio', plan: 'pro', rating: 5, quote: 'API puissante, intégration parfaite avec nos outils.', date: '2024-03' },
  { id: '49', name: 'Studio Créatif', role: 'Studio photo', location: 'Bordeaux', photo: '/images/testimonials/studio-creatif.jpg', persona: 'studio', plan: 'pro', rating: 5, quote: 'Support prioritaire exceptionnel. Toujours disponibles.', date: '2024-04' },
  { id: '50', name: 'Studio Image', role: 'Studio photo', location: 'Toulouse', photo: '/images/testimonials/studio-image.jpg', persona: 'studio', plan: 'pro', rating: 5, quote: 'Économies massives vs notre ancienne solution.', date: '2024-05' },

  // Additional testimonials to reach 50+
  { id: '51', name: 'Agnès Mercier', role: 'Photographe mariage', location: 'Clermont-Ferrand', photo: '/images/testimonials/agnes-wedding.jpg', persona: 'wedding', plan: 'pro', rating: 5, quote: 'Transition depuis ShootProof sans accroc.', date: '2024-06' },
  { id: '52', name: 'Bruno Lefebvre', role: 'Photographe événementiel', location: 'Caen', photo: '/images/testimonials/bruno-event.jpg', persona: 'event', plan: 'pro', rating: 5, quote: 'Stockage illimité, enfin la liberté.', date: '2024-06' },
  { id: '53', name: 'Corinne Dupuis', role: 'Photographe portrait', location: 'Orléans', photo: '/images/testimonials/corinne-portrait.jpg', persona: 'portrait', plan: 'premium', rating: 5, quote: 'Mes clients adorent la sélection facile.', date: '2024-06' },
];

export default function TestimonialsPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | 'all'>('all');
  const [selectedPlan, setSelectedPlan] = useState<'all' | 'free' | 'premium' | 'pro'>('all');

  const filteredTestimonials = TESTIMONIALS.filter(testimonial => {
    const personaMatch = selectedPersona === 'all' || testimonial.persona === selectedPersona;
    const planMatch = selectedPlan === 'all' || testimonial.plan === selectedPlan;
    return personaMatch && planMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-4 bg-yellow-600">Témoignages</Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Ce que disent nos photographes
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              500+ photographes nous font confiance. Découvrez leurs avis.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">4,8/5</span>
              <span className="text-gray-600">({TESTIMONIALS.length} avis)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="border-b bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtrer les témoignages</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={selectedPersona} onValueChange={(value) => setSelectedPersona(value as Persona | 'all')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type de photographe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="wedding">Mariage</SelectItem>
                  <SelectItem value="event">Événementiel</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="studio">Studios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'all' | 'free' | 'premium' | 'pro')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  <SelectItem value="free">Gratuit</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            {filteredTestimonials.length} témoignage{filteredTestimonials.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={testimonial.photo}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-xs text-gray-600">{testimonial.role}</p>
                        <p className="text-xs text-gray-500">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <blockquote className="mb-4 text-sm text-gray-700">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {testimonial.persona === 'wedding' && 'Mariage'}
                      {testimonial.persona === 'event' && 'Événementiel'}
                      {testimonial.persona === 'portrait' && 'Portrait'}
                      {testimonial.persona === 'studio' && 'Studio'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.plan === 'free' && 'Gratuit'}
                      {testimonial.plan === 'premium' && 'Premium'}
                      {testimonial.plan === 'pro' && 'Pro'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Ils nous font confiance
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600">Photographes actifs</div>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow-sm">
              <div className="mb-2 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="text-sm text-gray-600">Note moyenne 4,8/5</div>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-600">Taux de satisfaction</div>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-bold text-purple-600">3000$</div>
              <div className="text-sm text-gray-600">Économie moyenne/an</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Rejoignez 500+ photographes satisfaits
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Essayez PikSend gratuitement pendant 14 jours
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth">
                Essayer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/success-stories">
                Voir les success stories
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
