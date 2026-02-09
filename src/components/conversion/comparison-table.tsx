'use client';

/**
 * ComparisonTable Component
 * Responsive comparison table showing PikSend vs competitors
 * 
 * @module components/conversion/comparison-table
 * Requirements: 4.1, 4.2
 */

import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { createClient } from '@/lib/supabase/client';
import { useVisitorFingerprint } from '@/hooks/use-visitor-fingerprint';

interface ComparisonTableProps {
  competitors?: Competitor[];
  highlightPikSend?: boolean;
  variant?: 'full' | 'compact';
  features?: ComparisonFeature[];
}

interface Competitor {
  name: string;
  logo?: string;
  price: number;
  commission: number;
  features: Record<string, boolean | string>;
  url?: string;
}

interface ComparisonFeature {
  key: string;
  label: string;
  description?: string;
  important?: boolean;
}

const DEFAULT_FEATURES: ComparisonFeature[] = [
  { key: 'price', label: 'Prix mensuel', important: true },
  { key: 'commission', label: 'Commission', important: true },
  { key: 'lightroomPlugin', label: 'Plugin Lightroom', important: true },
  { key: 'support', label: 'Support', important: false },
  { key: 'storage', label: 'Stockage', important: false },
  { key: 'galleries', label: 'Galeries', important: false },
  { key: 'customDomain', label: 'Domaine custom', important: false },
  { key: 'branding', label: 'Branding personnalisé', important: false },
];

const DEFAULT_COMPETITORS: Competitor[] = [
  {
    name: 'PikSend',
    price: 19.99,
    commission: 10,
    features: {
      price: '19,99$',
      commission: '10%',
      lightroomPlugin: true,
      support: '< 2h',
      storage: 'Illimité',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
    },
  },
  {
    name: 'Pixieset',
    price: 25,
    commission: 15,
    features: {
      price: '25$',
      commission: '15%',
      lightroomPlugin: false,
      support: '24-48h',
      storage: '100 GB',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
    },
    url: 'https://pixieset.com',
  },
  {
    name: 'Pic-Time',
    price: 24,
    commission: 15,
    features: {
      price: '24$',
      commission: '15%',
      lightroomPlugin: false,
      support: '24h',
      storage: 'Illimité',
      galleries: 'Illimité',
      customDomain: true,
      branding: true,
    },
    url: 'https://pic-time.com',
  },
  {
    name: 'ShootProof',
    price: 30,
    commission: 15,
    features: {
      price: '30$',
      commission: '15%',
      lightroomPlugin: false,
      support: '24h',
      storage: '50 GB',
      galleries: 'Illimité',
      customDomain: false,
      branding: true,
    },
    url: 'https://shootproof.com',
  },
];

export function ComparisonTable({
  competitors = DEFAULT_COMPETITORS,
  highlightPikSend = true,
  variant = 'full',
  features = DEFAULT_FEATURES,
}: ComparisonTableProps) {
  const visitorId = useVisitorFingerprint();

  // Track table view
  useEffect(() => {
    if (visitorId) {
      const supabase = createClient();
      const analytics = createAnalyticsService(supabase);
      analytics.trackFunnelEvent('comparison_table_viewed', {}, visitorId);
    }
  }, [visitorId]);

  const renderFeatureValue = (value: boolean | string | undefined) => {
    if (value === undefined) {
      return <span className="text-sm text-gray-400">-</span>;
    }
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="mx-auto h-5 w-5 text-green-600" />
      ) : (
        <X className="mx-auto h-5 w-5 text-gray-300" />
      );
    }
    return <span className="text-sm text-gray-900">{value}</span>;
  };

  const isPikSend = (name: string) => name === 'PikSend';

  if (variant === 'compact') {
    // Mobile-optimized stacked view
    return (
      <div className="space-y-4 md:hidden">
        {competitors.map((competitor) => (
          <Card 
            key={competitor.name}
            className={isPikSend(competitor.name) && highlightPikSend ? 'border-2 border-blue-600' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                {isPikSend(competitor.name) && highlightPikSend && (
                  <Badge className="bg-blue-600">Recommandé</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{feature.label}</span>
                    <div className="font-medium">
                      {renderFeatureValue(competitor.features[feature.key])}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="p-4 text-left text-sm font-semibold text-gray-700">
              Fonctionnalité
            </th>
            {competitors.map((competitor) => (
              <th 
                key={competitor.name}
                className={`p-4 text-center ${
                  isPikSend(competitor.name) && highlightPikSend
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="text-base font-bold text-gray-900">
                    {competitor.name}
                  </div>
                  {isPikSend(competitor.name) && highlightPikSend && (
                    <Badge className="bg-blue-600">Recommandé</Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr 
              key={feature.key}
              className={`border-b border-gray-100 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="p-4">
                <div>
                  <div className={`text-sm ${feature.important ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                    {feature.label}
                  </div>
                  {feature.description && (
                    <div className="mt-1 text-xs text-gray-500">
                      {feature.description}
                    </div>
                  )}
                </div>
              </td>
              {competitors.map((competitor) => (
                <td 
                  key={`${competitor.name}-${feature.key}`}
                  className={`p-4 text-center ${
                    isPikSend(competitor.name) && highlightPikSend
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  {renderFeatureValue(competitor.features[feature.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Highlight section */}
      {highlightPikSend && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm font-medium text-blue-900">
            <span className="font-bold">Commission la plus basse</span> • 
            <span className="font-bold"> Plugin Lightroom unique</span> • 
            <span className="font-bold"> Support ultra-rapide</span>
          </p>
          <p className="mt-2 text-xs text-blue-700">
            Rejoignez 500+ photographes qui ont choisi PikSend
          </p>
        </div>
      )}
    </div>
  );
}
