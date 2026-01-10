'use client';

import { useRouter } from 'next/navigation';
import { 
  Clock, 
  ChevronRight, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Minus,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { LandingHeader } from '@/components/layouts/landing-header';
import { Footer } from '@/components/layouts';
import { HeroSceneWrapper } from '@/components/three/hero-scene-wrapper';
import { PricingSection } from '@/components/pricing';
import type { LandingContent } from '@/lib/content/landing';

interface LandingPageClientProps {
  content: LandingContent;
}

export function LandingPageClient({ content }: LandingPageClientProps) {
  const router = useRouter();

  const onGetStarted = () => router.push('/auth');
  const onViewFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <LandingHeader />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-48 md:pb-40 px-4 overflow-hidden min-h-[95vh] flex items-center">
        <HeroSceneWrapper />
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[1200px] md:h-[800px] bg-indigo-500/10 rounded-full blur-[100px] md:blur-[150px]" />
        </div>
        
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
            <span className="p-1 bg-indigo-600 rounded-full text-white">
              <Sparkles size={10} />
            </span>
            <span className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest">
              Le choix des photographes professionnels
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-[7rem] font-black text-slate-900 tracking-tight leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 delay-100 drop-shadow-sm">
            Vos photos méritent la <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              qualité originale.
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 md:mb-14 animate-in fade-in slide-in-from-bottom-4 delay-200 font-medium leading-relaxed px-4">
            Ce que vos clients reçoivent ne doit pas être compressé.
            <span className="text-slate-900 font-extrabold"> Livraison photo HD </span> 
            sans perte pour les créateurs exigeants.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 delay-300 px-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-5 md:px-12 md:py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 group"
            >
              Démarrer gratuitement
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onViewFeatures}
              className="w-full sm:w-auto px-10 py-5 md:px-12 md:py-6 bg-white/60 backdrop-blur-md text-slate-600 font-black rounded-3xl border border-slate-200 hover:bg-white transition-all shadow-sm active:scale-95"
            >
              En savoir plus
            </button>
          </div>
          
          <p className="mt-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Zéro compression • Livraison HD • Prêt en 2 min
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-20 md:mt-28 max-w-4xl mx-auto pt-8 md:pt-12 border-t border-slate-200/50 animate-in fade-in delay-500 px-4 backdrop-blur-sm rounded-t-3xl">
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">500+</p>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Experts pro</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">12K+</p>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Galeries livrées</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">150K+</p>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Photos HD</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">4.9/5</p>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <AlertTriangle size={14} /> Le problème invisible
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1]">
                Lors de l&apos;envoi, vos photos sont{' '}
                <span className="text-rose-500 underline decoration-rose-500/30">
                  automatiquement dégradées.
                </span>
              </h2>
              <div className="space-y-6 text-slate-400 font-medium text-base md:text-lg leading-relaxed">
                <p>
                  Vous passez des heures à retoucher chaque détail. Vos photos sont prêtes à être livrées.{' '}
                  <span className="text-white font-bold">Puis vient le moment de l&apos;envoi.</span>
                </p>
                <p>
                  La messagerie compresse automatiquement vos fichiers. Vos 24 mégapixels sont réduits à un format web médiocre.{' '}
                  <span className="text-white font-bold">Les détails disparaissent.</span>
                </p>
                <p>
                  Dès qu&apos;un client zoome ou imprime, la perte devient flagrante.{' '}
                  <span className="text-rose-400 font-bold">La qualité perçue chute,</span> et votre image professionnelle avec.
                </p>
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl space-y-10">
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-[2rem]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-indigo-400">Qualité originale PikSend</p>
                    <TrendingUp size={24} className="text-indigo-400" />
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight">24 MP • 6000×4000px</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
                    Détails nets, couleurs fidèles, 100% HD
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-px h-12 bg-slate-700/50" />
                </div>
                
                <div className="bg-rose-600/10 border border-rose-500/30 p-8 rounded-[2rem]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-rose-400">Messagerie classique</p>
                    <Minus size={24} className="text-rose-400" />
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight opacity-50">1600×1067px • -70%</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
                    Compression automatique irréversible
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
              La solution PikSend
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
              Livrez en qualité originale.
            </h2>
            <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mx-auto px-4 leading-relaxed">
              Uploadez vos fichiers HD. Partagez un lien unique.{' '}
              <span className="text-indigo-600 font-bold">Vos clients reçoivent 100% de votre travail.</span>
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: ImageIcon, 
                title: "Qualité originale", 
                desc: "Zéro compression. Vos photos arrivent exactement comme vous les avez exportées depuis Lightroom ou Photoshop.", 
                highlight: "0% de perte" 
              },
              { 
                icon: Clock, 
                title: "Friction minimale", 
                desc: "Pas de compte à créer pour vos clients. Ils cliquent sur le lien et téléchargent instantanément en HD.", 
                highlight: "Prêt en 2 min" 
              },
              { 
                icon: Zap, 
                title: "Galerie Premium", 
                desc: "Offrez une expérience de visionnage haut de gamme, sécurisée et épurée. Valorisez votre image de marque.", 
                highlight: "Design Pro" 
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-white p-10 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group"
              >
                <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                  <feature.icon size={32} />
                </div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                  {feature.highlight}
                </p>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
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
      <section className="py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-900 rounded-[3.5rem] md:rounded-[5rem] p-16 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:32px_32px]" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none">
                Prêt à livrer la <br />
                <span className="text-indigo-400">meilleure qualité ?</span>
              </h2>
              
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Rejoignez les 500+ photographes qui ont déjà choisi PikSend pour valoriser leur travail.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-12 py-6 bg-white text-slate-900 font-black rounded-3xl hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-95 text-xl"
                >
                  Créer ma galerie gratuite
                </button>
              </div>
              
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                Aucune carte requise • Annulez quand vous voulez
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
