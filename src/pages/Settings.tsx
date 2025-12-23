import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Shield, 
  Camera,
  Save,
  ExternalLink,
  Check,
  Loader2,
  Crown,
  Zap
} from 'lucide-react';

const STRIPE_PLANS = {
  premium: {
    name: 'Premium',
    price: 9.99,
    features: ['5 Go de stockage', '50 galeries', '500 images par galerie', 'Taille illimitée par image', 'Durée jusqu\'à 90 jours'],
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  pro: {
    name: 'Pro',
    price: 25.99,
    features: ['50 Go de stockage', '500 galeries', '5000 images par galerie', 'Taille illimitée par image', 'Durée jusqu\'à 180 jours', 'Support prioritaire'],
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, session, signOut } = useAuth();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setName(data.name || '');
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Check subscription status on mount and after checkout
  const checkSubscription = async () => {
    if (!session?.access_token) return;
    
    setIsCheckingSubscription(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check subscription');
      }

      const data = await response.json();
      console.log('Subscription status:', data);
      
      // Refresh profile data
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      return data;
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  // Check subscription on mount and after success
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
    }
  }, [session?.access_token]);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Abonnement activé !', {
        description: 'Merci pour votre abonnement. Votre compte a été mis à jour.',
      });
      checkSubscription();
      // Clean URL
      navigate('/settings', { replace: true });
    }

    if (canceled === 'true') {
      toast.info('Paiement annulé', {
        description: 'Vous pouvez réessayer à tout moment.',
      });
      navigate('/settings', { replace: true });
    }
  }, [searchParams]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Profil mis à jour');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscribe = async (plan: 'premium' | 'pro') => {
    if (!session?.access_token) {
      toast.error('Vous devez être connecté');
      return;
    }

    setSubscribingTo(plan);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan }),
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

  const handleManageSubscription = async () => {
    if (!session?.access_token) {
      toast.error('Vous devez être connecté');
      return;
    }

    setIsManaging(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'accéder au portail.',
      });
    } finally {
      setIsManaging(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentPlan = profile?.subscription_plan || 'free';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-xl font-display font-bold">Paramètres</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Profile Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>Gérez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  value={profile?.email || ''} 
                  disabled 
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Abonnement</CardTitle>
                    <CardDescription>Gérez votre plan et facturation</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={checkSubscription}
                  disabled={isCheckingSubscription}
                >
                  {isCheckingSubscription ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Actualiser'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Display */}
              <div className="p-4 rounded-xl bg-gradient-subtle border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan actuel</p>
                    <p className="text-2xl font-display font-bold capitalize">
                      {currentPlan === 'free' ? 'Gratuit' : currentPlan}
                    </p>
                  </div>
                  <Badge 
                    variant={currentPlan !== 'free' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {currentPlan === 'free' ? 'Gratuit' : 'Actif'}
                  </Badge>
                </div>
                
                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground">Stockage</p>
                    <p className="text-lg font-semibold">
                      {profile?.storage_used_mb?.toFixed(1) || '0'} 
                      <span className="text-sm text-muted-foreground font-normal">
                        {' '}/ {profile?.storage_limit_mb || 20} Mo
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground">Galeries max</p>
                    <p className="text-lg font-semibold">{profile?.max_galleries || 3}</p>
                  </div>
                </div>

                {profile?.stripe_subscription_id && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <Button 
                      variant="outline" 
                      onClick={handleManageSubscription}
                      disabled={isManaging}
                      className="gap-2"
                    >
                      {isManaging ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Gérer l'abonnement
                    </Button>
                  </div>
                )}
              </div>

              {/* Available Plans */}
              {currentPlan === 'free' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-display font-semibold mb-4">Passer à un plan supérieur</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
                        const Icon = plan.icon;
                        const isCurrentPlan = currentPlan === key;
                        
                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border ${
                              isCurrentPlan 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border/40 bg-card/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                                <Icon className={`h-5 w-5 ${plan.color}`} />
                              </div>
                              <div>
                                <h4 className="font-display font-semibold">{plan.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  <span className="text-lg font-bold text-foreground">${plan.price}</span>/mois
                                </p>
                              </div>
                            </div>
                            
                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <Check className={`h-4 w-4 ${plan.color}`} />
                                  <span className="text-muted-foreground">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <Button
                              onClick={() => handleSubscribe(key as 'premium' | 'pro')}
                              disabled={subscribingTo === key || isCurrentPlan}
                              className="w-full"
                              variant={key === 'pro' ? 'default' : 'outline'}
                            >
                              {subscribingTo === key ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Upgrade option for premium users */}
              {currentPlan === 'premium' && (
                <>
                  <Separator />
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold">Passer à Pro</h4>
                        <p className="text-sm text-muted-foreground">
                          <span className="text-lg font-bold text-foreground">$25.99</span>/mois
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {STRIPE_PLANS.pro.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe('pro')}
                      disabled={subscribingTo === 'pro'}
                      className="w-full"
                    >
                      {subscribingTo === 'pro' && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Passer à Pro
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez votre compte et sessions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-sm text-muted-foreground mb-1">Connecté via</p>
                <p className="font-medium">
                  {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                </p>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut}
                >
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
