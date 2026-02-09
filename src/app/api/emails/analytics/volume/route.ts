import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/analytics/volume
 * 
 * Get email volume data grouped by day for charting
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
      .select("created_at, sent_at, delivered_at, opened_at, clicked_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch volume data: ${error.message}`);
    }

    // Group data by date
    const volumeByDate = new Map<string, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>();

    for (const log of logs || []) {
      // Skip logs without created_at
      const createdAt = log.created_at;
      if (!createdAt) continue;
      
      const date = new Date(createdAt).toISOString().split("T")[0]!;
      
      if (!volumeByDate.has(date)) {
        volumeByDate.set(date, {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
        });
      }

      const stats = volumeByDate.get(date)!;
      stats.sent++;
      if (log.delivered_at) stats.delivered++;
      if (log.opened_at) stats.opened++;
      if (log.clicked_at) stats.clicked++;
    }

    // Convert to array format for charting
    const data = Array.from(volumeByDate.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching volume data:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume data" },
      { status: 500 }
    );
  }
}
