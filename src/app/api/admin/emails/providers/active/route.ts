import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { EmailProviderService } from "@/lib/services/email-provider.service";

/**
 * GET /api/admin/emails/providers/active
 * 
 * Get the currently active email provider
 * 
 * Requirements: 6.1
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const supabase = createAdminClient();
    
    // Create provider service
    const providerService = new EmailProviderService(supabase);

    // Get active provider
    const provider = await providerService.getActiveProvider();

    return NextResponse.json({
      success: true,
      provider: provider.name,
    });
  } catch (error) {
    console.error("Error getting active provider:", error);
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get active provider",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/emails/providers/active
 * 
 * Set the active email provider
 * 
 * Requirements: 6.1, 6.3
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const supabase = createAdminClient();
    
    // Parse request body
    const body = await request.json();
    const { provider } = body;

    // Validate input
    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Validate provider name
    if (provider !== "resend" && provider !== "aws-ses") {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'resend' or 'aws-ses'" },
        { status: 400 }
      );
    }

    // Create provider service
    const providerService = new EmailProviderService(supabase);

    // Set active provider (this also tests the connection)
    await providerService.setActiveProvider(provider);

    return NextResponse.json({
      success: true,
      message: `${provider} is now the active email provider`,
    });
  } catch (error) {
    console.error("Error setting active provider:", error);
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to set active provider",
      },
      { status: 500 }
    );
  }
}
