import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/context';
import { getServerLocale } from '@/lib/i18n/server';
import { Sparkles, Shield, Zap } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { getUserCount } from '@/lib/services/user-stats.service';
import { generateStructuredData } from '@/lib/services/seo.service';

// Preload Inter font with optimal settings - reduced weights for performance
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Reduced from 5 to 3 weights
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const translations = (await import(`@/locales/${locale}.json`)).default;
  
  const title = translations.auth?.signin?.title || 'Sign In';
  const description = translations.auth?.signin?.subtitle || 'Sign in to your PikSend account to manage your photo galleries';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';
  
  // Map locale to OpenGraph locale format
  const ogLocaleMap: Record<string, string> = {
    en: 'en_US',
    fr: 'fr_FR',
    sv: 'sv_SE',
    no: 'nb_NO',
    da: 'da_DK',
    fi: 'fi_FI',
    ja: 'ja_JP',
    ko: 'ko_KR',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
    ar: 'ar_SA',
  };
  
  return {
    title: `${title} | PikSend`,
    description,
    keywords: [
      'professional photo delivery',
      'photo gallery login',
      'photographer dashboard',
      'secure photo sharing',
      'PikSend sign in',
    ],
    authors: [{ name: 'PikSend' }],
    creator: 'PikSend',
    publisher: 'PikSend',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/auth`,
    },
    openGraph: {
      title: `${title} | PikSend`,
      description,
      type: 'website',
      locale: ogLocaleMap[locale] || 'en_US',
      url: `${baseUrl}/auth`,
      siteName: 'PikSend',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${title} | PikSend`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${title} | PikSend`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  };
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const userCount = await getUserCount();
  
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
        className={`${inter.variable} min-h-screen w-full flex flex-col lg:flex-row bg-white`}
        lang={locale}
      >
        {/* Left Side - Branding & Benefits */}
        <aside 
          className="w-full lg:w-1/2 xl:w-2/5 bg-piksend-gradient relative overflow-hidden lg:block hidden"
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
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white min-h-screen">
            {/* Logo & Tagline */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div 
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"
                  aria-hidden="true"
                >
                  <LogoIcon size={28} variant="white" />
                </div>
                <span className="text-2xl font-bold" aria-label="PikSend">PikSend</span>
              </div>
              
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                {t('auth.sidebar.headline')}
              </h1>
              
              <p className="text-lg text-white/90 mb-12 max-w-md">
                {t('auth.sidebar.subheadline', { count: userCount })}
              </p>

              {/* Benefits */}
              <ul className="space-y-6" role="list" aria-label="Key benefits">
                <li className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-5 h-5 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{t('auth.sidebar.benefit1Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit1Desc')}</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Zap className="w-5 h-5 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{t('auth.sidebar.benefit2Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit2Desc')}</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20"
                    aria-hidden="true"
                  >
                    <Shield className="w-5 h-5 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{t('auth.sidebar.benefit3Title')}</h3>
                    <p className="text-white/90 text-sm">{t('auth.sidebar.benefit3Desc')}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Testimonial */}
            <figure 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-8"
              role="figure"
              aria-label="Customer testimonial"
            >
              <div className="flex items-center gap-1 mb-3" role="img" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className="w-5 h-5 text-warning fill-current" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="sr-only">5 out of 5 stars</span>
              </div>
              <blockquote className="text-white/90 mb-4 italic">
                "{t('auth.sidebar.testimonialQuote')}"
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold"
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
          className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background min-h-screen"
          role="main"
          aria-label="Authentication form"
        >
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>
      </div>
    </I18nProvider>
  );
}
