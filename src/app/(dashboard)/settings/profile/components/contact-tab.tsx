'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  AlertCircle,
  Mail,
  Phone,
  Globe,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  YoutubeIcon,
  Link as LinkIcon,
  MousePointerClick,
  Save,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PublicProfileSchema, TEXT_LIMITS, type SocialLinks, type CTAButton } from '@/types/public-profile';
import { z } from 'zod';

interface ContactTabProps {
  initialData?: {
    publicEmail?: string;
    phone?: string;
    website?: string;
    address?: string;
    socialLinks?: SocialLinks;
    ctaButton?: CTAButton;
  };
  onSave: (data: ContactTabData) => Promise<void>;
  disabled?: boolean;
}

export interface ContactTabData {
  publicEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  socialLinks?: SocialLinks;
  ctaButton?: CTAButton;
}

interface FieldError {
  message: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/votre-profil' },
  { key: 'facebook' as const, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/votre-page' },
  { key: 'pinterest' as const, label: 'Pinterest', icon: LinkIcon, placeholder: 'https://pinterest.com/votre-profil' },
  { key: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/votre-profil' },
  { key: 'tiktok' as const, label: 'TikTok', icon: LinkIcon, placeholder: 'https://tiktok.com/@votre-profil' },
  { key: 'youtube' as const, label: 'YouTube', icon: YoutubeIcon, placeholder: 'https://youtube.com/@votre-chaine' },
  { key: 'other' as const, label: 'Autre', icon: LinkIcon, placeholder: 'https://votre-site.com' },
];

export function ContactTab({ initialData, onSave, disabled = false }: ContactTabProps) {
  // Form state - Contact info
  const [publicEmail, setPublicEmail] = useState(initialData?.publicEmail || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [address, setAddress] = useState(initialData?.address || '');

  // Form state - Social links
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData?.socialLinks || {});

  // Form state - CTA Button
  const [ctaText, setCtaText] = useState(initialData?.ctaButton?.text || '');
  const [ctaUrl, setCtaUrl] = useState(initialData?.ctaButton?.url || '');
  const [ctaStyle, setCtaStyle] = useState<'primary' | 'secondary'>(initialData?.ctaButton?.style || 'primary');

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
      publicEmail !== (initialData?.publicEmail || '') ||
      phone !== (initialData?.phone || '') ||
      website !== (initialData?.website || '') ||
      address !== (initialData?.address || '') ||
      JSON.stringify(socialLinks) !== JSON.stringify(initialData?.socialLinks || {}) ||
      ctaText !== (initialData?.ctaButton?.text || '') ||
      ctaUrl !== (initialData?.ctaButton?.url || '') ||
      ctaStyle !== (initialData?.ctaButton?.style || 'primary');
    
    setHasChanges(changed);
  }, [publicEmail, phone, website, address, socialLinks, ctaText, ctaUrl, ctaStyle, initialData, initialDataSet]);

  // Set initial data flag after first render
  useEffect(() => {
    setInitialDataSet(true);
  }, []);

