import { useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ArrowLeft,
  Upload,
  X,
  Eye,
  Calendar,
  Copy,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  password_hash: string;
  created_at: string;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_mb: number;
  order_index: number;
}

interface UploadingImage {
  id: string;
  url: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
}

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Fetch gallery
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Gallery;
    },
    enabled: !!id && !!user,
  });

  // Fetch images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['gallery-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('gallery_id', id)
        .order('order_index');
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!id && !!user,
  });

  // Fetch profile for limits
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const copyLink = () => {
    if (!gallery) return;
    const url = `${window.location.origin}/g/${gallery.unique_slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de la galerie a été copié dans le presse-papiers.',
    });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImagesPerGallery = profile?.max_images_per_gallery || 30;
    const maxImageSizeMb = profile?.max_image_size_mb || 1;

    if (images.length + files.length > maxImagesPerGallery) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez pas ajouter plus de ${maxImagesPerGallery} images.`,
        variant: 'destructive',
      });
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Type de fichier invalide',
          description: `${file.name} n'est pas une image.`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > maxImageSizeMb * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse la limite de ${maxImageSizeMb} Mo.`,
          variant: 'destructive',
        });
        continue;
      }

      const uploadId = crypto.randomUUID();
      const uploadingImage: UploadingImage = {
        id: uploadId,
        url: URL.createObjectURL(file),
        file,
        status: 'uploading',
      };

      setUploadingImages(prev => [...prev, uploadingImage]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('galleryId', id!);
        formData.append('orderIndex', (images.length + uploadingImages.length).toString());

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        setUploadingImages(prev => prev.map(img => 
          img.id === uploadId ? { ...img, status: 'done' } : img
        ));

        // Refresh images list
        queryClient.invalidateQueries({ queryKey: ['gallery-images', id] });

        setTimeout(() => {
          setUploadingImages(prev => prev.filter(img => img.id !== uploadId));
        }, 1000);
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadingImages(prev => prev.map(img => 
          img.id === uploadId ? { ...img, status: 'error' } : img
        ));
        toast({
          title: 'Erreur d\'upload',
          description: error.message || 'Impossible d\'uploader l\'image.',
          variant: 'destructive',
        });
      }
    }
  }, [id, images.length, uploadingImages.length, profile, session, queryClient, toast]);

  const deleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      queryClient.invalidateQueries({ queryKey: ['gallery-images', id] });
      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'image.',
        variant: 'destructive',
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  const deleteGallery = async () => {
    try {
      // Delete all images first
      for (const image of images) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageId: image.id }),
          }
        );
      }

      // Delete gallery
      const { error } = await supabase.from('galleries').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Galerie supprimée',
        description: 'La galerie et toutes ses images ont été supprimées.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la galerie.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const isExpired = gallery ? isPast(new Date(gallery.expires_at)) : false;

  if (galleryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md">
          <CardContent className="pt-6 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Galerie introuvable</h2>
            <Button asChild>
              <Link to="/dashboard">Retour au dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>
        </Button>

        {/* Gallery Info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-bold">{gallery.title}</h1>
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Expirée' : 'Active'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {gallery.views_count} vues
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {isExpired 
                  ? 'Expirée' 
                  : `Expire ${formatDistanceToNow(new Date(gallery.expires_at), { addSuffix: true, locale: fr })}`
                }
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {images.length} image{images.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/g/${gallery.unique_slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir
              </a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la galerie ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les images seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteGallery} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Gallery Info Card */}
        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Lien public</span>
                <p className="font-mono mt-1">{window.location.origin}/g/{gallery.unique_slug}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mot de passe</span>
                <p className="font-mono mt-1">{gallery.password_hash}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date d'expiration</span>
                <p className="mt-1">{format(new Date(gallery.expires_at), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Images */}
        <div className="mb-6">
          <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Ajouter des images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* Images Grid */}
        {imagesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 && uploadingImages.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">Aucune image</h3>
              <p className="text-muted-foreground">
                Ajoutez des images à votre galerie pour commencer.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing images */}
            {images.map((image) => (
              <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={image.cloudinary_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteImage(image.id)}
                    disabled={deletingImageId === image.id}
                  >
                    {deletingImageId === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Uploading images */}
            {uploadingImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {img.status === 'uploading' && (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  )}
                  {img.status === 'done' && (
                    <div className="bg-primary rounded-full p-2">
                      <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {img.status === 'error' && (
                    <X className="h-8 w-8 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
