'use client';

/**
 * Country Map Component
 * Professional geographic distribution visualization with SVG flags
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/country-map
 * Requirement 3.3.3: THE System SHALL track visitor country (via IP geolocation)
 */
import { Globe, MapPin, Users } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';
import { getCountryName } from '@/lib/data/countries';
import { useTranslation } from '@/lib/i18n/context';

interface CountryMapProps {
  data: Record<string, number>;
}

// Gradient colors for ranking
const RANK_STYLES = [
  { bg: 'bg-gradient-to-r from-amber-400 to-amber-500', text: 'text-amber-900', labelKey: 'rank1' },
  { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-slate-800', labelKey: 'rank2' },
  { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', text: 'text-amber-100', labelKey: 'rank3' },
];

// Flag component with fallback
function CountryFlag({ code, className }: { code: string; className?: string }) {
  const FlagComponent = (Flags as any)[code];
  
  if (!FlagComponent) {
    return (
      <div className={`bg-slate-200 rounded flex items-center justify-center ${className}`}>
        <Globe size={12} className="text-slate-400" />
      </div>
    );
  }
  
  return <FlagComponent className={`rounded shadow-sm ${className}`} />;
}

export function CountryMap({ data }: CountryMapProps) {
  const { locale, t } = useTranslation();
  
  // Convert data to array and sort by count
  const sortedData = Object.entries(data)
    .map(([code, count]) => ({
      code: code.toUpperCase(),
      name: getCountryName(code, locale),
      views: count,
    }))
    .sort((a, b) => b.views - a.views);

  const totalViews = sortedData.reduce((sum, item) => sum + item.views, 0);
  const countriesCount = sortedData.length;
  const topCountries = sortedData.slice(0, 5);

  // Empty state
  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
          <Globe size={36} className="text-emerald-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-400 mb-1">{t('admin.galleryAnalytics.geography.noData')}</h3>
        <p className="text-xs text-slate-400">{t('admin.galleryAnalytics.geography.countriesWillAppear')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <Globe size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('admin.galleryAnalytics.geography.countries')}</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{countriesCount}</p>
          <p className="text-[10px] text-emerald-600/70 font-medium mt-0.5">{t('admin.galleryAnalytics.geography.differentCountries')}</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-100">
              <Users size={14} className="text-indigo-600" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{t('admin.galleryAnalytics.geography.views')}</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">{totalViews}</p>
          <p className="text-[10px] text-indigo-600/70 font-medium mt-0.5">{t('admin.galleryAnalytics.geography.geolocatedViews')}</p>
        </div>
      </div>

      {/* Top Countries List */}
      <div className="space-y-2">
        {topCountries.map((country, index) => {
          const percentage = totalViews > 0 ? Math.round((country.views / totalViews) * 100) : 0;
          const rankStyle = RANK_STYLES[index];
          
          return (
            <div 
              key={country.code}
              className="group relative bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Progress bar background */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-50 to-transparent transition-all"
                style={{ width: `${percentage}%` }}
              />
              
              <div className="relative flex items-center gap-3 p-3">
                {/* Rank badge */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0
                  ${index < 3 && rankStyle
                    ? `${rankStyle.bg} ${rankStyle.text} shadow-sm` 
                    : 'bg-slate-100 text-slate-500'
                  }
                `}>
                  {index < 3 && rankStyle ? t(`admin.galleryAnalytics.geography.${rankStyle.labelKey}`) : `${index + 1}e`}
                </div>
                
                {/* Flag and country name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CountryFlag code={country.code} className="w-8 h-6 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{country.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{country.code}</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-slate-900">{country.views}</p>
                  <p className="text-[10px] font-bold text-indigo-600">{percentage}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more countries if available */}
      {sortedData.length > 5 && (
        <div className="pt-2">
          <div className="flex flex-wrap gap-2">
            {sortedData.slice(5, 10).map((country) => (
              <div 
                key={country.code}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
              >
                <CountryFlag code={country.code} className="w-5 h-4" />
                <span className="text-xs font-medium text-slate-600">{country.name}</span>
                <span className="text-xs font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">{country.views}</span>
              </div>
            ))}
            {sortedData.length > 10 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-600">
                <MapPin size={12} />
                +{sortedData.length - 10} {t('admin.galleryAnalytics.geography.otherCountries')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
