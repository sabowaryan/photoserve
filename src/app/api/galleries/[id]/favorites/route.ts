/**
 * Favorites API Routes
 * GET - Get list of favorite image IDs for a session
 * POST - Toggle favorite status for an image
 * 
 * @module app/api/galleries/[id]/favorites/route
 * Requirements: 3.1.1, 3.1.2
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { getSupabaseClient } from '@/lib/auth';
import { createFavoritesService } from '@/lib/services/favorites.service';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

const toggleFavoriteSchema = z.object({
  imageId: z.string().uuid('Invalid image ID format'),
  sessionId: z.string().min(1, 'Session ID is required'),
});

const getFavoritesSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

/**
 * GET /api/galleries/[id]/favorites
 * Get list of favorite image IDs for a session
 * 
 * Query params:
 * - sessionId: string (required) - Session identifier for the visitor
 * 
 * Returns: { favorites: string[] }
 * 
 * Requirement 3.1.3: THE Favorites_Count SHALL be displayed in gallery header
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Get sessionId from query params
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    // Validate query params
    getFavoritesSchema.parse({ sessionId });

    const favoritesService = createFavoritesService(supabase);
    const favorites = await favoritesService.getFavorites(galleryId, sessionId);

    return createApiResponse({ 
      favorites,
      count: favorites.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/galleries/[id]/favorites
 * Toggle favorite status for an image
 * 
 * Body:
 * - imageId: string (required) - UUID of the image to toggle
 * - sessionId: string (required) - Session identifier for the visitor
 * 
 * Returns: { isFavorite: boolean, message: string }
 * 
 * Requirement 3.1.1: THE Gallery_View SHALL display a heart icon on each image
 * Requirement 3.1.2: WHEN clicking the heart, THE System SHALL toggle favorite status
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Parse and validate request body
    const body = await request.json();
    const { imageId, sessionId } = toggleFavoriteSchema.parse(body);

    const favoritesService = createFavoritesService(supabase);
    const isFavorite = await favoritesService.toggleFavorite(
      galleryId,
      imageId,
      sessionId
    );

    return createApiResponse({ 
      isFavorite,
      message: isFavorite ? 'Favorite added' : 'Favorite removed',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
