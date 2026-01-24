'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Star,
  X,
  Calendar,
  User,
  MessageSquare,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TEXT_LIMITS, ARRAY_LIMITS, type Testimonial } from '@/types/public-profile';
import { z } from 'zod';

interface TestimonialsTabProps {
  initialData?: {
    testimonials?: Testimonial[];
  };
  onSave: (data: TestimonialsTabData) => Promise<void>;
  disabled?: boolean;
}

export interface TestimonialsTabData {
  testimonials?: Testimonial[];
}

interface FieldError {
  message: string;
}

interface TestimonialFormData {
  clientName: string;
  clientPhoto: string;
  rating: number;
  text: string;
  date: string;
}

export function TestimonialsTab({ initialData, onSave, disabled = false }: TestimonialsTabProps) {
  // Form state
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialData?.testimonials || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [clientName, setClientName] = useState<string>('');
  const [clientPhoto, setClientPhoto] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const isoString = today.toISOString();
    const datePart = isoString.substring(0, 10);
    return datePart;
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if initial data has been set
  const [initialDataSet, setInitialDataSet] = useState(false);

  // Update hasChanges when testimonials change
  useEffect(() => {
    if (!initialDataSet) return;

    const changed = JSON.stringify(testimonials) !== JSON.stringify(initialData?.testimonials || []);
    setHasChanges(changed);
  }, [testimonials, initialData, initialDataSet]);

  // Set initial data flag after first render
  useEffect(() => {
    setInitialDataSet(true);
  }, []);

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName: keyof TestimonialFormData, value: any): FieldError | null => {
    try {
      if (fieldName === 'clientName') {
        z.string()
          .min(1, 'Le nom du client est requis')
          .max(TEXT_LIMITS.CLIENT_NAME, `Le nom ne peut pas dépasser ${TEXT_LIMITS.CLIENT_NAME} caractères`)
          .parse(value);
      } else if (fieldName === 'clientPhoto') {
        if (value) {
          z.string().url('URL de photo invalide').parse(value);
        }
      } else if (fieldName === 'rating') {
        z.number()
          .int('La note doit être un nombre entier')
          .min(1, 'La note minimale est 1')
          .max(5, 'La note maximale est 5')
          .parse(value);
      } else if (fieldName === 'text') {
        z.string()
          .min(1, 'Le texte du témoignage est requis')
          .max(TEXT_LIMITS.TESTIMONIAL_TEXT, `Le texte ne peut pas dépasser ${TEXT_LIMITS.TESTIMONIAL_TEXT} caractères`)
          .parse(value);
      } else if (fieldName === 'date') {
        z.string().datetime('Date invalide').parse(new Date(value).toISOString());
      }
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
  const handleFieldBlur = useCallback((fieldName: keyof TestimonialFormData, value: any) => {
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
   * Reset form
   */
  const resetForm = useCallback(() => {
    setClientName('');
    setClientPhoto('');
    setRating(5);
    setText('');
    const today = new Date();
    const isoString = today.toISOString();
    const datePart = isoString.substring(0, 10);
    setDate(datePart);
    setErrors({});
    setEditingId(null);
    setIsFormOpen(false);
  }, []);

  /**
   * Open form for adding new testimonial
   */
  const handleAddNew = useCallback(() => {
    if (testimonials.length >= ARRAY_LIMITS.TESTIMONIALS) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${ARRAY_LIMITS.TESTIMONIALS} témoignages`);
      return;
    }
    resetForm();
    setIsFormOpen(true);
  }, [testimonials.length, resetForm]);

  /**
   * Open form for editing existing testimonial
   */
  const handleEdit = useCallback((testimonial: Testimonial) => {
    setClientName(testimonial.clientName);
    setClientPhoto(testimonial.clientPhoto ?? '');
    setRating(testimonial.rating);
    setText(testimonial.text);
    const testimonialDate = new Date(testimonial.date);
    const isoString = testimonialDate.toISOString();
    const datePart = isoString.substring(0, 10);
    setDate(datePart);
    setEditingId(testimonial.id);
    setIsFormOpen(true);
    setErrors({});
  }, []);

  /**
   * Delete a testimonial
   */
  const handleDelete = useCallback((id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Témoignage supprimé');
    }
  }, []);

  /**
   * Validate all form fields
   */
  const validateFormFields = useCallback((): boolean => {
    const newErrors: Record<string, FieldError> = {};

    const clientNameError = validateField('clientName', clientName);
    if (clientNameError) newErrors.clientName = clientNameError;

    if (clientPhoto) {
      const clientPhotoError = validateField('clientPhoto', clientPhoto);
      if (clientPhotoError) newErrors.clientPhoto = clientPhotoError;
    }

    const ratingError = validateField('rating', rating);
    if (ratingError) newErrors.rating = ratingError;

    const textError = validateField('text', text);
    if (textError) newErrors.text = textError;

    const dateError = validateField('date', date);
    if (dateError) newErrors.date = dateError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [clientName, clientPhoto, rating, text, date, validateField]);

  /**
   * Save testimonial (add or update)
   */
  const handleSaveTestimonial = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormFields()) {
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    const testimonialData: Testimonial = {
      id: editingId || crypto.randomUUID(),
      clientName,
      clientPhoto: clientPhoto || undefined,
      rating,
      text,
      date: new Date(date).toISOString(),
    };

    if (editingId) {
      // Update existing
      setTestimonials(prev => prev.map(t => t.id === editingId ? testimonialData : t));
      toast.success('Témoignage mis à jour');
    } else {
      // Add new
      setTestimonials(prev => [...prev, testimonialData]);
      toast.success('Témoignage ajouté');
    }

    resetForm();
  }, [editingId, clientName, clientPhoto, rating, text, date, validateFormFields, resetForm]);

  /**
   * Handle main form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const data: TestimonialsTabData = {
        testimonials: testimonials.length > 0 ? testimonials : undefined,
      };

      await onSave(data);
      
      toast.success('Témoignages mis à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render star rating
   */
  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                'w-5 h-5',
                star <= count
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-slate-300'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white shadow-lg shadow-pink-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Témoignages clients</h3>
              <p className="text-sm text-slate-500">
                Ajoutez jusqu'à {ARRAY_LIMITS.TESTIMONIALS} témoignages de clients satisfaits
              </p>
            </div>
          </div>
          
          {!isFormOpen && (
            <button
              type="button"
              onClick={handleAddNew}
              disabled={disabled || testimonials.length >= ARRAY_LIMITS.TESTIMONIALS}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Testimonial Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-slate-900 text-base">
              {editingId ? 'Modifier le témoignage' : 'Nouveau témoignage'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
          {/* Client Name */}
          <div className="space-y-2.5">
            <label htmlFor="clientName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Nom du client <span className="text-red-500">*</span>
            </label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onBlur={(e) => handleFieldBlur('clientName', e.target.value)}
              placeholder="Marie Dubois"
              disabled={disabled}
              className={cn(
                'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-blue-500/10',
                errors.clientName && 'border-red-500 focus-visible:ring-red-500'
              )}
              maxLength={TEXT_LIMITS.CLIENT_NAME}
            />
            
            {errors.clientName && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.clientName.message}</span>
              </div>
            )}
          </div>

          {/* Client Photo */}
          <div className="space-y-2.5">
            <label htmlFor="clientPhoto" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              Photo du client (optionnel)
            </label>
            <Input
              id="clientPhoto"
              type="url"
              value={clientPhoto}
              onChange={(e) => setClientPhoto(e.target.value)}
              onBlur={(e) => handleFieldBlur('clientPhoto', e.target.value)}
              placeholder="https://exemple.com/photo.jpg"
              disabled={disabled}
              className={cn(
                'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-purple-500/10',
                errors.clientPhoto && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            
            {errors.clientPhoto && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.clientPhoto.message}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">
              URL de la photo du client
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-600" />
              Note <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              {renderStars(rating, true)}
              <span className="text-sm font-semibold text-amber-700">
                {rating} / 5
              </span>
            </div>
            
            {errors.rating && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.rating.message}</span>
              </div>
            )}
          </div>

          {/* Testimonial Text */}
          <div className="space-y-2.5">
            <label htmlFor="text" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-600" />
              Témoignage <span className="text-red-500">*</span>
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={(e) => handleFieldBlur('text', e.target.value)}
              placeholder="Un photographe exceptionnel ! Les photos sont magnifiques..."
              disabled={disabled}
              rows={4}
              maxLength={TEXT_LIMITS.TESTIMONIAL_TEXT}
              className={cn(
                'flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-500/10 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                errors.text && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            
            {errors.text && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.text.message}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500">
              <span>Maximum {TEXT_LIMITS.TESTIMONIAL_TEXT} caractères</span>
              <span className={cn(
                text.length >= TEXT_LIMITS.TESTIMONIAL_TEXT * 0.9 && 'text-amber-600 font-medium'
              )}>
                {text.length}/{TEXT_LIMITS.TESTIMONIAL_TEXT}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2.5">
            <label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={(e) => handleFieldBlur('date', e.target.value)}
              disabled={disabled}
              className={cn(
                'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-green-500/10',
                errors.date && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            
            {errors.date && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.date.message}</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              disabled={disabled}
              className="px-5 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveTestimonial}
              disabled={disabled}
              className="px-5 py-2.5 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all hover:scale-105 shadow-sm"
            >
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-slate-900">
              Témoignages ({testimonials.length}/{ARRAY_LIMITS.TESTIMONIALS})
            </h4>
          </div>

          <div className="space-y-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl p-5 hover:border-pink-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Client Info */}
                    <div className="flex items-center gap-3">
                      {testimonial.clientPhoto && (
                        <img
                          src={testimonial.clientPhoto}
                          alt={testimonial.clientName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{testimonial.clientName}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {testimonial.date ? new Date(testimonial.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : ''}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Text */}
                    <p className="text-sm text-slate-700 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(testimonial)}
                      disabled={disabled || isSaving}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(testimonial.id)}
                      disabled={disabled || isSaving}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {testimonials.length === 0 && !isFormOpen && (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-300 rounded-xl">
          <MessageSquare className="w-14 h-14 text-slate-400 mx-auto mb-4" />
          <h4 className="font-semibold text-slate-900 mb-2">Aucun témoignage</h4>
          <p className="text-sm text-slate-600 mb-5">
            Ajoutez des témoignages de clients satisfaits pour renforcer votre crédibilité
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all hover:scale-105 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter votre premier témoignage
          </button>
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
