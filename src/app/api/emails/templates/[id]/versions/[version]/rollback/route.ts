import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";

/**
 * POST /api/emails/templates/[id]/versions/[version]/rollback
 * Rollback to a previous template version (creates a new version with old content)
 * 
 * Requirements: 7.9
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { supabase, user } = await requireSupabaseClient();
    const { id, version } = await params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    const templateRepo = createTemplateRepository(supabase);
    const updatedTemplate = await templateRepo.rollbackToVersion(
      id,
      versionNumber,
      user?.id
    );

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error rolling back template version:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Template or version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to rollback template version" },
      { status: 500 }
    );
  }
}
