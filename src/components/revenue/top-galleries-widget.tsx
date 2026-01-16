'use client';

/**
 * Top Galleries Widget Component
 * Displays top performing galleries by revenue
 * 
 * @module components/revenue/top-galleries-widget
 * Requirements: 5.3 - UI - Revenue Dashboard Page
 */
import { useState, useEffect } from 'react';
import { TrendingUp, Crown, ExternalLink, ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface TopGallery {
  galleryId: string;
  title: string;
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function TopGalleriesWidget() {
  const [galleries, setGalleries] = useState<TopGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/photographer/top-galleries?limit=5');
        if (response.ok) {
          const result = await response.json();
          setGalleries(result);
        }
      } catch (error) {
        console.error('Failed to fetch top galleries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate max revenue for progress bars
  const maxRevenue = Math.max(...galleries.map(g => g.totalRevenue), 1);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
          <TrendingUp size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Top Galeries</h2>
          <p className="text-xs text-slate-500">Par revenus générés</p>
        </div>
      </div>

      <div className="p-4">
        {galleries.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune galerie monétisée</p>
            <p className="text-slate-400 text-sm mt-1">Activez la monétisation sur vos galeries</p>
          </div>
        ) : (
          <div className="space-y-2">
            {galleries.map((gallery, index) => (
              <Link
                key={gallery.galleryId}
                href={`/dashboard/gallery/${gallery.galleryId}`}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all"
              >
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                  index === 0 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' 
                    : index === 1
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/30'
                    : index === 2
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {index === 0 ? <Crown size={14} /> : index + 1}
                </div>

                {/* Gallery Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {gallery.title}
                    </p>
                    <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {gallery.totalSales} ventes
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {gallery.conversionRate.toFixed(1)}% conv.
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${(gallery.totalRevenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-emerald-600 text-lg">
                    {formatCurrency(gallery.totalRevenue)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
