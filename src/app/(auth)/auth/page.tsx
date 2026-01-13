'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  Eye, 
  EyeOff, 
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { z } from 'zod';

const emailSchema = z.string().email({ message: 'Email invalide' });
const passwordSchema = z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' });

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type AuthTab = 'signin' | 'signup';

function AuthContent() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pass = formData.password;
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 6) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  }, [formData.password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'from-rose-500 to-pink-500';
    if (passwordStrength <= 50) return 'from-amber-500 to-orange-500';
    if (passwordStrength <= 75) return 'from-blue-500 to-indigo-500';
    return 'from-emerald-500 to-teal-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Faible';
    if (passwordStrength <= 50) return 'Moyen';
    if (passwordStrength <= 75) return 'Bon';
    return 'Excellent';
  };

  const getStrengthLabelColor = () => {
    if (passwordStrength <= 25) return 'text-rose-600';
    if (passwordStrength <= 50) return 'text-amber-600';
    if (passwordStrength <= 75) return 'text-blue-600';
    return 'text-emerald-600';
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const intent = searchParams.get('intent');
      const plan = searchParams.get('plan');
      const gallery = searchParams.get('gallery');
      
      const pendingIntent = localStorage.getItem('piksend_subscribe_intent');
      if (pendingIntent) {
        router.push('/auth/callback');
        return;
      }
      
      if (intent === 'subscribe' && plan) {
        handleSubscriptionRedirect(plan, gallery);
        return;
      }
      
      if (session.user.isAdmin) {
        router.push('/admin');
      } else {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      }
    }
  }, [session, status, router, searchParams]);

  // Handle subscription redirect after authentication
  const handleSubscriptionRedirect = async (plan: string, gallery: string | null) => {
    try {
      const response = await fetch('/api/stripe/checkout/guest-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          galleryId: null,
          successUrl: `${window.location.origin}/dashboard?subscribed=true${gallery ? `&gallery=${gallery}` : ''}`,
          cancelUrl: gallery 
            ? `${window.location.origin}/g/${gallery}?showPricing=true`
            : `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Subscription redirect error:', error);
      setError('Erreur lors de la redirection vers le paiement. Veuillez réessayer.');
      router.push('/dashboard');
    }
  };

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError('Un compte existe déjà avec cette adresse email. Connectez-vous avec votre mot de passe.');
      } else if (errorParam === 'OAuthCallback') {
        setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
      } else {
        setError('Une erreur est survenue lors de la connexion.');
      }
    }
    
    const intent = searchParams.get('intent');
    if (intent === 'subscribe') {
      setSuccess('Créez votre compte pour continuer vers le paiement.');
      setActiveTab('signup');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const validateForm = () => {
    try {
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        setError(err.issues[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (activeTab === 'signup') {
      if (!formData.name) {
        setError("Veuillez entrer votre nom.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (!formData.agreeTerms) {
        setError("Vous devez accepter les conditions d'utilisation.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'signin') {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError('Email ou mot de passe incorrect');
        } else {
          router.refresh();
        }
      } else {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password, 
            name: formData.name 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erreur lors de l\'inscription');
          return;
        }

        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.');
          setActiveTab('signin');
        } else {
          const intent = searchParams.get('intent');
          const plan = searchParams.get('plan');
          const gallery = searchParams.get('gallery');
          
          if (intent === 'subscribe' && plan) {
            await handleSubscriptionRedirect(plan, gallery);
          } else {
            router.push('/auth/callback');
            router.refresh();
          }
        }
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const intent = searchParams.get('intent');
      const plan = searchParams.get('plan');
      const gallery = searchParams.get('gallery');
      
      if (intent === 'subscribe' && plan) {
        localStorage.setItem('piksend_subscribe_intent', JSON.stringify({
          intent,
          plan,
          gallery,
        }));
      }
      
      await signIn('google', { 
        callbackUrl: '/auth/callback',
        redirect: true,
      });
    } catch {
      setError('Erreur lors de la connexion avec Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Back button */}
      <Link 
        href="/" 
        className="fixed top-4 left-4 z-20 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm group"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
      </Link>

      {/* Background Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg z-10 animate-in slide-in-from-bottom-4 duration-700">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-slate-200/50 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Header Orbs */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/10">
                <LogoIcon size={32} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                PikSend
              </h1>
              <p className="text-indigo-100/80 font-medium text-sm max-w-xs mx-auto">
                La plateforme de partage de photos préférée des créatifs.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Tabs Navigation */}
            <div className="flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/50">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'signin' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'signup' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-2xl animate-in slide-in-from-top-2 flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertCircle size={18} />
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-2xl animate-in slide-in-from-top-2 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name field (signup only) */}
              {activeTab === 'signup' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Nom Complet
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-100 transition-colors">
                      <User className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-14 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
                      placeholder="Alexandre Dupont"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Adresse Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-100 transition-colors">
                    <Mail className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Mot de passe
                  </label>
                  {activeTab === 'signin' && (
                    <Link 
                      href="/forgot-password"
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                    >
                      Oublié ?
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-100 transition-colors">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-14 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {activeTab === 'signup' && formData.password && (
                  <div className="mt-3 px-1 animate-in fade-in">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getStrengthColor()} transition-all duration-500 rounded-full`} 
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Sécurité
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${getStrengthLabelColor()}`}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password (signup only) */}
              {activeTab === 'signup' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-100 transition-colors">
                      <ShieldCheck className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-14 pr-14 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms checkbox (signup only) */}
              {activeTab === 'signup' && (
                <div className="flex items-start gap-3 ml-1 py-2 animate-in slide-in-from-top-2">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="agreeTerms"
                      name="agreeTerms"
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded-lg focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <label htmlFor="agreeTerms" className="text-xs text-slate-500 font-medium leading-relaxed cursor-pointer">
                    J&apos;accepte les{' '}
                    <Link href="/legal/terms" className="text-indigo-600 font-bold hover:underline">
                      Conditions d&apos;utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/legal/privacy" className="text-indigo-600 font-bold hover:underline">
                      Politique de confidentialité
                    </Link>.
                  </label>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group/btn overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <span className="text-base">
                      {activeTab === 'signin' ? 'Se connecter' : 'Créer mon compte'}
                    </span>
                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Social Login Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]">
                <span className="bg-white px-4 text-slate-400 flex items-center gap-2">
                  <Sparkles size={12} className="text-indigo-400" />
                  Accès rapide
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-indigo-300 hover:shadow-lg transition-all font-bold text-base text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <GoogleLogo />
              <span className="group-hover:text-indigo-600 transition-colors">Se connecter avec Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          © 2025 PikSend. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-indigo-100 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <p className="text-sm font-bold text-slate-400">Chargement...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
