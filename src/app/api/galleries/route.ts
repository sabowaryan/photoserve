/**
 * Gallery API Routes
 * GET - List user galleries
 * POST - Create new gallery
 * 
 * @module app/api/galleries/route
 * Requirements: 9.1 - API Routes for gallery CRUD, 18.6 - First gallery congratulations email
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryService } from '@/lib/services/gallery.service';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { createGallerySchema } from '@/lib/validators/gallery.schema';
import { AuthenticationError } from '@/lib/errors';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';

/**
 * GET /api/galleries
 * List all galleries for the authenticated user
 */
export async function GET() {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const galleryService = createGalleryService(supabase);
    const galleries = await galleryService.getByUserId(userId);

    return createApiResponse({ galleries });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * POST /api/galleries
 * Create a new gallery
 * 
 * Requirements: 7.1, 13.3 - Track first gallery creation and mark onboarding task complete
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGallerySchema.parse(body);

    const galleryService = createGalleryService(supabase);
    
    // Check if this is the user's first gallery
    const existingGalleries = await galleryService.getByUserId(userId);
    const isFirstGallery = existingGalleries.length === 0;
    
    const gallery = await galleryService.create(userId, validatedData);

    // If this is the first gallery, track the event and mark onboarding task complete
    if (isFirstGallery) {
      try {
        const analyticsService = createAnalyticsService(supabase);
        
        // Track first gallery creation event
        await analyticsService.trackFunnelEvent(
          "first_gallery_created",
          {
            userId,
            galleryId: gallery.id,
            timestamp: new Date().toISOString(),
          }
        );

        // Mark onboarding task as complete
        await supabase
          .from('onboarding_states')
          .upsert({
            user_id: userId,
            step_id: 'create_first_gallery',
            completed: true,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,step_id'
          });

        // Send congratulations email for first gallery
        const emailTriggersService = new EmailTriggersService(supabase);
        await emailTriggersService.handleFirstGalleryEvent(userId);
      } catch (error) {
        // Log error but don't fail the gallery creation
        console.error('Failed to track first gallery creation:', error);
      }
    }

    return createApiResponse({ gallery, isFirstGallery }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
