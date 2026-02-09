import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRenderer } from "@/lib/email/template-renderer";

/**
 * POST /api/emails/templates/[id]/versions/[version]/preview
 * Preview a specific template version with sample data
 * 
 * Requirements: 7.8
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { variables = {} } = body;

    const templateRenderer = createTemplateRenderer(supabase);
    const rendered = await templateRenderer.renderById(id, variables, versionNumber);

    return NextResponse.json({
      html: rendered.html,
      text: rendered.text,
      subject: rendered.subject,
    });
  } catch (error) {
    console.error("Error previewing template version:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Template or version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to preview template version" },
      { status: 500 }
    );
  }
}
