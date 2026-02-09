import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Démo Interactive PikSend - Essayez avant de vous inscrire',
  description: 'Découvrez PikSend en action avec notre démo interactive. Testez la création de galerie, le partage, et toutes les fonctionnalités sans créer de compte.',
  keywords: 'demo piksend, essai piksend, test piksend, démo galerie photo',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Découvrez PikSend en action
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Explorez toutes les fonctionnalités avec notre démo interactive
          </p>
          <Button size="lg" className="gap-2">
            <Play className="h-5 w-5" />
            Lancer la démo
          </Button>
        </div>
      </section>

      {/* Demo Features */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Ce que vous allez découvrir
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Création de galerie</CardTitle>
                <CardDescription>
                  Voyez comment créer une galerie en quelques clics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Upload de photos, organisation, personnalisation du design et des paramètres.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expérience client</CardTitle>
                <CardDescription>
                  Découvrez ce que vos clients verront
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Navigation intuitive, sélection de photos, téléchargement, et partage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités Pro</CardTitle>
                <CardDescription>
                  Explorez les options avancées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Branding personnalisé, domaine custom, analytics, et plus encore.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Prêt à essayer avec vos photos ?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Créez votre compte gratuit et uploadez votre première galerie
          </p>
          <Button asChild size="lg">
            <Link href="/auth">
              Essayer avec mes photos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
