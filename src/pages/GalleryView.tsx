import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Camera, Lock, Eye, Calendar, Download, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Gallery {
  id: string;
  title: string;
  expires_at: string;
  views_count: number;
  password_hash: string;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  order_index: number;
}

export default function GalleryView() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  const fetchGallery = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('galleries')
        .select('id, title, expires_at, views_count, password_hash')
        .eq('unique_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Galerie introuvable ou expirée');
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('Cette galerie a expiré');
        setLoading(false);
        return;
      }

      setGallery(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError('Erreur lors du chargement de la galerie');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gallery) return;

    // Simple password check (in production, use proper hashing)
    if (password === gallery.password_hash) {
      setIsAuthenticated(true);
      
      // Increment view count
      await supabase
        .from('galleries')
        .update({ views_count: gallery.views_count + 1 })
        .eq('id', gallery.id);

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('id, cloudinary_url, order_index')
        .eq('gallery_id', gallery.id)
        .order('order_index');

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les images.',
          variant: 'destructive',
        });
        return;
      }

      setImages(imagesData || []);
    } else {
      toast({
        title: 'Mot de passe incorrect',
        description: 'Veuillez vérifier le mot de passe et réessayer.',
        variant: 'destructive',
      });
    }
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `photo-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image.',
        variant: 'destructive',
      });
    }
  };

  const downloadAll = async () => {
    toast({
      title: 'Téléchargement en cours...',
      description: 'Vos images sont en cours de téléchargement.',
    });
    
    for (let i = 0; i < images.length; i++) {
      await downloadImage(images[i].cloudinary_url, i);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">{error}</h2>
            <p className="text-muted-foreground mb-6">
              Le lien que vous avez suivi n'est plus valide.
            </p>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated && gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/20 w-fit mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">{gallery.title}</CardTitle>
            <CardDescription>
              Cette galerie est protégée par un mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez le mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full btn-primary">
                Accéder à la galerie
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Expire le {format(new Date(gallery.expires_at), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {gallery?.views_count} vues
            </span>
            <Button onClick={downloadAll} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Tout télécharger
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">{gallery?.title}</h1>
          <p className="text-muted-foreground">
            {images.length} photo{images.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={image.cloudinary_url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
            </div>
          ))}
        </div>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
            disabled={lightboxIndex === 0}
            className="absolute left-4 p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={() => setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1))}
            disabled={lightboxIndex === images.length - 1}
            className="absolute right-4 p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center p-4">
            <img
              src={images[lightboxIndex].cloudinary_url}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {lightboxIndex + 1} / {images.length}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadImage(images[lightboxIndex].cloudinary_url, lightboxIndex)}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
