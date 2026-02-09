"use client";

/**
 * Soft Signup Modal Component
 * 
 * Progressive signup modal triggered at strategic moments in the funnel:
 * - After 2 minutes of viewing a guest gallery
 * - When clicking on a locked feature
 * - When reaching plan limits
 * 
 * Requirements: 5.6, 6.8 (sales-funnel-optimization spec)
 */

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type SignupTrigger = 
  | 'guest_upload' 
  | 'feature_locked' 
  | 'limit_reached'
  | 'time_based'
  | 'manual';

interface SoftSignupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** What triggered the signup modal */
  trigger: SignupTrigger;
  /** Optional default email to pre-fill */
  defaultEmail?: string;
  /** Optional callback URL after signup */
  callbackUrl?: string;
  /** Optional feature name that was locked (for feature_locked trigger) */
  lockedFeature?: string;
}

type SignupStep = 1 | 2 | 3;

/**
 * Get trigger-specific messaging
 */
function getTriggerMessaging(trigger: SignupTrigger, lockedFeature?: string) {
  switch (trigger) {
    case 'guest_upload':
      return {
        title: "Vous aimez PikSend ?",
        subtitle: "Créez votre compte gratuit pour débloquer toutes les fonctionnalités",
        benefits: [
          "Galeries illimitées",
          "Branding personnalisé",
          "Téléchargement ZIP",
          "Support prioritaire"
        ]
      };
    case 'feature_locked':
      return {
        title: lockedFeature ? `${lockedFeature} est Premium` : "Cette fonctionnalité est Premium",
        subtitle: "Créez votre compte gratuit et découvrez toutes nos fonctionnalités",
        benefits: [
          "Essai gratuit 14 jours",
          "Pas de carte bancaire requise",
          "Annulation à tout moment",
          "Support 24/7"
        ]
      };
    case 'limit_reached':
      return {
        title: "Limite atteinte",
        subtitle: "Passez à Premium pour continuer à créer des galeries",
        benefits: [
          "100 galeries par mois",
          "Stockage illimité",
          "Branding personnalisé",
          "Commission 10% seulement"
        ]
      };
    case 'time_based':
      return {
        title: "Prêt à créer vos galeries ?",
        subtitle: "Rejoignez 500+ photographes qui utilisent PikSend",
        benefits: [
          "Configuration en 5 minutes",
          "Plugin Lightroom unique",
          "Commission la plus basse",
          "Support réactif"
        ]
      };
    default:
      return {
        title: "Créez votre compte",
        subtitle: "Commencez gratuitement, pas de carte bancaire requise",
        benefits: [
          "Galeries illimitées",
          "Branding personnalisé",
          "Téléchargement ZIP",
          "Support prioritaire"
        ]
      };
  }
}

/**
 * Soft Signup Modal with progressive 3-step flow
 */
export function SoftSignupModal({
  isOpen,
  onClose,
  trigger,
  defaultEmail = "",
  callbackUrl,
  lockedFeature
}: SoftSignupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: defaultEmail,
    password: "",
    confirmPassword: "",
    name: "",
    agreeTerms: false
  });

  const messaging = getTriggerMessaging(trigger, lockedFeature);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setFormData(prev => ({ ...prev, email: defaultEmail }));
    }
  }, [isOpen, defaultEmail]);

  // Track modal shown event
  useEffect(() => {
    if (isOpen) {
      // Track signup modal shown
      if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
        (window as any).trackFunnelEvent('signup_modal_shown', {
          trigger,
          lockedFeature
        });
      }
    }
  }, [isOpen, trigger, lockedFeature]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    // Track step completion
    if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
      (window as any).trackFunnelEvent('signup_step_completed', {
        step: 1,
        trigger
      });
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!formData.agreeTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          name: formData.name || formData.email.split('@')[0]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la création du compte");
        setIsLoading(false);
        return;
      }

      // Track signup completion
      if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
        (window as any).trackFunnelEvent('signup_completed', {
          trigger,
          email: formData.email
        });
      }

      // Auto sign in
      const { signIn } = await import('next-auth/react');
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Compte créé, mais erreur de connexion. Veuillez vous connecter manuellement.");
        setIsLoading(false);
        return;
      }

      // Move to step 3 (profile - optional)
      setStep(3);
      setIsLoading(false);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleSkipProfile = () => {
    // Redirect to callback URL or dashboard
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      router.push('/dashboard');
    }
    router.refresh();
    onClose();
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSkipProfile();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold opacity-90">PikSend</span>
            </div>
            <h2 className="text-2xl font-black mb-2">{messaging.title}</h2>
            <p className="text-indigo-100 text-sm">{messaging.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Étape {step}/3
              </span>
              <span className="text-xs text-slate-400">
                {step === 1 && "Votre email"}
                {step === 2 && "Mot de passe"}
                {step === 3 && "Profil (optionnel)"}
              </span>
            </div>
            <div className="flex gap-1">
              <div className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                step >= 1 ? "bg-gradient-to-r from-indigo-600 to-violet-600" : "bg-slate-200"
              )} />
              <div className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                step >= 2 ? "bg-gradient-to-r from-indigo-600 to-violet-600" : "bg-slate-200"
              )} />
              <div className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                step >= 3 ? "bg-gradient-to-r from-indigo-600 to-violet-600" : "bg-slate-200"
              )} />
            </div>
          </div>

          {/* No credit card required */}
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">
              Pas de carte bancaire requise
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="vous@exemple.com"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="Minimum 6 caractères"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="Confirmez votre mot de passe"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 cursor-pointer">
                  J'accepte les{' '}
                  <a href="/legal/terms" target="_blank" className="text-indigo-600 font-bold hover:underline">
                    conditions d'utilisation
                  </a>
                  {' '}et la{' '}
                  <a href="/legal/privacy" target="_blank" className="text-indigo-600 font-bold hover:underline">
                    politique de confidentialité
                  </a>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-all"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Créer mon compte</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Profile (optional) */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-bold text-slate-700 mb-1">
                  Bienvenue sur PikSend ! 🎉
                </h3>
                <p className="text-sm text-slate-500">
                  Complétez votre profil (optionnel)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nom complet <span className="text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="Jean Dupont"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Terminer</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSkipProfile}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all"
                >
                  Je ferai ça plus tard
                </button>
              </div>
            </form>
          )}

          {/* Benefits list (only show on step 1) */}
          {step === 1 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Ce qui vous attend
              </h3>
              <ul className="space-y-2">
                {messaging.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
