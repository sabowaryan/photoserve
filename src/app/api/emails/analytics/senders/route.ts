import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/email-analytics.service";

/**
 * GET /api/emails/analytics/senders
 * 
 * Get performance analytics for all sender addresses
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

    // Get all sender addresses that have been used in the date range
    const { data: usedSenders, error: sendersError } = await supabase
      .from("email_logs")
      .select("from_address")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());

    if (sendersError) {
      throw new Error(`Failed to fetch senders: ${sendersError.message}`);
    }

    // Get unique sender addresses
    const uniqueSenderEmails = Array.from(
      new Set(usedSenders?.map((log) => log.from_address).filter(Boolean))
    );

    // Fetch analytics for each sender
    const senders = await Promise.all(
      uniqueSenderEmails.map((senderEmail) =>
        analyticsService.getSenderAnalytics(senderEmail!, { from, to })
      )
    );

    // Sort by sent count (descending)
    senders.sort((a, b) => b.sent - a.sent);

    return NextResponse.json({ senders });
  } catch (error) {
    console.error("Error fetching sender analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sender analytics" },
      { status: 500 }
    );
  }
}
