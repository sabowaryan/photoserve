/**
 * Gallery Monetization API Routes
 * POST - Create/enable paywall
 * GET - Retrieve monetization config
 * PUT - Update paywall config
 * DELETE - Disable paywall
 * 
 * @module app/api/galleries/[id]/monetization/route
 * Requirements: 2.3 - API Routes for gallery monetization
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryMonetizationService } from '@/lib/services/gallery-monetization.service';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Route params interface
 */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Zod schema for gallery ID validation
 */
const galleryIdSchema = z.object({
  id: z.string().trim().uuid('Invalid gallery ID'),
});

/**
 * Zod schema for creating/enabling paywall
 */
const createPaywallSchema = z.object({
  priceCents: z
    .number()
    .int('Price must be a whole number')
    .min(500, 'Minimum price is $5.00')
    .max(50000, 'Maximum price is $500.00'),
  currency: z
    .enum(['usd', 'eur', 'cad'], {
      message: 'Currency must be usd, eur, or cad',
    })
    .default('usd'),
  previewMode: z
    .enum(['full_paywall', 'freemium'], {
      message: 'Preview mode must be full_paywall or freemium',
    })
    .default('full_paywall'),
  watermarkEnabled: z.boolean().default(true),
  accessDurationDays: z.number().int().min(1).nullable().optional(),
});

/**
 * Zod schema for updating paywall
 */
const updatePaywallSchema = z.object({
  isEnabled: z.boolean().optional(),
  priceCents: z
    .number()
    .int('Price must be a whole number')
    .min(500, 'Minimum price is $5.00')
    .max(50000, 'Maximum price is $500.00')
    .optional(),
  currency: z
    .enum(['usd', 'eur', 'cad'], {
      message: 'Currency must be usd, eur, or cad',
    })
    .optional(),
  previewMode: z
    .enum(['full_paywall', 'freemium'], {
      message: 'Preview mode must be full_paywall or freemium',
    })
    .optional(),
  watermarkEnabled: z.boolean().optional(),
  accessDurationDays: z.number().int().min(1).nullable().optional(),
});

/**
 * Verify user owns the gallery
 * @param supabase - Supabase client
 * @param galleryId - Gallery ID
 * @param userId - User ID
 * @returns Gallery data if owned by user
 * @throws NotFoundError if gallery not found or not owned by user
 */
async function verifyGalleryOwnership(
  supabase: any,
  galleryId: string,
  userId: string
): Promise<{ id: string; user_id: string; title: string; is_public: boolean }> {
  const { data: gallery, error } = await supabase
    .from('galleries')
    .select('id, user_id, title, is_public')
    .eq('id', galleryId)
    .single();

  if (error || !gallery) {
    throw new NotFoundError('Gallery');
  }

  if (gallery.user_id !== userId) {
    throw new NotFoundError('Gallery');
  }

  return gallery;
}

/**
 * Verify user has Pro plan
 * @param supabase - Supabase client
 * @param userId - User ID
 * @throws AuthorizationError if user doesn't have Pro plan
 */
async function verifyProPlan(supabase: any, userId: string): Promise<void> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Failed to fetch user profile');
  }

  if (profile.subscription_plan !== 'pro') {
    throw new AuthorizationError('Pro plan required to enable gallery monetization');
  }
}

/**
 * POST /api/galleries/[id]/monetization
 * Create/enable paywall for a gallery
 * 
 * Requirements:
 * - User must be authenticated
 * - User must own the gallery
 * - User must have Pro plan
 * - Creates monetization config and Stripe Price
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Verify ownership
    await verifyGalleryOwnership(supabase, galleryId, userId);

    // Verify Pro plan
    await verifyProPlan(supabase, userId);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaywallSchema.parse(body);

    // Create monetization config
    const monetizationService = createGalleryMonetizationService(supabase);
    const config = await monetizationService.enablePaywall(galleryId, {
      priceCents: validatedData.priceCents,
      currency: validatedData.currency,
      previewMode: validatedData.previewMode,
      watermarkEnabled: validatedData.watermarkEnabled,
      accessDurationDays: validatedData.accessDurationDays,
    });

    return createApiResponse(config, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * GET /api/galleries/[id]/monetization
 * Retrieve monetization config for a gallery
 * 
 * Requirements:
 * - User must be authenticated
 * - User must own the gallery OR gallery is active with enabled paywall
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Get gallery to check ownership or public access
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id, is_active')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Get monetization config
    const monetizationService = createGalleryMonetizationService(supabase);
    const config = await monetizationService.getConfig(galleryId);

    // Check access permissions
    const isOwner = gallery.user_id === userId;
    const isActiveWithPaywall = gallery.is_active && config?.isEnabled;

    if (!isOwner && !isActiveWithPaywall) {
      throw new NotFoundError('Gallery monetization configuration');
    }

    if (!config) {
      throw new NotFoundError('Gallery monetization configuration');
    }

    return createApiResponse(config);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * PUT /api/galleries/[id]/monetization
 * Update paywall configuration
 * 
 * Requirements:
 * - User must be authenticated
 * - User must own the gallery
 * - User must have Pro plan
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Verify ownership
    await verifyGalleryOwnership(supabase, galleryId, userId);

    // Verify Pro plan
    await verifyProPlan(supabase, userId);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePaywallSchema.parse(body);

    // Ensure at least one field is being updated
    if (Object.keys(validatedData).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // Update monetization config
    const monetizationService = createGalleryMonetizationService(supabase);
    const config = await monetizationService.updatePaywall(galleryId, validatedData);

    return createApiResponse(config);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/galleries/[id]/monetization
 * Disable paywall for a gallery
 * 
 * Requirements:
 * - User must be authenticated
 * - User must own the gallery
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Verify ownership
    await verifyGalleryOwnership(supabase, galleryId, userId);

    // Disable paywall
    const monetizationService = createGalleryMonetizationService(supabase);
    await monetizationService.disablePaywall(galleryId);

    return createNoContentResponse();
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
