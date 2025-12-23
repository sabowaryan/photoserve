import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, ArrowLeft, Upload, X, Lock, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
}

export default function GalleryCreate() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch user profile for limits
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImagesPerGallery = profile?.max_images_per_gallery || 30;
    const maxImageSizeMb = profile?.max_image_size_mb || 1;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Type de fichier invalide',
          description: `${file.name} n'est pas une image.`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > maxImageSizeMb * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse la limite de ${maxImageSizeMb} Mo.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImagesPerGallery) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez pas ajouter plus de ${maxImagesPerGallery} images.`,
        variant: 'destructive',
      });
      return;
    }

    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
      status: 'pending',
      progress: 0,
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [images.length, profile, toast]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: 'Titre requis',
        description: 'Veuillez entrer un titre pour la galerie.',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: 'Mot de passe requis',
        description: 'Veuillez définir un mot de passe pour protéger la galerie.',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'Images requises',
        description: 'Veuillez ajouter au moins une image.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase.rpc('generate_unique_slug');
      if (slugError) throw slugError;

      const uniqueSlug = slugData as string;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Create gallery
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .insert({
          title: title.trim(),
          password_hash: password, // Note: In production, hash this on the server
          unique_slug: uniqueSlug,
          user_id: user?.id,
          expiration_days: expirationDays,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (galleryError) throw galleryError;

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setImages(prev => prev.map(p => 
          p.id === img.id ? { ...p, status: 'uploading', progress: 0 } : p
        ));

        const formData = new FormData();
        formData.append('file', img.file);
        formData.append('galleryId', gallery.id);
        formData.append('orderIndex', i.toString());

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

        setImages(prev => prev.map(p => 
          p.id === img.id ? { ...p, status: 'done', progress: 100 } : p
        ));
      }

      toast({
        title: 'Galerie créée !',
        description: `Votre galerie "${title}" a été créée avec succès.`,
      });

      navigate(`/dashboard/gallery/${gallery.id}`);
    } catch (error: any) {
      console.error('Error creating gallery:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la galerie.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Nouvelle galerie</CardTitle>
            <CardDescription>
              Créez une galerie photo sécurisée à partager avec vos clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la galerie</Label>
              <Input
                id="title"
                placeholder="Ex: Mariage de Marie & Jean"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mot de passe
              </Label>
              <Input
                id="password"
                type="text"
                placeholder="Mot de passe pour accéder à la galerie"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Ce mot de passe sera demandé aux visiteurs pour accéder à la galerie.
              </p>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Durée de validité
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="expiration"
                  type="number"
                  min={1}
                  max={365}
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                  disabled={isCreating}
                  className="w-24"
                />
                <span className="text-muted-foreground">jours</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images ({images.length}/{profile?.max_images_per_gallery || 30})
              </Label>

              {/* Upload Zone */}
              <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <span className="text-sm text-muted-foreground text-center">
                  Cliquez ou glissez vos images ici<br />
                  <span className="text-xs">Max {profile?.max_image_size_mb || 1} Mo par image</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isCreating}
                />
              </label>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      {img.status === 'done' && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-1">
                            <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {img.status === 'pending' && (
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-2 right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-destructive-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim() || !password.trim() || images.length === 0}
              className="w-full btn-primary"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Créer la galerie
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
