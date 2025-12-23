import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Plus,
  FolderOpen,
  Eye,
  Clock,
  Copy,
  Trash2,
  Settings,
  LogOut,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: 'free' | 'premium' | 'pro';
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
}

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  
  useDocumentTitle('Tableau de bord');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      // Fetch galleries (excluding password_hash for security)
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select('id, title, unique_slug, expires_at, expiration_days, views_count, is_active, created_at, updated_at, user_id')
        .order('created_at', { ascending: false });

      if (galleriesError) throw galleriesError;
      setGalleries(galleriesData as Gallery[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos données.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/g/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de la galerie a été copié dans le presse-papiers.',
    });
  };

  const deleteGallery = async (id: string) => {
    try {
      const { error } = await supabase.from('galleries').delete().eq('id', id);
      if (error) throw error;
      
      setGalleries(galleries.filter(g => g.id !== id));
      toast({
        title: 'Galerie supprimée',
        description: 'La galerie a été supprimée avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la galerie.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const storagePercentage = profile 
    ? (profile.storage_used_mb / profile.storage_limit_mb) * 100 
    : 0;

  const planColors = {
    free: 'bg-muted text-muted-foreground',
    premium: 'bg-primary/20 text-primary',
    pro: 'bg-gradient-primary text-primary-foreground',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Bonjour{profile?.name ? `, ${profile.name}` : ''} 👋
          </h1>
          <p className="text-muted-foreground">Gérez vos galeries photo et suivez votre utilisation.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Plan Card */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Plan actuel</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <Badge className={`text-lg px-3 py-1 ${planColors[profile?.subscription_plan || 'free']}`}>
                  {profile?.subscription_plan?.toUpperCase() || 'FREE'}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Storage Card */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Stockage utilisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold">{profile?.storage_used_mb?.toFixed(1) || 0}</span>
                    <span className="text-muted-foreground">/ {profile?.storage_limit_mb} Mo</span>
                  </div>
                  <Progress value={storagePercentage} className="h-2" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Galleries Count */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Galeries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold">{galleries.length}</span>
                    <span className="text-muted-foreground">/ {profile?.max_galleries || 3}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(profile?.max_galleries || 3) - galleries.length} restantes)
                    </span>
                  </div>
                  <Progress 
                    value={(galleries.length / (profile?.max_galleries || 3)) * 100} 
                    className={`h-2 ${galleries.length >= (profile?.max_galleries || 3) ? '[&>div]:bg-destructive' : ''}`}
                  />
                  {galleries.length >= (profile?.max_galleries || 3) && (
                    <Link to="/upgrade?limit=galleries" className="text-xs text-destructive hover:underline mt-2 block">
                      Limite atteinte → Passer à un plan supérieur
                    </Link>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Gallery Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">Vos galeries</h2>
          <Button asChild className="btn-primary">
            <Link to="/dashboard/gallery/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle galerie
            </Link>
          </Button>
        </div>

        {/* Galleries List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : galleries.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">Aucune galerie</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre première galerie pour commencer à partager vos photos.
              </p>
              <Button asChild className="btn-primary">
                <Link to="/dashboard/gallery/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une galerie
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {galleries.map((gallery) => {
              const isExpired = isPast(new Date(gallery.expires_at));
              
              return (
                <Card key={gallery.id} className="glass-card group hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-lg font-semibold">{gallery.title}</h3>
                          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                            {isExpired ? 'Expirée' : 'Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {gallery.views_count} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {isExpired 
                              ? 'Expirée' 
                              : `Expire ${formatDistanceToNow(new Date(gallery.expires_at), { addSuffix: true, locale: fr })}`
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyLink(gallery.unique_slug)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteGallery(gallery.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/dashboard/gallery/${gallery.id}`}>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}