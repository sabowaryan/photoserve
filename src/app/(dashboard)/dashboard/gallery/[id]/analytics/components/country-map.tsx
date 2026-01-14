'use client';

/**
 * Country Map Component
 * Displays geographic distribution of views by country
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/country-map
 * Requirement 3.3.3: THE System SHALL track visitor country (via IP geolocation)
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CountryMapProps {
  data: Record<string, number>;
}

// Country code to name mapping (common countries)
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AU: 'Australia',
  NZ: 'New Zealand',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  ZA: 'South Africa',
  RU: 'Russia',
  KR: 'South Korea',
  SG: 'Singapore',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  PT: 'Portugal',
  GR: 'Greece',
  TR: 'Turkey',
  IL: 'Israel',
  EG: 'Egypt',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  MY: 'Malaysia',
  PH: 'Philippines',
};

export function CountryMap({ data }: CountryMapProps) {
  // Convert data to array and sort by count
  const chartData = Object.entries(data)
    .map(([code, count]) => ({
      country: COUNTRY_NAMES[code] || code,
      views: count,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10); // Show top 10 countries

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No geographic data available yet</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            type="number"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            type="category"
            dataKey="country" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            width={120}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar 
            dataKey="views" 
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
