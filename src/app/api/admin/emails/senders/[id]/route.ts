/**
 * Individual Sender Address API Routes
 * 
 * Endpoints:
 * - DELETE /api/admin/emails/senders/[id] - Delete sender address
 * 
 * Requirements: 6.6
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSenderAddressRepository } from '@/lib/repositories/sender-address.repository';

/**
 * DELETE /api/admin/emails/senders/[id]
 * Delete a sender address (with validation to prevent deleting the only verified sender)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = createAdminClient();
    const repository = createSenderAddressRepository(supabase);

    // Delete sender (repository handles validation)
    await repository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sender address:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('only verified sender')) {
        return NextResponse.json(
          { error: 'Cannot delete the only verified sender address' },
          { status: 400 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Sender address not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete sender address' },
      { status: 500 }
    );
  }
}
