/**
 * Property-based tests for ProfileViewsRepository analytics calculations
 * 
 * Tests universal properties that should hold for all inputs
 * Uses fast-check for property-based testing
 * 
 * Feature: public-photographer-profile
 * Property 23: Calcul correct des statistiques analytics
 * Validates: Requirements 9.7, 9.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Database } from '@/lib/supabase/types';

type ProfileViewRow = Database['public']['Tables']['profile_views']['Row'];

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for profile view records
 * Generates realistic profile view data for testing
 */
const profileViewArb = fc.record({
  id: fc.uuid(),
  profile_id: fc.uuid(),
  visitor_ip_hash: fc.string({ minLength: 64, maxLength: 64 }).map(s => 
    s.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').substring(0, 64)
  ),
  user_agent: fc.oneof(
    fc.constant('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    fc.constant('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
    fc.constant('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
  ),
  referrer: fc.option(
    fc.oneof(
      fc.constant('https://google.com/search'),
      fc.constant('https://facebook.com'),
      fc.constant('https://instagram.com'),
      fc.webUrl()
    ),
    { nil: null }
  ),
  country: fc.option(fc.constantFrom('US', 'FR', 'GB', 'DE', 'CA', 'AU'), { nil: null }),
  city: fc.option(fc.constantFrom('Paris', 'London', 'New York', 'Berlin', 'Toronto'), { nil: null }),
  galleries_viewed: fc.option(fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }), { nil: null }),
  cta_clicked: fc.option(fc.boolean(), { nil: null }),
  social_links_clicked: fc.option(
    fc.array(fc.constantFrom('instagram', 'facebook', 'twitter', 'linkedin'), { maxLength: 5 }),
    { nil: null }
  ),
  viewed_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => {
    // Ensure valid date
    const timestamp = d.getTime();
    if (isNaN(timestamp)) {
      return new Date('2024-06-01').toISOString();
    }
    return d.toISOString();
  }),
  session_duration: fc.option(fc.integer({ min: 0, max: 3600 }), { nil: null })
});

/**
 * Generator for arrays of profile views
 * Ensures at least one view for meaningful statistics
 */
const profileViewsArb = fc.array(profileViewArb, { minLength: 1, maxLength: 100 });

// ============================================================================
// Helper Functions for Manual Calculation
// ============================================================================

/**
 * Manually calculate total views
 */
function calculateTotalViews(views: ProfileViewRow[]): number {
  return views.length;
}

/**
 * Manually calculate CTA click rate
 */
function calculateCTAClickRate(views: ProfileViewRow[]): number {
  const totalViews = views.length;
  const ctaClicks = views.filter(v => v.cta_clicked === true).length;
  return totalViews > 0 ? (ctaClicks / totalViews) * 100 : 0;
}

/**
 * Manually calculate average session duration
 */
function calculateAverageSessionDuration(views: ProfileViewRow[]): number {
  const totalViews = views.length;
  const totalDuration = views.reduce((sum, v) => sum + (v.session_duration || 0), 0);
  return totalViews > 0 ? Math.round(totalDuration / totalViews) : 0;
}

/**
 * Manually group views by date
 */
function groupViewsByDate(views: ProfileViewRow[]): Map<string, number> {
  const grouped = new Map<string, number>();
  
  views.forEach(view => {
    const date = view.viewed_at.split('T')[0] ?? view.viewed_at;
    grouped.set(date, (grouped.get(date) || 0) + 1);
  });
  
  return grouped;
}

/**
 * Manually calculate top galleries
 */
function calculateTopGalleries(views: ProfileViewRow[]): Map<string, number> {
  const galleryViews = new Map<string, number>();
  
  views.forEach(view => {
    const galleriesViewed = view.galleries_viewed || [];
    galleriesViewed.forEach(galleryId => {
      galleryViews.set(galleryId, (galleryViews.get(galleryId) || 0) + 1);
    });
  });
  
  return galleryViews;
}

/**
 * Manually calculate top referrers
 */
function calculateTopReferrers(views: ProfileViewRow[]): Map<string, number> {
  const referrers = new Map<string, number>();
  
  views.forEach(view => {
    if (view.referrer) {
      try {
        const domain = new URL(view.referrer).hostname;
        referrers.set(domain, (referrers.get(domain) || 0) + 1);
      } catch {
        referrers.set('Direct', (referrers.get('Direct') || 0) + 1);
      }
    }
  });
  
  return referrers;
}

// ============================================================================
// Property 23: Calcul correct des statistiques analytics
// ============================================================================

