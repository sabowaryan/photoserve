import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { SavingsCalculator } from '@/components/conversion/savings-calculator';
import { TestimonialVideo } from '@/components/landing/testimonial-video';

export const metadata: Metadata = {
  title: 'PikSend vs ShootProof - Comparaison détaillée 2024',
  description: 'Comparez PikSend et ShootProof : prix, commissions, fonctionnalités. Économisez jusqu\'à 120$/an avec PikSend. Plugin Lightroom unique.',
  keywords: 'piksend vs shootproof, alternative shootproof, comparaison shootproof, meilleur que shootproof',
  openGraph: {
    title: 'PikSend vs ShootProof - Comparaison détaillée',
    description: 'Commission 10% vs 15% • Plugin Lightroom unique • 10$/mois moins cher',
  },
};

const SHOOTPROOF_FEATURES = [
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
    name: 'ShootProof',
    price: 30,
    commission: 15,
    features: {
      price: '30$/mois',
      commission: '15%',
      lightroomPlugin: false,
      support: '24h',
      storage: '50 GB',
      galleries: 'Illimité',
      customDomain: false,
      branding: true,
      clientSelection: true,
      watermark: true,
    },
  },
];

export default function ShootProofComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              PikSend vs ShootProof
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Plus de fonctionnalités, commission plus basse, prix 33% moins cher
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">5% de commission en moins</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
                <Check className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">10$/mois moins cher</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
                <Check className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Stockage illimité</span>
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
                  <span className="text-gray-600">ShootProof</span>
                  <span className="text-2xl font-bold text-gray-900">30$</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-green-600">
                    Économisez 120$/an
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
                  <span className="text-gray-600">ShootProof</span>
                  <span className="text-2xl font-bold text-gray-900">15%</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-green-600">
                    Gardez 5% de plus
                  </span>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Stockage</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">PikSend</span>
                  <span className="text-2xl font-bold text-green-600">Illimité</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ShootProof</span>
                  <span className="text-2xl font-bold text-gray-900">50 GB</span>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-sm font-semibold text-blue-600">
                    Aucune limite
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
            features={SHOOTPROOF_FEATURES}
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
            competitorName="ShootProof"
            competitorPrice={30}
            competitorCommission={0.15}
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            "J'ai switché de ShootProof à PikSend"
          </h2>
          <TestimonialVideo
            videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
            thumbnail="/images/testimonials/sophie-portrait-thumb.jpg"
            author={{
              name: 'Sophie Laurent',
              role: 'Photographe portrait',
              location: 'Marseille, France',
              photo: '/images/testimonials/sophie-portrait.jpg',
              persona: 'portrait',
            }}
            quote="ShootProof était trop cher pour ce que j'en faisais. PikSend me donne tout ce dont j'ai besoin pour moitié prix, avec un stockage illimité et le plugin Lightroom en bonus."
            metrics={{
              revenue: '+3600$/an',
              timeSaved: '2h/galerie',
              roi: '280%',
            }}
            variant="featured"
          />
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="bg-blue-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Pourquoi passer de ShootProof à PikSend ?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Prix 33% moins cher
              </h3>
              <p className="text-gray-600">
                19,99$ vs 30$. Économisez 120$/an sur votre abonnement, sans compromis sur les fonctionnalités.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Stockage illimité
              </h3>
              <p className="text-gray-600">
                Fini les 50 GB de limite. Uploadez autant de photos que vous voulez, sans surcoût.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Check className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Plugin Lightroom
              </h3>
              <p className="text-gray-600">
                Créez vos galeries directement depuis Lightroom. Workflow ultra-rapide, zéro friction.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Check className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Domaine personnalisé inclus
              </h3>
              <p className="text-gray-600">
                Domaine custom inclus dans le plan Pro. Chez ShootProof, c'est un extra payant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Prêt à économiser 600$/an ?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Rejoignez les photographes qui ont fait le bon choix
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
