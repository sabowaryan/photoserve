import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { SavingsCalculator } from '@/components/conversion/savings-calculator';
import { TestimonialVideo } from '@/components/landing/testimonial-video';

export const metadata: Metadata = {
  title: 'PikSend vs Pic-Time - Comparaison détaillée 2024',
  description: 'Comparez PikSend et Pic-Time : prix, commissions, fonctionnalités. Économisez jusqu\'à 48$/an avec PikSend. Plugin Lightroom unique.',
  keywords: 'piksend vs pic-time, alternative pic-time, comparaison pic-time, meilleur que pic-time',
  openGraph: {
    title: 'PikSend vs Pic-Time - Comparaison détaillée',
    description: 'Commission 10% vs 15% • Plugin Lightroom unique • Prix plus bas',
  },
};

const PICTIME_FEATURES = [
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
    name: 'Pic-Time',
    price: 24,
    commission: 15,
    features: {
      price: '24$/mois',
      commission: '15%',
      lightroomPlugin: false,
      support: '24h',
      storage: 'Illimité',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
      clientSelection: true,
      watermark: true,
    },
  },
];

export default function PicTimeComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              PikSend vs Pic-Time
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Même qualité, commission plus basse, et un plugin Lightroom qui change tout
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">5% de commission en moins</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
                <Check className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">4$/mois moins cher</span>
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
                  <span className="text-gray-600">Pic-Time</span>
                  <span className="text-2xl font-bold text-gray-900">24$</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-green-600">
                    Économisez 48$/an
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
                  <span className="text-gray-600">Pic-Time</span>
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
                  <span className="text-sm text-gray-700">Prix plus bas</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-blue-600">
                    Meilleur rapport qualité/prix
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
            features={PICTIME_FEATURES}
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
            competitorName="Pic-Time"
            competitorPrice={24}
            competitorCommission={0.15}
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            "J'ai switché de Pic-Time à PikSend"
          </h2>
          <TestimonialVideo
            videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
            thumbnail="/images/testimonials/thomas-event-thumb.jpg"
            author={{
              name: 'Thomas Martin',
              role: 'Photographe événementiel',
              location: 'Lyon, France',
              photo: '/images/testimonials/thomas-event.jpg',
              persona: 'event',
            }}
            quote="Pic-Time était bien, mais PikSend est mieux. Commission plus basse, plugin Lightroom qui me fait gagner un temps fou, et support réactif. Le switch était évident."
            metrics={{
              revenue: '+4800$/an',
              timeSaved: '1.5h/galerie',
              roi: '350%',
            }}
            variant="featured"
          />
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="bg-blue-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Pourquoi passer de Pic-Time à PikSend ?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Économisez sur tout
              </h3>
              <p className="text-gray-600">
                Prix mensuel plus bas ET commission plus basse. Double économie sur votre budget.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Workflow Lightroom
              </h3>
              <p className="text-gray-600">
                Créez vos galeries directement depuis Lightroom. Fini l'export manuel et l'upload fastidieux.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Check className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Support français
              </h3>
              <p className="text-gray-600">
                Support en français, réponse en moins de 2h. Parlez à de vraies personnes qui comprennent vos besoins.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Check className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Même fonctionnalités
              </h3>
              <p className="text-gray-600">
                Toutes les fonctionnalités que vous aimez chez Pic-Time, mais en mieux et moins cher.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Prêt à faire le switch ?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Migration gratuite • Support dédié • Essai 14 jours
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
