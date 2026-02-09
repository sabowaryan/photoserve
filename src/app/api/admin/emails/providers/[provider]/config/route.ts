import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/admin-auth";
import { EmailProviderService } from "@/lib/services/email-provider.service";

interface RouteParams {
  params: Promise<{
    provider: string;
  }>;
}

/**
 * GET /api/admin/emails/providers/[provider]/config
 * 
 * Get decrypted provider configuration (for editing)
 * 
 * Requirements: 6.1, 6.2
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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
    const providerService = new EmailProviderService(supabase);
    
    // Get decrypted configuration
    const decryptedConfig = await providerService.getProviderConfig(provider as any);

    if (!decryptedConfig) {
      return NextResponse.json(
        { error: "Provider not configured" },
        { status: 404 }
      );
    }

    // Mask sensitive data for security (show only last 4 characters)
    let maskedConfig = { ...decryptedConfig };
    
    if (provider === "resend" && maskedConfig.apiKey) {
      const key = maskedConfig.apiKey as string;
      maskedConfig.apiKey = key.length > 4 
        ? "•".repeat(key.length - 4) + key.slice(-4)
        : "•".repeat(key.length);
    } else if (provider === "aws-ses") {
      if (maskedConfig.accessKeyId) {
        const key = maskedConfig.accessKeyId as string;
        maskedConfig.accessKeyId = key.length > 4
          ? key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4)
          : key;
      }
      if (maskedConfig.secretAccessKey) {
        const key = maskedConfig.secretAccessKey as string;
        maskedConfig.secretAccessKey = "•".repeat(key.length);
      }
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
    });
  } catch (error) {
    console.error("Error getting provider configuration:", error);
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get provider configuration",
      },
      { status: 500 }
    );
  }
}
