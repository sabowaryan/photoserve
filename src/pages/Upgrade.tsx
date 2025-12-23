import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useState } from 'react';
import { 
  Camera, 
  Check, 
  ChevronRight,
  Crown,
  Zap,
  Sparkles,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  HardDrive,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';

const LIMITS_INFO = {
  galleries: {
    icon: FolderOpen,
    title: 'Limite de galeries atteinte',
    description: 'Vous avez atteint le nombre maximum de galeries pour votre plan.',
  },
  storage: {
    icon: HardDrive,
    title: 'Espace de stockage insuffisant',
    description: 'Votre espace de stockage est plein ou insuffisant pour vos fichiers.',
  },
  images: {
    icon: ImageIcon,
    title: 'Limite d\'images atteinte',
    description: 'Vous avez atteint le nombre maximum d\'images par galerie.',
  },
};

const PLANS = [
  {
    key: 'free',
    name: 'Gratuit',
    price: '$0',
    storage: '20 Mo',
    galleries: 3,
    imagesPerGallery: 30,
    maxImageSize: '1 Mo',
    maxDuration: '30 jours',
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$9.99',
    storage: '5 Go',
    galleries: 50,
    imagesPerGallery: 500,
    maxImageSize: 'Illimité',
    maxDuration: '90 jours',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    popular: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$25.99',
    storage: '50 Go',
    galleries: 500,
    imagesPerGallery: 5000,
    maxImageSize: 'Illimité',
    maxDuration: '180 jours',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const limitType = searchParams.get('limit') as keyof typeof LIMITS_INFO | null;
  const limitInfo = limitType ? LIMITS_INFO[limitType] : null;
  const LimitIcon = limitInfo?.icon || AlertTriangle;

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: galleryCount = 0 } = useQuery({
    queryKey: ['galleryCount', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const currentPlan = profile?.subscription_plan || 'free';
  const currentPlanData = PLANS.find(p => p.key === currentPlan);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === 'free' || planKey === currentPlan) return;

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

  const isUpgrade = (planKey: string) => {
    const planOrder = { free: 0, premium: 1, pro: 2 };
    return planOrder[planKey as keyof typeof planOrder] > planOrder[currentPlan as keyof typeof planOrder];
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
            </Link>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Alert Banner */}
          {limitInfo && (
            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <LimitIcon className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">{limitInfo.title}</h3>
                  <p className="text-sm text-muted-foreground">{limitInfo.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Passez à un plan supérieur
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Débloquez plus de fonctionnalités et augmentez vos limites pour continuer à développer votre activité.
            </p>
          </div>

          {/* Current Usage */}
          <Card className="mb-8 glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Votre utilisation actuelle</CardTitle>
                <Badge className={currentPlanData?.bgColor}>
                  {currentPlan.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Stockage
                  </span>
                  <span className="text-sm font-medium">
                    {profile?.storage_used_mb?.toFixed(1) || 0} / {profile?.storage_limit_mb || 20} Mo
                  </span>
                </div>
                <Progress 
                  value={((profile?.storage_used_mb || 0) / (profile?.storage_limit_mb || 20)) * 100} 
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Galeries
                  </span>
                  <span className="text-sm font-medium">
                    {galleryCount} / {profile?.max_galleries || 3}
                  </span>
                </div>
                <Progress 
                  value={(galleryCount / (profile?.max_galleries || 3)) * 100} 
                  className={`h-2 ${galleryCount >= (profile?.max_galleries || 3) ? '[&>div]:bg-destructive' : ''}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle>Comparaison des plans</CardTitle>
              <CardDescription>
                Choisissez le plan qui correspond à vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Fonctionnalité</th>
                      {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = plan.key === currentPlan;
                        return (
                          <th key={plan.key} className={`text-center p-4 ${isCurrent ? 'bg-primary/5' : ''}`}>
                            <div className="flex flex-col items-center gap-2">
                              <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                                <Icon className={`h-5 w-5 ${plan.color}`} />
                              </div>
                              <span className="font-semibold">{plan.name}</span>
                              <span className="text-lg font-bold">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mois</span></span>
                              {isCurrent && (
                                <Badge variant="outline" className="text-xs">Actuel</Badge>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 text-sm">Stockage</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={`text-center p-4 text-sm font-medium ${plan.key === currentPlan ? 'bg-primary/5' : ''}`}>
                          {plan.storage}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 text-sm">Galeries max</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={`text-center p-4 text-sm font-medium ${plan.key === currentPlan ? 'bg-primary/5' : ''}`}>
                          {plan.galleries}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 text-sm">Images par galerie</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={`text-center p-4 text-sm font-medium ${plan.key === currentPlan ? 'bg-primary/5' : ''}`}>
                          {plan.imagesPerGallery}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 text-sm">Taille max par image</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={`text-center p-4 text-sm font-medium ${plan.key === currentPlan ? 'bg-primary/5' : ''}`}>
                          {plan.maxImageSize}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 text-sm">Durée de validité max</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={`text-center p-4 text-sm font-medium ${plan.key === currentPlan ? 'bg-primary/5' : ''}`}>
                          {plan.maxDuration}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4"></td>
                      {PLANS.map((plan) => {
                        const canUpgrade = isUpgrade(plan.key);
                        const isCurrent = plan.key === currentPlan;
                        return (
                          <td key={plan.key} className={`text-center p-4 ${isCurrent ? 'bg-primary/5' : ''}`}>
                            <Button
                              onClick={() => handleSubscribe(plan.key)}
                              disabled={!canUpgrade || subscribingTo === plan.key}
                              variant={plan.popular ? 'default' : 'outline'}
                              className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                              size="sm"
                            >
                              {subscribingTo === plan.key ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isCurrent ? (
                                'Plan actuel'
                              ) : canUpgrade ? (
                                <>
                                  <ChevronRight className="h-4 w-4 mr-1" />
                                  Choisir
                                </>
                              ) : (
                                '—'
                              )}
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}