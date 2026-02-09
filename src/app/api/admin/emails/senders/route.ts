/**
 * Sender Address Management API Routes
 * 
 * Endpoints:
 * - GET /api/admin/emails/senders - List all sender addresses
 * - POST /api/admin/emails/senders - Add new sender address
 * 
 * Requirements: 6.4, 6.5
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSenderAddressRepository } from '@/lib/repositories/sender-address.repository';
import { EmailProviderService } from '@/lib/services/email-provider.service';

/**
 * GET /api/admin/emails/senders
 * List all sender addresses
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const repository = createSenderAddressRepository(supabase);

    const senders = await repository.findAll();

    return NextResponse.json({ senders });
  } catch (error) {
    console.error('Error fetching sender addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sender addresses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/emails/senders
 * Add new sender address and initiate verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const repository = createSenderAddressRepository(supabase);

    // Check if sender already exists
    const existing = await repository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Sender address already exists' },
        { status: 409 }
      );
    }

    // Create sender address
    const sender = await repository.create({
      email,
      name: name || null,
      is_verified: false,
      is_default: false,
    });

    // Initiate verification with active provider
    try {
      const providerService = new EmailProviderService(supabase);
      const provider = await providerService.getActiveProvider();

      if (provider) {
        await provider.verifySender(email);
        const domain = email.split('@')[1];
        if (domain) {
          const domainRecords = await provider.getDomainRecords(domain);

          // Update sender with domain records (cast to any to handle type mismatch)
          await repository.updateVerificationStatus(
            sender.id,
            false,
            domainRecords as any
          );
        }
      }
    } catch (verificationError) {
      console.error('Error initiating verification:', verificationError);
      // Continue even if verification fails - sender is created
    }

    // Fetch updated sender with domain records
    const updatedSender = await repository.findById(sender.id);

    return NextResponse.json({ sender: updatedSender }, { status: 201 });
  } catch (error) {
    console.error('Error creating sender address:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create sender address'
      },
      { status: 500 }
    );
  }
}
