/**
 * Analytics Dashboard Page
 * 
 * Displays analytics for the photographer's public profile including:
 * - Total views
 * - CTA click rate
 * - Average session duration
 * - Views by day/week/month chart
 * - Top 10 galleries
 * - Top 10 referrers
 * - Period filter (7, 30, 90 days, all)
 * 
 * Requirements:
 * - 9.7: Allow photographer to view profile statistics in dashboard
 * - 9.8: Display metrics (total views, views by period, top galleries, CTA click rate)
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { generatePageMetadata } from '@/lib/services';
import { AnalyticsDashboard } from './analytics-dashboard';

export const metadata: Metadata = generatePageMetadata('dashboard');

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-28 pb-20 font-['Plus_Jakarta_Sans']">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/20 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <Suspense fallback={<div>Chargement...</div>}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  );
}
