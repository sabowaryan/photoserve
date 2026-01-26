'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  MousePointerClick,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
  BarChart3,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { ProfileAnalytics } from '@/types/public-profile';

type PeriodFilter = '7' | '30' | '90' | 'all';

interface PeriodOption {
  value: PeriodFilter;
  label: string;
  days: number | null;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '7', label: '7 derniers jours', days: 7 },
  { value: '30', label: '30 derniers jours', days: 30 },
  { value: '90', label: '90 derniers jours', days: 90 },
  { value: 'all', label: 'Tout', days: null },
];

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range based on period
      const endDate = new Date();
      let startDate: Date;

      const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === period);
      if (selectedPeriod?.days) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedPeriod.days);
      } else {
        // For "all", use a date far in the past
        startDate = new Date('2020-01-01');
      }

      const response = await fetch(
        `/api/public-profile/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec du chargement des analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      toast.error('Échec du chargement des analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Calculate date range based on period
      const endDate = new Date();
      let startDate: Date;

      const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === period);
      if (selectedPeriod?.days) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedPeriod.days);
      } else {
        // For "all", use a date far in the past
        startDate = new Date('2020-01-01');
      }

      const response = await fetch(
        `/api/public-profile/analytics/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'export');
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export réussi ! Le fichier CSV a été téléchargé.');
    } catch (err) {
      console.error('Error exporting analytics:', err);
      toast.error(err instanceof Error ? err.message : 'Échec de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation / Breadcrumb */}
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link
          href="/settings/profile"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span className="hidden sm:inline">Profil Public</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400">Analytics</span>
      </div>

      {/* Header */}
      <div className="relative animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={24} />
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Analytics du Profil
                </h1>
              </div>
              <p className="text-indigo-100/70 text-sm font-medium max-w-2xl">
                Suivez les performances de votre profil public et analysez l'engagement de vos visiteurs
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || isLoading || !analytics}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </>
                )}
              </Button>

              {/* Period Filter */}
              <div className="flex gap-2 flex-wrap">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      period === option.value
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Chargement des analytics...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Erreur de chargement
                </h3>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <Button
                  onClick={fetchAnalytics}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      {analytics && !isLoading && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Total Views */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Vues Totales
                  </CardTitle>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Eye className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">
                  {formatNumber(analytics.totalViews)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Nombre total de visites
                </p>
              </CardContent>
            </Card>

            {/* CTA Click Rate */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Taux de Clic CTA
                  </CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MousePointerClick className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">
                  {formatPercentage(analytics.ctaClickRate)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Visiteurs ayant cliqué sur le CTA
                </p>
              </CardContent>
            </Card>

            {/* Average Session Duration */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Durée Moyenne
                  </CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">
                  {formatDuration(analytics.averageSessionDuration)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Temps moyen par session
                </p>
              </CardContent>
            </Card>

            {/* Trend */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Tendance
                  </CardTitle>
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">
                  {analytics.viewsByPeriod.length}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Jours avec des visites
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Views Chart */}
          <Card className="animate-in fade-in slide-in-from-top-3 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Visites par Jour
              </CardTitle>
              <CardDescription>
                Évolution du nombre de visites sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.viewsByPeriod.length > 0 ? (
                <div className="space-y-3">
                  {analytics.viewsByPeriod.map((item) => {
                    const maxViews = Math.max(...analytics.viewsByPeriod.map((v) => v.views));
                    const percentage = (item.views / maxViews) * 100;

                    return (
                      <div key={item.date} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {new Date(item.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="font-bold text-indigo-600">
                            {formatNumber(item.views)} {item.views === 1 ? 'vue' : 'vues'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Aucune donnée pour cette période</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Galleries and Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Top Galleries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Top 10 Galeries
                </CardTitle>
                <CardDescription>
                  Galeries les plus consultées par vos visiteurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topGalleries.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topGalleries.map((gallery, index) => (
                      <div
                        key={gallery.galleryId}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {gallery.galleryTitle}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatNumber(gallery.views)} {gallery.views === 1 ? 'vue' : 'vues'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune galerie consultée</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                  Top 10 Referrers
                </CardTitle>
                <CardDescription>
                  Sources de trafic principales vers votre profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topReferrers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topReferrers.map((referrer, index) => (
                      <div
                        key={referrer.referrer}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {referrer.referrer}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatNumber(referrer.count)} {referrer.count === 1 ? 'visite' : 'visites'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun referrer enregistré</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
