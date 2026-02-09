import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { QueueManager } from "@/lib/email/queue-manager";

/**
 * GET /api/emails/queue/stats
 * 
 * Get detailed queue statistics including counts by priority
 * 
 * Requirements: 9.3, 9.4
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const queueManager = new QueueManager(supabase);

    const stats = await queueManager.getStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue stats" },
      { status: 500 }
    );
  }
}
