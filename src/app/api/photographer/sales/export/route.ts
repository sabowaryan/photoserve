/**
 * Sales Export API Route
 * Exports sales data in CSV format
 * 
 * @module app/api/photographer/sales/export/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRevenueService, SaleFilters } from '@/lib/services/revenue.service';
import { ApiErrorResponse } from '@/lib/api/error-handler';

/**
 * GET /api/photographer/sales/export
 * Export sales data as CSV
 * 
 * Query params:
 * - galleryId: Filter by gallery
 * - status: Filter by status
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - format: Export format (csv only for now)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters: SaleFilters = {
      galleryId: searchParams.get('galleryId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: 1000, // Max export limit
    };

    const format = searchParams.get('format') || 'csv';
    if (format !== 'csv') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Only CSV format is supported', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    const revenueService = createRevenueService(supabase);
    const { sales } = await revenueService.getSales(user.id, filters);

    // Generate CSV
    const headers = [
      'ID',
      'Gallery',
      'Buyer Email',
      'Amount',
      'Currency',
      'Platform Fee',
      'Net Amount',
      'Status',
      'Purchased At',
      'Refunded At',
    ];

    const rows = sales.map(sale => [
      sale.id,
      sale.galleryTitle,
      sale.buyerEmail,
      (sale.amount / 100).toFixed(2),
      sale.currency.toUpperCase(),
      (sale.platformFee / 100).toFixed(2),
      (sale.netAmount / 100).toFixed(2),
      sale.status,
      sale.purchasedAt,
      sale.refundedAt || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Return CSV file
    const filename = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[SalesExport] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to export sales', code: 'EXPORT_ERROR' },
      { status: 500 }
    );
  }
}
