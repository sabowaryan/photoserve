import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { QueueManager } from "@/lib/email/queue-manager";

/**
 * GET /api/emails/queue/health
 * 
 * Get queue health status including processing rate, error rate,
 * and health indicators
 * 
 * Requirements: 9.3, 9.4
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const queueManager = new QueueManager(supabase);

    const health = await queueManager.getQueueHealth();

    return NextResponse.json({ health });
  } catch (error) {
    console.error("Error fetching queue health:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue health" },
      { status: 500 }
    );
  }
}
