/**
 * Analytics API Route
 * 
 * GET /api/public-profile/analytics
 * Retrieves analytics data for the authenticated user's public profile
 * 
 * Query parameters:
 * - startDate: ISO date string for the start of the analytics period
 * - endDate: ISO date string for the end of the analytics period
 * 
 * Requirements:
 * - 9.7: Allow photographer to view profile statistics in dashboard
 * - 9.8: Display metrics (total views, views by period, top galleries, CTA click rate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Validate date parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Les paramètres startDate et endDate sont requis' 
        },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Format de date invalide' 
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'La date de début doit être antérieure à la date de fin' 
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const { supabase } = await requireSupabaseClient();

    // Create service
    const service = createPublicProfileService(supabase);

    // Get analytics
    const analytics = await service.getAnalytics(
      session.user.id,
      startDate,
      endDate
    );

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Analytics API error:', error);

    if (error instanceof Error) {
      if (error.message === 'Profile not found') {
        return NextResponse.json(
          { 
            error: 'NOT_FOUND', 
            message: 'Profil public non trouvé' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'INTERNAL_ERROR', 
          message: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Une erreur est survenue' 
      },
      { status: 500 }
    );
  }
}
