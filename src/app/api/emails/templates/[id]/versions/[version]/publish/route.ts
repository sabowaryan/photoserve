import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";

/**
 * POST /api/emails/templates/[id]/versions/[version]/publish
 * Publish a specific template version as active
 * 
 * Requirements: 7.8
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { id, version } = await params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    const templateRepo = createTemplateRepository(supabase);
    await templateRepo.publishTemplateVersion(id, versionNumber);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing template version:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Template or version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to publish template version" },
      { status: 500 }
    );
  }
}
