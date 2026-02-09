import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { EmailProviderService } from "@/lib/services/email-provider.service";

/**
 * POST /api/admin/emails/providers/[provider]/test
 * 
 * Test email provider connection
 * 
 * Requirements: 6.3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { provider } = await params;

    // Validate provider name
    if (provider !== "resend" && provider !== "aws-ses") {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'resend' or 'aws-ses'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    
    // Create provider service
    const providerService = new EmailProviderService(supabase);

    // Test provider connection
    const isConnected = await providerService.testProviderConnection(
      provider as "resend" | "aws-ses"
    );

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${provider}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to ${provider}. Please verify your credentials.`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error testing provider connection:", error);
    
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to test provider connection",
      },
      { status: 500 }
    );
  }
}
