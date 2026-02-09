import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { createTemplateRepository } from "@/lib/repositories/template.repository";
import { createTemplateEngine } from "@/lib/email/template-engine";
import EmailService from "@/lib/services/email.service";

/**
 * POST /api/emails/templates/[id]/test
 * Send a test email with the template
 * 
 * Requirements: 7.7
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { id } = await params;
    const { to, variables = {} } = await request.json();

    // Validate email address
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Get template
    const templateRepo = createTemplateRepository(supabase);
    const template = await templateRepo.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Render template with variables
    const templateEngine = createTemplateEngine(supabase);
    const rendered = await templateEngine.generatePreview(id, variables);

    // Send test email
    const emailService = new EmailService(supabase);
    
    // Add test prefix to subject
    const testSubject = `[TEST] ${rendered.subject}`;
    
    const result = await emailService.sendTransactionalEmail({
      to,
      subject: testSubject,
      html: rendered.html,
      text: rendered.text,
      type: 'transactional',
      templateId: id,
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: `Test email sent to ${to}`,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to send test email" 
      },
      { status: 500 }
    );
  }
}
