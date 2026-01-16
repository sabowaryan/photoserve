/**
 * Gallery Monetization Service
 * Handles gallery paywall configuration and monetization operations
 * 
 * @module lib/services/gallery-monetization.service
 * Requirements: 2.1 - Gallery Paywall Configuration
 * Requirements: 11.1 - Caching Strategy (5 minute cache for monetization config)
 */
import { getStripe } from '@/lib/stripe/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import Stripe from 'stripe';
import { 
  getCacheService, 
  ICacheService, 
  CACHE_TTL, 
  CACHE_PREFIX,
  CacheInvalidation,
} from './cache.service';

/**
 * Monetization Configuration
 */
export interface MonetizationConfig {
  galleryId: string;
  isEnabled: boolean;
  priceCents: number;
  currency: string;
  previewMode: 'full_paywall' | 'freemium';
  watermarkEnabled: boolean;
  accessDurationDays?: number | null;
  stripePriceId?: string | null;
  platformFeePercent?: number;
}

/**
 * Gallery Monetization Stats
 */
export interface MonetizationStats {
  totalSales: number;
  totalRevenueCents: number;
  conversionRate: number;
}

/**
 * Gallery Monetization Service Interface
 */
export interface IGalleryMonetizationService {
  enablePaywall(galleryId: string, config: Partial<MonetizationConfig>): Promise<MonetizationConfig>;
  updatePaywall(galleryId: string, config: Partial<MonetizationConfig>): Promise<MonetizationConfig>;
  disablePaywall(galleryId: string): Promise<void>;
  getConfig(galleryId: string): Promise<MonetizationConfig | null>;
  createStripePrice(config: MonetizationConfig): Promise<string>;
  updateSalesStats(galleryId: string, salePriceCents: number): Promise<void>;
  getConversionRate(galleryId: string): Promise<number>;
}

/**
 * Gallery Monetization Service Implementation
 */
export class GalleryMonetizationService implements IGalleryMonetizationService {
  private stripe: Stripe;
  private cacheService: ICacheService;

  constructor(
    private supabase: SupabaseClient<Database>,
    cacheService?: ICacheService
  ) {
    this.stripe = getStripe();
    this.cacheService = cacheService || getCacheService();
  }

