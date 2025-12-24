import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO, createFAQStructuredData } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Logo, LogoIcon } from '@/components/Logo';
import { 
  Shield, 
  Clock, 
  Download, 
  ChevronRight,
  Check,
  Sparkles,
  Users,
  Zap,
  Lock,
  Globe,
  Star,
  ArrowRight,
  Crown
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  const faqData = [
    { question: 'Comment partager mes photos avec mes clients ?', answer: "Uploadez vos photos, définissez un mot de passe et une date d'expiration, puis partagez le lien unique avec vos clients." },
    { question: 'Les galeries sont-elles sécurisées ?', answer: 'Oui, chaque galerie est protégée par un mot de passe unique et les données sont chiffrées avec SSL.' },
    { question: 'Combien de temps les galeries restent-elles accessibles ?', answer: 'Vous définissez la durée de vie. Elle peut aller de quelques jours à 180 jours selon votre abonnement.' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Protection par mot de passe',
      description: 'Chaque galerie est sécurisée par un mot de passe unique. Seuls vos clients y accèdent.',
    },
    {
      icon: Clock,
      title: 'Expiration automatique',
      description: 'Définissez une durée de vie. Vos galeries s\'autodétruisent après la date limite.',
    },
    {
      icon: Download,
      title: 'Qualité originale',
      description: 'Vos clients téléchargent les photos en qualité maximale, sans aucune compression.',
    },
    {
      icon: Globe,
      title: 'Lien unique partageable',
      description: 'Un lien simple à partager par email, SMS ou message. Accessible partout.',
    },
    {
      icon: Lock,
      title: 'Données sécurisées',
      description: 'Vos photos sont stockées sur des serveurs sécurisés avec chiffrement SSL.',
    },
    {
      icon: Zap,
      title: 'Rapide et simple',
      description: 'Uploadez vos photos, définissez un mot de passe, partagez. C\'est tout.',
    },
  ];

  const plans = [
    {
      name: 'Gratuit',
      price: '$0',
      period: '/mois',
      description: 'Pour découvrir PhotoServe',
      features: [
        '20 Mo de stockage',
        '3 galeries maximum',
        '30 images par galerie',
        'Expiration 30 jours max',
        '1 Mo max par image',
      ],
      cta: 'Commencer gratuitement',
      popular: false,
      icon: Sparkles,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/mois',
      description: 'Pour les photographes actifs',
      features: [
        '5 Go de stockage',
        '50 galeries maximum',
        '500 images par galerie',
        'Jusqu\'à 90 jours d\'expiration',
        'Taille illimitée par image',
      ],
      cta: 'Essayer Premium',
      popular: true,
      icon: Crown,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      name: 'Pro',
      price: '$25.99',
      period: '/mois',
      description: 'Pour les professionnels',
      features: [
        '50 Go de stockage',
        '500 galeries maximum',
        '5000 images par galerie',
        'Jusqu\'à 180 jours d\'expiration',
        'Support prioritaire',
      ],
      cta: 'Passer Pro',
      popular: false,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Photographes' },
    { value: '500K+', label: 'Galeries créées' },
    { value: '99.9%', label: 'Disponibilité' },
    { value: '5★', label: 'Note moyenne' },
  ];

  const testimonials = [
    {
      name: 'Marie Dupont',
      role: 'Photographe mariage',
      content: 'PhotoServe a révolutionné ma façon de livrer les photos à mes clients. Simple, sécurisé et professionnel.',
      avatar: 'MD',
    },
    {
      name: 'Pierre Martin',
      role: 'Portrait professionnel',
      content: 'Mes clients adorent la simplicité d\'accès. Plus besoin d\'expliquer comment télécharger des fichiers.',
      avatar: 'PM',
    },
    {
      name: 'Sophie Laurent',
      role: 'Photographe événementiel',
      content: 'L\'expiration automatique est géniale pour les événements. Les galeries se gèrent toutes seules.',
      avatar: 'SL',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEO 
        title="Partagez vos photos en toute sécurité"
        description="Créez des galeries photo temporaires et sécurisées par mot de passe. Partagez vos photos avec vos clients en toute confidentialité. Qualité originale garantie."
        keywords="galerie photo, partage photos, photographe professionnel, livraison photos client, portfolio sécurisé"
        structuredData={createFAQStructuredData(faqData)}
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Témoignages
            </a>
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
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button asChild className="btn-primary">
                  <Link to="/auth">
                    <span className="hidden sm:inline">Commencer</span>
                    <span className="sm:hidden">Connexion</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 relative">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-primary/10 rounded-full blur-[120px] sm:blur-[150px]" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm text-primary font-medium">Plateforme sécurisée pour photographes</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-slide-up">
            Partagez vos photos<br />
            <span className="gradient-text">en toute sécurité</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up px-4">
            Créez des galeries temporaires protégées par mot de passe. 
            Vos clients téléchargent en qualité originale, sans compromis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up px-4">
            <Button asChild size="lg" className="btn-primary text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Link to="/auth">
                Créer une galerie gratuite
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" asChild>
              <a href="#features">Découvrir</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-16 sm:mt-20 max-w-3xl mx-auto animate-fade-in">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">Comment ça marche</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Simple comme 1, 2, 3
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Partagez vos photos avec vos clients en quelques minutes seulement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Uploadez', desc: 'Glissez vos photos dans l\'interface' },
              { step: '2', title: 'Sécurisez', desc: 'Définissez un mot de passe et une date d\'expiration' },
              { step: '3', title: 'Partagez', desc: 'Envoyez le lien à vos clients' },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative inline-flex mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <ArrowRight className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              PhotoServe simplifie le partage de photos professionnelles avec vos clients.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/5 rounded-full blur-[100px] sm:blur-[120px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">Tarifs</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Commencez gratuitement et évoluez selon vos besoins. Sans engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={index} 
                  className={`glass-card relative flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular ? 'border-primary glow-effect' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3">
                        Populaire
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-xl ${plan.bgColor} mb-4`}>
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${plan.color}`} />
                    </div>
                    <CardTitle className="font-display text-xl sm:text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={user ? '/pricing' : '/auth'}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">Témoignages</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Découvrez ce que nos utilisateurs pensent de PhotoServe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-card hover:border-primary/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto">
          <Card className="glass-card border-primary/30 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            </div>
            <CardContent className="py-12 sm:py-16 px-6 sm:px-12 text-center relative z-10">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Prêt à simplifier vos livraisons ?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm sm:text-base">
                Rejoignez des milliers de photographes qui font confiance à PhotoServe pour partager leurs photos en toute sécurité.
              </p>
              <Button asChild size="lg" className="btn-primary text-base sm:text-lg px-6 sm:px-8">
                <Link to="/auth">
                  Créer mon compte gratuit
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 sm:py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoIcon size={20} />
                <span className="font-display text-xl font-bold">PhotoServe</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                La plateforme sécurisée pour partager vos photos avec vos clients.
              </p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">10 000+ photographes</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Témoignages</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-3">
                <li><Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/legal/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique des cookies</Link></li>
                <li><Link to="/legal/mentions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Centre d'aide</Link></li>
                <li><a href="mailto:contact@photoserve.fr" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2025 PhotoServe. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">By Akollad Group</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}