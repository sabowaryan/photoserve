import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturesContent } from '@/lib/content/features';
import { generatePageMetadata } from '@/lib/services';
import { 
  Shield, 
  Clock, 
  Download, 
  Lock,
  Globe,
  Zap,
  Image,
  Eye,
  Smartphone,
  Cloud,
  ArrowRight,
  AlertTriangle,
  Check,
  Sparkles
} from 'lucide-react';

const iconMap = {
  Shield,
  Clock,
  Download,
  Lock,
  Globe,
  Zap,
  Image,
  Eye,
  Smartphone,
  Cloud,
} as const;

export const metadata: Metadata = generatePageMetadata('features');

export default function FeaturesPage() {
  const content = getFeaturesContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">
            <Sparkles size={12} />
            {content.hero.badge}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {content.hero.title}{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {content.hero.titleHighlight}
            </span>
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            {content.hero.subtitle}
          </p>
        </section>

        {/* Comparison Table */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 text-center mb-4">
            {content.comparison.title}
          </h2>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-3 font-medium text-slate-500 text-xs"></th>
                    <th className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-rose-600 font-bold text-xs">
                        <div className="w-5 h-5 bg-rose-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle size={12} />
                        </div>
                        WhatsApp
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-bold text-xs">
                        <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Check size={12} />
                        </div>
                        PikSend
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.comparison.items.map((row, index) => (
                    <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium text-xs text-slate-700">{row.feature}</td>
                      <td className="p-3 text-center text-xs text-slate-400">{row.whatsapp}</td>
                      <td className="p-3 text-center text-xs text-indigo-600 font-medium">{row.photoserve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 text-center mb-6">
            {content.mainFeatures.title}
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {content.mainFeatures.items.map((feature, index) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap] || Shield;
              const colors = [
                { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
                { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                { bg: 'bg-violet-100', text: 'text-violet-600', badge: 'bg-violet-50 text-violet-600 border-violet-200' },
                { bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
              ];
              const color = colors[index % colors.length];
              
              return (
                <div 
                  key={index} 
                  className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 ${color?.bg} rounded-lg flex items-center justify-center`}>
                      <Icon size={18} className={color?.text} />
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${color?.badge}`}>
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-xs mb-3">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <div className={`w-4 h-4 ${color?.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check size={10} className={color?.text} />
                        </div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Additional Features */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 text-center mb-6">
            {content.additionalFeatures.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {content.additionalFeatures.items.map((feature, index) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap] || Shield;
              return (
                <div 
                  key={index} 
                  className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-lg p-3 hover:border-indigo-200 hover:shadow-md transition-all group"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition-colors">
                    <Icon size={16} className="text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-slate-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-xl p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Orbs */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {content.cta.title}
              </h2>
              <p className="text-indigo-100/80 text-sm mb-5 max-w-md mx-auto">
                {content.cta.subtitle}
              </p>
              <Link 
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-600 font-bold text-sm rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group"
              >
                {content.cta.button}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-indigo-100/60 mt-4">
                {content.cta.footer}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
