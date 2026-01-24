'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Info, User, Wallpaper, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MediaTabProps {
  initialData?: {
    avatarUrl?: string;
    coverImageUrl?: string;
  };
  onSave: (data: MediaTabData) => Promise<void>;
  disabled?: boolean;
}

export interface MediaTabData {
  avatarUrl?: string;
  coverImageUrl?: string;
}

// Recommended dimensions for images
const RECOMMENDED_DIMENSIONS = {
  avatar: { width: 400, height: 400, display: '400x400px' },
  cover: { width: 1920, height: 600, display: '1920x600px' },
};

// File validation constants
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function MediaTab({ initialData, onSave, disabled = false }: MediaTabProps) {
  // State for images
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  
  // State for previews during upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImageUrl || null);
  
  // Upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Drag state
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  
  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Validate image file
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Format invalide. Formats acceptés : PNG, JPG, JPEG, WebP. Reçu : ${file.type}`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Le fichier dépasse ${MAX_FILE_SIZE_MB}MB. Taille : ${fileSizeMB}MB`,
      };
    }

    return { valid: true };
  }, []);

  /**
   * Upload image to Cloudinary via API
   */
  const uploadImage = useCallback(async (file: File, type: 'avatar' | 'cover'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/public-profile/upload-media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Échec du téléchargement');
    }

    const data = await response.json();
    return data.url;
  }, []);

  /**
   * Handle avatar upload
   */
  const handleAvatarUpload = useCallback(async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Upload to Cloudinary
      const url = await uploadImage(file, 'avatar');
      
      // Update state
      setAvatarUrl(url);
      setAvatarPreview(url);
      setHasChanges(true);
      
      toast.success('Avatar téléchargé avec succès !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec du téléchargement');
      setAvatarPreview(avatarUrl || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [validateFile, uploadImage, avatarUrl]);

  /**
   * Handle cover image upload
   */
  const handleCoverUpload = useCallback(async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploadingCover(true);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);

      // Upload to Cloudinary
      const url = await uploadImage(file, 'cover');
      
      // Update state
      setCoverImageUrl(url);
      setCoverPreview(url);
      setHasChanges(true);
      
      toast.success('Image de couverture téléchargée avec succès !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec du téléchargement');
      setCoverPreview(coverImageUrl || null);
    } finally {
      setIsUploadingCover(false);
    }
  }, [validateFile, uploadImage, coverImageUrl]);

  /**
   * Handle file input change
   */
  const handleAvatarInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }, [handleAvatarUpload]);

  const handleCoverInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCoverUpload(file);
    }
    // Reset input
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  }, [handleCoverUpload]);

  /**
   * Handle drag and drop for avatar
   */
  const handleAvatarDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(true);
  }, []);

  const handleAvatarDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(false);
  }, []);

  const handleAvatarDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  }, [handleAvatarUpload]);

  /**
   * Handle drag and drop for cover
   */
  const handleCoverDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(true);
  }, []);

  const handleCoverDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);
  }, []);

  const handleCoverDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleCoverUpload(file);
    }
  }, [handleCoverUpload]);

  /**
   * Remove avatar
   */
  const handleRemoveAvatar = useCallback(() => {
    setAvatarUrl('');
    setAvatarPreview(null);
    setHasChanges(true);
  }, []);

  /**
   * Remove cover image
   */
  const handleRemoveCover = useCallback(() => {
    setCoverImageUrl('');
    setCoverPreview(null);
    setHasChanges(true);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const data: MediaTabData = {
        avatarUrl: avatarUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
      };

      await onSave(data);
      
      toast.success('Médias mis à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-6">
      {/* Avatar Upload Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Avatar</h3>
            <p className="text-sm text-slate-500">Photo de profil de votre page publique</p>
          </div>
        </div>

        <div className="space-y-4">
          {avatarPreview ? (
            <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl">
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {!isUploadingAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={disabled || isSaving}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                  </button>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Avatar actuel</p>
                <p className="text-xs text-slate-500 mt-1">Cliquez sur × pour supprimer</p>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleAvatarDragOver}
              onDragLeave={handleAvatarDragLeave}
              onDrop={handleAvatarDrop}
              onClick={() => !isUploadingAvatar && !disabled && avatarInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                isDraggingAvatar && "border-emerald-500 bg-emerald-50 scale-[1.02]",
                isUploadingAvatar || disabled
                  ? "border-slate-300 bg-slate-50 cursor-not-allowed"
                  : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30"
              )}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-8 h-8 text-emerald-500 mb-3 animate-spin" />
                  <span className="text-sm font-medium text-slate-600">Téléchargement...</span>
                </>
              ) : (
                <>
                  <div className="p-3.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl text-emerald-600 mb-3 shadow-sm">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    Cliquez ou glissez-déposez pour télécharger
                  </span>
                  <span className="text-xs text-slate-500 mt-1.5">
                    PNG, JPG, WebP • Max {MAX_FILE_SIZE_MB}MB
                  </span>
                </>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept={ACCEPTED_FORMATS.join(',')}
                onChange={handleAvatarInputChange}
                className="hidden"
                disabled={isUploadingAvatar || disabled}
              />
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900 mb-1">Dimensions recommandées</p>
              <p className="text-emerald-700">
                {RECOMMENDED_DIMENSIONS.avatar.display} (carré) pour un affichage optimal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image Upload Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white shadow-lg shadow-purple-500/30">
            <Wallpaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Image de couverture</h3>
            <p className="text-sm text-slate-500">Bannière en haut de votre page publique</p>
          </div>
        </div>

        <div className="space-y-4">
          {coverPreview ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-56 object-cover"
                />
                {!isUploadingCover && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    disabled={disabled || isSaving}
                    className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} />
                  </button>
                )}
                {isUploadingCover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center font-medium">
                Image de couverture actuelle
              </p>
            </div>
          ) : (
            <div
              onDragOver={handleCoverDragOver}
              onDragLeave={handleCoverDragLeave}
              onDrop={handleCoverDrop}
              onClick={() => !isUploadingCover && !disabled && coverInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                isDraggingCover && "border-purple-500 bg-purple-50 scale-[1.02]",
                isUploadingCover || disabled
                  ? "border-slate-300 bg-slate-50 cursor-not-allowed"
                  : "border-slate-300 hover:border-purple-400 hover:bg-purple-50/30"
              )}
            >
              {isUploadingCover ? (
                <>
                  <Loader2 className="w-8 h-8 text-purple-500 mb-3 animate-spin" />
                  <span className="text-sm font-medium text-slate-600">Téléchargement...</span>
                </>
              ) : (
                <>
                  <div className="p-3.5 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl text-purple-600 mb-3 shadow-sm">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    Cliquez ou glissez-déposez pour télécharger
                  </span>
                  <span className="text-xs text-slate-500 mt-1.5">
                    PNG, JPG, WebP • Max {MAX_FILE_SIZE_MB}MB
                  </span>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept={ACCEPTED_FORMATS.join(',')}
                onChange={handleCoverInputChange}
                className="hidden"
                disabled={isUploadingCover || disabled}
              />
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs bg-purple-50 border border-purple-200 rounded-xl p-3.5">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-900 mb-1">Dimensions recommandées</p>
              <p className="text-purple-700">
                {RECOMMENDED_DIMENSIONS.cover.display} (format paysage) pour un affichage optimal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Card */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Sauvegarder les modifications</h3>
            <p className="text-sm text-slate-400">
              {hasChanges ? 'Vous avez des modifications non sauvegardées' : 'Aucune modification à sauvegarder'}
            </p>
          </div>
          
          <button
            type="submit"
            disabled={disabled || isSaving || !hasChanges || isUploadingAvatar || isUploadingCover}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
