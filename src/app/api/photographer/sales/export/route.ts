/**
 * Sales Export API Route
 * Exports sales data in CSV, Excel, and PDF formats
 * 
 * @module app/api/photographer/sales/export/route
 * Requirements: 5.2 - API Routes - Revenue
 * Requirements: 9.3 - Export & Reports
 * - Export SHALL support formats: CSV, Excel, PDF
 * - Export SHALL include: Date, Gallery, Client, Amount, Fee, Net, Status
 * - Export SHALL support date range selection
 * - Export SHALL support filtering by status, gallery
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService, SaleFilters } from '@/lib/services/revenue.service';
import { ApiErrorResponse } from '@/lib/api/error-handler';
import { exportSales, isValidExportFormat, ExportFormat } from '@/lib/utils/export';

/**
 * GET /api/photographer/sales/export
 * Export sales data in various formats
 * 
 * Query params:
 * - galleryId: Filter by gallery
 * - status: Filter by status
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - format: Export format (csv, excel, pdf)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

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
    
    // Validate format
    if (!isValidExportFormat(format)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid format. Supported formats: csv, excel, pdf', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    const revenueService = createRevenueService(supabase);
    const { sales } = await revenueService.getSales(userId, filters);

    // Get user profile for photographer name (optional)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    // Generate export
    const exportResult = exportSales(sales, format as ExportFormat, {
      title: 'Sales Export',
      dateRange: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      photographerName: profile?.name || undefined,
      currencySymbol: '$',
    });

    // Return file - convert Buffer to Uint8Array for NextResponse compatibility
    let responseData: BodyInit;
    if (typeof exportResult.data === 'string') {
      responseData = exportResult.data;
    } else {
      responseData = new Uint8Array(exportResult.data);
    }
    
    return new NextResponse(responseData, {
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    });
  } catch (error) {
    console.error('[SalesExport] Error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to export sales', code: 'EXPORT_ERROR' },
      { status: 500 }
    );
  }
}
