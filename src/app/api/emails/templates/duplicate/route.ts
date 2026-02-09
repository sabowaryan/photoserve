import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";

/**
 * POST /api/emails/templates/duplicate
 * Duplicate an existing email template
 * 
 * Requirements: 7.2
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const templateRepo = createTemplateRepository(supabase);

    // Get the original template
    const originalTemplate = await templateRepo.getTemplate(templateId);
    if (!originalTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create a duplicate with a new name and slug
    const duplicateName = `${originalTemplate.name} (Copy)`;
    const duplicateSlug = `${originalTemplate.slug}-copy-${Date.now()}`;

    const newTemplate = await templateRepo.createTemplate({
      name: duplicateName,
      slug: duplicateSlug,
      type: originalTemplate.type,
      source: originalTemplate.source,
      subject: originalTemplate.subject,
      content: originalTemplate.content,
      variables: originalTemplate.variables,
      is_active: false, // Start as inactive
    });

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
