/**
 * Logo Upload API Endpoint
 * Handles custom logo upload for Pro plan photographers
 * 
 * @module app/api/profile/logo
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { NextResponse } from 'next/server';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { hasFeatureAccess } from '@/config/plan-features';
import { createLogoUploadService } from '@/lib/services/logo-upload.service';

/**
 * POST /api/profile/logo
 * Upload a custom logo for the authenticated photographer
 * 
 * Requirements:
 * - 5.1: Validate file type is image
 * - 5.2: Validate file size is under 2MB
 * - 5.3: Upload image to Cloudinary
 * - 5.4: Store Cloudinary URL in database
 * - 5.5: Display error message on upload failure
 */
export async function POST(request: Request) {
  try {
    // Requirement 6.1: Authenticate the user
    const session = await getSession();

    if (!session?.user) {
      // Requirement 6.2: Return 401 Unauthorized if not authenticated
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { supabase } = await requireSupabaseClient();

    // Get user's current plan to verify Pro access
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single();

    const userPlan = profile?.subscription_plan || 'free';

    // Requirement 8.1, 8.2: Verify Pro plan subscription
    if (!hasFeatureAccess(userPlan, 'whiteLabel')) {
      return NextResponse.json(
        { error: 'Custom logo requires Pro plan' },
        { status: 403 }
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize logo upload service
    const logoService = createLogoUploadService();

    // Requirement 5.1, 5.2: Validate image file
    const validation = logoService.validateImage(file);
    if (!validation.valid) {
      // Requirement 5.5: Display error message on validation failure
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Requirement 5.3: Upload to Cloudinary
    const uploadResult = await logoService.uploadLogo(file, session.user.id);

    // Requirement 5.4: Update database with Cloudinary URL
    // Store both the URL and public ID for future deletion
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('branding')
      .eq('id', session.user.id)
      .single();

    const currentBranding = (currentProfile as any)?.branding || {};

    // Update branding with new logo URL
    const updatedBranding = {
      ...currentBranding,
      customLogo: uploadResult.url,
      customLogoPublicId: uploadResult.publicId, // Store for deletion
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ branding: updatedBranding } as any)
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating profile with logo:', updateError);
      // Attempt to clean up uploaded image
      try {
        await logoService.deleteLogo(uploadResult.publicId);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded logo:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to save logo to profile' },
        { status: 500 }
      );
    }

    // Return success with logo URL
    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    // Requirement 5.5: Display error message on upload failure
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/logo
 * Remove the custom logo for the authenticated photographer
 * 
 * Requirement: 5.10 - Remove logo and delete reference from database
 */
export async function DELETE() {
  try {
    // Authenticate the user
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { supabase } = await requireSupabaseClient();

    // Get current branding to retrieve public ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('branding')
      .eq('id', session.user.id)
      .single();

    const currentBranding = (profile as any)?.branding || {};
    const publicId = currentBranding.customLogoPublicId;

    // Delete from Cloudinary if public ID exists
    if (publicId) {
      const logoService = createLogoUploadService();
      try {
        await logoService.deleteLogo(publicId);
      } catch (error) {
        console.error('Error deleting logo from Cloudinary:', error);
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Requirement 5.10: Delete logo reference from database
    const updatedBranding = {
      ...currentBranding,
      customLogo: undefined,
      customLogoPublicId: undefined,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ branding: updatedBranding } as any)
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error removing logo from profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove logo from profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logo removed successfully',
    });
  } catch (error) {
    console.error('Logo deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
