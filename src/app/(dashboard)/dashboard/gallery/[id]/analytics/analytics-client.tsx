'use client';

/**
 * Gallery Analytics Client Component
 * Displays comprehensive analytics with charts and visualizations
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/analytics-client
 * Requirement 3.3.4: THE Dashboard SHALL display analytics per gallery
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Users, Heart, MessageSquare, TrendingUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { GalleryStats } from '@/types';
import { ViewsChart } from './components/views-chart';
import { CountryMap } from './components/country-map';
import { StatsCard } from './components/stats-card';

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  created_at: string;
}

interface AnalyticsClientProps {
  gallery: Gallery;
}

export function AnalyticsClient({ gallery }: AnalyticsClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/galleries/${gallery.id}/analytics`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [gallery.id]);

  const handleBack = () => {
    router.push(`/dashboard/gallery/${gallery.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{gallery.title}</h1>
            <p className="text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      )}

      {/* Stats Display */}
      {!loading && stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Views"
              value={stats.totalViews}
              icon={Eye}
              description="All-time gallery views"
            />
            <StatsCard
              title="Unique Visitors"
              value={stats.uniqueVisitors}
              icon={Users}
              description="Distinct visitors"
            />
            <StatsCard
              title="Favorites"
              value={stats.favoritesCount}
              icon={Heart}
              description="Images marked as favorite"
            />
            <StatsCard
              title="Comments"
              value={stats.commentsCount}
              icon={MessageSquare}
              description="Total comments received"
            />
          </div>

          {/* Views Over Time Chart */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Views Over Time</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Daily views for the last 30 days
            </p>
            <ViewsChart data={stats.viewsByDate} />
          </Card>

          {/* Geographic Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Geographic Distribution</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Views by country
            </p>
            <CountryMap data={stats.viewsByCountry} />
          </Card>
        </>
      )}
    </div>
  );
}