  /**
   * Enable paywall for a gallery
   * Requirements: 2.1 - Enable paywall configuration
   * 
   * @param galleryId - The gallery ID
   * @param config - Monetization configuration
   * @returns The created configuration
   */
  async enablePaywall(
    galleryId: string,
    config: Partial<MonetizationConfig>
  ): Promise<MonetizationConfig> {
    try {
      // Validate inputs
      this.validateConfig(config);

      // Check if gallery exists and get photographer info
      const { data: gallery, error: galleryError } = await this.supabase
        .from('galleries')
        .select('id, user_id, title')
        .eq('id', galleryId)
        .single();

      if (galleryError || !gallery) {
        throw new NotFoundError('Gallery');
      }

      if (!gallery.user_id) {
        throw new AppError('Gallery has no owner', 'GALLERY_NO_OWNER', 400);
      }

      // Check if monetization already exists
      const { data: existing } = await this.supabase
        .from('gallery_monetization')
        .select('id')
        .eq('gallery_id', galleryId)
        .single();

      if (existing) {
        throw new ValidationError('Gallery already has monetization configured', {
          galleryId,
        });
      }

      // Check if photographer has Stripe Connect account
      const { data: connectAccount, error: connectError } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id, charges_enabled')
        .eq('user_id', gallery.user_id)
        .single();

      if (connectError || !connectAccount) {
        throw new ValidationError('Photographer must connect Stripe account first', {
          userId: gallery.user_id,
        });
      }

      if (!connectAccount.charges_enabled) {
        throw new ValidationError('Stripe account is not ready to accept charges', {
          accountId: connectAccount.stripe_account_id,
        });
      }

      // Create Stripe Price if needed
      let stripePriceId: string | null = null;
      if (config.priceCents) {
        const priceConfig: MonetizationConfig = {
          galleryId,
          isEnabled: true,
          priceCents: config.priceCents,
          currency: config.currency || 'usd',
          previewMode: config.previewMode || 'full_paywall',
          watermarkEnabled: config.watermarkEnabled ?? true,
          accessDurationDays: config.accessDurationDays,
          platformFeePercent: config.platformFeePercent || 10.0,
        };

        stripePriceId = await this.createStripePrice(priceConfig);
      }

      // Create monetization record
      const { data: monetization, error: insertError } = await this.supabase
        .from('gallery_monetization')
        .insert({
          gallery_id: galleryId,
          is_enabled: true,
          price_cents: config.priceCents!,
          currency: config.currency || 'usd',
          preview_mode: config.previewMode || 'full_paywall',
          watermark_enabled: config.watermarkEnabled ?? true,
          access_duration_days: config.accessDurationDays || null,
          stripe_price_id: stripePriceId,
          platform_fee_percent: config.platformFeePercent || 10.0,
          total_sales: 0,
          total_revenue_cents: 0,
          conversion_rate: 0.0,
        })
        .select()
        .single();

      if (insertError || !monetization) {
        console.error('[GalleryMonetizationService] Failed to create monetization:', insertError);
        throw new AppError('Failed to enable paywall', 'MONETIZATION_CREATE_ERROR', 500);
      }

      console.log('[GalleryMonetizationService] Enabled paywall:', {
        galleryId,
        priceCents: config.priceCents,
        stripePriceId,
      });

      // Invalidate cache for this gallery
      await CacheInvalidation.monetizationConfig(this.cacheService, galleryId);

      return this.mapToConfig(monetization);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryMonetizationService] Error enabling paywall:', error);
      throw new AppError(
        'Failed to enable paywall',
        'MONETIZATION_ENABLE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update paywall configuration
   * Requirements: 2.1 - Update paywall configuration
   * 
   * @param galleryId - The gallery ID
   * @param config - Updated configuration
   * @returns The updated configuration
   */
  async updatePaywall(
    galleryId: string,
    config: Partial<MonetizationConfig>
  ): Promise<MonetizationConfig> {
    try {
      // Validate inputs
      if (config.priceCents !== undefined) {
        this.validateConfig(config);
      }

      // Get existing configuration
      const existing = await this.getConfig(galleryId);
      if (!existing) {
        throw new NotFoundError('Gallery monetization configuration');
      }

      // Check if price changed and needs new Stripe Price
      let stripePriceId = existing.stripePriceId;
      if (
        config.priceCents !== undefined &&
        config.priceCents !== existing.priceCents
      ) {
        const priceConfig: MonetizationConfig = {
          ...existing,
          priceCents: config.priceCents,
          currency: config.currency || existing.currency,
        };
        stripePriceId = await this.createStripePrice(priceConfig);
      }

      // Update database record
      const updateData: any = {};
      if (config.isEnabled !== undefined) updateData.is_enabled = config.isEnabled;
      if (config.priceCents !== undefined) {
        updateData.price_cents = config.priceCents;
        updateData.stripe_price_id = stripePriceId;
      }
      if (config.currency !== undefined) updateData.currency = config.currency;
      if (config.previewMode !== undefined) updateData.preview_mode = config.previewMode;
      if (config.watermarkEnabled !== undefined) updateData.watermark_enabled = config.watermarkEnabled;
      if (config.accessDurationDays !== undefined) updateData.access_duration_days = config.accessDurationDays;
      if (config.platformFeePercent !== undefined) updateData.platform_fee_percent = config.platformFeePercent;

      const { data: updated, error: updateError } = await this.supabase
        .from('gallery_monetization')
        .update(updateData)
        .eq('gallery_id', galleryId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('[GalleryMonetizationService] Failed to update monetization:', updateError);
        throw new AppError('Failed to update paywall', 'MONETIZATION_UPDATE_ERROR', 500);
      }

      console.log('[GalleryMonetizationService] Updated paywall:', {
        galleryId,
        changes: Object.keys(updateData),
      });

      // Invalidate cache for this gallery
      await CacheInvalidation.monetizationConfig(this.cacheService, galleryId);

      return this.mapToConfig(updated);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryMonetizationService] Error updating paywall:', error);
      throw new AppError('Failed to update paywall', 'MONETIZATION_UPDATE_ERROR', 500);
    }
  }

  /**
   * Disable paywall for a gallery
   * Requirements: 2.1 - Disable paywall
   * 
   * @param galleryId - The gallery ID
   */
  async disablePaywall(galleryId: string): Promise<void> {
    try {
      // Check if configuration exists
      const existing = await this.getConfig(galleryId);
      if (!existing) {
        throw new NotFoundError('Gallery monetization configuration');
      }

      // Set is_enabled to false (keep config for potential re-enable)
      const { error: updateError } = await this.supabase
        .from('gallery_monetization')
        .update({ is_enabled: false })
        .eq('gallery_id', galleryId);

      if (updateError) {
        console.error('[GalleryMonetizationService] Failed to disable paywall:', updateError);
        throw new AppError('Failed to disable paywall', 'MONETIZATION_DISABLE_ERROR', 500);
      }

      // Invalidate cache for this gallery
      await CacheInvalidation.monetizationConfig(this.cacheService, galleryId);

      console.log('[GalleryMonetizationService] Disabled paywall:', { galleryId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryMonetizationService] Error disabling paywall:', error);
      throw new AppError('Failed to disable paywall', 'MONETIZATION_DISABLE_ERROR', 500);
    }
  }

  /**
   * Get monetization configuration for a gallery
   * Requirements: 2.1 - Retrieve configuration
   * Requirements: 11.1 - Cache monetization config (5 minutes)
   * 
   * @param galleryId - The gallery ID
   * @returns The configuration or null if not found
   */
  async getConfig(galleryId: string): Promise<MonetizationConfig | null> {
    try {
      // Check cache first
      const cacheKey = `${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`;
      const cached = await this.cacheService.get<MonetizationConfig>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabase
        .from('gallery_monetization')
        .select('*')
        .eq('gallery_id', galleryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('[GalleryMonetizationService] Error getting config:', error);
        throw new AppError('Failed to get monetization config', 'MONETIZATION_GET_ERROR', 500);
      }

      const config = this.mapToConfig(data);
      
      // Cache the result
      await this.cacheService.set(cacheKey, config, CACHE_TTL.MONETIZATION_CONFIG);

      return config;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryMonetizationService] Error getting config:', error);
      throw new AppError('Failed to get monetization config', 'MONETIZATION_GET_ERROR', 500);
    }
  }

  /**
   * Create Stripe Price object
   * Requirements: 2.1 - Create Stripe Price
   * 
   * @param config - Monetization configuration
   * @returns The Stripe Price ID
   */
  async createStripePrice(config: MonetizationConfig): Promise<string> {
    try {
      // Get gallery info for product name
      const { data: gallery } = await this.supabase
        .from('galleries')
        .select('title, user_id')
        .eq('id', config.galleryId)
        .single();

      if (!gallery?.user_id) {
        throw new AppError('Gallery not found or has no owner', 'GALLERY_NOT_FOUND', 404);
      }

      // Get photographer's Stripe Connect account
      const { data: connectAccount } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id')
        .eq('user_id', gallery.user_id)
        .single();

      if (!connectAccount) {
        throw new AppError('Stripe Connect account not found', 'CONNECT_ACCOUNT_NOT_FOUND', 404);
      }

      // Create Stripe Price
      const price = await this.stripe.prices.create(
        {
          currency: config.currency.toLowerCase(),
          unit_amount: config.priceCents,
          product_data: {
            name: `Gallery Access: ${gallery?.title || 'Untitled'}`,
            metadata: {
              gallery_id: config.galleryId,
              platform: 'piksend',
              type: 'gallery_unlock',
            },
          },
          metadata: {
            gallery_id: config.galleryId,
            platform: 'piksend',
            type: 'gallery_unlock',
          },
        },
        {
          stripeAccount: connectAccount.stripe_account_id,
        }
      );

      console.log('[GalleryMonetizationService] Created Stripe Price:', {
        priceId: price.id,
        galleryId: config.galleryId,
        amount: config.priceCents,
      });

      return price.id;
    } catch (error) {
      console.error('[GalleryMonetizationService] Error creating Stripe Price:', error);
      throw new AppError(
        'Failed to create Stripe Price',
        'STRIPE_PRICE_CREATE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update sales statistics for a gallery
   * Requirements: 2.1 - Update sales stats
   * 
   * @param galleryId - The gallery ID
   * @param salePriceCents - The sale price in cents
   */
  async updateSalesStats(galleryId: string, salePriceCents: number): Promise<void> {
    try {
      // Get current stats
      const { data: current, error: getError } = await this.supabase
        .from('gallery_monetization')
        .select('total_sales, total_revenue_cents')
        .eq('gallery_id', galleryId)
        .single();

      if (getError || !current) {
        console.error('[GalleryMonetizationService] Failed to get current stats:', getError);
        throw new AppError('Failed to get current stats', 'STATS_GET_ERROR', 500);
      }

      // Calculate new stats
      const newTotalSales = (current.total_sales ?? 0) + 1;
      const newTotalRevenue = (current.total_revenue_cents ?? 0) + salePriceCents;

      // Calculate conversion rate
      const conversionRate = await this.getConversionRate(galleryId);

      // Update stats
      const { error: updateError } = await this.supabase
        .from('gallery_monetization')
        .update({
          total_sales: newTotalSales,
          total_revenue_cents: newTotalRevenue,
          conversion_rate: conversionRate,
        })
        .eq('gallery_id', galleryId);

      if (updateError) {
        console.error('[GalleryMonetizationService] Failed to update stats:', updateError);
        throw new AppError('Failed to update sales stats', 'STATS_UPDATE_ERROR', 500);
      }

      console.log('[GalleryMonetizationService] Updated sales stats:', {
        galleryId,
        totalSales: newTotalSales,
        totalRevenue: newTotalRevenue,
        conversionRate,
      });

      // Invalidate cache for this gallery
      await CacheInvalidation.monetizationConfig(this.cacheService, galleryId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GalleryMonetizationService] Error updating sales stats:', error);
      throw new AppError('Failed to update sales stats', 'STATS_UPDATE_ERROR', 500);
    }
  }

  /**
   * Calculate conversion rate for a gallery
   * Requirements: 2.1 - Calculate conversion rate
   * 
   * @param galleryId - The gallery ID
   * @returns The conversion rate as a percentage
   */
  async getConversionRate(galleryId: string): Promise<number> {
    try {
      // Get total views from analytics (if available)
      // For now, we'll use a simple calculation based on purchases
      // In a real implementation, this would query the analytics service
      
      const { data: stats } = await this.supabase
        .from('gallery_monetization')
        .select('total_sales')
        .eq('gallery_id', galleryId)
        .single();

      // Get gallery views (placeholder - would come from analytics)
      // For now, return 0 if no views data available
      const totalViews = 0; // TODO: Integrate with analytics service

      if (totalViews === 0) {
        return 0.0;
      }

      const conversionRate = (stats?.total_sales || 0) / totalViews * 100;
      return Math.round(conversionRate * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('[GalleryMonetizationService] Error calculating conversion rate:', error);
      // Return 0 on error rather than throwing
      return 0.0;
    }
  }

  /**
   * Validate monetization configuration
   * 
   * @param config - Configuration to validate
   */
  private validateConfig(config: Partial<MonetizationConfig>): void {
    // Validate price range ($5 - $500)
    if (config.priceCents !== undefined) {
      if (config.priceCents < 500 || config.priceCents > 50000) {
        throw new ValidationError('Price must be between $5.00 and $500.00', {
          priceCents: config.priceCents,
          min: 500,
          max: 50000,
        });
      }
    }

    // Validate currency
    if (config.currency !== undefined) {
      const validCurrencies = ['usd', 'eur', 'cad'];
      if (!validCurrencies.includes(config.currency.toLowerCase())) {
        throw new ValidationError('Invalid currency', {
          currency: config.currency,
          validCurrencies,
        });
      }
    }

    // Validate preview mode
    if (config.previewMode !== undefined) {
      const validModes = ['full_paywall', 'freemium'];
      if (!validModes.includes(config.previewMode)) {
        throw new ValidationError('Invalid preview mode', {
          previewMode: config.previewMode,
          validModes,
        });
      }
    }

    // Validate platform fee
    if (config.platformFeePercent !== undefined) {
      if (config.platformFeePercent < 0 || config.platformFeePercent > 100) {
        throw new ValidationError('Platform fee must be between 0% and 100%', {
          platformFeePercent: config.platformFeePercent,
        });
      }
    }

    // Validate access duration
    if (config.accessDurationDays !== undefined && config.accessDurationDays !== null) {
      if (config.accessDurationDays < 1) {
        throw new ValidationError('Access duration must be at least 1 day', {
          accessDurationDays: config.accessDurationDays,
        });
      }
    }
  }

  /**
   * Map database record to MonetizationConfig
   */
  private mapToConfig(data: any): MonetizationConfig {
    return {
      galleryId: data.gallery_id,
      isEnabled: data.is_enabled,
      priceCents: data.price_cents,
      currency: data.currency,
      previewMode: data.preview_mode,
      watermarkEnabled: data.watermark_enabled,
      accessDurationDays: data.access_duration_days,
      stripePriceId: data.stripe_price_id,
      platformFeePercent: data.platform_fee_percent,
    };
  }
}

/**
 * Factory function to create a GalleryMonetizationService instance
 */
export function createGalleryMonetizationService(
  supabase: SupabaseClient<Database>
): GalleryMonetizationService {
  return new GalleryMonetizationService(supabase);
}
