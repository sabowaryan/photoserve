import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/queue/status
 * 
 * Get queue status breakdown for dashboard widget
 * 
 * Requirements: 9.3, 9.4
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get counts by status with timeout
    const { data: statusCounts, error: statusError } = await supabase
      .from("email_queue")
      .select("status")
      .in("status", ["pending", "processing", "failed"]);

    if (statusError) {
      console.error("Error fetching queue status:", statusError);
      // Return empty counts instead of throwing
      return NextResponse.json({
        status: {
          pending: 0,
          processing: 0,
          failed: 0,
        },
        scheduled: [],
        error: statusError.message,
      });
    }

    // Count by status
    const pending = statusCounts?.filter((q) => q.status === "pending").length || 0;
    const processing = statusCounts?.filter((q) => q.status === "processing").length || 0;
    const failed = statusCounts?.filter((q) => q.status === "failed").length || 0;

    // Get scheduled emails (next 10)
    const { data: scheduled, error: scheduledError } = await supabase
      .from("email_queue")
      .select("id, to_address, subject, scheduled_at, priority")
      .eq("status", "pending")
      .not("scheduled_at", "is", null)
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (scheduledError) {
      console.error("Error fetching scheduled emails:", scheduledError);
    }

    return NextResponse.json({
      status: {
        pending,
        processing,
        failed,
      },
      scheduled: scheduled || [],
    });
  } catch (error) {
    console.error("Error fetching queue status:", error);
    // Return empty data instead of error to prevent UI crashes
    return NextResponse.json({
      status: {
        pending: 0,
        processing: 0,
        failed: 0,
      },
      scheduled: [],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
