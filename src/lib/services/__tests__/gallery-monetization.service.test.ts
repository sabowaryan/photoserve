/**
 * Gallery Monetization Service Tests
 * Tests for gallery paywall configuration and monetization operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GalleryMonetizationService } from '../gallery-monetization.service';
import { ValidationError, NotFoundError, AppError } from '@/lib/errors';
import type Stripe from 'stripe';
import type { ICacheService } from '../cache.service';

// Mock Stripe
const mockStripe = {
  prices: {
    create: vi.fn(),
  },
  accounts: {
    retrieve: vi.fn(),
  },
} as unknown as Stripe;

// Mock Stripe client
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

// Mock cache service
const createMockCacheService = (): ICacheService => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  deletePattern: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(false),
  getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0, isRedisConnected: false }),
  isRedisAvailable: vi.fn().mockReturnValue(false),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

// Mock Supabase client
interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  _mocks: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
}

const createMockSupabase = (): MockSupabase => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  // Chain methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, select: mockSelect });
  mockSingle.mockResolvedValue({ data: null, error: null });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  };
};

describe('GalleryMonetizationService', () => {
  let service: GalleryMonetizationService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockCacheService: ICacheService;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockCacheService = createMockCacheService();
    service = new GalleryMonetizationService(mockSupabase as any, mockCacheService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enablePaywall', () => {
    const validConfig = {
      priceCents: 2999,
      currency: 'usd',
      previewMode: 'full_paywall' as const,
      watermarkEnabled: true,
    };

    const mockGallery = {
      id: 'gallery-123',
      user_id: 'user-123',
      title: 'Test Gallery',
    };

    const mockConnectAccount = {
      stripe_account_id: 'acct_123',
      charges_enabled: true,
    };

    it('should enable paywall successfully', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock existing monetization check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock connect account lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockConnectAccount,
        error: null,
      });

      // Mock gallery lookup for Stripe Price creation
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock connect account lookup for Stripe Price creation
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockConnectAccount,
        error: null,
      });

      // Mock Stripe price creation
      mockStripe.prices.create = vi.fn().mockResolvedValue({
        id: 'price_123',
      });

      // Mock monetization insert
      const mockMonetization = {
        gallery_id: 'gallery-123',
        is_enabled: true,
        price_cents: 2999,
        currency: 'usd',
        preview_mode: 'full_paywall',
        watermark_enabled: true,
        access_duration_days: null,
        stripe_price_id: 'price_123',
        platform_fee_percent: 10.0,
        total_sales: 0,
        total_revenue_cents: 0,
        conversion_rate: 0.0,
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockMonetization,
        error: null,
      });

      const result = await service.enablePaywall('gallery-123', validConfig);

      expect(result).toEqual({
        galleryId: 'gallery-123',
        isEnabled: true,
        priceCents: 2999,
        currency: 'usd',
        previewMode: 'full_paywall',
        watermarkEnabled: true,
        accessDurationDays: null,
        stripePriceId: 'price_123',
        platformFeePercent: 10.0,
      });

      expect(mockStripe.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
          unit_amount: 2999,
        }),
        expect.objectContaining({
          stripeAccount: 'acct_123',
        })
      );
    });

    it('should throw ValidationError for price too low', async () => {
      await expect(
        service.enablePaywall('gallery-123', { ...validConfig, priceCents: 100 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for price too high', async () => {
      await expect(
        service.enablePaywall('gallery-123', { ...validConfig, priceCents: 60000 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid currency', async () => {
      await expect(
        service.enablePaywall('gallery-123', { ...validConfig, currency: 'invalid' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if gallery not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.enablePaywall('gallery-123', validConfig)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if monetization already exists', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock existing monetization (found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { id: 'existing-123' },
        error: null,
      });

      await expect(
        service.enablePaywall('gallery-123', validConfig)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if no Stripe Connect account', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock existing monetization check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock connect account lookup (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.enablePaywall('gallery-123', validConfig)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if charges not enabled', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockGallery,
        error: null,
      });

      // Mock existing monetization check (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock connect account lookup (charges not enabled)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { ...mockConnectAccount, charges_enabled: false },
        error: null,
      });

      await expect(
        service.enablePaywall('gallery-123', validConfig)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePaywall', () => {
    const mockExistingConfig = {
      gallery_id: 'gallery-123',
      is_enabled: true,
      price_cents: 2999,
      currency: 'usd',
      preview_mode: 'full_paywall',
      watermark_enabled: true,
      access_duration_days: null,
      stripe_price_id: 'price_123',
      platform_fee_percent: 10.0,
    };

    it('should update paywall configuration', async () => {
      // Mock get existing config
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockExistingConfig,
        error: null,
      });

      // Mock update
      const updatedConfig = {
        ...mockExistingConfig,
        preview_mode: 'freemium',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: updatedConfig,
        error: null,
      });

      const result = await service.updatePaywall('gallery-123', {
        previewMode: 'freemium',
      });

      expect(result.previewMode).toBe('freemium');
    });

    it('should create new Stripe Price when price changes', async () => {
      // Mock get existing config
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockExistingConfig,
        error: null,
      });

      // Mock gallery lookup for Stripe Price creation
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { title: 'Test Gallery', user_id: 'user-123' },
        error: null,
      });

      // Mock connect account lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: 'acct_123' },
        error: null,
      });

      // Mock Stripe price creation
      mockStripe.prices.create = vi.fn().mockResolvedValue({
        id: 'price_new',
      });

      // Mock update
      const updatedConfig = {
        ...mockExistingConfig,
        price_cents: 3999,
        stripe_price_id: 'price_new',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: updatedConfig,
        error: null,
      });

      const result = await service.updatePaywall('gallery-123', {
        priceCents: 3999,
      });

      expect(result.priceCents).toBe(3999);
      expect(result.stripePriceId).toBe('price_new');
      expect(mockStripe.prices.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if config not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.updatePaywall('gallery-123', { previewMode: 'freemium' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid price', async () => {
      // Mock get existing config
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockExistingConfig,
        error: null,
      });

      await expect(
        service.updatePaywall('gallery-123', { priceCents: 100 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('disablePaywall', () => {
    it('should disable paywall successfully', async () => {
      // Mock get config
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          gallery_id: 'gallery-123',
          is_enabled: true,
        },
        error: null,
      });

      // Mock update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.disablePaywall('gallery-123')).resolves.not.toThrow();
    });

    it('should throw NotFoundError if config not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.disablePaywall('gallery-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getConfig', () => {
    it('should return config if found', async () => {
      const mockConfig = {
        gallery_id: 'gallery-123',
        is_enabled: true,
        price_cents: 2999,
        currency: 'usd',
        preview_mode: 'full_paywall',
        watermark_enabled: true,
        access_duration_days: null,
        stripe_price_id: 'price_123',
        platform_fee_percent: 10.0,
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockConfig,
        error: null,
      });

      const result = await service.getConfig('gallery-123');

      expect(result).toEqual({
        galleryId: 'gallery-123',
        isEnabled: true,
        priceCents: 2999,
        currency: 'usd',
        previewMode: 'full_paywall',
        watermarkEnabled: true,
        accessDurationDays: null,
        stripePriceId: 'price_123',
        platformFeePercent: 10.0,
      });
    });

    it('should return null if not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getConfig('gallery-123');
      expect(result).toBeNull();
    });
  });

  describe('createStripePrice', () => {
    it('should create Stripe Price successfully', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { title: 'Test Gallery', user_id: 'user-123' },
        error: null,
      });

      // Mock connect account lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: 'acct_123' },
        error: null,
      });

      // Mock Stripe price creation
      mockStripe.prices.create = vi.fn().mockResolvedValue({
        id: 'price_123',
      });

      const config = {
        galleryId: 'gallery-123',
        isEnabled: true,
        priceCents: 2999,
        currency: 'usd',
        previewMode: 'full_paywall' as const,
        watermarkEnabled: true,
      };

      const priceId = await service.createStripePrice(config);

      expect(priceId).toBe('price_123');
      expect(mockStripe.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
          unit_amount: 2999,
          product_data: expect.objectContaining({
            name: 'Gallery Access: Test Gallery',
          }),
        }),
        expect.objectContaining({
          stripeAccount: 'acct_123',
        })
      );
    });

    it('should throw AppError if no connect account', async () => {
      // Mock gallery lookup
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { title: 'Test Gallery', user_id: 'user-123' },
        error: null,
      });

      // Mock connect account lookup (not found)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const config = {
        galleryId: 'gallery-123',
        isEnabled: true,
        priceCents: 2999,
        currency: 'usd',
        previewMode: 'full_paywall' as const,
        watermarkEnabled: true,
      };

      await expect(service.createStripePrice(config)).rejects.toThrow(AppError);
    });
  });

  describe('updateSalesStats', () => {
    it('should update sales statistics', async () => {
      // Mock get current stats
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          total_sales: 5,
          total_revenue_cents: 14995,
        },
        error: null,
      });

      // Mock get conversion rate (returns 0 for now)
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { total_sales: 6 },
        error: null,
      });

      // Mock update
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        service.updateSalesStats('gallery-123', 2999)
      ).resolves.not.toThrow();
    });

    it('should throw AppError if stats not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.updateSalesStats('gallery-123', 2999)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getConversionRate', () => {
    it('should return 0 when no views', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { total_sales: 10 },
        error: null,
      });

      const rate = await service.getConversionRate('gallery-123');
      expect(rate).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const rate = await service.getConversionRate('gallery-123');
      expect(rate).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate preview mode', async () => {
      await expect(
        service.enablePaywall('gallery-123', {
          priceCents: 2999,
          previewMode: 'invalid' as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate platform fee range', async () => {
      await expect(
        service.enablePaywall('gallery-123', {
          priceCents: 2999,
          platformFeePercent: 150,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate access duration', async () => {
      await expect(
        service.enablePaywall('gallery-123', {
          priceCents: 2999,
          accessDurationDays: 0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should accept valid currencies', async () => {
      const validCurrencies = ['usd', 'eur', 'cad'];
      
      for (const currency of validCurrencies) {
        // This should not throw
        const config = {
          priceCents: 2999,
          currency,
        };
        
        // Just validate, don't execute full flow
        expect(() => {
          (service as any).validateConfig(config);
        }).not.toThrow();
      }
    });
  });
});
