import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Camera, 
  Check, 
  ChevronRight,
  Crown,
  Zap,
  Sparkles,
  Loader2,
  ArrowLeft
} from 'lucide-react';

const PLANS = [
  {
    key: 'free',
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    description: 'Parfait pour découvrir PhotoServe',
    features: [
      { text: '20 Mo de stockage', included: true },
      { text: '3 galeries maximum', included: true },
      { text: '30 images par galerie', included: true },
      { text: 'Expiration fixe 30 jours', included: true },
      { text: 'Taille max 1 Mo/image', included: true },
      { text: 'Durée personnalisable', included: false },
      { text: 'Support prioritaire', included: false },
    ],
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    popular: false,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '9,99',
    period: '/mois',
    description: 'Pour les photographes actifs',
    features: [
      { text: '5 Go de stockage', included: true },
      { text: '50 galeries maximum', included: true },
      { text: '500 images par galerie', included: true },
      { text: 'Durée jusqu\'à 90 jours', included: true },
      { text: 'Taille illimitée par image', included: true },
      { text: 'Durée personnalisable', included: true },
      { text: 'Support prioritaire', included: false },
    ],
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    popular: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '25,99',
    period: '/mois',
    description: 'Pour les professionnels exigeants',
    features: [
      { text: '50 Go de stockage', included: true },
      { text: '500 galeries maximum', included: true },
      { text: '5000 images par galerie', included: true },
      { text: 'Durée jusqu\'à 180 jours', included: true },
      { text: 'Taille illimitée par image', included: true },
      { text: 'Durée personnalisable', included: true },
      { text: 'Support prioritaire', included: true },
    ],
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const currentPlan = profile?.subscription_plan || 'free';

  const handleSubscribe = async (planKey: string) => {
    if (planKey === 'free') {
      navigate('/auth');
      return;
    }

    if (!session?.access_token) {
      toast.error('Vous devez être connecté pour souscrire');
      navigate('/auth');
      return;
    }

    setSubscribingTo(planKey);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planKey }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer la session de paiement.',
      });
    } finally {
      setSubscribingTo(null);
    }
  };

  const getButtonText = (planKey: string) => {
    if (currentPlan === planKey) return 'Plan actuel';
    if (planKey === 'free') return 'Commencer gratuitement';
    if (currentPlan === 'pro') return 'Contacter le support';
    if (currentPlan === 'premium' && planKey === 'free') return 'Contacter le support';
    return 'Choisir ce plan';
  };

  const isUpgrade = (planKey: string) => {
    const planOrder = { free: 0, premium: 1, pro: 2 };
    return planOrder[planKey as keyof typeof planOrder] > planOrder[currentPlan as keyof typeof planOrder];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild variant="outline">
                <Link to="/dashboard">Dashboard</Link>
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

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Choisissez votre plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Commencez gratuitement et évoluez selon vos besoins. 
              Tous les plans incluent un accès complet à toutes les fonctionnalités de base.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.key;
              const canUpgrade = isUpgrade(plan.key);
              
              return (
                <Card 
                  key={plan.key}
                  className={`relative flex flex-col ${
                    plan.popular 
                      ? 'border-primary shadow-lg shadow-primary/10' 
                      : isCurrentPlan 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'bg-card/50 border-border/40'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3">
                        Populaire
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="bg-background">
                        Votre plan
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-xl ${plan.bgColor} mb-4`}>
                      <Icon className={`h-8 w-8 ${plan.color}`} />
                    </div>
                    <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}€</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check 
                            className={`h-5 w-5 shrink-0 mt-0.5 ${
                              feature.included ? plan.color : 'text-muted-foreground/30'
                            }`} 
                          />
                          <span className={`text-sm ${
                            feature.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'
                          }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isCurrentPlan || subscribingTo === plan.key || (currentPlan === 'pro' && plan.key !== 'pro')}
                      className={`w-full gap-2 ${plan.popular ? 'btn-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {subscribingTo === plan.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : canUpgrade ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : null}
                      {getButtonText(plan.key)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ/Note */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground text-sm">
              Besoin d'aide pour choisir ? <Link to="/auth" className="text-primary hover:underline">Contactez-nous</Link>
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Tous les prix sont en euros et hors taxes. Vous pouvez annuler à tout moment.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Camera className="h-4 w-4" />
            <span className="font-display font-medium">PhotoServe</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
