import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/analytics/rates
 * 
 * Get email rate data (open, click, bounce) grouped by day for charting
 * 
 * Query params:
 * - from: ISO date string (required)
 * - to: ISO date string (required)
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
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

    // Query email logs grouped by date
    const { data: logs, error } = await supabase
      .from("email_logs")
      .select("created_at, sent_at, delivered_at, opened_at, clicked_at, bounced_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch rate data: ${error.message}`);
    }

    // Group data by date and calculate rates
    const ratesByDate = new Map<string, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
    }>();

    for (const log of logs || []) {
      // Skip logs without created_at
      const createdAt = log.created_at;
      if (!createdAt) continue;
      
      const date = new Date(createdAt).toISOString().split("T")[0]!;
      
      if (!ratesByDate.has(date)) {
        ratesByDate.set(date, {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        });
      }

      const stats = ratesByDate.get(date)!;
      stats.sent++;
      if (log.delivered_at) stats.delivered++;
      if (log.opened_at) stats.opened++;
      if (log.clicked_at) stats.clicked++;
      if (log.bounced_at) stats.bounced++;
    }

    // Convert to array format with calculated rates
    const data = Array.from(ratesByDate.entries()).map(([date, stats]) => ({
      date,
      openRate: stats.delivered > 0 
        ? Math.round((stats.opened / stats.delivered) * 100 * 100) / 100 
        : 0,
      clickRate: stats.delivered > 0 
        ? Math.round((stats.clicked / stats.delivered) * 100 * 100) / 100 
        : 0,
      bounceRate: stats.sent > 0 
        ? Math.round((stats.bounced / stats.sent) * 100 * 100) / 100 
        : 0,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching rate data:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate data" },
      { status: 500 }
    );
  }
}
