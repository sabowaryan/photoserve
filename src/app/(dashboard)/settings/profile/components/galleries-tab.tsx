'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Star,
  GripVertical,
  Info,
  Calendar,
  Lock,
  Save,
  Images
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Gallery } from '@/types';

interface GalleriesTabProps {
  initialData?: {
    featuredGalleries?: string[];
    hiddenGalleries?: string[];
  };
  onSave: (data: GalleriesTabData) => Promise<void>;
  disabled?: boolean;
}

export interface GalleriesTabData {
  featuredGalleries?: string[];
  hiddenGalleries?: string[];
}

interface GalleryWithStatus extends Gallery {
  isFeatured: boolean;
  isHidden: boolean;
}

export function GalleriesTab({ initialData, onSave, disabled = false }: GalleriesTabProps) {
  // State
  const [galleries, setGalleries] = useState<GalleryWithStatus[]>([]);
  const [isLoadingGalleries, setIsLoadingGalleries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Featured and hidden galleries
  const [featuredGalleries, setFeaturedGalleries] = useState<string[]>(initialData?.featuredGalleries || []);
  const [hiddenGalleries, setHiddenGalleries] = useState<string[]>(initialData?.hiddenGalleries || []);

  /**
   * Fetch user galleries
   */
  const fetchGalleries = useCallback(async () => {
    try {
      setIsLoadingGalleries(true);

      const response = await fetch('/api/galleries');
      
      if (!response.ok) {
        throw new Error('Échec du chargement des galeries');
      }

      const data = await response.json();
      const userGalleries = data.galleries || [];

      // Add status flags to galleries
      const galleriesWithStatus: GalleryWithStatus[] = userGalleries.map((gallery: Gallery) => ({
        ...gallery,
        isFeatured: featuredGalleries.includes(gallery.id),
        isHidden: hiddenGalleries.includes(gallery.id),
      }));

      setGalleries(galleriesWithStatus);
    } catch (error) {
      console.error('Error fetching galleries:', error);
      toast.error('Impossible de charger les galeries');
    } finally {
      setIsLoadingGalleries(false);
    }
  }, [featuredGalleries, hiddenGalleries]);

  /**
   * Load galleries on mount
   */
  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  /**
   * Track changes
   */
  useEffect(() => {
    const changed = 
      JSON.stringify(featuredGalleries.sort()) !== JSON.stringify((initialData?.featuredGalleries || []).sort()) ||
      JSON.stringify(hiddenGalleries.sort()) !== JSON.stringify((initialData?.hiddenGalleries || []).sort());
    
    setHasChanges(changed);
  }, [featuredGalleries, hiddenGalleries, initialData]);

  /**
   * Toggle featured status
   */
  const toggleFeatured = useCallback((galleryId: string) => {
    setFeaturedGalleries(prev => {
      if (prev.includes(galleryId)) {
        return prev.filter(id => id !== galleryId);
      } else {
        return [...prev, galleryId];
      }
    });

    // Update gallery status
    setGalleries(prev => prev.map(g => 
      g.id === galleryId ? { ...g, isFeatured: !g.isFeatured } : g
    ));
  }, []);

  /**
   * Toggle hidden status
   */
  const toggleHidden = useCallback((galleryId: string) => {
    setHiddenGalleries(prev => {
      if (prev.includes(galleryId)) {
        return prev.filter(id => id !== galleryId);
      } else {
        return [...prev, galleryId];
      }
    });

    // Update gallery status
    setGalleries(prev => prev.map(g => 
      g.id === galleryId ? { ...g, isHidden: !g.isHidden } : g
    ));
  }, []);

  /**
   * Get sorted galleries for display preview
   * Featured galleries first, then by creation date descending
   */
  const getSortedGalleries = useCallback(() => {
    return [...galleries]
      .filter(g => !g.isHidden) // Only show non-hidden galleries in preview
      .sort((a, b) => {
        // Featured galleries first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        
        // Then by creation date (newest first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [galleries]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  /**
   * Check if gallery is new (< 7 days)
   */
  const isNewGallery = (createdAt: string | null) => {
    if (!createdAt) return false;
    
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff < 7;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const data: GalleriesTabData = {
        featuredGalleries: featuredGalleries.length > 0 ? featuredGalleries : undefined,
        hiddenGalleries: hiddenGalleries.length > 0 ? hiddenGalleries : undefined,
      };

      await onSave(data);
      
      toast.success('Configuration des galeries mise à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-6">
      {/* Gallery List Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl text-white shadow-lg shadow-violet-500/30">
            <Images className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Vos galeries</h3>
            <p className="text-sm text-slate-500">
              Gérez la visibilité et la mise en avant de vos galeries sur votre profil public
            </p>
          </div>
        </div>

        {isLoadingGalleries ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-300 rounded-xl">
            <ImageIcon className="w-14 h-14 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Aucune galerie trouvée
            </p>
            <p className="text-xs text-slate-500">
              Créez votre première galerie pour la voir apparaître ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className={cn(
                  'flex items-center gap-4 p-5 bg-gradient-to-br border-2 rounded-xl transition-all',
                  gallery.isHidden 
                    ? 'from-slate-50 to-slate-100/50 border-slate-200 opacity-60' 
                    : 'from-white to-slate-50/30 border-slate-200 hover:border-violet-300 hover:shadow-md'
                )}
              >
                {/* Drag Handle (visual only for now) */}
                <div className="text-slate-400 cursor-grab hover:text-violet-600 transition-colors">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Gallery Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {gallery.title}
                    </h4>
                    
                    {/* Badges */}
                    {isNewGallery(gallery.created_at) && (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Nouveau
                      </span>
                    )}
                    
                    {gallery.password_hash && (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    
                    {!gallery.is_active && (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(gallery.created_at)}
                    </span>
                    <span>•</span>
                    <span className="font-medium">{gallery.views_count || 0} vues</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Featured Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleFeatured(gallery.id)}
                    disabled={disabled || isSaving || gallery.isHidden}
                    className={cn(
                      'p-2.5 rounded-xl border-2 transition-all',
                      gallery.isFeatured
                        ? 'border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm'
                        : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50',
                      (disabled || isSaving || gallery.isHidden) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={gallery.isFeatured ? 'Retirer de la mise en avant' : 'Mettre en avant'}
                  >
                    <Star className={cn('w-4 h-4', gallery.isFeatured && 'fill-current')} />
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleHidden(gallery.id)}
                    disabled={disabled || isSaving}
                    className={cn(
                      'p-2.5 rounded-xl border-2 transition-all',
                      gallery.isHidden
                        ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                      (disabled || isSaving) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={gallery.isHidden ? 'Afficher sur le profil' : 'Masquer du profil'}
                  >
                    {gallery.isHidden ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="flex items-start gap-2.5 text-xs bg-violet-50 border border-violet-200 rounded-xl p-4 mt-5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
          <div>
            <p className="font-semibold text-violet-900 mb-2">À propos de la gestion des galeries</p>
            <ul className="space-y-1.5 text-violet-700">
              <li>• <strong>Mise en avant</strong> : Les galeries mises en avant apparaissent en premier sur votre profil</li>
              <li>• <strong>Masquage</strong> : Les galeries masquées ne sont pas visibles sur votre profil public</li>
              <li>• <strong>Ordre</strong> : Les galeries sont triées par mise en avant, puis par date de création</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Display Preview & Statistics */}
      {galleries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistics Cards */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {galleries.length}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Total galeries
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-amber-700 mb-1">
              {featuredGalleries.length}
            </div>
            <div className="text-xs font-semibold text-amber-700">
              Mises en avant
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-slate-600 mb-1">
              {hiddenGalleries.length}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Masquées
            </div>
          </div>
        </div>
      )}

      {/* Display Preview Section */}
      {galleries.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Aperçu de l'ordre d'affichage</h3>
              <p className="text-sm text-slate-500">
                Voici comment vos galeries apparaîtront sur votre profil public
              </p>
            </div>
          </div>

          {getSortedGalleries().length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-300 rounded-xl">
              <EyeOff className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Aucune galerie visible
              </p>
              <p className="text-xs text-slate-500">
                Toutes vos galeries sont actuellement masquées
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-4">
              <div className="space-y-2.5">
                {getSortedGalleries().map((gallery, index) => (
                  <div
                    key={gallery.id}
                    className="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 font-bold text-sm rounded-xl shadow-sm">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {gallery.title}
                        </span>
                        
                        {gallery.isFeatured && (
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                        )}
                        
                        {isNewGallery(gallery.created_at) && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formatDate(gallery.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            disabled={disabled || isSaving || !hasChanges}
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
