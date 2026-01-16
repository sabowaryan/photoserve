/**
 * Revenue Dashboard Page
 * Displays revenue analytics, sales, and payouts for photographers
 * 
 * @module app/(dashboard)/revenue/page
 * Requirements: 5.3 - UI - Revenue Dashboard Page
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import { RevenueOverview } from '@/components/revenue/revenue-overview';
import { RevenueChart } from '@/components/revenue/revenue-chart';
import { SalesTable } from '@/components/revenue/sales-table';
import { TopGalleriesWidget } from '@/components/revenue/top-galleries-widget';
import { DollarSign, TrendingUp, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
  return {
    title: t('seo.revenue.title'),
    description: t('seo.revenue.description'),
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/60 rounded-2xl border border-slate-200/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white/60 rounded-2xl border border-slate-200/60" />
        <div className="h-80 bg-white/60 rounded-2xl border border-slate-200/60" />
      </div>
      <div className="h-96 bg-white/60 rounded-2xl border border-slate-200/60" />
    </div>
  );
}

export default async function RevenuePage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth');
  }

  const { supabase, userId } = await requireSupabaseClient();

  // Check if user has Stripe Connect account
  const { data: connectAccount } = await supabase
    .from('stripe_connect_accounts')
    .select('charges_enabled, payouts_enabled')
    .eq('user_id', userId)
    .single();

  const hasConnectAccount = connectAccount?.charges_enabled === true;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-10 pt-28 pb-20">
      {/* Navigation / Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          href="/dashboard"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span className="hidden sm:inline">Tableau de bord</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400">Revenus</span>
      </div>

      {/* Hero Section */}
      <div className="relative mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Status Badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
                  hasConnectAccount 
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' 
                    : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    hasConnectAccount ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  {hasConnectAccount ? 'Stripe Connecté' : 'Configuration requise'}
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                Tableau de bord des revenus
              </h1>
              
              <p className="text-emerald-100/60 text-xs sm:text-sm font-medium max-w-xl leading-relaxed hidden sm:block">
                Suivez vos ventes, analysez vos performances et gérez vos paiements.
              </p>
            </div>

            {/* Action Button */}
            {hasConnectAccount && (
              <div className="shrink-0 flex gap-2">
                <Link 
                  href="/settings#stripe-connect"
                  className="group relative px-4 py-2.5 bg-white/10 backdrop-blur-md text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all border border-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  <span className="hidden sm:inline">Gérer Stripe</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats Preview */}
          {hasConnectAccount && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-white">
                    <DollarSign size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Revenus</p>
                    <p className="text-base font-black tracking-tight">Voir ci-dessous</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasConnectAccount ? (
        /* Connect Stripe CTA */
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-8 shadow-lg shadow-amber-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Connectez Stripe pour commencer à vendre
              </h2>
              <p className="text-slate-600 mb-6 max-w-2xl">
                Pour activer la monétisation de vos galeries et voir vos revenus, vous devez d'abord connecter votre compte Stripe. 
                Cela vous permet de recevoir des paiements directement de vos clients lorsqu'ils achètent l'accès à vos galeries.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/settings#stripe-connect"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  <TrendingUp className="w-5 h-5" />
                  Connecter Stripe
                </Link>
                <Link
                  href="/help#monetization"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  En savoir plus
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Suspense fallback={<LoadingSkeleton />}>
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview Cards */}
            <RevenueOverview />

            {/* Chart and Top Galleries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              <div>
                <TopGalleriesWidget />
              </div>
            </div>

            {/* Sales Table */}
            <SalesTable />
          </div>
        </Suspense>
      )}
    </main>
  );
}
