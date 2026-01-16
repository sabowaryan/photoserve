/**
 * Integration Tests for Stripe Connect API Routes
 * Tests all 5 Connect routes with authentication, authorization, and validation
 * 
 * @module app/api/stripe/connect/__tests__/routes.integration.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as onboardPOST } from '../onboard/route';
import { POST as refreshLinkPOST } from '../refresh-link/route';
import { GET as statusGET } from '../status/route';
import { POST as disconnectPOST } from '../disconnect/route';
import { POST as dashboardLinkPOST } from '../dashboard-link/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/services/stripe-connect.service', () => ({
  createStripeConnectService: vi.fn(),
}));

import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';

describe('Stripe Connect API Routes - Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockAccountId = 'acct_123';
  const mockOnboardingUrl = 'https://connect.stripe.com/setup/123';
  const mockDashboardUrl = 'https://dashboard.stripe.com/123';

  let mockSupabase: any;
  let mockStripeConnectService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    // Mock Stripe Connect service
    mockStripeConnectService = {
      createConnectAccount: vi.fn(),
      refreshOnboardingLink: vi.fn(),
      getAccountStatus: vi.fn(),
      disconnectAccount: vi.fn(),
      createDashboardLink: vi.fn(),
    };

    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      hasRLS: true,
      userId: mockUserId,
    });

    vi.mocked(createStripeConnectService).mockReturnValue(mockStripeConnectService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/stripe/connect/onboard', () => {
    it('should create Connect account and return onboarding URL for Pro user', async () => {
      // Mock Pro user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_plan: 'pro',
          email: 'test@example.com',
          name: 'Test User',
        },
        error: null,
      });

      // Mock service response
      mockStripeConnectService.createConnectAccount.mockResolvedValue({
        accountId: mockAccountId,
        onboardingLink: mockOnboardingUrl,
      });

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accountId).toBe(mockAccountId);
      expect(data.onboardingUrl).toBe(mockOnboardingUrl);
      expect(mockStripeConnectService.createConnectAccount).toHaveBeenCalledWith(mockUserId);
    });

    it('should reject non-Pro users with 403', async () => {
      // Mock Premium user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_plan: 'premium',
          email: 'test@example.com',
        },
        error: null,
      });

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
      expect(mockStripeConnectService.createConnectAccount).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('POST /api/stripe/connect/refresh-link', () => {
    it('should refresh onboarding link for existing account', async () => {
      // Mock Pro user profile
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.refreshOnboardingLink.mockResolvedValue(mockOnboardingUrl);

      const response = await refreshLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accountId).toBe(mockAccountId);
      expect(data.onboardingUrl).toBe(mockOnboardingUrl);
      expect(mockStripeConnectService.refreshOnboardingLink).toHaveBeenCalledWith(mockAccountId);
    });

    it('should return 404 if Connect account does not exist', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await refreshLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject non-Pro users', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'free' },
        error: null,
      });

      const response = await refreshLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });
  });

  describe('GET /api/stripe/connect/status', () => {
    it('should return account status for connected Pro user', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.getAccountStatus.mockResolvedValue({
        accountId: mockAccountId,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        disabledReason: null,
        onboardingCompleted: true,
      });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
      expect(data.accountId).toBe(mockAccountId);
      expect(data.chargesEnabled).toBe(true);
      expect(data.payoutsEnabled).toBe(true);
      expect(data.detailsSubmitted).toBe(true);
      expect(data.onboardingCompleted).toBe(true);
    });

    it('should return not_connected status if no account exists', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(false);
      expect(data.status).toBe('not_connected');
    });

    it('should reject non-Pro users', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'premium' },
        error: null,
      });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/stripe/connect/disconnect', () => {
    it('should disconnect Connect account for Pro user', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.disconnectAccount.mockResolvedValue(undefined);

      const response = await disconnectPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockStripeConnectService.disconnectAccount).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 404 if no account exists', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await disconnectPOST();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject non-Pro users', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'free' },
        error: null,
      });

      const response = await disconnectPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/stripe/connect/dashboard-link', () => {
    it('should create dashboard link for Pro user with connected account', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.createDashboardLink.mockResolvedValue(mockDashboardUrl);

      const response = await dashboardLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe(mockDashboardUrl);
      expect(data.accountId).toBe(mockAccountId);
      expect(mockStripeConnectService.createDashboardLink).toHaveBeenCalledWith(mockAccountId);
    });

    it('should return 404 if no account exists', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await dashboardLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject non-Pro users', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'premium' },
        error: null,
      });

      const response = await dashboardLinkPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle Stripe service errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'pro', email: 'test@example.com' },
        error: null,
      });

      mockStripeConnectService.createConnectAccount.mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Account Status Variations', () => {
    it('should return pending status when verification is incomplete', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.getAccountStatus.mockResolvedValue({
        accountId: mockAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        currentlyDue: ['individual.verification.document'],
        eventuallyDue: ['individual.verification.additional_document'],
        pastDue: [],
        disabledReason: null,
        onboardingCompleted: false,
      });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
      expect(data.chargesEnabled).toBe(false);
      expect(data.payoutsEnabled).toBe(false);
      expect(data.detailsSubmitted).toBe(false);
      expect(data.onboardingCompleted).toBe(false);
      expect(data.currentlyDue).toContain('individual.verification.document');
    });

    it('should return action required status when account has past due requirements', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.getAccountStatus.mockResolvedValue({
        accountId: mockAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: ['individual.verification.document'],
        disabledReason: 'requirements.past_due',
        onboardingCompleted: false,
      });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
      expect(data.chargesEnabled).toBe(false);
      expect(data.disabledReason).toBe('requirements.past_due');
      expect(data.pastDue).toContain('individual.verification.document');
    });

    it('should return restricted status when account is disabled', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.getAccountStatus.mockResolvedValue({
        accountId: mockAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        disabledReason: 'rejected.fraud',
        onboardingCompleted: false,
      });

      const response = await statusGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
      expect(data.chargesEnabled).toBe(false);
      expect(data.payoutsEnabled).toBe(false);
      expect(data.disabledReason).toBe('rejected.fraud');
    });
  });

  describe('Plan Verification Edge Cases', () => {
    it('should reject free plan users for onboard', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'free', email: 'test@example.com' },
        error: null,
      });

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });

    it('should reject null subscription plan', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: null, email: 'test@example.com' },
        error: null,
      });

      const response = await onboardPOST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Service Method Calls', () => {
    it('should call createConnectAccount with correct userId', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan: 'pro', email: 'test@example.com', name: 'Test' },
        error: null,
      });

      mockStripeConnectService.createConnectAccount.mockResolvedValue({
        accountId: mockAccountId,
        onboardingLink: mockOnboardingUrl,
      });

      await onboardPOST();

      expect(mockStripeConnectService.createConnectAccount).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectService.createConnectAccount).toHaveBeenCalledWith(mockUserId);
    });

    it('should call getAccountStatus with correct accountId', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.getAccountStatus.mockResolvedValue({
        accountId: mockAccountId,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        disabledReason: null,
        onboardingCompleted: true,
      });

      await statusGET();

      expect(mockStripeConnectService.getAccountStatus).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectService.getAccountStatus).toHaveBeenCalledWith(mockAccountId);
    });

    it('should call disconnectAccount with correct userId', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.disconnectAccount.mockResolvedValue(undefined);

      await disconnectPOST();

      expect(mockStripeConnectService.disconnectAccount).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectService.disconnectAccount).toHaveBeenCalledWith(mockUserId);
    });

    it('should call createDashboardLink with correct accountId', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { stripe_account_id: mockAccountId },
          error: null,
        });

      mockStripeConnectService.createDashboardLink.mockResolvedValue(mockDashboardUrl);

      await dashboardLinkPOST();

      expect(mockStripeConnectService.createDashboardLink).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectService.createDashboardLink).toHaveBeenCalledWith(mockAccountId);
    });
  });

});
