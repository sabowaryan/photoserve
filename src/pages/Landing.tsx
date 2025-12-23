import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  Camera, 
  Shield, 
  Clock, 
  Download, 
  ChevronRight,
  Check,
  Sparkles
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Protection par mot de passe',
      description: 'Chaque galerie est protégée par un mot de passe unique que vous définissez.',
    },
    {
      icon: Clock,
      title: 'Expiration automatique',
      description: 'Définissez une durée de vie pour vos galeries. Elles s\'autodétruisent automatiquement.',
    },
    {
      icon: Download,
      title: 'Qualité originale',
      description: 'Vos clients téléchargent les photos en qualité originale, sans compression.',
    },
  ];

  const plans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '/mois',
      features: [
        '20 Mo de stockage',
        '3 galeries maximum',
        '30 images par galerie',
        'Expiration fixe 30 jours',
        'Taille max 1 Mo/image',
      ],
      cta: 'Commencer gratuitement',
      popular: false,
    },
    {
      name: 'Premium',
      price: '9,99€',
      period: '/mois',
      features: [
        '5 Go de stockage',
        '50 galeries maximum',
        '500 images par galerie',
        'Durée personnalisable (jusqu\'à 90 jours)',
        'Taille illimitée par image',
      ],
      cta: 'Essayer Premium',
      popular: true,
    },
    {
      name: 'Pro',
      price: '25,99€',
      period: '/mois',
      features: [
        '50 Go de stockage',
        '500 galeries maximum',
        '5000 images par galerie',
        'Durée personnalisable (jusqu\'à 180 jours)',
        'Taille illimitée par image',
      ],
      cta: 'Passer Pro',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="btn-primary">
                <Link to="/dashboard">
                  Dashboard
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button asChild className="btn-primary">
                  <Link to="/auth">Commencer</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Plateforme sécurisée pour photographes</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Partagez vos photos<br />
            <span className="gradient-text">en toute sécurité</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up">
            Créez des galeries temporaires protégées par mot de passe. 
            Vos clients téléchargent en qualité originale, sans compromis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Button asChild size="lg" className="btn-primary text-lg px-8">
              <Link to="/auth">
                Créer une galerie
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              <a href="#features">En savoir plus</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              PhotoServe simplifie le partage de photos professionnelles avec vos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card group hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Commencez gratuitement et évoluez selon vos besoins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`glass-card relative ${plan.popular ? 'border-primary glow-effect' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Populaire
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/auth">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display font-bold">PhotoServe</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PhotoServe. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}