/**
 * Unit Tests for Stripe Connect Service
 * 
 * Tests the Stripe Connect service functionality for photographer onboarding
 * and account management.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StripeConnectService } from '../stripe-connect.service';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

// Mock Stripe instance
const mockStripe = {
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn(),
    createLoginLink: vi.fn(),
    del: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
} as unknown as Stripe;

// Mock Supabase client
const createMockSupabase = () => {
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
  mockInsert.mockReturnValue({ eq: mockEq });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });
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
  } as unknown as SupabaseClient<Database>;
};

describe('StripeConnectService', () => {
  let service: StripeConnectService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new StripeConnectService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConnectAccount', () => {
    const userId = 'user-123';
    const mockProfile = {
      email: 'photographer@example.com',
      name: 'John Doe',
    };

    const mockAccount = {
      id: 'acct_123',
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      requirements: {
        currently_due: ['business_profile.url'],
        eventually_due: ['external_account'],
        past_due: [],
        disabled_reason: null,
      },
    };

    const mockAccountLink = {
      url: 'https://connect.stripe.com/setup/s/abc123',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should create a new Connect account successfully', async () => {
      // Mock: No existing account
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Get user profile
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      // Mock: Insert account
      mockSupabaseInstance._mocks.insert.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock Stripe calls
      vi.mocked(mockStripe.accounts.create).mockResolvedValue(mockAccount as any);
      vi.mocked(mockStripe.accountLinks.create).mockResolvedValue(mockAccountLink as any);

      const result = await service.createConnectAccount(userId);

      expect(result).toEqual({
        accountId: mockAccount.id,
        onboardingLink: mockAccountLink.url,
      });

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email: mockProfile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: userId,
          platform: 'piksend',
        },
      });

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: mockAccount.id,
        refresh_url: expect.stringContaining('/settings?connect=refresh'),
        return_url: expect.stringContaining('/settings?connect=success'),
        type: 'account_onboarding',
      });
    });

    it('should throw ValidationError if account already exists', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: 'acct_existing' },
        error: null,
      });

      await expect(service.createConnectAccount(userId)).rejects.toThrow(ValidationError);
      expect(mockStripe.accounts.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user profile not found', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      // No existing account
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      // Profile not found
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.createConnectAccount(userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOnboardingLink', () => {
    const accountId = 'acct_123';

    it('should return existing valid link', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: {
          onboarding_link: 'https://connect.stripe.com/setup/s/valid',
          onboarding_expires_at: futureDate,
        },
        error: null,
      });

      const result = await service.getOnboardingLink(accountId);

      expect(result).toBe('https://connect.stripe.com/setup/s/valid');
    });

    it('should refresh link if expired', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const mockSupabaseInstance = mockSupabase as any;
      
      // First call: get expired link
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: {
          onboarding_link: 'https://connect.stripe.com/setup/s/expired',
          onboarding_expires_at: pastDate,
        },
        error: null,
      });

      // Second call: verify account exists for refresh
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: accountId },
        error: null,
      });

      const newLink = 'https://connect.stripe.com/setup/s/new';
      vi.mocked(mockStripe.accountLinks.create).mockResolvedValue({
        url: newLink,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      } as any);

      const result = await service.getOnboardingLink(accountId);

      expect(result).toBe(newLink);
      expect(mockStripe.accountLinks.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if account not found', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.getOnboardingLink(accountId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('refreshOnboardingLink', () => {
    const accountId = 'acct_123';

    it('should create and return new onboarding link', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: accountId },
        error: null,
      });

      const newLink = 'https://connect.stripe.com/setup/s/refreshed';
      vi.mocked(mockStripe.accountLinks.create).mockResolvedValue({
        url: newLink,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      } as any);

      const result = await service.refreshOnboardingLink(accountId);

      expect(result).toBe(newLink);
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: expect.stringContaining('/settings?connect=refresh'),
        return_url: expect.stringContaining('/settings?connect=success'),
        type: 'account_onboarding',
      });
    });
  });

  describe('getAccountStatus', () => {
    const accountId = 'acct_123';

    it('should return account status from Stripe', async () => {
      const mockAccount = {
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          disabled_reason: null,
        },
      };

      vi.mocked(mockStripe.accounts.retrieve).mockResolvedValue(mockAccount as any);

      const result = await service.getAccountStatus(accountId);

      expect(result).toEqual({
        accountId,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        disabledReason: null,
        onboardingCompleted: true,
      });
    });

    it('should handle account with pending requirements', async () => {
      const mockAccount = {
        id: accountId,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: {
          currently_due: ['business_profile.url', 'external_account'],
          eventually_due: ['tos_acceptance.date'],
          past_due: [],
          disabled_reason: null,
        },
      };

      vi.mocked(mockStripe.accounts.retrieve).mockResolvedValue(mockAccount as any);

      const result = await service.getAccountStatus(accountId);

      expect(result.onboardingCompleted).toBe(false);
      expect(result.currentlyDue).toHaveLength(2);
    });
  });

  describe('updateAccountStatus', () => {
    const accountId = 'acct_123';

    it('should update account status in database', async () => {
      const mockAccount = {
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          disabled_reason: null,
        },
      };

      vi.mocked(mockStripe.accounts.retrieve).mockResolvedValue(mockAccount as any);

      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.update.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      await service.updateAccountStatus(accountId);

      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith(accountId);
    });
  });

  describe('createDashboardLink', () => {
    const accountId = 'acct_123';

    it('should create and return dashboard link', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: accountId },
        error: null,
      });

      const dashboardUrl = 'https://connect.stripe.com/express/acct_123';
      vi.mocked(mockStripe.accounts.createLoginLink).mockResolvedValue({
        url: dashboardUrl,
      } as any);

      const result = await service.createDashboardLink(accountId);

      expect(result).toBe(dashboardUrl);
      expect(mockStripe.accounts.createLoginLink).toHaveBeenCalledWith(accountId);
    });

    it('should throw NotFoundError if account not found', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.createDashboardLink(accountId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('disconnectAccount', () => {
    const userId = 'user-123';
    const accountId = 'acct_123';

    it('should disconnect account successfully', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      
      // Mock: Get account
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: accountId },
        error: null,
      });

      // Mock: Delete from database
      mockSupabaseInstance._mocks.delete.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      vi.mocked(mockStripe.accounts.del).mockResolvedValue({ id: accountId, deleted: true } as any);

      await service.disconnectAccount(userId);

      expect(mockStripe.accounts.del).toHaveBeenCalledWith(accountId);
    });

    it('should throw NotFoundError if account not found', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.disconnectAccount(userId)).rejects.toThrow(NotFoundError);
    });

    it('should continue if Stripe deletion fails but delete from database', async () => {
      const mockSupabaseInstance = mockSupabase as any;
      
      mockSupabaseInstance._mocks.single.mockResolvedValueOnce({
        data: { stripe_account_id: accountId },
        error: null,
      });

      mockSupabaseInstance._mocks.delete.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      vi.mocked(mockStripe.accounts.del).mockRejectedValue(new Error('Stripe error'));

      // Should not throw - logs warning and continues
      await expect(service.disconnectAccount(userId)).resolves.not.toThrow();
    });
  });
});