  /**
   * Validate a single field with Zod
   */
  const validateField = useCallback((fieldName: string, value: any): FieldError | null => {
    try {
      // Handle nested fields for socialLinks and ctaButton
      if (fieldName.startsWith('socialLinks.')) {
        if (value) {
          const schema = z.string().url('URL invalide');
          schema.parse(value);
        }
        return null;
      }

      if (fieldName.startsWith('ctaButton.')) {
        const field = fieldName.split('.')[1];
        if (field === 'text' && value) {
          const schema = z.string().min(1).max(TEXT_LIMITS.CTA_TEXT);
          schema.parse(value);
        } else if (field === 'url' && value) {
          const schema = z.string().url('URL invalide');
          schema.parse(value);
        }
        return null;
      }

      // Validate top-level fields
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
    if (!value) {
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
   * Handle social link change
   */
  const handleSocialLinkChange = useCallback((platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value || undefined,
    }));
  }, []);

  /**
   * Validate all fields before save
   */
  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<string, FieldError> = {};

    // Validate contact fields if they have values
    if (publicEmail) {
      const error = validateField('publicEmail', publicEmail);
      if (error) newErrors.publicEmail = error;
    }

    if (phone) {
      const error = validateField('phone', phone);
      if (error) newErrors.phone = error;
    }

    if (website) {
      const error = validateField('website', website);
      if (error) newErrors.website = error;
    }

    if (address) {
      const error = validateField('address', address);
      if (error) newErrors.address = error;
    }

    // Validate social links
    Object.entries(socialLinks).forEach(([key, url]) => {
      if (url) {
        const error = validateField(`socialLinks.${key}`, url);
        if (error) newErrors[`socialLinks.${key}`] = error;
      }
    });

    // Validate CTA button - both fields required if one is filled
    if (ctaText || ctaUrl) {
      if (!ctaText) {
        newErrors['ctaButton.text'] = { message: 'Le texte du bouton est requis' };
      } else {
        const error = validateField('ctaButton.text', ctaText);
        if (error) newErrors['ctaButton.text'] = error;
      }

      if (!ctaUrl) {
        newErrors['ctaButton.url'] = { message: 'L\'URL du bouton est requise' };
      } else {
        const error = validateField('ctaButton.url', ctaUrl);
        if (error) newErrors['ctaButton.url'] = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [publicEmail, phone, website, address, socialLinks, ctaText, ctaUrl, validateField]);

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

      // Clean up social links - remove empty values
      const cleanedSocialLinks = Object.entries(socialLinks).reduce((acc, [key, value]) => {
        if (value) {
          acc[key as keyof SocialLinks] = value;
        }
        return acc;
      }, {} as SocialLinks);

      const data: ContactTabData = {
        publicEmail: publicEmail || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address || undefined,
        socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined,
        ctaButton: ctaText && ctaUrl ? {
          text: ctaText,
          url: ctaUrl,
          style: ctaStyle,
        } : undefined,
      };

      await onSave(data);
      
      toast.success('Informations de contact mises à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-6">
      {/* Contact Information Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Informations de contact</h3>
            <p className="text-sm text-slate-500">
              Ces informations seront affichées publiquement sur votre profil
            </p>
          </div>
        </div>

        <div className="space-y-5">
        {/* Public Email */}
        <div className="space-y-2.5">
          <label htmlFor="publicEmail" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            Email public
          </label>
          <Input
            id="publicEmail"
            type="email"
            value={publicEmail}
            onChange={(e) => setPublicEmail(e.target.value)}
            onBlur={(e) => handleFieldBlur('publicEmail', e.target.value)}
            placeholder="contact@exemple.com"
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-blue-500/10',
              errors.publicEmail && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          
          {errors.publicEmail && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.publicEmail.message}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Votre email sera affiché avec protection anti-spam
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2.5">
          <label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            Téléphone
          </label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => handleFieldBlur('phone', e.target.value)}
            placeholder="+33 6 12 34 56 78"
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-green-500/10',
              errors.phone && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={TEXT_LIMITS.PHONE}
          />
          
          {errors.phone && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.phone.message}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Format international recommandé
          </p>
        </div>

        {/* Website */}
        <div className="space-y-2.5">
          <label htmlFor="website" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            Site web
          </label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={(e) => handleFieldBlur('website', e.target.value)}
            placeholder="https://votre-site.com"
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-indigo-500/10',
              errors.website && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          
          {errors.website && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.website.message}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2.5">
          <label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            Adresse
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={(e) => handleFieldBlur('address', e.target.value)}
            placeholder="123 Rue de la Photo, 75001 Paris, France"
            disabled={disabled || isSaving}
            rows={3}
            maxLength={TEXT_LIMITS.ADDRESS}
            className={cn(
              'flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
              errors.address && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          
          {errors.address && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors.address.message}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Optionnel</span>
            <span className={cn(
              address.length >= TEXT_LIMITS.ADDRESS * 0.9 && 'text-amber-600 font-medium'
            )}>
              {address.length}/{TEXT_LIMITS.ADDRESS}
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* Social Networks Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white shadow-lg shadow-pink-500/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Réseaux sociaux</h3>
            <p className="text-sm text-slate-500">
              Ajoutez les liens vers vos profils de réseaux sociaux
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="space-y-2.5">
              <label htmlFor={`social-${key}`} className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Icon className="w-4 h-4 text-pink-600" />
                {label}
              </label>
              <Input
                id={`social-${key}`}
                type="url"
                value={socialLinks[key] || ''}
                onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                onBlur={(e) => handleFieldBlur(`socialLinks.${key}`, e.target.value)}
                placeholder={placeholder}
                disabled={disabled || isSaving}
                className={cn(
                  'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-pink-500/10',
                  errors[`socialLinks.${key}`] && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              
              {errors[`socialLinks.${key}`] && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errors[`socialLinks.${key}`]?.message}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Bouton d'action (CTA)</h3>
            <p className="text-sm text-slate-500">
              Configurez un bouton d'appel à l'action pour inciter les visiteurs à vous contacter
            </p>
          </div>
        </div>

        <div className="space-y-5">

        {/* CTA Text */}
        <div className="space-y-2.5">
          <label htmlFor="ctaText" className="text-sm font-semibold text-slate-700">
            Texte du bouton
          </label>
          <Input
            id="ctaText"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            onBlur={(e) => handleFieldBlur('ctaButton.text', e.target.value)}
            placeholder="Réserver une séance"
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-amber-500/10',
              errors['ctaButton.text'] && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={TEXT_LIMITS.CTA_TEXT}
          />
          
          {errors['ctaButton.text'] && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors['ctaButton.text'].message}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Optionnel</span>
            <span>{ctaText.length}/{TEXT_LIMITS.CTA_TEXT}</span>
          </div>
        </div>

        {/* CTA URL */}
        <div className="space-y-2.5">
          <label htmlFor="ctaUrl" className="text-sm font-semibold text-slate-700">
            URL du bouton
          </label>
          <Input
            id="ctaUrl"
            type="url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            onBlur={(e) => handleFieldBlur('ctaButton.url', e.target.value)}
            placeholder="https://calendly.com/votre-lien"
            disabled={disabled || isSaving}
            className={cn(
              'px-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-amber-500/10',
              errors['ctaButton.url'] && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          
          {errors['ctaButton.url'] && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errors['ctaButton.url'].message}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Lien vers votre formulaire de contact, calendrier de réservation, etc.
          </p>
        </div>

        {/* CTA Style */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Style du bouton
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCtaStyle('primary')}
              disabled={disabled || isSaving}
              className={cn(
                'px-4 py-4 rounded-xl border-2 transition-all font-medium text-sm',
                ctaStyle === 'primary'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                (disabled || isSaving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div className={cn(
                  'px-4 py-2 rounded-lg text-white font-semibold shadow-sm',
                  'bg-indigo-600'
                )}>
                  Primaire
                </div>
                <span className="text-xs text-slate-500">Bouton mis en avant</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCtaStyle('secondary')}
              disabled={disabled || isSaving}
              className={cn(
                'px-4 py-4 rounded-xl border-2 transition-all font-medium text-sm',
                ctaStyle === 'secondary'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                (disabled || isSaving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div className={cn(
                  'px-4 py-2 rounded-lg font-semibold border-2 shadow-sm',
                  'border-indigo-600 text-indigo-600 bg-white'
                )}>
                  Secondaire
                </div>
                <span className="text-xs text-slate-500">Bouton discret</span>
              </div>
            </button>
          </div>
        </div>

        {/* CTA Preview */}
        {ctaText && ctaUrl && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-700 mb-4">Aperçu du bouton :</p>
            <div className="flex justify-center">
              <button
                type="button"
                disabled
                className={cn(
                  'px-6 py-3 rounded-xl font-semibold transition-all shadow-sm',
                  ctaStyle === 'primary'
                    ? 'bg-indigo-600 text-white'
                    : 'border-2 border-indigo-600 text-indigo-600 bg-white'
                )}
              >
                {ctaText}
              </button>
            </div>
          </div>
        )}
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
