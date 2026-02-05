'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useCachedSession } from '@/hooks/use-cached-session';
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
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type AuthTab = 'signin' | 'signup';

function AuthContent() {
  const { t } = useTranslation();
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
  const { data: session, status } = useCachedSession();

  const emailSchema = z.string().email({ message: t('auth.errors.invalidEmail') });
  const passwordSchema = z.string().min(6, { message: t('auth.errors.passwordTooShort') });

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
    if (passwordStrength <= 25) return t('auth.passwordStrength.weak');
    if (passwordStrength <= 50) return t('auth.passwordStrength.medium');
    if (passwordStrength <= 75) return t('auth.passwordStrength.good');
    return t('auth.passwordStrength.excellent');
  };

  const getStrengthLabelColor = () => {
    if (passwordStrength <= 25) return 'text-rose-600';
    if (passwordStrength <= 50) return 'text-amber-600';
    if (passwordStrength <= 75) return 'text-blue-600';
    return 'text-emerald-600';
  };

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
        const callbackUrl = searchParams.get('callbackUrl');
        if (callbackUrl) {
          // Decode and use the callback URL
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [session, status, router, searchParams]);

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
      setError(t('errors.payment.checkoutFailed'));
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError(t('auth.errors.accountExists'));
      } else if (errorParam === 'OAuthCallback') {
        setError(t('auth.errors.oauthError'));
      } else {
        setError(t('auth.errors.genericError'));
      }
    }
    
    const intent = searchParams.get('intent');
    if (intent === 'subscribe') {
      setSuccess(t('auth.success.accountCreated').replace('!', '.'));
      setActiveTab('signup');
    }
  }, [searchParams, t]);

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
        setError(t('auth.errors.nameRequired'));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('auth.errors.passwordMismatch'));
        return;
      }
      if (!formData.agreeTerms) {
        setError(t('auth.errors.termsRequired'));
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
          setError(t('auth.errors.invalidCredentials'));
        } else {
          // Check if there's a callback URL
          const callbackUrl = searchParams.get('callbackUrl');
          if (callbackUrl) {
            router.push(decodeURIComponent(callbackUrl));
          } else {
            router.refresh();
          }
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
          setError(data.error || t('auth.errors.signupFailed'));
          return;
        }

        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setSuccess(t('auth.success.accountCreated'));
          setActiveTab('signin');
        } else {
          const intent = searchParams.get('intent');
          const plan = searchParams.get('plan');
          const gallery = searchParams.get('gallery');
          const callbackUrl = searchParams.get('callbackUrl');
          
          if (intent === 'subscribe' && plan) {
            await handleSubscriptionRedirect(plan, gallery);
          } else if (callbackUrl) {
            router.push(decodeURIComponent(callbackUrl));
          } else {
            router.push('/auth/callback');
            router.refresh();
          }
        }
      }
    } catch {
      setError(t('auth.errors.genericError'));
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
      const callbackUrl = searchParams.get('callbackUrl');
      
      if (intent === 'subscribe' && plan) {
        localStorage.setItem('piksend_subscribe_intent', JSON.stringify({
          intent,
          plan,
          gallery,
        }));
      }
      
      // Use the provided callbackUrl or default to /auth/callback
      const finalCallbackUrl = callbackUrl ? decodeURIComponent(callbackUrl) : '/auth/callback';
      
      await signIn('google', { 
        callbackUrl: finalCallbackUrl,
        redirect: true,
      });
    } catch {
      setError(t('auth.errors.googleFailed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Back button */}
      <Link 
        href="/" 
        className="fixed top-3 left-3 z-20 p-2 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm group"
      >
        <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
      </Link>

      {/* Background Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow border border-white/10">
                <LogoIcon size={20} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold text-white">{t('auth.title')}</h1>
                <p className="text-indigo-100/80 text-[10px]">{t('common.hdPhotoSharing')}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Tabs Navigation */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl mb-4 border border-slate-200/50">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'signin' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t('auth.tabs.signIn')}
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'signup' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t('auth.tabs.signUp')}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name field (signup only) */}
              {activeTab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {t('auth.form.name')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <User className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder={t('auth.form.namePlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('auth.form.email')}
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder={t('auth.form.emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('auth.form.password')}
                  </label>
                  {activeTab === 'signin' && (
                    <Link 
                      href="/forgot-password"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {t('auth.form.forgotPassword')}
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder={t('auth.form.passwordPlaceholder')}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {activeTab === 'signup' && formData.password && (
                  <div className="mt-2 px-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getStrengthColor()} transition-all duration-500 rounded-full`} 
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={10} />
                        {t('auth.passwordStrength.label')}
                      </span>
                      <span className={`text-[9px] font-bold ${getStrengthLabelColor()}`}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password (signup only) */}
              {activeTab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {t('auth.form.confirmPassword')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <ShieldCheck className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder={t('auth.form.passwordPlaceholder')}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms checkbox (signup only) */}
              {activeTab === 'signup' && (
                <div className="flex items-start gap-2 py-1">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-[10px] text-slate-500 leading-relaxed cursor-pointer">
                    {t('auth.form.agreeTerms')}{' '}
                    <Link href="/legal/terms" className="text-indigo-600 font-bold hover:underline">{t('auth.form.termsLink')}</Link>
                    {' '}{t('auth.form.andThe')}{' '}
                    <Link href="/legal/privacy" className="text-indigo-600 font-bold hover:underline">{t('auth.form.privacyLink')}</Link>
                  </label>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <span>{activeTab === 'signin' ? t('auth.buttons.signIn') : t('auth.buttons.signUp')}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Social Login Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-indigo-400" />
                  {t('common.or')}
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 transition-all text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleLogo />
              <span>{t('common.google')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-4">
          © 2025 PikSend
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
          <p className="text-xs font-medium text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
