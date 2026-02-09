import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/recent
 * 
 * Get recent email logs (last 10 emails) for dashboard widget
 * 
 * Requirements: 9.1, 9.2
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: logs, error } = await supabase
      .from("email_logs")
      .select("id, to_address, subject, status, created_at, template_id")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch recent logs: ${error.message}`);
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent logs" },
      { status: 500 }
    );
  }
}
