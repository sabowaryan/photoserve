import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createEmailLogRepository } from "@/lib/repositories/email-log.repository";

/**
 * POST /api/emails/logs/[id]/retry
 * 
 * Retry a failed email by re-queueing it
 * 
 * Requirements: 8.3
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const repository = createEmailLogRepository(supabase);

    // Get the log to verify it exists and is failed
    const log = await repository.getLogById(id);

    if (!log) {
      return NextResponse.json(
        { error: "Email log not found" },
        { status: 404 }
      );
    }

    if (!log.failed_at) {
      return NextResponse.json(
        { error: "Email has not failed and cannot be retried" },
        { status: 400 }
      );
    }

    // Get the original queue entry if it exists
    if (!log.queue_id) {
      return NextResponse.json(
        { error: "No queue entry found for this email" },
        { status: 400 }
      );
    }

    // Get the queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("id", log.queue_id)
      .single();

    if (queueError || !queueEntry) {
      return NextResponse.json(
        { error: "Queue entry not found" },
        { status: 404 }
      );
    }

    // Reset the queue entry to retry
    const { error: updateError } = await supabase
      .from("email_queue")
      .update({
        status: "pending",
        retry_count: 0,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", log.queue_id);

    if (updateError) {
      throw updateError;
    }

    // Update the log status
    const { error: logUpdateError } = await supabase
      .from("email_logs")
      .update({
        status: "queued",
        failed_at: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (logUpdateError) {
      throw logUpdateError;
    }

    return NextResponse.json({
      success: true,
      message: "Email has been re-queued for retry",
    });
  } catch (error) {
    console.error("Error retrying email:", error);
    return NextResponse.json(
      { error: "Failed to retry email" },
      { status: 500 }
    );
  }
}
