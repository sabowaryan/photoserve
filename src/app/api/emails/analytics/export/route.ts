import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/email-analytics.service";

/**
 * GET /api/emails/analytics/export
 * 
 * Export analytics data in CSV or JSON format
 * 
 * Query params:
 * - from: ISO date string (required)
 * - to: ISO date string (required)
 * - format: 'csv' | 'json' (required)
 * - templateId: string (optional)
 * - senderEmail: string (optional)
 * - status: string (optional)
 * 
 * Requirements: 8.6
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const format = searchParams.get("format") as "csv" | "json";
    const templateId = searchParams.get("templateId") || undefined;
    const senderEmail = searchParams.get("senderEmail") || undefined;
    const status = searchParams.get("status") || undefined;

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing required parameters: from and to" },
        { status: 400 }
      );
    }

    if (!format || !["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'csv' or 'json'" },
        { status: 400 }
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const analyticsService = new AnalyticsService(supabase);

    const filters = {
      dateRange: { from, to },
      templateId,
      senderEmail,
      status: status as any,
    };

    const exportData = await analyticsService.exportAnalytics(filters, format);

    // Set appropriate headers for download
    const headers = new Headers();
    if (format === "csv") {
      headers.set("Content-Type", "text/csv");
      headers.set(
        "Content-Disposition",
        `attachment; filename="email-analytics-${from.toISOString().split("T")[0]}-to-${to.toISOString().split("T")[0]}.csv"`
      );
    } else {
      headers.set("Content-Type", "application/json");
      headers.set(
        "Content-Disposition",
        `attachment; filename="email-analytics-${from.toISOString().split("T")[0]}-to-${to.toISOString().split("T")[0]}.json"`
      );
    }

    return new NextResponse(exportData, { headers });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    );
  }
}
