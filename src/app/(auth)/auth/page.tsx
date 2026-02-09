'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import { useCachedSession } from '@/hooks/use-cached-session';
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';
import { AuthButton } from '@/components/auth/AuthButton';
import { FormInput } from '@/components/auth/FormInput';
import { ErrorMessage } from '@/components/auth/ErrorMessage';
import { SuccessMessage } from '@/components/auth/SuccessMessage';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

// Lazy load non-critical icon
const Sparkles = lazy(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })));

// Lazy load Google Sign-In button for better code splitting
const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then(mod => ({ default: mod.GoogleSignInButton })),
  {
    loading: () => <LoadingSpinner size="sm" />,
    ssr: false
  }
);

type AuthTab = 'signin' | 'signup';
type SignupStep = 1 | 2 | 3;

export default function AuthPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null); // Inline validation
  const [passwordError, setPasswordError] = useState<string | null>(null); // Inline validation

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

    // Clear general error when user starts typing
    if (error) setError(null);

    // Inline validation for email
    if (name === 'email' && value) {
      try {
        emailSchema.parse(value);
        setEmailError(null);
      } catch (err) {
        if (err instanceof z.ZodError && err.issues[0]) {
          setEmailError(err.issues[0].message);
        }
      }
    } else if (name === 'email' && !value) {
      setEmailError(null);
    }

    // Inline validation for password
    if (name === 'password' && value && activeTab === 'signup') {
      try {
        passwordSchema.parse(value);
        setPasswordError(null);
      } catch (err) {
        if (err instanceof z.ZodError && err.issues[0]) {
          setPasswordError(err.issues[0].message);
        }
      }
    } else if (name === 'password' && !value) {
      setPasswordError(null);
    }
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

  const handleSignupStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'signup') {
      // Step 1: Email validation
      if (signupStep === 1) {
        try {
          emailSchema.parse(formData.email);
          setIsLoading(true);

          // Move to step 2 (password)
          setTimeout(() => {
            setSignupStep(2);
            setIsLoading(false);
          }, 300); // Small delay for UX
        } catch (err) {
          if (err instanceof z.ZodError && err.issues[0]) {
            setError(err.issues[0].message);
          } else {
            setError(t('auth.errors.genericError'));
          }
          setIsLoading(false);
        }
        return;
      }

      // Step 2: Password + terms validation and account creation
      if (signupStep === 2) {
        try {
          passwordSchema.parse(formData.password);
          if (formData.password !== formData.confirmPassword) {
            setError(t('auth.errors.passwordMismatch'));
            return;
          }
          if (!formData.agreeTerms) {
            setError(t('auth.errors.termsRequired'));
            return;
          }

          setIsLoading(true);

          // Create account
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name || formData.email.split('@')[0] // Use email prefix if no name
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.error || t('auth.errors.signupFailed'));
            setIsLoading(false);
            return;
          }

          // Don't auto sign in - show verification message instead
          setSuccess(t('auth.success.verificationEmailSent'));
          setSignupStep(3); // Move to step 3 to show verification message
          setIsLoading(false);
        } catch (err) {
          if (err instanceof z.ZodError && err.issues[0]) {
            setError(err.issues[0].message);
          } else {
            setError(t('auth.errors.genericError'));
          }
          setIsLoading(false);
        }
        return;
      }

      // Step 3: Verification message - redirect to sign in
      if (signupStep === 3) {
        setActiveTab('signin');
        setSignupStep(1);
        return;
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'signup') {
      handleSignupStepSubmit(e);
      return;
    }

    // Sign in flow
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
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
    } catch {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError(null);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 p-2.5 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={t('common.backToHome')}
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
      </Link>

      <div className="w-full flex items-center justify-center">

        {/* Main Glassmorphic Card */}
        <div className="w-full max-w-[28rem] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative group/card">

          {/* Subtle glow effect on card hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Header Section */}
          <div className="relative pt-8 px-6 pb-6 flex flex-col items-center text-center">

            {/* Logo with glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full" />
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-indigo-500/20 shadow-lg shadow-indigo-500/20 relative z-10 w-16 h-16 flex items-center justify-center">
                <LogoIcon size={32} className="text-indigo-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-100 mb-2">
              {activeTab === 'signin' ? t('auth.title') : t('auth.buttons.signUp')}
            </h1>
            <p className="text-slate-400 text-sm max-w-xs">
              {activeTab === 'signin'
                ? t('auth.sidebar.subheadline')
                : t('auth.signup.stepAccount')}
            </p>
          </div>

          {/* Navigation Tabs - Glassmorphic Pill Style */}
          <div className="px-6 pb-4">
            <div className="p-1.5 bg-slate-950/50 rounded-xl border border-white/5 flex relative">
              {/* Sliding Indicator */}
              <div
                className={`absolute inset-y-1.5 w-[calc(50%-0.375rem)] bg-slate-800 rounded-[0.6rem] shadow-md border border-white/10 transition-all duration-300 ease-out z-0`}
                style={{
                  left: activeTab === 'signin' ? '0.375rem' : 'calc(50%)'
                }}
              />

              <button
                onClick={() => {
                  setActiveTab('signin');
                  setSignupStep(1);
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors relative z-10 ${activeTab === 'signin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {t('auth.tabs.signIn')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setSignupStep(1);
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors relative z-10 ${activeTab === 'signup' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {t('auth.tabs.signUp')}
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="px-6 pb-8 relative">

            {/* Messages */}
            {error && (
              <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                <ErrorMessage
                  message={error}
                  dismissible
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {success && (
              <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                <SuccessMessage
                  message={success}
                  dismissible
                  onDismiss={() => setSuccess(null)}
                />
              </div>
            )}

            {/* Signup Progress Steps */}
            {activeTab === 'signup' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('auth.signup.step')} {signupStep}/3
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {signupStep === 1 && "Account"}
                    {signupStep === 2 && "Security"}
                    {signupStep === 3 && "Verify"}
                  </span>
                </div>
                <div className="flex gap-1.5 h-1">
                  <div className={`flex-1 rounded-full transition-colors duration-500 ${signupStep >= 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  <div className={`flex-1 rounded-full transition-colors duration-500 ${signupStep >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  <div className={`flex-1 rounded-full transition-colors duration-500 ${signupStep >= 3 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                </div>
              </div>
            )}

            {/* Google Sign In - Prominent on Signup */}
            {activeTab === 'signup' && signupStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <GoogleSignInButton
                  variant="primary"
                  onSignInStart={handleGoogleSignIn}
                  callbackUrl={searchParams.get('callbackUrl') ? decodeURIComponent(searchParams.get('callbackUrl')!) : undefined}
                  subscribeIntent={
                    searchParams.get('intent') === 'subscribe' && searchParams.get('plan')
                      ? {
                        intent: searchParams.get('intent')!,
                        plan: searchParams.get('plan')!,
                        gallery: searchParams.get('gallery'),
                      }
                      : undefined
                  }
                />

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-slate-900/50 px-3 text-slate-500 flex items-center gap-1 backdrop-blur-xl">
                      Or continue with
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" role="form">

              {/* Step 1: Email */}
              {(activeTab === 'signin' || (activeTab === 'signup' && signupStep === 1)) && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                  <FormInput
                    id="email-input"
                    type="email"
                    name="email"
                    label={t('auth.form.email')}
                    placeholder={t('auth.form.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleInputChange}
                    error={emailError || undefined}
                    icon={<Mail size={16} />}
                    required
                  />

                  {activeTab === 'signin' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label htmlFor="password-input" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {t('auth.form.password')}
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:underline"
                        >
                          {t('auth.form.forgotPassword')}
                        </Link>
                      </div>
                      <FormInput
                        id="password-input"
                        type="password"
                        name="password"
                        label=""
                        placeholder={t('auth.form.passwordPlaceholder')}
                        value={formData.password}
                        onChange={handleInputChange}
                        error={passwordError || undefined}
                        icon={<Lock size={16} />}
                        showPasswordToggle
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Password (Signup) */}
              {(activeTab === 'signup' && signupStep === 2) && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-4">
                  <div className="space-y-1">
                    <FormInput
                      id="password-input"
                      type="password"
                      name="password"
                      label={t('auth.form.password')}
                      placeholder={t('auth.form.passwordPlaceholder')}
                      value={formData.password}
                      onChange={handleInputChange}
                      error={passwordError || undefined}
                      icon={<Lock size={16} />}
                      showPasswordToggle
                      required
                    />

                    {formData.password && !passwordError && (
                      <PasswordStrengthIndicator password={formData.password} />
                    )}
                  </div>

                  <FormInput
                    id="confirm-password-input"
                    type="password"
                    name="confirmPassword"
                    label={t('auth.form.confirmPassword')}
                    placeholder={t('auth.form.passwordPlaceholder')}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={error && error.includes('match') ? error : undefined}
                    icon={<ShieldCheck size={16} />}
                    showPasswordToggle
                    required
                  />

                  <div className="flex items-start gap-3 py-1 px-1">
                    <div className="relative flex items-center">
                      <input
                        id="agreeTerms"
                        name="agreeTerms"
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={handleInputChange}
                        className="peer h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-offset-slate-900 focus:ring-indigo-500 checked:bg-indigo-600"
                        aria-required="true"
                      />
                    </div>
                    <label htmlFor="agreeTerms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                      {t('auth.form.agreeTerms')}{' '}
                      <Link href="/legal/terms" className="text-indigo-400 hover:text-indigo-300 hover:underline">{t('auth.form.termsLink')}</Link>
                      {' '}{t('auth.form.andThe')}{' '}
                      <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300 hover:underline">{t('auth.form.privacyLink')}</Link>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Verification (Signup) */}
              {(activeTab === 'signup' && signupStep === 3) && (
                <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                      <Mail className="text-indigo-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {t('auth.verification.checkEmail')}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">
                      We've sent a magic link to <span className="text-white font-medium">{formData.email}</span>
                    </p>
                  </div>

                  <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-500" />
                      {t('auth.verification.didntReceive')}
                    </h4>
                    <ul className="text-xs text-slate-500 space-y-1 ml-6 list-disc">
                      <li>{t('auth.verification.checkSpam')}</li>
                      <li>{t('auth.verification.waitFewMinutes')}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {activeTab === 'signup' && (signupStep === 2 || signupStep === 3) && (
                  <button
                    type="button"
                    onClick={() => setSignupStep((signupStep - 1) as SignupStep)}
                    className="mb-4 text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-white/5"
                  >
                    <ArrowLeft size={14} />
                    {t('common.back')}
                  </button>
                )}

                <AuthButton
                  type="submit"
                  loading={isLoading}
                  fullWidth
                  size="md"
                  variant="primary"
                >
                  {activeTab === 'signin' && t('auth.buttons.signIn')}
                  {activeTab === 'signup' && signupStep === 1 && t('auth.signup.continue')}
                  {activeTab === 'signup' && signupStep === 2 && t('auth.buttons.signUp')}
                  {activeTab === 'signup' && signupStep === 3 && t('auth.buttons.goToSignIn')}
                </AuthButton>
              </div>

              {/* Social Login Separator - for signin only */}
              {(activeTab === 'signin') && (
                <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/50" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-slate-900/50 px-3 text-slate-500 flex items-center gap-1 backdrop-blur-xl">
                        <Suspense fallback={<span className="w-2.5 h-2.5 inline-block" />}>
                          <Sparkles size={10} className="text-indigo-400" />
                        </Suspense>
                        {t('common.or')}
                      </span>
                    </div>
                  </div>
                  <GoogleSignInButton
                    variant="primary"
                    onSignInStart={handleGoogleSignIn}
                    callbackUrl={searchParams.get('callbackUrl') ? decodeURIComponent(searchParams.get('callbackUrl')!) : undefined}
                  />
                </div>
              )}

            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-4 left-0 w-full text-center">
          <p className="text-[10px] text-slate-600/50 hover:text-slate-500 transition-colors">
            &copy; {new Date().getFullYear()} PikSend. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
