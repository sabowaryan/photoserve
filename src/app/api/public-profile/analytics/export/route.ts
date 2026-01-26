/**
 * Analytics Export API Route
 * Generates a CSV file with anonymized analytics data for GDPR compliance
 * 
 * Requirement 13.6: THE Système SHALL permettre au Photographe_Pro d'exporter ses données analytics
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createPublicProfileRepository } from '@/lib/repositories/public-profile.repository';
import { createProfileViewsRepository } from '@/lib/repositories/profile-views.repository';

/**
 * GET /api/public-profile/analytics/export
 * Export analytics data as CSV
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Get query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Les paramètres startDate et endDate sont requis',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Format de date invalide',
        },
        { status: 400 }
      );
    }

    // Get user's public profile
    const profileRepo = createPublicProfileRepository(supabase);
    const profile = await profileRepo.findByUserId(userId);

    if (!profile) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Profil public non trouvé',
        },
        { status: 404 }
      );
    }

    // Get analytics data
    const viewsRepo = createProfileViewsRepository(supabase);
    const views = await viewsRepo.findByProfileAndDateRange(
      profile.id,
      startDate,
      endDate
    );

    // Generate CSV content with GDPR-compliant anonymized data
    const csv = generateCSV(views);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-${profile.slug}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue lors de l\'export',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV content from profile views
 * Data is anonymized for GDPR compliance:
 * - IP addresses are already hashed in the database
 * - No personally identifiable information is included
 */
function generateCSV(views: any[]): string {
  // CSV header
  const headers = [
    'Date',
    'Heure',
    'Visiteur ID (Anonymisé)',
    'Pays',
    'Ville',
    'Navigateur',
    'Galeries Consultées',
    'CTA Cliqué',
    'Réseaux Sociaux Cliqués',
    'Durée Session (secondes)',
    'Referrer',
  ];

  // CSV rows
  const rows = views.map((view) => {
    const viewedAt = new Date(view.viewed_at);
    const date = viewedAt.toLocaleDateString('fr-FR');
    const time = viewedAt.toLocaleTimeString('fr-FR');

    // Anonymize visitor IP hash (show only first 8 characters)
    const anonymizedVisitorId = view.visitor_ip_hash
      ? view.visitor_ip_hash.substring(0, 8) + '...'
      : 'N/A';

    // Extract browser from user agent (simplified)
    const browser = extractBrowser(view.user_agent);

    // Format galleries viewed count
    const galleriesCount = view.galleries_viewed?.length || 0;

    // Format CTA clicked
    const ctaClicked = view.cta_clicked ? 'Oui' : 'Non';

    // Format social links clicked
    const socialLinksClicked = view.social_links_clicked?.join(', ') || 'Aucun';

    // Session duration
    const sessionDuration = view.session_duration || 0;

    // Referrer domain (anonymized - only domain, no full URL)
    const referrer = view.referrer ? extractDomain(view.referrer) : 'Direct';

    return [
      date,
      time,
      anonymizedVisitorId,
      view.country || 'N/A',
      view.city || 'N/A',
      browser,
      galleriesCount.toString(),
      ctaClicked,
      socialLinksClicked,
      sessionDuration.toString(),
      referrer,
    ];
  });

  // Combine headers and rows
  const csvLines = [headers, ...rows];

  // Convert to CSV format (escape quotes and handle commas)
  return csvLines
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Extract browser name from user agent string
 */
function extractBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Inconnu';

  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';

  return 'Autre';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'Invalide';
  }
}
