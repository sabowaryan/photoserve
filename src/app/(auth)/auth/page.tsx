'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import { useCachedSession } from '@/hooks/use-cached-session';
import { Mail, Lock, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Lazy load components with better loading state
const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then(mod => ({ default: mod.GoogleSignInButton })),
  { 
    loading: () => (
      <div className="h-11 bg-slate-100 animate-pulse rounded-lg" role="status" aria-label="Loading Google sign in button">
        <span className="sr-only">Loading...</span>
      </div>
    ), 
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userCount, setUserCount] = useState(500); // Default fallback

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useCachedSession();

  // Fetch real user count with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/stats/users-count', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setUserCount(data.count);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[auth-page] Failed to fetch user count:', err);
        }
        // Keep default fallback of 500
      });
    
    return () => controller.abort();
  }, []);

  // Memoize Zod schemas to prevent recreation on every render
  const signInSchema = useMemo(() => z.object({
    email: z.string().email({ message: t('auth.errors.invalidEmail') }),
    password: z.string().min(6, { message: t('auth.errors.passwordTooShort') }),
  }), [t]);

  const signUpStep1Schema = useMemo(() => z.object({
    email: z.string().email({ message: t('auth.errors.invalidEmail') }),
  }), [t]);

  const signUpStep2Schema = useMemo(() => z.object({
    email: z.string().email(),
    password: z.string().min(6, { message: t('auth.errors.passwordTooShort') }),
    confirmPassword: z.string(),
    name: z.string().optional(),
    agreeTerms: z.boolean().refine(val => val === true, {
      message: t('auth.errors.termsRequired'),
    }),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('auth.errors.passwordMismatch'),
    path: ['confirmPassword'],
  }), [t]);

  // React Hook Form
  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpStep1Form = useForm({
    resolver: zodResolver(signUpStep1Schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const signUpStep2Form = useForm({
    resolver: zodResolver(signUpStep2Schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      agreeTerms: false,
    },
  });

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
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [session, status, router, searchParams]);

  const handleSubscriptionRedirect = useCallback(async (plan: string, gallery: string | null) => {
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
  }, [t, router]);

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

  // Sign In Handler with useCallback
  const handleSignIn = useCallback(async (data: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.errors.invalidCredentials'));
      } else {
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
  }, [t, router, searchParams]);

  // Sign Up Step 1 Handler with useCallback
  const handleSignUpStep1 = useCallback(async (data: z.infer<typeof signUpStep1Schema>) => {
    setIsLoading(true);
    setError(null);
    
    // Transfer email to step 2 form
    signUpStep2Form.setValue('email', data.email);
    
    setTimeout(() => {
      setSignupStep(2);
      setIsLoading(false);
    }, 300);
  }, [signUpStep2Form]);

  // Sign Up Step 2 Handler with useCallback
  const handleSignUpStep2 = useCallback(async (data: z.infer<typeof signUpStep2Schema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name || data.email.split('@')[0]
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || t('auth.errors.signupFailed'));
        setIsLoading(false);
        return;
      }

      setSuccess(t('auth.success.verificationEmailSent'));
      setSignupStep(3);
      setIsLoading(false);
    } catch {
      setError(t('auth.errors.genericError'));
      setIsLoading(false);
    }
  }, [t]);

  const handleGoogleSignIn = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  return (
    <div className="w-full" role="region" aria-label="Authentication">
      {/* Mobile Logo */}
      <nav className="lg:hidden mb-8 text-center" aria-label="Mobile navigation">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
          aria-label="Back to home page"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span className="font-semibold">{t('common.backToHome')}</span>
        </Link>
      </nav>

      {/* Desktop Back Button */}
      <Link
        href="/"
        className="hidden lg:inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
        aria-label="Back to home page"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
        <span className="text-sm font-medium">{t('common.backToHome')}</span>
      </Link>

      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main" aria-labelledby="auth-title">
        {/* Header */}
        <header className="mb-8">
          <h1 id="auth-title" className="text-3xl font-bold text-slate-900 mb-2">
            {activeTab === 'signin' ? t('auth.signin.title') : t('auth.signup.title')}
          </h1>
          <p className="text-slate-600">
            {activeTab === 'signin' 
              ? t('auth.signin.subtitle')
              : t('auth.signup.subtitle', { count: userCount })}
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Authentication options">
          <button
            role="tab"
            aria-selected={activeTab === 'signin'}
            aria-controls="auth-form"
            id="signin-tab"
            onClick={() => {
              setActiveTab('signin');
              setSignupStep(1);
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              activeTab === 'signin'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth.tabs.signIn')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'signup'}
            aria-controls="auth-form"
            id="signup-tab"
            onClick={() => {
              setActiveTab('signup');
              setSignupStep(1);
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              activeTab === 'signup'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth.tabs.signUp')}
          </button>
        </div>

        {/* Progress Steps for Signup */}
        {activeTab === 'signup' && (
          <div className="mb-6" role="progressbar" aria-valuenow={signupStep} aria-valuemin={1} aria-valuemax={3} aria-label={`Sign up progress: step ${signupStep} of 3`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('auth.signup.step')} {signupStep}/3
              </span>
              <span className="text-xs text-muted-foreground">
                {signupStep === 1 && t('auth.signup.stepEmail')}
                {signupStep === 2 && t('auth.signup.stepPassword')}
                {signupStep === 3 && t('auth.verification.title')}
              </span>
            </div>
            <div className="flex gap-2" aria-hidden="true">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${signupStep >= 1 ? 'bg-piksend-gradient' : 'bg-secondary'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${signupStep >= 2 ? 'bg-piksend-gradient' : 'bg-secondary'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${signupStep >= 3 ? 'bg-piksend-gradient' : 'bg-secondary'}`} />
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label="Dismiss error message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div role="status" aria-live="polite" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)} 
              className="text-green-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Dismiss success message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Google Sign In - Prominent on Signup Step 1 */}
        {activeTab === 'signup' && signupStep === 1 && (
          <div className="mb-6">
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
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium">
                  {t('common.or')}
                </span>
              </div>
            </div>
          </div>
        )}

        <form 
          id="auth-form"
          role="tabpanel"
          aria-labelledby={activeTab === 'signin' ? 'signin-tab' : 'signup-tab'}
          onSubmit={activeTab === 'signin' ? signInForm.handleSubmit(handleSignIn) : signupStep === 1 ? signUpStep1Form.handleSubmit(handleSignUpStep1) : signUpStep2Form.handleSubmit(handleSignUpStep2)} 
          className="space-y-5"
          noValidate
        >

          {/* Step 1: Email */}
          {(activeTab === 'signin' || (activeTab === 'signup' && signupStep === 1)) && (
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('auth.form.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={(activeTab === 'signin' ? signInForm.formState.errors.email : signUpStep1Form.formState.errors.email) ? 'true' : 'false'}
                    aria-describedby={(activeTab === 'signin' ? signInForm.formState.errors.email : signUpStep1Form.formState.errors.email) ? 'email-error' : undefined}
                    {...(activeTab === 'signin' ? signInForm.register('email') : signUpStep1Form.register('email'))}
                    placeholder={t('auth.form.emailPlaceholder')}
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      (activeTab === 'signin' ? signInForm.formState.errors.email : signUpStep1Form.formState.errors.email)
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                </div>
                {activeTab === 'signin' && signInForm.formState.errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">{signInForm.formState.errors.email.message}</p>
                )}
                {activeTab === 'signup' && signUpStep1Form.formState.errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">{signUpStep1Form.formState.errors.email.message}</p>
                )}
              </div>

              {activeTab === 'signin' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      {t('auth.form.password')}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {t('auth.form.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={signInForm.formState.errors.password ? 'true' : 'false'}
                      aria-describedby={signInForm.formState.errors.password ? 'password-error' : undefined}
                      {...signInForm.register('password')}
                      placeholder={t('auth.form.passwordPlaceholder')}
                      className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        signInForm.formState.errors.password
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  {signInForm.formState.errors.password && (
                    <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Password (Signup) */}
          {activeTab === 'signup' && signupStep === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                  {t('auth.form.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={signUpStep2Form.formState.errors.password ? 'true' : 'false'}
                    aria-describedby={signUpStep2Form.formState.errors.password ? 'password-error-signup' : 'password-hint'}
                    {...signUpStep2Form.register('password')}
                    placeholder={t('auth.form.passwordPlaceholder')}
                    className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      signUpStep2Form.formState.errors.password
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
                <p id="password-hint" className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
                {signUpStep2Form.formState.errors.password && (
                  <p id="password-error-signup" className="mt-2 text-sm text-red-600" role="alert">{signUpStep2Form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
                  {t('auth.form.confirmPassword')}
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={signUpStep2Form.formState.errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={signUpStep2Form.formState.errors.confirmPassword ? 'confirm-password-error' : undefined}
                    {...signUpStep2Form.register('confirmPassword')}
                    placeholder={t('auth.form.passwordPlaceholder')}
                    className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      signUpStep2Form.formState.errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
                {signUpStep2Form.formState.errors.confirmPassword && (
                  <p id="confirm-password-error" className="mt-2 text-sm text-red-600" role="alert">{signUpStep2Form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  aria-required="true"
                  aria-invalid={signUpStep2Form.formState.errors.agreeTerms ? 'true' : 'false'}
                  aria-describedby={signUpStep2Form.formState.errors.agreeTerms ? 'terms-error' : 'terms-description'}
                  {...signUpStep2Form.register('agreeTerms')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-2"
                />
                <label id="terms-description" htmlFor="agreeTerms" className="text-sm text-slate-600">
                  {t('auth.form.agreeTerms')}{' '}
                  <Link href="/legal/terms" className="font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">
                    {t('auth.form.termsLink')}
                  </Link>
                  {' '}{t('auth.form.andThe')}{' '}
                  <Link href="/legal/privacy" className="font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">
                    {t('auth.form.privacyLink')}
                  </Link>
                </label>
              </div>
              {signUpStep2Form.formState.errors.agreeTerms && (
                <p id="terms-error" className="text-sm text-red-600" role="alert">{signUpStep2Form.formState.errors.agreeTerms.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Verification */}
          {activeTab === 'signup' && signupStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center" aria-hidden="true">
                <Mail className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t('auth.verification.checkEmail')}
                </h3>
                <p className="text-slate-600 mb-1">
                  {t('auth.verification.emailSent')} <span className="font-semibold text-slate-900">{signUpStep2Form.getValues('email')}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {t('auth.verification.clickLink')}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left" role="note" aria-label="Email troubleshooting tips">
                <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  {t('auth.verification.didntReceive')}
                </h4>
                <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
                  <li>{t('auth.verification.checkSpam')}</li>
                  <li>{t('auth.verification.waitFewMinutes')}</li>
                  <li>{t('auth.verification.checkEmail')}</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-slate-500 mb-2">
                  {t('auth.verification.needHelp')}
                </p>
                <Link 
                  href="/contact" 
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                >
                  {t('auth.verification.contactSupport')}
                </Link>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            {activeTab === 'signup' && signupStep === 2 && (
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                aria-label="Go back to previous step"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {t('common.back')}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-live="polite"
              className="w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  {activeTab === 'signin' && t('auth.buttons.signIn')}
                  {activeTab === 'signup' && signupStep === 1 && t('auth.signup.continue')}
                  {activeTab === 'signup' && signupStep === 2 && t('auth.buttons.signUp')}
                  {activeTab === 'signup' && signupStep === 3 && t('auth.buttons.goToSignIn')}
                </>
              )}
            </button>
          </div>

          {/* Social Login for Sign In */}
          {activeTab === 'signin' && (
            <div className="pt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500 font-medium">
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
      </article>

      {/* Footer */}
      <footer className="mt-6 text-center text-sm text-slate-500" role="contentinfo">
        &copy; {new Date().getFullYear()} PikSend. All rights reserved.
      </footer>
    </div>
  );
}
