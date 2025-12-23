import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
  Check
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const currentPlan = plans?.find(p => p.name === profile?.subscription_plan) || plans?.[0];

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const planFeatures = {
    free: ['3 galeries max', '30 images par galerie', '20 MB de stockage', 'Images jusqu\'à 1 MB'],
    premium: ['15 galeries max', '100 images par galerie', '1 GB de stockage', 'Images jusqu\'à 5 MB', 'Durée personnalisée'],
    pro: ['Galeries illimitées', 'Images illimitées', '10 GB de stockage', 'Taille illimitée', 'Durée personnalisée', 'Support prioritaire'],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <Save className="h-4 w-4" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Abonnement</CardTitle>
                  <CardDescription>Gérez votre plan et facturation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-4 rounded-xl bg-gradient-subtle border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan actuel</p>
                    <p className="text-2xl font-display font-bold capitalize">
                      {profile?.subscription_plan || 'Free'}
                    </p>
                  </div>
                  <Badge 
                    variant={profile?.subscription_plan === 'pro' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {profile?.subscription_plan === 'free' ? 'Gratuit' : 'Actif'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {planFeatures[profile?.subscription_plan as keyof typeof planFeatures || 'free']?.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground">Stockage utilisé</p>
                  <p className="text-xl font-semibold">
                    {profile?.storage_used_mb?.toFixed(1) || '0'} MB
                    <span className="text-sm text-muted-foreground font-normal">
                      {' '}/ {profile?.storage_limit_mb || 20} MB
                    </span>
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground">Galeries max</p>
                  <p className="text-xl font-semibold">{profile?.max_galleries || 3}</p>
                </div>
              </div>

              {/* Upgrade/Manage Buttons */}
              <div className="flex flex-wrap gap-3">
                {profile?.subscription_plan === 'free' && (
                  <Button onClick={() => navigate('/')} className="gap-2">
                    Passer à Premium
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {profile?.stripe_subscription_id && (
                  <Button variant="outline" className="gap-2">
                    Gérer l'abonnement
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
