'use client';

import { useRouter } from 'next/navigation';
import {
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Minus,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Check,
  Shield,
  Star,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/layouts/landing-header';
import { Footer } from '@/components/layouts';
import { PricingSection } from '@/components/pricing';
import { GuestUploadForm } from '@/components/guest';
import { ComparisonTable } from '@/components/conversion/comparison-table';
import { useTranslation } from '@/lib/i18n/context';
import type { LandingContent } from '@/lib/content/landing';

interface LandingPageClientProps {
  content: LandingContent;
}

export function LandingPageClient({ content }: LandingPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const onGetStarted = () => router.push('/auth');
  const onViewFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };
  const onScrollToUpload = () => {
    document.getElementById('guest-upload')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUploadComplete = (gallerySlug: string) => {
    router.push(`/g/${gallerySlug}?showPricing=true`);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/10 selection:text-primary font-sans">
      <LandingHeader />

      {/* HERO SECTION */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden" aria-label="Hero Section">
        {/* Advanced Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-[5%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-warning/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.15]" />
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left order-2 lg:order-1 space-y-8">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 backdrop-blur-xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="flex items-center justify-center w-5 h-5 bg-primary rounded-full text-primary-foreground shadow-sm">
                  <Sparkles size={10} />
                </span>
                <span className="text-[10px] md:text-xs font-black text-foreground uppercase tracking-[0.2em]">
                  {t('landing.badge')}
                </span>
              </div>

              {/* Editorial Headline - Updated per Requirement 10.1 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-foreground tracking-tight leading-[1.05] animate-in fade-in slide-in-from-bottom-4 delay-100 duration-1000">
                <span className="sr-only">Professional Photo Delivery Galleries — </span>
                Livrez vos photos en{' '}
                <span className="relative inline-block">
                  <span className="text-primary italic">
                    5 minutes
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                .{' '}
                <span className="block mt-2">
                  Vendez vos galeries.{' '}
                  <span className="text-primary">Gardez 90%</span>.
                </span>
              </h1>

              {/* Premium Subtitle */}
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-4 delay-200 duration-1000 font-medium leading-relaxed">
                La plateforme de livraison photo professionnelle qui vous permet de{' '}
                <span className="text-foreground font-bold">partager vos galeries en quelques clics</span>
                {' '}et de{' '}
                <span className="text-foreground font-bold">vendre vos photos avec la commission la plus basse du marché</span>.
              </p>

              {/* Badges under hero - Requirement 10.2 */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 animate-in fade-in slide-in-from-bottom-4 delay-250 duration-1000">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                  <Sparkles size={16} strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider">Plugin Lightroom Unique</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success border border-success/20 rounded-full">
                  <TrendingUp size={16} strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider">Commission 10%</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 text-accent border border-accent/20 rounded-full">
                  <Clock size={16} strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider">Support &lt; 2h</span>
                </div>
              </div>

              {/* Modern CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 delay-300 duration-1000">
                <Button
                  onClick={onScrollToUpload}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-7 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all group"
                  aria-label={t('landing.cta.primary')}
                >
                  <Upload size={20} className="mr-2" />
                  {t('landing.cta.primary')}
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={onViewFeatures}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-7 text-base font-bold rounded-2xl border-border bg-white/50 backdrop-blur-md hover:bg-white hover:border-primary transition-all shadow-sm active:scale-[0.98]"
                  aria-label={t('landing.cta.secondary')}
                >
                  {t('landing.cta.secondary')}
                </Button>
              </div>

              {/* Refined Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-1000">
                <div className="flex items-center gap-2 text-muted-foreground group">
                  <div className="p-1.5 bg-success/10 text-success rounded-lg group-hover:bg-success group-hover:text-white transition-colors">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-widest">{t('common.zeroCompression')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground group">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    <Shield size={14} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-widest">{t('common.fullySecure')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground group">
                  <div className="p-1.5 bg-warning/10 text-warning rounded-lg group-hover:bg-warning group-hover:text-white transition-colors">
                    <Zap size={14} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-widest">{t('common.readyIn2Min')}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="order-1 lg:order-2 animate-in fade-in slide-in-from-right-8 delay-300 duration-1000">
              <div className="relative max-w-md mx-auto lg:max-w-none">
                {/* Main Gallery Preview Card - Professional Glassmorphism */}
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 transform hover:scale-[1.02] transition-all duration-700 ease-out group">
                  {/* Gallery Header */}
                  <div className="flex items-center justify-between mb-5 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <ImageIcon size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-foreground tracking-tight">{t('common.exampleWeddingSession')}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.examplePhotosHd')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t('common.active')}</span>
                    </div>
                  </div>

                  {/* Photo Grid Preview - Editorial Style */}
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
                    {[
                      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=400&h=400&fit=crop',
                      null
                    ].map((imageUrl, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-2xl overflow-hidden transition-transform duration-500 hover:scale-105 ${i === 5 ? 'bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20' : 'bg-muted shadow-sm'}`}
                      >
                        {i === 5 ? (
                          <span className="text-primary font-black text-sm md:text-lg">+24</span>
                        ) : (
                          <img
                            src={imageUrl!}
                            alt={`Photo Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Gallery Stats - Modern Dashboard Feel */}
                  <div className="flex items-center justify-between px-3 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-base font-black text-foreground tracking-tight">1.2k</p>
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('common.views')}</p>
                      </div>
                      <div className="w-px h-8 bg-primary/10" />
                      <div className="text-left">
                        <p className="text-base font-black text-foreground tracking-tight">342</p>
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('common.downloads')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className="text-warning fill-warning" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Micro-UI Elements */}
                <div className="absolute -top-6 -right-4 md:-top-8 md:-right-6 bg-white/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-border animate-bounce-slow">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-success/10 rounded-xl flex items-center justify-center">
                      <Check size={16} strokeWidth={3} className="text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">{t('common.hdQuality')}</p>
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-tight">{t('common.noCompression')}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-4 md:-bottom-8 md:-left-6 bg-primary rounded-2xl p-3 shadow-2xl text-primary-foreground animate-bounce-slow delay-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap size={16} strokeWidth={2.5} className="fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black">{t('common.instantDelivery')}</p>
                      <p className="text-[10px] text-white/70 font-extrabold uppercase tracking-tight">{t('common.secureUniqueLink')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 md:mt-24 max-w-4xl mx-auto">
            {[
              { value: '500+', label: t('landing.stats.experts'), icon: '💼', color: 'primary' },
              { value: '12K+', label: t('landing.stats.galleries'), icon: '📸', color: 'accent' },
              { value: '150K+', label: t('landing.stats.photos'), icon: '✨', color: 'primary' },
              { value: '4.9/5', label: t('landing.stats.satisfaction'), icon: '🌟', color: 'warning' }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-border group-hover:border-primary/30 transition-all shadow-sm">
                  <div className="text-xl mb-2 filter drop-shadow-sm">{stat.icon}</div>
                  <p className="text-2xl font-display font-black text-foreground mb-0.5 tracking-tighter">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em]">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUEST UPLOAD SECTION */}
      <section id="guest-upload" className="py-20 md:py-32 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
              <Upload size={12} strokeWidth={3} />
              {t('common.upload')}
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
              {t('guest.upload.title')}
            </h2>
            <p className="text-muted-foreground font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('guest.upload.subtitle')}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white/60">
            <GuestUploadForm
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION - Premium Dark UI */}
      <section className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
            <div className="lg:w-1/2 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-[0.2em]">
                <AlertTriangle size={12} strokeWidth={3} />
                <span>{t('landing.problem.badge')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-[1.1] tracking-tight">
                {t('landing.problem.title')}{' '}
                <span className="text-destructive italic">
                  {t('landing.problem.titleHighlight')}
                </span>
              </h2>

              <div className="space-y-4 text-slate-400 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                <p>
                  {t('landing.problem.paragraph1')}{' '}
                  <span className="text-white font-bold">{t('landing.problem.paragraph1Highlight')}</span>
                </p>
                <p>
                  {t('landing.problem.paragraph2')}{' '}
                  <span className="text-white font-bold">{t('landing.problem.paragraph2Highlight')}</span>
                </p>
                <p>
                  {t('landing.problem.paragraph3')}{' '}
                  <span className="text-destructive font-bold">{t('landing.problem.paragraph3Highlight')}</span> {t('landing.problem.paragraph3End')}
                </p>
              </div>
            </div>

            <div className="lg:w-1/2 w-full max-w-md">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl space-y-6">
                {/* PikSend Comparison */}
                <div className="bg-primary/20 border border-primary/30 p-5 rounded-2xl group transition-all hover:bg-primary/25 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('landing.problem.comparison.original')}</p>
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <p className="text-2xl font-display font-black text-white">{t('landing.problem.comparison.originalSpec')}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {t('landing.problem.comparison.originalDesc')}
                  </p>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-2xl group transition-all hover:bg-destructive/15 cursor-default opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-destructive uppercase tracking-[0.2em]">{t('landing.problem.comparison.classic')}</p>
                    <Minus size={20} className="text-destructive" />
                  </div>
                  <p className="text-2xl font-display font-black text-white">{t('landing.problem.comparison.classicSpec')}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {t('landing.problem.comparison.classicDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="features" className="py-24 md:py-36 px-4 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 md:mb-24 space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
              {t('landing.benefits.title')}
            </h2>
            <p className="text-muted-foreground font-medium text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t('landing.benefits.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Zap, title: t('landing.benefit1.title'), desc: t('landing.benefit1.desc'), color: 'primary' },
              { icon: Shield, title: t('landing.benefit2.title'), desc: t('landing.benefit2.desc'), color: 'success' },
              { icon: ImageIcon, title: t('landing.benefit3.title'), desc: t('landing.benefit3.desc'), color: 'accent' },
              { icon: TrendingUp, title: t('landing.benefit4.title'), desc: t('landing.benefit4.desc'), color: 'warning' },
              { icon: Check, title: t('landing.benefit5.title'), desc: t('landing.benefit5.desc'), color: 'primary' },
              { icon: Star, title: t('landing.benefit6.title'), desc: t('landing.benefit6.desc'), color: 'accent' }
            ].map((benefit, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-[2rem] p-8 border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
              >
                <div className={`mb-6 inline-flex p-4 rounded-2xl bg-${benefit.color}/10 text-${benefit.color} group-hover:bg-${benefit.color} group-hover:text-white transition-colors duration-500`}>
                  <benefit.icon size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-display font-black text-foreground mb-3 tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTROOM PLUGIN HIGHLIGHT SECTION - Requirement 10.6 */}
      <section className="py-20 md:py-32 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles size={12} strokeWidth={3} />
                <span>Exclusif PikSend</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-[1.1] tracking-tight text-foreground">
                Le seul avec un{' '}
                <span className="text-primary italic">
                  Plugin Lightroom
                </span>
              </h2>

              <div className="space-y-4 text-muted-foreground font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                <p>
                  Exportez et uploadez vos photos{' '}
                  <span className="text-foreground font-bold">directement depuis Lightroom</span>
                  {' '}en un seul clic. Plus besoin de jongler entre plusieurs applications.
                </p>
                <p>
                  Créez vos galeries en{' '}
                  <span className="text-foreground font-bold">moins de 2 minutes</span>
                  {' '}et concentrez-vous sur ce qui compte vraiment : votre photographie.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 pt-4">
                <Button
                  onClick={onScrollToUpload}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all group"
                >
                  Essayer maintenant
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white/60">
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Sélectionnez vos photos', desc: 'Dans Lightroom Classic' },
                    { step: '2', title: 'Cliquez sur "Exporter vers PikSend"', desc: 'Un seul bouton' },
                    { step: '3', title: 'Votre galerie est prête', desc: 'En moins de 2 minutes' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI PIKSEND VS CONCURRENTS SECTION - Requirement 10.4 */}
      <section className="py-24 md:py-36 px-4 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 md:mb-24 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-[0.2em]">
              <TrendingUp size={12} strokeWidth={3} />
              <span>Comparaison</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
              Pourquoi PikSend vs Concurrents ?
            </h2>
            <p className="text-muted-foreground font-medium text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              La commission la plus basse, le plugin Lightroom unique, et le support le plus rapide du marché.
            </p>
          </div>

          {/* Import and use ComparisonTable component */}
          <div className="mb-12">
            <ComparisonTable highlightPikSend={true} />
          </div>

          {/* Key Differentiators */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: TrendingUp,
                title: 'Commission la plus basse',
                desc: '10% vs 15% chez les concurrents',
                highlight: 'Économisez 5% sur chaque vente'
              },
              {
                icon: Sparkles,
                title: 'Plugin Lightroom unique',
                desc: 'Exportez directement depuis Lightroom',
                highlight: 'Gagnez 80% de temps'
              },
              {
                icon: Clock,
                title: 'Support ultra-rapide',
                desc: 'Réponse en moins de 2h',
                highlight: 'vs 24-48h ailleurs'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-8 border border-border hover:border-primary/30 hover:shadow-xl transition-all">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary">
                  <item.icon size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-display font-black text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-medium text-sm mb-3">
                  {item.desc}
                </p>
                <p className="text-primary font-bold text-sm">
                  {item.highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION - Requirement 10.5 */}
      <section className="py-24 md:py-36 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 md:mb-24 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 text-warning text-[10px] font-black uppercase tracking-[0.2em]">
              <Star size={12} strokeWidth={3} />
              <span>Témoignages</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
              500+ photographes nous font confiance
            </h2>
            <p className="text-muted-foreground font-medium text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              Découvrez pourquoi les photographes professionnels choisissent PikSend
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sophie Martin',
                role: 'Photographe Mariage',
                location: 'Paris, France',
                photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                quote: 'Le plugin Lightroom a transformé mon workflow. Je livre mes galeries en 5 minutes au lieu de 30. Un gain de temps incroyable !',
                rating: 5,
                metric: '+2500€/mois de revenus'
              },
              {
                name: 'Thomas Dubois',
                role: 'Photographe Événementiel',
                location: 'Lyon, France',
                photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                quote: 'La commission à 10% fait toute la différence. J\'économise 500€ par mois comparé à mon ancien service. Et le support est ultra-réactif !',
                rating: 5,
                metric: '500€ économisés/mois'
              },
              {
                name: 'Marie Lefebvre',
                role: 'Photographe Portrait',
                location: 'Bordeaux, France',
                photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
                quote: 'Mes clients adorent la qualité des galeries. Zéro compression, téléchargement rapide, interface élégante. PikSend est parfait !',
                rating: 5,
                metric: '4.9/5 satisfaction clients'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-8 border border-border hover:shadow-2xl transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground font-medium text-base leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-primary font-bold text-sm">{testimonial.metric}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => router.push('/testimonials')}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base font-bold rounded-2xl"
            >
              Voir tous les témoignages
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <PricingSection content={content} />

      {/* FINAL CTA SECTION */}
      <section className="py-24 md:py-36 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/[0.02]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary-foreground)_0%,transparent_70%)] opacity-20" />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="bg-primary rounded-[3rem] p-10 md:p-20 text-primary-foreground shadow-2xl relative overflow-hidden group">
            {/* CTA Background Sparkles */}
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={120} className="animate-pulse-slow" />
            </div>

            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black tracking-tight leading-tight">
                {t('landing.finalCta.title')}
              </h2>
              <p className="text-primary-foreground/80 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                {t('landing.finalCta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  onClick={onGetStarted}
                  size="xl"
                  variant="secondary"
                  className="w-full sm:w-auto px-10 py-8 text-lg font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all group"
                >
                  {t('landing.finalCta.button')}
                  <ArrowRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                  {t('landing.finalCta.noCreditCard')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
