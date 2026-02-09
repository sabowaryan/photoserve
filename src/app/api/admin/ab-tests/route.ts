/**
 * A/B Tests Admin API
 * 
 * Provides endpoints for fetching A/B test results and statistics.
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { ALL_AB_TESTS } from '@/config/ab-tests';
import { ABTestResult } from '@/types/ab-testing';

/**
 * Calculate statistical significance using two-proportion z-test
 */
function calculateSignificance(
  conversions1: number,
  total1: number,
  conversions2: number,
  total2: number,
  confidenceLevel: number = 0.95
): { pValue: number; isSignificant: boolean } {
  const p1 = conversions1 / total1;
  const p2 = conversions2 / total2;
  const pPool = (conversions1 + conversions2) / (total1 + total2);
  
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / total1 + 1 / total2));
  const z = (p1 - p2) / se;
  
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  const isSignificant = pValue < (1 - confidenceLevel);
  
  return { pValue, isSignificant };
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Calculate confidence interval for a proportion
 */
function calculateConfidenceInterval(
  conversions: number,
  total: number
): [number, number] {
  const p = conversions / total;
  const z = 1.96; // 95% confidence
  const se = Math.sqrt((p * (1 - p)) / total);
  
  return [
    Math.max(0, p - z * se),
    Math.min(1, p + z * se),
  ];
}

/**
 * GET /api/admin/ab-tests
 * 
 * Fetch A/B test results and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const supabase = createAdminClient();

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Get all tests (running and completed)
    const tests = ALL_AB_TESTS.filter(
      (test) => test.status === 'running' || test.status === 'completed'
    );

    // Fetch A/B test events from analytics
    let query = supabase
      .from('gallery_events')
      .select('*')
      .eq('event_type', 'ab_test_conversion');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      throw eventsError;
    }

    // Calculate results for each test
    const results: Record<string, ABTestResult[]> = {};

    for (const test of tests) {
      const testEvents = (events || []).filter(
        (e) => e.event_data && (e.event_data as any).testId === test.id
      );

      const variantResults: ABTestResult[] = [];

      for (const variant of test.variants) {
        const variantEvents = testEvents.filter(
          (e) => (e.event_data as any).variantId === variant.id
        );

        const sampleSize = variantEvents.length;
        const conversions = variantEvents.filter(
          (e) => (e.event_data as any).value === 1
        ).length;

        const conversionRate = sampleSize > 0 ? conversions / sampleSize : 0;
        const confidenceInterval = calculateConfidenceInterval(
          conversions,
          sampleSize
        );

        // Calculate significance vs control
        const controlVariant = test.variants.find((v) => v.id === 'control');
        let pValue = 1;
        let isSignificant = false;

        if (controlVariant && variant.id !== 'control') {
          const controlEvents = testEvents.filter(
            (e) => (e.event_data as any).variantId === 'control'
          );
          const controlSampleSize = controlEvents.length;
          const controlConversions = controlEvents.filter(
            (e) => (e.event_data as any).value === 1
          ).length;

          if (controlSampleSize > 0 && sampleSize > 0) {
            const significance = calculateSignificance(
              conversions,
              sampleSize,
              controlConversions,
              controlSampleSize,
              test.confidenceLevel
            );
            pValue = significance.pValue;
            isSignificant = significance.isSignificant;
          }
        }

        variantResults.push({
          testId: test.id,
          variantId: variant.id,
          metric: test.targetMetric,
          value: conversions,
          sampleSize,
          conversionRate,
          confidenceInterval,
          pValue,
          isSignificant,
        });
      }

      results[test.id] = variantResults;
    }

    return createApiResponse({
      tests,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
