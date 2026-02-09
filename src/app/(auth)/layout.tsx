import { Inter } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/context';
import { getServerLocale } from '@/lib/i18n/server';
import { Sparkles, Shield, Zap } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { BackButton } from '@/components/auth/BackButton';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { LanguageSwitcherWrapper } from '@/components/auth/LanguageSwitcherWrapper';
import { getUserCount } from '@/lib/services/user-stats.service';
import { generateStructuredData } from '@/lib/services/seo.service';
import { cn } from '@/lib/utils';

// Preload Inter font with optimal settings - only 2 weights for auth pages
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600'], // Only 2 weights needed for auth
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

// Note: Metadata is now generated at the page level (auth/page.tsx, forgot-password/page.tsx, reset-password/page.tsx)
// Each page exports its own generateMetadata function using the generateAuthMetadata utility

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parallel data fetching for better performance
  const [locale, userCount] = await Promise.all([
    getServerLocale(),
    getUserCount(),
  ]);
  
  // Check if RTL language
  const isRTL = locale === 'ar';
  
  // Generate structured data for SEO (only once)
  const organizationSchema = generateStructuredData('Organization');
  const softwareSchema = generateStructuredData('SoftwareApplication');
  
  // Import translations for server component (cached by Next.js)
  const translations = (await import(`@/locales/${locale}.json`)).default;
  
  // Optimized translation function
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    let result = value || key;
    
    // Replace {{count}} with actual user count
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([key, val]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
      });
    }
    
    return result;
  };

  return (
    <I18nProvider initialLocale={locale}>
      {/* Preconnect to critical origins for faster OAuth */}
      <link rel="preconnect" href="https://accounts.google.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://accounts.google.com" />
      
      {/* JSON-LD Structured Data for SEO - Combined into single script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [organizationSchema, softwareSchema]
          })
        }}
      />
      
      <div 
        className={cn(
          inter.variable,
          "min-h-screen w-full flex flex-col bg-white relative",
          "lg:flex-row"
        )}
        lang={locale}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Language Switcher - Fixed top-right corner */}
        <LanguageSwitcherWrapper />
        {/* Left Side - Branding & Benefits */}
        <aside 
          className="w-full lg:w-[52%] bg-piksend-gradient relative overflow-hidden lg:block hidden"
          aria-label={t('auth.sidebar.headline')}
        >
          {/* Decorative elements - hidden from screen readers - CSS only, no images */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-piksend-violet/20 rounded-full blur-3xl" aria-hidden="true" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 pe-40 text-white min-h-screen">
            {/* Logo & Tagline */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"
                  aria-hidden="true"
                >
                  <LogoIcon size={24} variant="white" />
                </div>
                <span className="text-xl font-bold" aria-label="PikSend">PikSend</span>
              </div>
              
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4 max-w-md">
                {t('auth.sidebar.headline')}
              </h1>
              
              <p className="text-base text-white/90 mb-8 max-w-sm">
                {t('auth.sidebar.subheadline', { count: userCount })}
              </p>

              {/* Benefits */}
              <ul className="space-y-5 max-w-sm" role="list" aria-label="Key benefits">
                <li className="flex items-start gap-3">
                  <div 
                    className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-4 h-4 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{t('auth.sidebar.benefit1Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit1Desc')}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div 
                    className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Zap className="w-4 h-4 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{t('auth.sidebar.benefit2Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit2Desc')}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div 
                    className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Shield className="w-4 h-4 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{t('auth.sidebar.benefit3Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit3Desc')}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Testimonial */}
            <figure 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 mt-8 max-w-sm"
              role="figure"
              aria-label="Customer testimonial"
            >
              <div className="flex items-center gap-1 mb-2" role="img" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className="w-4 h-4 text-warning fill-current" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="sr-only">5 out of 5 stars</span>
              </div>
              <blockquote className="text-white/90 mb-3 italic text-sm">
                "{t('auth.sidebar.testimonialQuote')}"
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold"
                  aria-hidden="true"
                >
                  MD
                </div>
                <div>
                  <p className="font-semibold text-sm">{t('auth.sidebar.testimonialAuthor')}</p>
                  <p className="text-white/90 text-xs">{t('auth.sidebar.testimonialRole')}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </aside>

        {/* Right Side - Auth Form */}
        <main 
          className="flex-1 flex items-center justify-start p-6 pt-20 lg:pt-12 lg:p-12 lg:ps-0 bg-background min-h-screen relative z-10"
          role="main"
          aria-label="Authentication form"
        >
          <div className="w-full max-w-md lg:-ms-32">
            <BackButton />
            {children}
            <AuthFooter />
          </div>
        </main>
      </div>
    </I18nProvider>
  );
}
