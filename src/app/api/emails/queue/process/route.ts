import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { QueueManager } from "@/lib/email/queue-manager";

/**
 * POST /api/emails/queue/process
 * 
 * Manually trigger queue processing
 * 
 * Requirements: 9.3, 9.4
 */
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const queueManager = new QueueManager(supabase);

    // Get batch size from request body (default: 10)
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize !== undefined ? body.batchSize : 10;

    // Validate batch size
    if (batchSize < 1 || batchSize > 100) {
      return NextResponse.json(
        { error: "Batch size must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Process batch
    const results = await queueManager.processBatch(batchSize);

    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Error processing queue:", error);
    return NextResponse.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}
