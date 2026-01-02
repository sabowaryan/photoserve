import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/shared/logo';
import { Footer, MobileNav } from '@/components/layouts';
import { generateStructuredData } from '@/lib/services/seo.service';
import { HeroSceneWrapper } from '@/components/three/hero-scene-wrapper';
import { getLandingContent } from '@/lib/content/landing';
import { 
  Shield, 
  Clock, 
  ChevronRight,
  Check,
  Zap,
  Lock,
  Star,
  ArrowRight,
  Crown,
  AlertTriangle,
  MessageCircleQuestion
} from 'lucide-react';

// Icon mapping for dynamic rendering
const iconMap = {
  Shield,
  Clock,
  Zap,
  Lock,
  Crown,
} as const;

export default function LandingPage() {
  // Get content from markdown file
  const content = getLandingContent();
  
  // Generate FAQ structured data for SEO
  const faqStructuredData = generateStructuredData('FAQPage', { 
    faqs: content.faq.items.map(f => ({ question: f.question, answer: f.answer })) 
  });

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Aide
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link href="/auth">Connexion</Link>
            </Button>
            <Button asChild className="btn-primary hidden sm:inline-flex">
              <Link href="/auth">Créer une galerie</Link>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 relative min-h-[90vh] flex items-center">
        <HeroSceneWrapper />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80 pointer-events-none z-[1]" />

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8 animate-fade-in">
            <span className="text-xs sm:text-sm text-primary font-medium">
              {content.hero.badge}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-slide-up">
            {content.hero.title}<br />
            <span className="gradient-text">{content.hero.titleHighlight}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up px-4">
            {content.hero.subtitle}
            <span className="text-foreground font-medium"> {content.hero.subtitleHighlight}</span>
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 animate-slide-up px-4 max-w-md sm:max-w-none mx-auto">
            <Button asChild size="lg" className="btn-primary text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 w-full sm:w-auto whitespace-normal sm:whitespace-nowrap text-center leading-tight py-3 sm:py-4 h-auto">
              <Link href="/auth" className="flex items-center justify-center gap-2">
                <span className="hidden sm:inline">{content.hero.cta}</span>
                <span className="sm:hidden">Créer ma galerie gratuite</span>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              </Link>
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              {content.hero.ctaSecondary}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-16 sm:mt-20 max-w-3xl mx-auto animate-fade-in">
            {content.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION PROBLÈME */}
      <section id="probleme" className="py-16 sm:py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-destructive/50 text-destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {content.problem.badge}
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              {content.problem.title}<br />{content.problem.titleLine2}
            </h2>
          </div>

          <div className="space-y-6 text-base sm:text-lg text-muted-foreground mb-12">
            {content.problem.paragraphs.map((para, index) => (
              <p key={index}>
                {para.text}
                {para.highlight && <span className="text-foreground font-medium"> {para.highlight}</span>}
              </p>
            ))}
          </div>

          <Card className="glass-card border-destructive/20 bg-destructive/5">
            <CardContent className="py-8 px-6">
              <div className="grid md:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{content.problem.comparison.original.label}</p>
                  <p className="text-2xl font-bold text-foreground">{content.problem.comparison.original.value}</p>
                  <p className="text-sm text-muted-foreground">{content.problem.comparison.original.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{content.problem.comparison.compressed.label}</p>
                  <p className="text-2xl font-bold text-destructive">{content.problem.comparison.compressed.value}</p>
                  <p className="text-sm text-muted-foreground">{content.problem.comparison.compressed.description}</p>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
                {content.problem.comparison.footer}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION SOLUTION */}
      <section id="solution" className="py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              {content.solution.badge}
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              {content.solution.title}<br />{content.solution.titleLine2}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              {content.solution.subtitle}
              <span className="text-foreground font-medium"> {content.solution.subtitleHighlight}</span>
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16">
            {content.benefits.map((benefit, index) => {
              const Icon = iconMap[benefit.icon as keyof typeof iconMap] || Shield;
              return (
                <Card key={index} className="glass-card group hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-xs font-medium text-primary mb-2">{benefit.highlight}</div>
                    <CardTitle className="font-display text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base">{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Steps */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-center mb-8">
              {content.steps.title}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {content.steps.items.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative inline-flex mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      {item.step}
                    </div>
                    {index < content.steps.items.length - 1 && (
                      <ArrowRight className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION TÉMOIGNAGES */}
      <section className="py-16 sm:py-24 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">{content.testimonials.badge}</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {content.testimonials.title}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {content.testimonials.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {content.testimonials.items.map((testimonial, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-foreground mb-6 leading-relaxed">
                    &quot;{testimonial.content}&quot;
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

      {/* SECTION TARIFS */}
      <section id="tarifs" className="py-16 sm:py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4">{content.pricing.badge}</Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {content.pricing.title}<br />{content.pricing.titleLine2}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {content.pricing.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {content.plans.map((plan, index) => {
              const Icon = plan.popular ? Crown : Zap;
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
                        Le plus choisi
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-xl ${plan.popular ? 'bg-amber-500/10' : 'bg-muted/50'} mb-4`}>
                      <Icon className={`h-6 w-6 ${plan.popular ? 'text-amber-500' : 'text-muted-foreground'}`} />
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
                      <Link href="/auth">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              <Lock className="h-4 w-4 inline mr-1" />
              {content.pricing.guarantee}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION FAQ */}
      <section className="py-16 sm:py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <MessageCircleQuestion className="h-3 w-3 mr-1" />
              {content.faq.badge}
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
              {content.faq.title}
            </h2>
          </div>

          <div className="space-y-4">
            {content.faq.items.map((faq, index) => (
              <Card key={index} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <Card className="glass-card border-primary/30 overflow-hidden relative max-w-4xl mx-auto">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            </div>
            <CardContent className="py-12 sm:py-16 px-6 sm:px-12 text-center relative z-10">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {content.cta.title}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                {content.cta.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <Button asChild size="lg" className="btn-primary text-base sm:text-lg px-8">
                  <Link href="/auth">
                    {content.cta.button}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {content.cta.footer}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
