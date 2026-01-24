'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  AlertCircle,
  Search,
  FileText,
  Tag,
  Eye,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PublicProfileSchema, TEXT_LIMITS, ARRAY_LIMITS } from '@/types/public-profile';
import { z } from 'zod';

interface SeoTabProps {
  initialData?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    displayName?: string;
    bio?: string;
  };
  onSave: (data: SeoTabData) => Promise<void>;
  disabled?: boolean;
}

export interface SeoTabData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

interface FieldError {
  message: string;
}

export function SeoTab({ initialData, onSave, disabled = false }: SeoTabProps) {
  // Form state
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [metaKeywords, setMetaKeywords] = useState<string[]>(initialData?.metaKeywords || []);

  // Validation state
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if initial data has been set
  const [initialDataSet, setInitialDataSet] = useState(false);

  // Update hasChanges when form values change
  useEffect(() => {
    if (!initialDataSet) return;

    const changed = 
      metaTitle !== (initialData?.metaTitle || '') ||
      metaDescription !== (initialData?.metaDescription || '') ||
      JSON.stringify(metaKeywords) !== JSON.stringify(initialData?.metaKeywords || []);
    
    setHasChanges(changed);
  }, [metaTitle, metaDescription, metaKeywords, initialData, initialDataSet]);

  // Set initial data flag after first render
  useEffect(() => {
    setInitialDataSet(true);
  }, []);

  /**
   * Validate a single field with Zod
   */
  const validateField = useCallback((fieldName: string, value: any): FieldError | null => {
    try {
      const fieldSchema = PublicProfileSchema.pick({ [fieldName]: true } as any);
      fieldSchema.parse({ [fieldName]: value || undefined });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { message: error.issues[0]?.message || 'Valeur invalide' };
      }
      return { message: 'Erreur de validation' };
    }
  }, []);

  /**
   * Handle field blur - validate on blur
   */
  const handleFieldBlur = useCallback((fieldName: string, value: any) => {
    // Skip validation for empty optional fields
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setErrors(prev => {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

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
   * Add a keyword
   */
  const handleAddKeyword = useCallback(() => {
    const trimmedKeyword = keywordInput.trim();
    
    if (!trimmedKeyword) {
      return;
    }

    if (metaKeywords.length >= ARRAY_LIMITS.META_KEYWORDS) {
      toast.error(`Maximum ${ARRAY_LIMITS.META_KEYWORDS} mots-clés autorisés`);
      return;
    }

    if (metaKeywords.includes(trimmedKeyword)) {
      toast.error('Ce mot-clé existe déjà');
      return;
    }

    setMetaKeywords(prev => [...prev, trimmedKeyword]);
    setKeywordInput('');
  }, [keywordInput, metaKeywords]);

  /**
   * Remove a keyword
   */
  const handleRemoveKeyword = useCallback((keyword: string) => {
    setMetaKeywords(prev => prev.filter(k => k !== keyword));
  }, []);

  /**
   * Handle keyword input key press
   */
  const handleKeywordKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  }, [handleAddKeyword]);

  /**
   * Validate all fields before save
   */
  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<string, FieldError> = {};

    // Validate optional fields if they have values
    if (metaTitle) {
      const error = validateField('metaTitle', metaTitle);
      if (error) newErrors.metaTitle = error;
    }

    if (metaDescription) {
      const error = validateField('metaDescription', metaDescription);
      if (error) newErrors.metaDescription = error;
    }

    if (metaKeywords.length > 0) {
      const error = validateField('metaKeywords', metaKeywords);
      if (error) newErrors.metaKeywords = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [metaTitle, metaDescription, metaKeywords, validateField]);

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

    try {
      setIsSaving(true);

      const data: SeoTabData = {
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        metaKeywords: metaKeywords.length > 0 ? metaKeywords : undefined,
      };

      await onSave(data);
      
      toast.success('Paramètres SEO mis à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate default values for preview
  const previewTitle = metaTitle || (initialData?.displayName ? `${initialData.displayName} - Photographe Professionnel` : 'Votre Nom - Photographe Professionnel');
  const previewDescription = metaDescription || (initialData?.bio ? initialData.bio.substring(0, 160) : 'Découvrez mon portfolio de photographie professionnelle.');
  const previewUrl = typeof window !== 'undefined' ? window.location.origin : 'https://piksend.com';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-6">
      {/* SEO Information Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Optimisation pour les moteurs de recherche</h3>
            <p className="text-sm text-slate-500">
              Optimisez votre profil pour améliorer votre visibilité dans les résultats de recherche Google
            </p>
          </div>
        </div>

        <div className="space-y-5">

        {/* Meta Title */}
        <div className="space-y-2.5">
          <label htmlFor="metaTitle" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Titre SEO
          </label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            onBlur={(e) => handleFieldBlur('metaTitle', e.target.value)}
            placeholder={initialData?.displayName ? `${initialData.displayName} - Photographe Professionnel` : 'Votre titre personnalisé'}
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-indigo-500/10',
              errors.metaTitle && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={TEXT_LIMITS.META_TITLE}
          />
          
          {errors.metaTitle && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.metaTitle.message}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Optionnel - Si vide, un titre sera généré automatiquement</span>
            <span className={cn(
              metaTitle.length >= TEXT_LIMITS.META_TITLE * 0.9 && 'text-amber-600 font-medium',
              metaTitle.length > TEXT_LIMITS.META_TITLE && 'text-red-600 font-medium'
            )}>
              {metaTitle.length}/{TEXT_LIMITS.META_TITLE}
            </span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-indigo-900 mb-1">💡 Conseil</p>
            <p className="text-xs text-indigo-700">
              Le titre SEO apparaît dans les résultats de recherche. Incluez votre nom et votre spécialité pour un meilleur référencement.
            </p>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2.5">
          <label htmlFor="metaDescription" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            Description SEO
          </label>
          <textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            onBlur={(e) => handleFieldBlur('metaDescription', e.target.value)}
            placeholder={initialData?.bio ? initialData.bio.substring(0, 160) : 'Décrivez votre activité de photographe en quelques mots...'}
            disabled={disabled || isSaving}
            rows={4}
            maxLength={TEXT_LIMITS.META_DESCRIPTION}
            className={cn(
              'flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
              errors.metaDescription && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          
          {errors.metaDescription && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.metaDescription.message}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Optionnel - Si vide, votre bio sera utilisée</span>
            <span className={cn(
              metaDescription.length >= TEXT_LIMITS.META_DESCRIPTION * 0.9 && 'text-amber-600 font-medium',
              metaDescription.length > TEXT_LIMITS.META_DESCRIPTION && 'text-red-600 font-medium'
            )}>
              {metaDescription.length}/{TEXT_LIMITS.META_DESCRIPTION}
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-purple-900 mb-1">💡 Conseil</p>
            <p className="text-xs text-purple-700">
              La description apparaît sous le titre dans les résultats de recherche. Soyez concis et incitatif pour encourager les clics.
            </p>
          </div>
        </div>

        {/* Meta Keywords */}
        <div className="space-y-2.5">
          <label htmlFor="keywordInput" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Mots-clés SEO
          </label>
          
          {/* Keyword Input */}
          <div className="flex gap-2">
            <Input
              id="keywordInput"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder="Ajouter un mot-clé (ex: photographe mariage)"
              disabled={disabled || isSaving || metaKeywords.length >= ARRAY_LIMITS.META_KEYWORDS}
              className="px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              disabled={disabled || isSaving || !keywordInput.trim() || metaKeywords.length >= ARRAY_LIMITS.META_KEYWORDS}
              className="px-5 py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            >
              Ajouter
            </button>
          </div>

          {errors.metaKeywords && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.metaKeywords.message}</span>
            </div>
          )}

          {/* Keywords List */}
          {metaKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl">
              {metaKeywords.map((keyword) => (
                <div
                  key={keyword}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm"
                >
                  <span>{keyword}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    disabled={disabled || isSaving}
                    className="text-slate-400 hover:text-red-600 transition-colors hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Optionnel - Appuyez sur Entrée pour ajouter un mot-clé</span>
            <span className={cn(
              metaKeywords.length >= ARRAY_LIMITS.META_KEYWORDS && 'text-amber-600 font-medium'
            )}>
              {metaKeywords.length}/{ARRAY_LIMITS.META_KEYWORDS}
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-emerald-900 mb-1">💡 Conseil</p>
            <p className="text-xs text-emerald-700">
              Ajoutez des mots-clés pertinents comme votre spécialité, votre localisation, ou le type de photographie que vous pratiquez.
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Google Search Preview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Aperçu dans les résultats Google</h3>
            <p className="text-sm text-slate-500">
              Voici comment votre profil apparaîtra dans les résultats de recherche
            </p>
          </div>
        </div>

        {/* Google Search Result Preview */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl p-6 space-y-3">
          {/* URL */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
              P
            </div>
            <span className="text-slate-600 font-medium">{previewUrl}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl text-blue-600 hover:underline cursor-pointer font-normal">
            {previewTitle}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {previewDescription}
          </p>

          {/* Keywords (if any) */}
          {metaKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {metaKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg shadow-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
          <p className="text-xs text-slate-600">
            <strong>Note :</strong> L'apparence réelle dans les résultats de recherche peut varier selon Google. 
            Cet aperçu est une représentation approximative.
          </p>
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
            disabled={disabled || isSaving || !hasChanges || Object.keys(errors).length > 0}
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
