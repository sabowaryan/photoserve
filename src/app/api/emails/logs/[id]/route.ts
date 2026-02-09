import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createEmailLogRepository } from "@/lib/repositories/email-log.repository";

/**
 * GET /api/emails/logs/[id]
 * 
 * Fetch a single email log by ID with full event history
 * 
 * Requirements: 8.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const repository = createEmailLogRepository(supabase);

    const log = await repository.getLogById(params.id);

    if (!log) {
      return NextResponse.json(
        { error: "Email log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching email log:", error);
    return NextResponse.json(
      { error: "Failed to fetch email log" },
      { status: 500 }
    );
  }
}
