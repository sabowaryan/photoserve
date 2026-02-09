import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { SavingsCalculator } from '@/components/conversion/savings-calculator';
import { TestimonialVideo } from '@/components/landing/testimonial-video';

export const metadata: Metadata = {
  title: 'PikSend vs Pixieset - Comparaison détaillée 2024',
  description: 'Comparez PikSend et Pixieset : prix, commissions, fonctionnalités. Économisez jusqu\'à 60$/mois avec PikSend. Plugin Lightroom unique.',
  keywords: 'piksend vs pixieset, alternative pixieset, comparaison pixieset, meilleur que pixieset',
  openGraph: {
    title: 'PikSend vs Pixieset - Comparaison détaillée',
    description: 'Commission 10% vs 15% • Plugin Lightroom unique • Support ultra-rapide',
  },
};

const PIXIESET_FEATURES = [
  { key: 'price', label: 'Prix mensuel', important: true },
  { key: 'commission', label: 'Commission sur ventes', important: true },
  { key: 'lightroomPlugin', label: 'Plugin Lightroom', important: true },
  { key: 'support', label: 'Temps de réponse support', important: true },
  { key: 'storage', label: 'Stockage', important: false },
  { key: 'galleries', label: 'Nombre de galeries', important: false },
  { key: 'customDomain', label: 'Domaine personnalisé', important: false },
  { key: 'branding', label: 'Branding personnalisé', important: false },
  { key: 'clientSelection', label: 'Sélection client', important: false },
  { key: 'watermark', label: 'Filigrane personnalisé', important: false },
];

const COMPETITORS = [
  {
    name: 'PikSend',
    price: 19.99,
    commission: 10,
    features: {
      price: '19,99$/mois',
      commission: '10%',
      lightroomPlugin: true,
      support: '< 2h',
      storage: 'Illimité',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
      clientSelection: true,
      watermark: true,
    },
  },
  {
    name: 'Pixieset',
    price: 25,
    commission: 15,
    features: {
      price: '25$/mois',
      commission: '15%',
      lightroomPlugin: false,
      support: '24-48h',
      storage: '100 GB',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
      clientSelection: true,
      watermark: true,
    },
  },
];

export default function PixiesetComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              PikSend vs Pixieset
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Même fonctionnalités, commission plus basse, prix plus bas, et un plugin Lightroom unique
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">5% de commission en moins</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
                <Check className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">5$/mois moins cher</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
                <Check className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Plugin Lightroom unique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Comparaison rapide
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Price */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Prix</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">PikSend</span>
                  <span className="text-2xl font-bold text-green-600">19,99$</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pixieset</span>
                  <span className="text-2xl font-bold text-gray-900">25$</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-green-600">
                    Économisez 60$/an
                  </span>
                </div>
              </div>
            </div>

            {/* Commission */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Commission</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">PikSend</span>
                  <span className="text-2xl font-bold text-green-600">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pixieset</span>
                  <span className="text-2xl font-bold text-gray-900">15%</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-green-600">
                    Gardez 5% de plus
                  </span>
                </div>
              </div>
            </div>

            {/* Unique Feature */}
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Différenciateur</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Plugin Lightroom</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Support &lt; 2h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Stockage illimité</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-blue-600">
                    Fonctionnalités exclusives
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Comparaison détaillée
          </h2>
          <ComparisonTable
            competitors={COMPETITORS}
            features={PIXIESET_FEATURES}
            highlightPikSend={true}
          />
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Calculez vos économies
          </h2>
          <SavingsCalculator
            competitorName="Pixieset"
            competitorPrice={25}
            competitorCommission={0.15}
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            "J'ai switché de Pixieset à PikSend"
          </h2>
          <TestimonialVideo
            videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
            thumbnail="/images/testimonials/marie-wedding-thumb.jpg"
            author={{
              name: 'Marie Dubois',
              role: 'Photographe de mariage',
              location: 'Paris, France',
              photo: '/images/testimonials/marie-wedding.jpg',
              persona: 'wedding',
            }}
            quote="J'utilisais Pixieset depuis 3 ans. En passant à PikSend, j'économise 500$/mois sur les commissions et le plugin Lightroom me fait gagner 2h par galerie."
            metrics={{
              revenue: '+6000$/an',
              timeSaved: '2h/galerie',
              roi: '400%',
            }}
            variant="featured"
          />
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="bg-blue-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Pourquoi passer de Pixieset à PikSend ?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Commission plus basse
              </h3>
              <p className="text-gray-600">
                Gardez 90% de vos ventes au lieu de 85%. Sur 5000$/mois de ventes, c'est 250$/mois de plus dans votre poche.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Plugin Lightroom unique
              </h3>
              <p className="text-gray-600">
                Créez et uploadez vos galeries directement depuis Lightroom. Gagnez 2h par galerie en éliminant l'export manuel.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Check className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Support ultra-rapide
              </h3>
              <p className="text-gray-600">
                Réponse en moins de 2h vs 24-48h chez Pixieset. Problème résolu rapidement = clients satisfaits.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Check className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Migration gratuite
              </h3>
              <p className="text-gray-600">
                Notre équipe vous aide à migrer vos galeries gratuitement. Transition en douceur, zéro stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Prêt à économiser 500$/mois ?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Rejoignez 500+ photographes qui ont fait le switch
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
            Pas de carte bancaire requise • Migration gratuite • Support dédié
          </p>
        </div>
      </section>
    </div>
  );
}
