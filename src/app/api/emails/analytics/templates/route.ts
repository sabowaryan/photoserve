import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/email-analytics.service";

/**
 * GET /api/emails/analytics/templates
 * 
 * Get performance analytics for all templates
 * 
 * Query params:
 * - from: ISO date string (required)
 * - to: ISO date string (required)
 * 
 * Requirements: 8.5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing required parameters: from and to" },
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

    // Get all templates that have been used in the date range
    const { data: usedTemplates, error: templatesError } = await supabase
      .from("email_logs")
      .select("template_id")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .not("template_id", "is", null);

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    // Get unique template IDs
    const uniqueTemplateIds = Array.from(
      new Set(usedTemplates?.map((log) => log.template_id).filter(Boolean))
    );

    // Fetch analytics for each template
    const templates = await Promise.all(
      uniqueTemplateIds.map((templateId) =>
        analyticsService.getTemplateAnalytics(templateId!, { from, to })
      )
    );

    // Sort by sent count (descending)
    templates.sort((a, b) => b.sent - a.sent);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching template analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch template analytics" },
      { status: 500 }
    );
  }
}
