'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Info,
  User,
  Hash,
  Type,
  FileText,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PublicProfileSchema, TEXT_LIMITS } from '@/types/public-profile';
import { z } from 'zod';

interface GeneralTabProps {
  initialData?: {
    slug?: string;
    displayName?: string;
    tagline?: string;
    bio?: string;
  };
  onSave: (data: GeneralTabData) => Promise<void>;
  disabled?: boolean;
}

export interface GeneralTabData {
  slug: string;
  displayName: string;
  tagline?: string;
  bio?: string;
}

interface SlugCheckResult {
  available: boolean;
  suggestions?: string[];
}

interface FieldError {
  message: string;
}

export function GeneralTab({ initialData, onSave, disabled = false }: GeneralTabProps) {
  // Form state
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [bio, setBio] = useState(initialData?.bio || '');

  // Validation state
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced slug for availability checking
  const debouncedSlug = useDebounce(slug, 500);

  // Track if initial data has been set
  const [initialDataSet, setInitialDataSet] = useState(false);

  // Update hasChanges when form values change
  useEffect(() => {
    if (!initialDataSet) return;

    const changed = 
      slug !== (initialData?.slug || '') ||
      displayName !== (initialData?.displayName || '') ||
      tagline !== (initialData?.tagline || '') ||
      bio !== (initialData?.bio || '');
    
    setHasChanges(changed);
  }, [slug, displayName, tagline, bio, initialData, initialDataSet]);

  // Set initial data flag after first render
  useEffect(() => {
    setInitialDataSet(true);
  }, []);

  /**
   * Validate a single field with Zod
   */
  const validateField = useCallback((fieldName: keyof GeneralTabData, value: any): FieldError | null => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = PublicProfileSchema.pick({ [fieldName]: true });
      fieldSchema.parse({ [fieldName]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { message: error.issues[0]?.message || 'Valeur invalide' };
      }
      return { message: 'Erreur de validation' };
    }
  }, []);

  /**
   * Check slug availability via API
   */
  const checkSlugAvailability = useCallback(async (slugToCheck: string): Promise<SlugCheckResult> => {
    if (!slugToCheck) {
      return { available: false };
    }

    try {
      const response = await fetch(`/api/public-profile/check-slug?slug=${encodeURIComponent(slugToCheck)}`);
      
      if (!response.ok) {
        throw new Error('Échec de la vérification du slug');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error checking slug:', error);
      throw error;
    }
  }, []);

  /**
   * Handle slug change with real-time validation
   */
  const handleSlugChange = useCallback((value: string) => {
    setSlug(value);
    setSlugCheckStatus('idle');
    setSlugSuggestions([]);

    // Validate format immediately
    const error = validateField('slug', value);
    if (error) {
      setErrors(prev => ({ ...prev, slug: error }));
    } else {
      setErrors(prev => {
        const { slug: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validateField]);

  /**
   * Check slug availability when debounced value changes
   */
  useEffect(() => {
    if (!debouncedSlug || errors.slug) {
      return;
    }

    // Don't check if it's the same as initial slug
    if (debouncedSlug === initialData?.slug) {
      setSlugCheckStatus('available');
      return;
    }

    const checkAvailability = async () => {
      setSlugCheckStatus('checking');
      
      try {
        const result = await checkSlugAvailability(debouncedSlug);
        
        if (result.available) {
          setSlugCheckStatus('available');
          setSlugSuggestions([]);
        } else {
          setSlugCheckStatus('unavailable');
          setSlugSuggestions(result.suggestions || []);
          setErrors(prev => ({
            ...prev,
            slug: { message: 'Ce slug est déjà utilisé' }
          }));
        }
      } catch (error) {
        setSlugCheckStatus('idle');
        toast.error('Impossible de vérifier la disponibilité du slug');
      }
    };

    checkAvailability();
  }, [debouncedSlug, initialData?.slug, errors.slug, checkSlugAvailability]);

  /**
   * Handle field blur - validate on blur
   */
  const handleFieldBlur = useCallback((fieldName: keyof GeneralTabData, value: any) => {
    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors(prev => {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validateField]);

  /**
   * Apply a suggested slug
   */
  const applySuggestion = useCallback((suggestion: string) => {
    setSlug(suggestion);
    setSlugCheckStatus('idle');
    setSlugSuggestions([]);
  }, []);

  /**
   * Validate all fields before save
   */
  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<string, FieldError> = {};

    // Validate required fields
    const slugError = validateField('slug', slug);
    if (slugError) newErrors.slug = slugError;

    const displayNameError = validateField('displayName', displayName);
    if (displayNameError) newErrors.displayName = displayNameError;

    // Validate optional fields if they have values
    if (tagline) {
      const taglineError = validateField('tagline', tagline);
      if (taglineError) newErrors.tagline = taglineError;
    }

    if (bio) {
      const bioError = validateField('bio', bio);
      if (bioError) newErrors.bio = bioError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [slug, displayName, tagline, bio, validateField]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    // Check slug availability one more time
    if (slugCheckStatus === 'unavailable') {
      toast.error('Le slug choisi n\'est pas disponible');
      return;
    }

    try {
      setIsSaving(true);

      const data: GeneralTabData = {
        slug,
        displayName,
        tagline: tagline || undefined,
        bio: bio || undefined,
      };

      await onSave(data);
      
      toast.success('Profil mis à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl space-y-6 animate-in slide-in-from-bottom-6">
      {/* Slug & Display Name Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slug Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl text-white shadow-lg">
              <Hash size={18} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-slate-900">Slug <span className="text-red-500">*</span></span>
              <p className="text-xs text-slate-500 mt-0.5">Votre URL personnalisée</p>
            </div>
          </div>
          
          <div className="relative">
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={(e) => handleFieldBlur('slug', e.target.value)}
              placeholder="mon-nom-photographe"
              disabled={disabled || isSaving}
              maxLength={TEXT_LIMITS.SLUG}
              className={cn(
                'w-full px-4 py-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
                errors.slug && 'border-red-500 focus:ring-red-500/10',
                slugCheckStatus === 'available' && !errors.slug && 'border-green-500 focus:ring-green-500/10'
              )}
            />
            
            {/* Status Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugCheckStatus === 'checking' && (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              )}
              {slugCheckStatus === 'available' && !errors.slug && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {slugCheckStatus === 'unavailable' && (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>

          {/* URL Preview */}
          {slug && !errors.slug && (
            <div className="flex items-center gap-2 text-xs mt-3 p-2 bg-indigo-50 rounded-lg">
              <Info className="w-3 h-3 text-indigo-600" />
              <span className="text-slate-600">URL : <span className="font-bold text-indigo-600">/p/{slug}</span></span>
            </div>
          )}

          {/* Error Message */}
          {errors.slug && (
            <div className="flex items-start gap-2 text-sm text-red-600 mt-3 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.slug.message}</span>
            </div>
          )}

          {/* Slug Suggestions */}
          {slugSuggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 mt-3">
              <p className="text-sm font-bold text-amber-900">
                Suggestions disponibles :
              </p>
              <div className="flex flex-wrap gap-2">
                {slugSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-100 transition-all hover:scale-105"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-3">
            Lettres minuscules, chiffres et tirets. Max {TEXT_LIMITS.SLUG} caractères.
          </p>
        </div>

        {/* Display Name Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
              <User size={18} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-slate-900">Nom d'affichage <span className="text-red-500">*</span></span>
              <p className="text-xs text-slate-500 mt-0.5">Votre nom public</p>
            </div>
          </div>
          
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={(e) => handleFieldBlur('displayName', e.target.value)}
            placeholder="Jean Dupont"
            disabled={disabled || isSaving}
            maxLength={TEXT_LIMITS.DISPLAY_NAME}
            className={cn(
              'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
              errors.displayName && 'border-red-500 focus:ring-red-500/10'
            )}
          />
          
          {errors.displayName && (
            <div className="flex items-start gap-2 text-sm text-red-600 mt-3 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.displayName.message}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-3">
            Maximum {TEXT_LIMITS.DISPLAY_NAME} caractères
          </p>
        </div>
      </div>

      {/* Tagline Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg">
            <Type size={18} />
          </div>
          <div className="flex-1">
            <span className="font-bold text-slate-900">Slogan</span>
            <p className="text-xs text-slate-500 mt-0.5">Votre accroche professionnelle</p>
          </div>
        </div>
        
        <input
          id="tagline"
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          onBlur={(e) => handleFieldBlur('tagline', e.target.value)}
          placeholder="Photographe de mariage et portrait"
          disabled={disabled || isSaving}
          maxLength={TEXT_LIMITS.TAGLINE}
          className={cn(
            'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
            errors.tagline && 'border-red-500 focus:ring-red-500/10'
          )}
        />
        
        {errors.tagline && (
          <div className="flex items-start gap-2 text-sm text-red-600 mt-3 p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errors.tagline.message}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-slate-500 mt-3">
          <span>Optionnel</span>
          <span className={cn(
            tagline.length >= TEXT_LIMITS.TAGLINE * 0.9 && 'text-amber-600 font-bold'
          )}>
            {tagline.length}/{TEXT_LIMITS.TAGLINE}
          </span>
        </div>
      </div>

      {/* Bio Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white shadow-lg">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <span className="font-bold text-slate-900">Biographie</span>
            <p className="text-xs text-slate-500 mt-0.5">Présentez votre parcours et votre style</p>
          </div>
        </div>
        
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onBlur={(e) => handleFieldBlur('bio', e.target.value)}
          placeholder="Parlez de vous, votre expérience, votre style photographique..."
          disabled={disabled || isSaving}
          rows={5}
          maxLength={TEXT_LIMITS.BIO}
          className={cn(
            'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none',
            errors.bio && 'border-red-500 focus:ring-red-500/10'
          )}
        />
        
        {errors.bio && (
          <div className="flex items-start gap-2 text-sm text-red-600 mt-3 p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errors.bio.message}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-slate-500 mt-3">
          <span>Optionnel</span>
          <span className={cn(
            bio.length >= TEXT_LIMITS.BIO * 0.9 && 'text-amber-600 font-bold'
          )}>
            {bio.length}/{TEXT_LIMITS.BIO}
          </span>
        </div>
      </div>

      {/* Save Button Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Save size={16} className="text-indigo-400" />
            <span className="text-sm font-bold text-white/70">Sauvegarder les modifications</span>
          </div>
          
          <button
            type="submit"
            disabled={disabled || isSaving || !hasChanges || Object.keys(errors).length > 0}
            className="relative w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={18} />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
