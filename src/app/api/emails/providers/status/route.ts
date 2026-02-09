import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/providers/status
 * 
 * Get active email provider and connection status
 * 
 * Requirements: 9.1, 9.2
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get active provider
    const { data: provider, error } = await supabase
      .from("email_providers")
      .select("id, name, is_active, updated_at")
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch provider status: ${error.message}`);
    }

    // If no active provider, return default state
    if (!provider) {
      return NextResponse.json({
        provider: null,
        status: "not_configured",
      });
    }

    // Check if provider was recently updated (within last 24 hours)
    const lastUpdate = provider.updated_at ? new Date(provider.updated_at) : null;
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const isRecent = lastUpdate ? lastUpdate > dayAgo : false;

    return NextResponse.json({
      provider: {
        name: provider.name,
        isActive: provider.is_active,
      },
      status: isRecent ? "connected" : "unknown",
    });
  } catch (error) {
    console.error("Error fetching provider status:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider status" },
      { status: 500 }
    );
  }
}
