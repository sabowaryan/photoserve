import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";
import { createTemplateEngine } from "@/lib/email/template-engine";

/**
 * POST /api/emails/templates/[id]/preview
 * Generate a preview of an email template
 * 
 * Requirements: 7.2
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { id } = await params;
    const { variables = {} } = await request.json();

    const templateRepo = createTemplateRepository(supabase);
    const template = await templateRepo.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateEngine = createTemplateEngine(supabase);

    // Generate preview with provided variables or sample data
    const preview = await templateEngine.generatePreview(id, variables);

    return NextResponse.json({
      html: preview.html,
      text: preview.text,
      subject: preview.subject,
    });
  } catch (error) {
    console.error("Error generating template preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
