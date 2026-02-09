import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/stats
 * 
 * Get quick stats for email dashboard:
 * - Emails sent today
 * - Queue size (pending emails)
 * - Delivery rate (last 7 days)
 * - Bounce rate (last 7 days)
 * 
 * Requirements: 9.1, 9.2
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get 7 days ago for rates
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Emails sent today
    const { count: sentToday, error: sentError } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (sentError) {
      console.error("Error fetching sent today:", sentError);
    }

    // Queue size (pending + scheduled)
    const { count: queueSize, error: queueError } = await supabase
      .from("email_queue")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "scheduled"]);

    if (queueError) {
      console.error("Error fetching queue size:", queueError);
    }

    // Get logs from last 7 days for rates
    const { data: recentLogs, error: logsError } = await supabase
      .from("email_logs")
      .select("sent_at, delivered_at, bounced_at")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (logsError) {
      console.error("Error fetching recent logs:", logsError);
    }

    // Calculate delivery and bounce rates
    let deliveryRate = 0;
    let bounceRate = 0;

    if (recentLogs && recentLogs.length > 0) {
      const sent = recentLogs.filter((log) => log.sent_at).length;
      const delivered = recentLogs.filter((log) => log.delivered_at).length;
      const bounced = recentLogs.filter((log) => log.bounced_at).length;

      if (sent > 0) {
        deliveryRate = Math.round((delivered / sent) * 100 * 100) / 100;
        bounceRate = Math.round((bounced / sent) * 100 * 100) / 100;
      }
    }

    return NextResponse.json({
      stats: {
        sentToday: sentToday || 0,
        queueSize: queueSize || 0,
        deliveryRate,
        bounceRate,
      },
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch email stats" },
      { status: 500 }
    );
  }
}