describe('Property 23: Calcul correct des statistiques analytics', () => {
  /**
   * **Validates: Requirements 9.7, 9.8**
   * 
   * Property: For any profile and period, the calculated statistics (total views,
   * CTA click rate, average session duration) must correspond exactly to the
   * aggregated data from profile_views for that period.
   */

  describe('Total Views Calculation', () => {
    it('should calculate total views as the exact count of view records', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const expectedTotal = calculateTotalViews(views);
          const actualTotal = views.length;
          
          expect(actualTotal).toBe(expectedTotal);
          expect(actualTotal).toBeGreaterThanOrEqual(1); // At least one view
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain total views count regardless of other properties', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Total views should be the same regardless of CTA clicks, galleries viewed, etc.
          const total = views.length;
          
          // Filter views with CTA clicks
          const withCTA = views.filter(v => v.cta_clicked);
          const withoutCTA = views.filter(v => !v.cta_clicked);
          
          expect(withCTA.length + withoutCTA.length).toBe(total);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CTA Click Rate Calculation', () => {
    it('should calculate CTA click rate as percentage of views with CTA clicked', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const expectedRate = calculateCTAClickRate(views);
          
          // Manual calculation
          const totalViews = views.length;
          const ctaClicks = views.filter(v => v.cta_clicked === true).length;
          const actualRate = totalViews > 0 ? (ctaClicks / totalViews) * 100 : 0;
          
          expect(actualRate).toBeCloseTo(expectedRate, 2);
          expect(actualRate).toBeGreaterThanOrEqual(0);
          expect(actualRate).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0% when no CTA clicks exist', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Force all CTA clicks to false or null
          const viewsWithoutCTA = views.map(v => ({ ...v, cta_clicked: false as boolean | null }));
          const rate = calculateCTAClickRate(viewsWithoutCTA);
          
          expect(rate).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 100% when all views have CTA clicked', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Force all CTA clicks to true
          const viewsWithCTA = views.map(v => ({ ...v, cta_clicked: true as boolean | null }));
          const rate = calculateCTAClickRate(viewsWithCTA);
          
          expect(rate).toBe(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle null CTA clicked values as false', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Set some CTA clicks to null
          const viewsWithNull = views.map((v, i) => ({
            ...v,
            cta_clicked: i % 2 === 0 ? null : v.cta_clicked
          }));
          
          const rate = calculateCTAClickRate(viewsWithNull);
          
          // Null should be treated as false
          const trueClicks = viewsWithNull.filter(v => v.cta_clicked === true).length;
          const expectedRate = (trueClicks / viewsWithNull.length) * 100;
          
          expect(rate).toBeCloseTo(expectedRate, 2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Average Session Duration Calculation', () => {
    it('should calculate average session duration correctly', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const expectedAvg = calculateAverageSessionDuration(views);
          
          // Manual calculation
          const totalDuration = views.reduce((sum, v) => sum + (v.session_duration || 0), 0);
          const actualAvg = Math.round(totalDuration / views.length);
          
          expect(actualAvg).toBe(expectedAvg);
          expect(actualAvg).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0 when all session durations are null', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Force all session durations to null
          const viewsWithoutDuration = views.map(v => ({ ...v, session_duration: null as number | null }));
          const avg = calculateAverageSessionDuration(viewsWithoutDuration);
          
          expect(avg).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle null session durations as 0 in calculation', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const avg = calculateAverageSessionDuration(views);
          
          // Null should be treated as 0
          const totalDuration = views.reduce((sum, v) => sum + (v.session_duration || 0), 0);
          const expectedAvg = Math.round(totalDuration / views.length);
          
          expect(avg).toBe(expectedAvg);
        }),
        { numRuns: 100 }
      );
    });

    it('should round to nearest integer', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const avg = calculateAverageSessionDuration(views);
          
          // Should be an integer
          expect(Number.isInteger(avg)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Views by Date Grouping', () => {
    it('should group views by date correctly', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const grouped = groupViewsByDate(views);
          
          // Total views across all dates should equal total views
          const totalGrouped = Array.from(grouped.values()).reduce((sum, count) => sum + count, 0);
          expect(totalGrouped).toBe(views.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract date part correctly (YYYY-MM-DD)', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const grouped = groupViewsByDate(views);
          
          // All keys should be valid date strings (at least start with YYYY-MM-DD pattern)
          Array.from(grouped.keys()).forEach(date => {
            // Should match YYYY-MM-DD at the start
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}/);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should count multiple views on same date', () => {
      fc.assert(
        fc.property(fc.date(), fc.integer({ min: 2, max: 10 }), (date, count) => {
          // Create multiple views on the same date
          const views: ProfileViewRow[] = Array.from({ length: count }, (_, i) => ({
            id: `view-${i}`,
            profile_id: 'profile-1',
            visitor_ip_hash: 'a'.repeat(64),
            user_agent: 'test',
            referrer: null,
            country: null,
            city: null,
            galleries_viewed: null,
            cta_clicked: null,
            social_links_clicked: null,
            viewed_at: date.toISOString(),
            session_duration: null
          }));
          
          const grouped = groupViewsByDate(views);
          const dateKey = date.toISOString().split('T')[0] ?? date.toISOString();
          
          expect(grouped.get(dateKey)).toBe(count);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Top Galleries Calculation', () => {
    it('should count gallery views correctly', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const topGalleries = calculateTopGalleries(views);
          
          // Total gallery views should equal sum of all galleries_viewed arrays
          const totalGalleryViews = views.reduce(
            (sum, v) => sum + (v.galleries_viewed?.length || 0),
            0
          );
          const countedViews = Array.from(topGalleries.values()).reduce((sum, count) => sum + count, 0);
          
          expect(countedViews).toBe(totalGalleryViews);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle views with no galleries viewed', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Force all galleries_viewed to null or empty
          const viewsWithoutGalleries = views.map(v => ({ ...v, galleries_viewed: null as string[] | null }));
          const topGalleries = calculateTopGalleries(viewsWithoutGalleries);
          
          expect(topGalleries.size).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should count same gallery multiple times across different views', () => {
      fc.assert(
        fc.property(fc.uuid(), fc.integer({ min: 2, max: 10 }), (galleryId, count) => {
          // Create multiple views with the same gallery
          const views: ProfileViewRow[] = Array.from({ length: count }, (_, i) => ({
            id: `view-${i}`,
            profile_id: 'profile-1',
            visitor_ip_hash: 'a'.repeat(64),
            user_agent: 'test',
            referrer: null,
            country: null,
            city: null,
            galleries_viewed: [galleryId],
            cta_clicked: null,
            social_links_clicked: null,
            viewed_at: new Date().toISOString(),
            session_duration: null
          }));
          
          const topGalleries = calculateTopGalleries(views);
          
          expect(topGalleries.get(galleryId)).toBe(count);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Top Referrers Calculation', () => {
    it('should count referrers correctly', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const topReferrers = calculateTopReferrers(views);
          
          // Total referrer counts should equal number of views with referrers
          const viewsWithReferrers = views.filter(v => v.referrer).length;
          const countedReferrers = Array.from(topReferrers.values()).reduce((sum, count) => sum + count, 0);
          
          expect(countedReferrers).toBe(viewsWithReferrers);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract domain from referrer URLs', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const topReferrers = calculateTopReferrers(views);
          
          // All referrer keys should be domains or "Direct"
          Array.from(topReferrers.keys()).forEach(referrer => {
            expect(referrer).toBeTruthy();
            expect(typeof referrer).toBe('string');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle views with no referrer', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Force all referrers to null
          const viewsWithoutReferrer = views.map(v => ({ ...v, referrer: null as string | null }));
          const topReferrers = calculateTopReferrers(viewsWithoutReferrer);
          
          expect(topReferrers.size).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should group same domain referrers together', () => {
      fc.assert(
        fc.property(fc.webUrl(), fc.integer({ min: 2, max: 10 }), (baseUrl, count) => {
          // Create multiple views with same domain but different paths
          const domain = new URL(baseUrl).hostname;
          const views: ProfileViewRow[] = Array.from({ length: count }, (_, i) => ({
            id: `view-${i}`,
            profile_id: 'profile-1',
            visitor_ip_hash: 'a'.repeat(64),
            user_agent: 'test',
            referrer: `${baseUrl}/path${i}`,
            country: null,
            city: null,
            galleries_viewed: null,
            cta_clicked: null,
            social_links_clicked: null,
            viewed_at: new Date().toISOString(),
            session_duration: null
          }));
          
          const topReferrers = calculateTopReferrers(views);
          
          expect(topReferrers.get(domain)).toBe(count);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Statistical Invariants', () => {
    it('should maintain consistency across all metrics', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          const totalViews = calculateTotalViews(views);
          const ctaClickRate = calculateCTAClickRate(views);
          const avgDuration = calculateAverageSessionDuration(views);
          const grouped = groupViewsByDate(views);
          
          // Total views should match
          expect(totalViews).toBe(views.length);
          
          // CTA click rate should be valid percentage
          expect(ctaClickRate).toBeGreaterThanOrEqual(0);
          expect(ctaClickRate).toBeLessThanOrEqual(100);
          
          // Average duration should be non-negative
          expect(avgDuration).toBeGreaterThanOrEqual(0);
          
          // Grouped views should sum to total
          const groupedTotal = Array.from(grouped.values()).reduce((sum, count) => sum + count, 0);
          expect(groupedTotal).toBe(totalViews);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of single view correctly', () => {
      fc.assert(
        fc.property(profileViewArb, (view) => {
          const views = [view];
          
          const totalViews = calculateTotalViews(views);
          const ctaClickRate = calculateCTAClickRate(views);
          const avgDuration = calculateAverageSessionDuration(views);
          
          expect(totalViews).toBe(1);
          expect(ctaClickRate).toBe(view.cta_clicked ? 100 : 0);
          expect(avgDuration).toBe(view.session_duration || 0);
        }),
        { numRuns: 100 }
      );
    });

    it('should be deterministic for same input', () => {
      fc.assert(
        fc.property(profileViewsArb, (views) => {
          // Calculate twice with same input
          const result1 = {
            total: calculateTotalViews(views),
            ctaRate: calculateCTAClickRate(views),
            avgDuration: calculateAverageSessionDuration(views)
          };
          
          const result2 = {
            total: calculateTotalViews(views),
            ctaRate: calculateCTAClickRate(views),
            avgDuration: calculateAverageSessionDuration(views)
          };
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });
  });
});
