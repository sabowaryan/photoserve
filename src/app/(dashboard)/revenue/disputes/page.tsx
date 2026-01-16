/**
 * Disputes Page
 * Displays list of disputes and dispute details for photographers
 * 
 * @module app/(dashboard)/revenue/disputes/page
 * Requirements: 7.2 - Dispute Handling
 * - THE Dashboard SHALL display dispute alert banner
 * - THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
 * - THE System SHALL provide link to Stripe Dashboard for full dispute management
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { getServerLocale } from '@/lib/i18n/server';
import { DisputesPageClient } from './disputes-page-client';
import { AlertTriangle, ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  // Locale is available for future i18n support
  await getServerLocale();
  
  return {
    title: 'Litiges - Revenus | PikSend',
    description: 'Gérez vos litiges et contestations de paiement',
  };
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      <div className="h-[600px] bg-white/60 rounded-2xl border border-slate-200/60" />
      <div className="h-[600px] bg-white/60 rounded-2xl border border-slate-200/60 hidden lg:block" />
    </div>
  );
}

export default async function DisputesPage() {
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
          href="/revenue"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span className="hidden sm:inline">Revenus</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400">Litiges</span>
      </div>

      {/* Hero Section */}
      <div className="relative mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                Gestion des litiges
              </h1>
              
              <p className="text-white/70 text-xs sm:text-sm font-medium max-w-xl leading-relaxed hidden sm:block">
                Consultez et gérez les litiges de paiement. Soumettez des preuves pour contester les réclamations.
              </p>
            </div>

            {/* Action Button */}
            {hasConnectAccount && (
              <div className="shrink-0 flex gap-2">
                <a 
                  href="https://dashboard.stripe.com/disputes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative px-4 py-2.5 bg-white/10 backdrop-blur-md text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all border border-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  <span className="hidden sm:inline">Stripe Dashboard</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {!hasConnectAccount ? (
        /* Connect Stripe CTA */
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-8 shadow-lg shadow-amber-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Connectez Stripe pour voir vos litiges
              </h2>
              <p className="text-slate-600 mb-6 max-w-2xl">
                Pour voir et gérer vos litiges, vous devez d'abord connecter votre compte Stripe.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/settings#stripe-connect"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  Connecter Stripe
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Suspense fallback={<LoadingSkeleton />}>
          <DisputesPageClient />
        </Suspense>
      )}
    </main>
  );
}
