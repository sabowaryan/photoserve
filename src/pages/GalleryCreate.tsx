import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  ArrowLeft, 
  Upload, 
  X, 
  Lock, 
  Calendar, 
  Image as ImageIcon, 
  Loader2,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  sizeMb: number;
}

// All possible duration options
const ALL_DURATION_OPTIONS = [
  { value: 1, label: '1 jour' },
  { value: 3, label: '3 jours' },
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
  { value: 60, label: '60 jours' },
  { value: 90, label: '90 jours' },
  { value: 180, label: '180 jours' },
  { value: 365, label: '1 an' },
];

export default function GalleryCreate() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useDocumentTitle('Nouvelle galerie');
  
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Fetch subscription plan details for max expiration days
  const { data: planDetails } = useQuery({
    queryKey: ['planDetails', profile?.subscription_plan],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('max_expiration_days')
        .eq('name', profile?.subscription_plan || 'free')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.subscription_plan,
  });

  // Fetch current gallery count
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
    enabled: !!user,
  });

  const maxGalleries = profile?.max_galleries || 3;
  const isGalleryLimitReached = galleryCount >= maxGalleries;

  // Calculate pending upload size
  const pendingUploadSize = useMemo(() => {
    return images.reduce((acc, img) => acc + img.sizeMb, 0);
  }, [images]);

  // Current and projected storage usage
  const currentStorageUsed = profile?.storage_used_mb || 0;
  const storageLimit = profile?.storage_limit_mb || 20;
  const projectedStorageUsed = currentStorageUsed + pendingUploadSize;
  const storagePercentage = (projectedStorageUsed / storageLimit) * 100;
  const isStorageExceeded = projectedStorageUsed > storageLimit;

  // Get duration options based on plan's max_expiration_days
  const maxExpirationDays = planDetails?.max_expiration_days || 7;
  const durationOptions = useMemo(() => {
    return ALL_DURATION_OPTIONS.filter(option => option.value <= maxExpirationDays);
  }, [maxExpirationDays]);

  // Reset expiration days if current value exceeds max
  useMemo(() => {
    if (expirationDays > maxExpirationDays) {
      setExpirationDays(maxExpirationDays);
    }
  }, [maxExpirationDays, expirationDays]);

  const validateAndAddFiles = useCallback((files: File[]) => {
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
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > maxImageSizeMb) {
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

    // Check storage limit
    const newFilesSize = validFiles.reduce((acc, f) => acc + f.size / (1024 * 1024), 0);
    if (currentStorageUsed + pendingUploadSize + newFilesSize > storageLimit) {
      toast({
        title: 'Espace insuffisant',
        description: `Ces fichiers dépasseraient votre limite de stockage de ${storageLimit} Mo.`,
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
      sizeMb: file.size / (1024 * 1024),
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [images.length, profile, toast, currentStorageUsed, pendingUploadSize, storageLimit]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
  }, [validateAndAddFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  }, [validateAndAddFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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

    if (isStorageExceeded) {
      toast({
        title: 'Espace insuffisant',
        description: 'Supprimez des images ou passez à un plan supérieur.',
        variant: 'destructive',
      });
      return;
    }

    if (isGalleryLimitReached) {
      toast({
        title: 'Limite de galeries atteinte',
        description: `Vous avez atteint votre limite de ${maxGalleries} galeries. Passez à un plan supérieur pour en créer plus.`,
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get fresh session token
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession?.access_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Hash password via edge function
      const hashResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hash-gallery-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: password.trim() }),
        }
      );

      if (!hashResponse.ok) {
        const errorData = await hashResponse.json().catch(() => ({}));
        console.error('[GalleryCreate] Hash password error:', errorData);
        throw new Error(errorData.error || 'Échec de la sécurisation du mot de passe');
      }

      const { hashedPassword } = await hashResponse.json();

      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase.rpc('generate_unique_slug');
      if (slugError) throw slugError;

      const uniqueSlug = slugData as string;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Create gallery with hashed password
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .insert({
          title: title.trim(),
          password_hash: hashedPassword,
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
              'Authorization': `Bearer ${currentSession.access_token}`,
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

        <div className="grid gap-6">
          {/* Storage Indicator */}
          <Card className={`glass-card ${isStorageExceeded ? 'border-destructive' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Espace de stockage</span>
                </div>
                <Badge variant={profile?.subscription_plan === 'free' ? 'secondary' : 'default'}>
                  {profile?.subscription_plan?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold">{projectedStorageUsed.toFixed(1)}</span>
                <span className="text-muted-foreground">/ {storageLimit} Mo</span>
                {pendingUploadSize > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (+{pendingUploadSize.toFixed(1)} Mo à uploader)
                  </span>
                )}
              </div>
              <Progress 
                value={Math.min(storagePercentage, 100)} 
                className={`h-2 ${isStorageExceeded ? '[&>div]:bg-destructive' : ''}`}
              />
              {isStorageExceeded && (
                <Link to="/upgrade?limit=storage" className="flex items-center gap-2 mt-2 text-destructive text-sm hover:underline">
                  <AlertTriangle className="h-4 w-4" />
                  Espace insuffisant. Passez à un plan supérieur →
                </Link>
              )}
              {isGalleryLimitReached && (
                <Link to="/upgrade?limit=galleries" className="flex items-center gap-2 mt-2 text-destructive text-sm hover:underline">
                  <AlertTriangle className="h-4 w-4" />
                  Limite de galeries atteinte ({galleryCount}/{maxGalleries}). Passez à un plan supérieur →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Main Form */}
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

              {/* Expiration - Select based on plan */}
              <div className="space-y-2">
                <Label htmlFor="expiration" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Durée de validité
                </Label>
                <Select
                  value={expirationDays.toString()}
                  onValueChange={(value) => setExpirationDays(parseInt(value))}
                  disabled={isCreating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profile?.subscription_plan === 'free' && (
                  <p className="text-xs text-muted-foreground">
                    Passez à Premium ou Pro pour des durées plus longues.
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({images.length}/{profile?.max_images_per_gallery || 30})
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Max {profile?.max_image_size_mb || 1} Mo par image
                  </span>
                </div>

                {/* Upload Zone with Drag & Drop */}
                <label
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className={`h-10 w-10 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm text-muted-foreground text-center">
                    {isDragging ? (
                      <span className="text-primary font-medium">Déposez vos images ici</span>
                    ) : (
                      <>
                        Cliquez ou glissez vos images ici<br />
                        <span className="text-xs">JPG, PNG, WebP acceptés</span>
                      </>
                    )}
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
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1">
                          <span className="text-xs text-foreground">{img.sizeMb.toFixed(1)} Mo</span>
                        </div>
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
                        {img.status === 'error' && (
                          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
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
                disabled={isCreating || !title.trim() || !password.trim() || images.length === 0 || isStorageExceeded || isGalleryLimitReached}
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
        </div>
      </main>
    </div>
  );
}
