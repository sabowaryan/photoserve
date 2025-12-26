import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Lock,
  Save,
  Edit3,
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, addDays } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  expiration_days: number;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
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

// Duration options by plan
const DURATION_OPTIONS = {
  free: [
    { value: 7, label: '7 jours' },
    { value: 14, label: '14 jours' },
    { value: 30, label: '30 jours' },
  ],
  premium: [
    { value: 7, label: '7 jours' },
    { value: 14, label: '14 jours' },
    { value: 30, label: '30 jours' },
    { value: 60, label: '60 jours' },
    { value: 90, label: '90 jours' },
  ],
  pro: [
    { value: 7, label: '7 jours' },
    { value: 14, label: '14 jours' },
    { value: 30, label: '30 jours' },
    { value: 60, label: '60 jours' },
    { value: 90, label: '90 jours' },
    { value: 180, label: '180 jours' },
    { value: 365, label: '1 an' },
  ],
};

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  
  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useDocumentTitle('Détails de la galerie');

  // Fetch gallery
  const { data: gallery, isLoading: galleryLoading, refetch: refetchGallery } = useQuery({
    queryKey: ['gallery', id],
    queryFn: async () => {
      // Exclude password_hash for security - it should never be sent to the client
      const { data, error } = await supabase
        .from('galleries')
        .select('id, title, unique_slug, expires_at, expiration_days, views_count, is_active, created_at, updated_at, user_id')
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

  // Initialize edit values when gallery loads
  useEffect(() => {
    if (gallery) {
      setEditTitle(gallery.title);
      // Password is not fetched from server for security - only allow setting new passwords
      setEditPassword('');
    }
  }, [gallery]);

  const plan = (profile?.subscription_plan || 'free') as keyof typeof DURATION_OPTIONS;
  const durationOptions = DURATION_OPTIONS[plan] || DURATION_OPTIONS.free;
  const canChangeDuration = plan !== 'free';

  const copyLink = () => {
    if (!gallery) return;
    const url = `${window.location.origin}/g/${gallery.unique_slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de la galerie a été copié dans le presse-papiers.',
    });
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || !gallery) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ title: editTitle.trim() })
        .eq('id', gallery.id);
      
      if (error) throw error;
      
      toast({ title: 'Titre mis à jour' });
      setIsEditingTitle(false);
      refetchGallery();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier le titre.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!editPassword.trim() || !gallery) return;
    
    // Validate password length
    if (editPassword.trim().length < 4) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 4 caractères.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const accessToken =
        session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;

      console.log('[GalleryDetail] hash-gallery-password (update) fetch start', {
        galleryId: gallery.id,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        passwordLength: editPassword?.trim()?.length,
      });

      if (!accessToken) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const hashRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hash-gallery-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: editPassword.trim(),
            galleryId: gallery.id,
            action: 'update',
          }),
        }
      );

      const hashJson = await hashRes.json().catch(() => ({}));

      console.log('[GalleryDetail] hash-gallery-password (update) fetch response', {
        ok: hashRes.ok,
        status: hashRes.status,
        hashJson,
      });

      if (!hashRes.ok) {
        throw new Error((hashJson as any)?.error || 'Échec de la mise à jour du mot de passe');
      }

      toast({ title: 'Mot de passe mis à jour' });
      setIsEditingPassword(false);
      setEditPassword('');
      refetchGallery();
    } catch (error: any) {
      console.error('[GalleryDetail] Password update error:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de modifier le mot de passe.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeDuration = async (days: string) => {
    if (!gallery || !canChangeDuration) return;
    
    const daysNum = parseInt(days);
    const newExpiresAt = addDays(new Date(gallery.created_at), daysNum);
    
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ 
          expiration_days: daysNum,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', gallery.id);
      
      if (error) throw error;
      
      toast({ title: 'Durée mise à jour' });
      refetchGallery();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier la durée.', variant: 'destructive' });
    }
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

        queryClient.invalidateQueries({ queryKey: ['gallery-images', id] });
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

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
  }, [id, images.length, uploadingImages.length, profile, session, queryClient, toast, user?.id]);

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
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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
  const totalImageSize = images.reduce((acc, img) => acc + (img.file_size_mb || 0), 0);

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

        {/* Gallery Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-display text-xl font-bold"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveTitle} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditTitle(gallery.title); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-2xl font-bold">{gallery.title}</h1>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </>
              )}
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
                {images.length} image{images.length !== 1 ? 's' : ''} ({totalImageSize.toFixed(1)} Mo)
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

        {/* Gallery Settings Card */}
        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Public Link */}
              <div>
                <Label className="text-muted-foreground text-xs">Lien public</Label>
                <p className="font-mono text-sm mt-1 truncate">{window.location.origin}/g/{gallery.unique_slug}</p>
              </div>

              {/* Password */}
              <div>
                <Label className="text-muted-foreground text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Mot de passe
                </Label>
                {isEditingPassword ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Nouveau mot de passe"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSavePassword} disabled={isSaving || !editPassword.trim()}>
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditingPassword(false); setEditPassword(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm text-muted-foreground">••••••••</p>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditingPassword(true)}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Expiration Date */}
              <div>
                <Label className="text-muted-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date d'expiration
                </Label>
                <p className="text-sm mt-1">{format(new Date(gallery.expires_at), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>

              {/* Duration Selector (paid plans only) */}
              <div>
                <Label className="text-muted-foreground text-xs">Durée de vie</Label>
                {canChangeDuration ? (
                  <Select
                    value={gallery.expiration_days?.toString() || '30'}
                    onValueChange={handleChangeDuration}
                  >
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {gallery.expiration_days || 30} jours
                    <span className="text-xs block">Passez à Premium pour modifier</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Images */}
        <div className="mb-6">
          <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Ajouter des images ({images.length}/{profile?.max_images_per_gallery || 30})
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Max {profile?.max_image_size_mb || 1} Mo par image
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                  <span className="text-xs text-foreground">{(image.file_size_mb || 0).toFixed(1)} Mo</span>
                </div>
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
