import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComparisonTable } from '@/components/conversion/comparison-table';

export const metadata: Metadata = {
  title: 'Alternatives aux plateformes de galeries photo - PikSend',
  description: 'Comparez PikSend avec Pixieset, Pic-Time, ShootProof et autres. Commission la plus basse (10%), plugin Lightroom unique, prix compétitifs.',
  keywords: 'alternative pixieset, alternative pic-time, alternative shootproof, plateforme galerie photo, partage photos photographe',
  openGraph: {
    title: 'Meilleures alternatives pour galeries photo professionnelles',
    description: 'Commission 10% • Plugin Lightroom • Support ultra-rapide',
  },
};

const ALL_COMPETITORS = [
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
    },
  },
];

const COMPARISON_FEATURES = [
  { key: 'price', label: 'Prix mensuel', important: true },
  { key: 'commission', label: 'Commission', important: true },
  { key: 'lightroomPlugin', label: 'Plugin Lightroom', important: true },
  { key: 'support', label: 'Support', important: true },
  { key: 'storage', label: 'Stockage', important: false },
  { key: 'galleries', label: 'Galeries', important: false },
  { key: 'customDomain', label: 'Domaine custom', important: false },
  { key: 'branding', label: 'Branding', important: false },
];

export default function AlternativesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-600">Comparateur</Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Trouvez la meilleure plateforme pour vos galeries photo
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Comparez PikSend avec les principales alternatives du marché
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">4,8/5 étoiles</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">500+ photographes</span>
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">Commission la plus basse</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why PikSend Stands Out */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Pourquoi PikSend se démarque
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Commission la plus basse</CardTitle>
                <CardDescription>10% vs 15% chez les concurrents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Sur 5000$/mois de ventes, économisez 250$/mois. C'est 3000$/an de plus dans votre poche.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Plugin Lightroom unique</CardTitle>
                <CardDescription>Seule plateforme avec intégration native</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Créez et uploadez vos galeries directement depuis Lightroom. Gagnez 2h par galerie.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Check className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Support ultra-rapide</CardTitle>
                <CardDescription>Réponse en moins de 2h</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Support en français, réponse rapide, vraies personnes. Pas de chatbot, pas d'attente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Comparaison complète
          </h2>
          <ComparisonTable
            competitors={ALL_COMPETITORS}
            features={COMPARISON_FEATURES}
            highlightPikSend={true}
          />
        </div>
      </section>

      {/* Individual Comparisons */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Comparaisons détaillées
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>PikSend vs Pixieset</CardTitle>
                <CardDescription>
                  Économisez 60$/an + 5% de commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>5$/mois moins cher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Commission 10% vs 15%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Plugin Lightroom unique</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Stockage illimité</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/vs/pixieset">
                    Voir la comparaison
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PikSend vs Pic-Time</CardTitle>
                <CardDescription>
                  Économisez 48$/an + 5% de commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>4$/mois moins cher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Commission 10% vs 15%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Plugin Lightroom unique</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Support plus rapide</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/vs/pic-time">
                    Voir la comparaison
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PikSend vs ShootProof</CardTitle>
                <CardDescription>
                  Économisez 120$/an + 5% de commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>10$/mois moins cher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Commission 10% vs 15%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Stockage illimité vs 50 GB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Domaine custom inclus</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/vs/shootproof">
                    Voir la comparaison
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Decision Matrix */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Quelle plateforme pour vous ?
          </h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Vous cherchez la commission la plus basse ?
                </h3>
                <p className="mb-3 text-gray-600">
                  PikSend offre la commission la plus basse du marché à 10%. Gardez 90% de vos ventes.
                </p>
                <Badge className="bg-green-600">PikSend - Meilleur choix</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Vous utilisez Lightroom ?
                </h3>
                <p className="mb-3 text-gray-600">
                  PikSend est la seule plateforme avec un plugin Lightroom natif. Gagnez 2h par galerie.
                </p>
                <Badge className="bg-blue-600">PikSend - Seule option</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Vous voulez le meilleur rapport qualité/prix ?
                </h3>
                <p className="mb-3 text-gray-600">
                  PikSend combine prix bas, commission basse, et fonctionnalités complètes. Le meilleur ROI.
                </p>
                <Badge className="bg-purple-600">PikSend - Meilleur ROI</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Vous avez besoin de support rapide ?
                </h3>
                <p className="mb-3 text-gray-600">
                  PikSend répond en moins de 2h vs 24-48h chez les concurrents. Support en français.
                </p>
                <Badge className="bg-orange-600">PikSend - Support le plus rapide</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à faire le meilleur choix ?
          </h2>
          <p className="mb-8 text-xl opacity-90">
            Essayez PikSend gratuitement pendant 14 jours
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="/auth">
                Essayer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-white bg-transparent text-white hover:bg-white/10 sm:w-auto">
              <Link href="/contact">
                Parler à un expert
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm opacity-75">
            Pas de carte bancaire requise • Migration gratuite • Support dédié
          </p>
        </div>
      </section>
    </div>
  );
}
