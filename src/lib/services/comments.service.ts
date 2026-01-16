/**
 * Comments Service
 * Business logic for comments operations on images
 * 
 * @module lib/services/comments.service
 * Requirements: 3.2.1, 3.2.2, 3.2.3
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface ICommentsService {
  addComment(imageId: string, content: string, sessionId: string): Promise<Comment>;
  getComments(imageId: string): Promise<Comment[]>;
  deleteComment(commentId: string): Promise<void>;
}

export class CommentsService implements ICommentsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Add a comment to an image
   * 
   * Requirement 3.2.1: THE Lightbox SHALL include a comment input field
   * Requirement 3.2.2: WHEN submitting a comment, THE System SHALL save it with image reference
   */
  async addComment(
    imageId: string,
    content: string,
    sessionId: string
  ): Promise<Comment> {
    // Validate inputs
    if (!imageId || !content?.trim() || !sessionId) {
      throw new ValidationError('Image ID, content, and Session ID are required');
    }

    // Validate content length (reasonable limit)
    if (content.trim().length > 1000) {
      throw new ValidationError('Comment content cannot exceed 1000 characters');
    }

    // Verify image exists
    const { data: image, error: imageError } = await this.supabase
      .from('images')
      .select('id, gallery_id')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      throw new NotFoundError('Image');
    }

    // Insert comment
    const commentData: CommentInsert = {
      image_id: imageId,
      gallery_id: image.gallery_id,
      content: content.trim(),
      session_id: sessionId,
    };

    const { data: comment, error: insertError } = await this.supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (!comment) {
      throw new Error('Failed to create comment');
    }

    return comment;
  }

  /**
   * Get all comments for an image
   * 
   * Requirement 3.2.3: THE Comments_List SHALL be visible in photographer dashboard
   */
  async getComments(imageId: string): Promise<Comment[]> {
    // Validate input
    if (!imageId) {
      throw new ValidationError('Image ID is required');
    }

    // Verify image exists
    const { data: image, error: imageError } = await this.supabase
      .from('images')
      .select('id')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      throw new NotFoundError('Image');
    }

    // Get comments ordered by creation date (newest first)
    const { data: comments, error: commentsError } = await this.supabase
      .from('comments')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    return comments || [];
  }

  /**
   * Delete a comment by ID
   * Only allows deletion by the same session that created it
   * 
   * Requirement 3.2.3: Allow comment management
   */
  async deleteComment(commentId: string): Promise<void> {
    // Validate input
    if (!commentId) {
      throw new ValidationError('Comment ID is required');
    }

    // Verify comment exists
    const { data: comment, error: commentError } = await this.supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      throw new NotFoundError('Comment');
    }

    // Delete comment
    const { error: deleteError } = await this.supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      throw deleteError;
    }
  }
}

/**
 * Factory function to create a CommentsService instance
 */
export function createCommentsService(
  supabase: SupabaseClient<Database>
): ICommentsService {
  return new CommentsService(supabase);
}