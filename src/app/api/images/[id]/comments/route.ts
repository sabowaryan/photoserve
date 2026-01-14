/**
 * Comments API Routes
 * GET - Get all comments for an image
 * POST - Add a comment to an image
 * DELETE - Delete a comment
 * 
 * @module app/api/images/[id]/comments/route
 * Requirements: 3.2.1, 3.2.2
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { getSupabaseClient } from '@/lib/auth';
import { createCommentsService } from '@/lib/services/comments.service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const imageIdSchema = z.object({
  id: z.string().uuid('Invalid image ID format'),
});

const addCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment content cannot exceed 1000 characters')
    .trim(),
  sessionId: z.string().min(1, 'Session ID is required'),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID format'),
});

/**
 * GET /api/images/[id]/comments
 * Get all comments for an image
 * 
 * Returns: { comments: Comment[] }
 * 
 * Requirement 3.2.3: THE Comments_List SHALL be visible in photographer dashboard
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: imageId } = await params;

    // Validate image ID
    imageIdSchema.parse({ id: imageId });

    const commentsService = createCommentsService(supabase);
    const comments = await commentsService.getComments(imageId);

    return createApiResponse({ 
      comments,
      count: comments.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/images/[id]/comments
 * Add a comment to an image
 * 
 * Body:
 * - content: string (required) - Comment text (max 1000 chars)
 * - sessionId: string (required) - Session identifier for the visitor
 * 
 * Returns: { comment: Comment }
 * 
 * Requirement 3.2.1: THE Lightbox SHALL include a comment input field
 * Requirement 3.2.2: WHEN submitting a comment, THE System SHALL save it with image reference
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: imageId } = await params;

    // Validate image ID
    imageIdSchema.parse({ id: imageId });

    // Parse and validate request body
    const body = await request.json();
    const { content, sessionId } = addCommentSchema.parse(body);

    const commentsService = createCommentsService(supabase);
    const comment = await commentsService.addComment(imageId, content, sessionId);

    return createApiResponse({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/images/[id]/comments
 * Delete a comment
 * 
 * Body:
 * - commentId: string (required) - UUID of the comment to delete
 * 
 * Returns: 204 No Content
 * 
 * Requirement 3.2.3: Allow comment management
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: imageId } = await params;

    // Validate image ID
    imageIdSchema.parse({ id: imageId });

    // Parse and validate request body
    const body = await request.json();
    const { commentId } = deleteCommentSchema.parse(body);

    const commentsService = createCommentsService(supabase);
    await commentsService.deleteComment(commentId);

    return createNoContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
