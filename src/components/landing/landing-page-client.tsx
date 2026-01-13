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
import { LandingHeader } from '@/components/layouts/landing-header';
import { Footer } from '@/components/layouts';
import { PricingSection } from '@/components/pricing';
import { GuestUploadForm } from '@/components/guest';
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
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <LandingHeader />

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-10 md:pt-28 md:pb-16 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-16 left-[10%] w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-indigo-500/15 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 right-[5%] w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-violet-500/10 rounded-full blur-[80px] animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-amber-500/8 rounded-full blur-[60px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        
        <div className="container mx-auto relative z-10 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 mb-4 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <span className="flex items-center justify-center w-4 h-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full text-white">
                  <Sparkles size={8} />
                </span>
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  {t('landing.badge')}
                </span>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4 animate-in fade-in slide-in-from-bottom-4 delay-100">
                {t('landing.title')}{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {t('landing.titleHighlight')}
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full h-2 text-indigo-500/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm md:text-base lg:text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 mb-6 animate-in fade-in slide-in-from-bottom-4 delay-200 font-medium leading-relaxed">
                {t('landing.subtitle')}
                <span className="text-slate-900 font-bold"> {t('landing.subtitleHighlight')} </span> 
                {t('landing.subtitleEnd')}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 animate-in fade-in slide-in-from-bottom-4 delay-300 mb-6">
                <button 
                  onClick={onScrollToUpload}
                  className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98] group"
                >
                  <Upload size={16} />
                  {t('landing.cta.primary')}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button 
                  onClick={onViewFeatures}
                  className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3.5 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm active:scale-[0.98]"
                >
                  {t('landing.cta.secondary')}
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 delay-500">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold">Zéro compression</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Shield size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold">100% sécurisé</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[10px] font-bold">Prêt en 2 min</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Visual Element */}
            <div className="order-1 lg:order-2 animate-in fade-in slide-in-from-right-8 delay-300">
              <div className="relative max-w-md mx-auto lg:max-w-none">
                {/* Main Gallery Preview Card */}
                <div className="relative bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-xl shadow-slate-200/60 border border-slate-200/80 transform hover:scale-[1.01] transition-transform duration-500">
                  {/* Gallery Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
                        <ImageIcon size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Séance Photo Mariage</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">24 photos • HD</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  
                  {/* Photo Grid Preview */}
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3">
                    {[
                      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop',
                      null
                    ].map((imageUrl, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-lg md:rounded-xl overflow-hidden ${i === 5 ? 'bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center' : 'bg-slate-100'}`}
                      >
                        {i === 5 ? (
                          <span className="text-white font-black text-sm md:text-base">+18</span>
                        ) : (
                          <img 
                            src={imageUrl!} 
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Gallery Stats */}
                  <div className="flex items-center justify-between px-2 py-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900">847</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Vues</p>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900">156</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Downloads</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-white rounded-xl p-2 md:p-2.5 shadow-lg border border-slate-100 animate-bounce-slow">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Check size={12} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900">Qualité HD</p>
                      <p className="text-[8px] text-slate-400 font-bold">0% compression</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-2 md:p-2.5 shadow-lg text-white animate-bounce-slow delay-500">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} />
                    <div>
                      <p className="text-[10px] font-black">Livraison instantanée</p>
                      <p className="text-[8px] text-white/70 font-bold">Lien unique sécurisé</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 md:mt-12 max-w-3xl mx-auto">
            {[
              { value: '500+', label: t('landing.stats.experts'), icon: '👨‍💼', color: 'indigo' },
              { value: '12K+', label: t('landing.stats.galleries'), icon: '📸', color: 'violet' },
              { value: '150K+', label: t('landing.stats.photos'), icon: '🖼️', color: 'purple' },
              { value: '4.9/5', label: t('landing.stats.satisfaction'), icon: '⭐', color: 'amber' }
            ].map((stat, i) => (
              <div 
                key={i}
                className="relative group"
              >
                {/* Glow effect on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300`} />
                
                {/* Card */}
                <div className="relative bg-white rounded-xl p-3 border border-slate-200/60 group-hover:border-slate-300 transition-all group-hover:shadow-md">
                  {/* Icon */}
                  <div className="text-lg mb-1.5 transform group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  
                  {/* Value */}
                  <p className="text-xl md:text-2xl font-black text-slate-900 mb-0.5">
                    {stat.value}
                  </p>
                  
                  {/* Label */}
                  <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUEST UPLOAD SECTION */}
      <section id="guest-upload" className="py-14 md:py-20 px-4 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
              <Upload size={10} />
              {t('common.upload')}
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
              {t('guest.upload.title')}
            </h2>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              {t('guest.upload.subtitle')}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg shadow-slate-200/50 border border-slate-100">
            <GuestUploadForm 
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-12 md:py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest mb-3">
                <AlertTriangle size={10} /> {t('landing.problem.badge')}
              </div>
              <h2 className="text-2xl md:text-4xl font-black mb-4 leading-[1.1]">
                {t('landing.problem.title')}{' '}
                <span className="text-rose-500 underline decoration-rose-500/30">
                  {t('landing.problem.titleHighlight')}
                </span>
              </h2>
              <div className="space-y-3 text-slate-400 font-medium text-xs md:text-sm leading-relaxed">
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
                  <span className="text-rose-400 font-bold">{t('landing.problem.paragraph3Highlight')}</span> {t('landing.problem.paragraph3End')}
                </p>
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 md:p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-indigo-400">{t('landing.problem.comparison.original')}</p>
                    <TrendingUp size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-lg md:text-xl font-black text-white tracking-tight">{t('landing.problem.comparison.originalSpec')}</p>
                  <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
                    {t('landing.problem.comparison.originalDesc')}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-px h-6 bg-slate-700/50" />
                </div>
                
                <div className="bg-rose-600/10 border border-rose-500/30 p-4 md:p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-rose-400">{t('landing.problem.comparison.classic')}</p>
                    <Minus size={16} className="text-rose-400" />
                  </div>
                  <p className="text-lg md:text-xl font-black text-white tracking-tight opacity-50">{t('landing.problem.comparison.classicSpec')}</p>
                  <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
                    {t('landing.problem.comparison.classicDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3">
              {t('landing.benefits.badge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
              {t('landing.benefits.title')}
            </h2>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              {t('landing.benefits.subtitle')}{' '}
              <span className="text-indigo-600 font-bold">{t('landing.benefits.subtitleHighlight')}</span>
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[
              { 
                icon: ImageIcon, 
                title: t('landing.benefits.features.quality.title'), 
                desc: t('landing.benefits.features.quality.desc'), 
                highlight: t('landing.benefits.features.quality.highlight')
              },
              { 
                icon: Clock, 
                title: t('landing.benefits.features.friction.title'), 
                desc: t('landing.benefits.features.friction.desc'), 
                highlight: t('landing.benefits.features.friction.highlight')
              },
              { 
                icon: Zap, 
                title: t('landing.benefits.features.gallery.title'), 
                desc: t('landing.benefits.features.gallery.desc'), 
                highlight: t('landing.benefits.features.gallery.highlight')
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                  <feature.icon size={22} />
                </div>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">
                  {feature.highlight}
                </p>
                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-xs md:text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <PricingSection content={content} />

      {/* FINAL CTA */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900 rounded-3xl md:rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:24px_24px]" />
              <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-indigo-600/15 rounded-full blur-[80px]" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {t('landing.finalCta.title')} <br />
                <span className="text-indigo-400">{t('landing.finalCta.titleHighlight')}</span>
              </h2>
              
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
                {t('landing.finalCta.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 text-base"
                >
                  {t('landing.finalCta.button')}
                </button>
              </div>
              
              <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em]">
                {t('landing.finalCta.note')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
