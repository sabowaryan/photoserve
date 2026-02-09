import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { EmailProviderService } from "@/lib/services/email-provider.service";

/**
 * POST /api/admin/emails/providers
 * 
 * Save email provider configuration
 * 
 * Requirements: 6.1, 6.2
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
    const { provider, config } = body;

    // Validate input
    if (!provider || !config) {
      return NextResponse.json(
        { error: "Provider and config are required" },
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

    // Save provider configuration
    const providerId = await providerService.saveProviderConfig({
      provider,
      config,
      isActive: false, // Don't activate automatically
    });

    return NextResponse.json({
      success: true,
      providerId,
      message: "Provider configuration saved successfully",
    });
  } catch (error) {
    console.error("Error saving provider configuration:", error);
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save provider configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/emails/providers
 * 
 * List all configured email providers
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

    // List providers
    const providers = await providerService.listProviders();

    return NextResponse.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error("Error listing providers:", error);
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list providers",
      },
      { status: 500 }
    );
  }
}
