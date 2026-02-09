import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";

/**
 * GET /api/emails/templates/[id]/versions
 * Get all versions of a template
 * 
 * Requirements: 7.8
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { id } = await params;

    const templateRepo = createTemplateRepository(supabase);
    const versions = await templateRepo.getTemplateVersions(id);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching template versions:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch template versions" },
      { status: 500 }
    );
  }
}
