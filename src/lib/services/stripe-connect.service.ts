/**
 * Stripe Connect Service
 * Handles Stripe Connect operations for photographers to receive direct payments
 * 
 * @module lib/services/stripe-connect.service
 * Requirements: 1.1, 1.2 - Stripe Connect onboarding and account management
 */
import { getStripe } from '@/lib/stripe/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import Stripe from 'stripe';

/**
 * Stripe Connect Account Status
 */
export interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  onboardingCompleted: boolean;
}

/**
 * Stripe Connect Service Interface
 */
export interface IStripeConnectService {
  createConnectAccount(userId: string): Promise<{ accountId: string; onboardingLink: string }>;
  getOnboardingLink(accountId: string): Promise<string>;
  refreshOnboardingLink(accountId: string): Promise<string>;
  getAccountStatus(accountId: string): Promise<ConnectAccountStatus>;
  updateAccountStatus(accountId: string): Promise<void>;
  createDashboardLink(accountId: string): Promise<string>;
  disconnectAccount(userId: string): Promise<void>;
}

/**
 * Stripe Connect Service Implementation
 */
export class StripeConnectService implements IStripeConnectService {
  private stripe: Stripe;

  constructor(private supabase: SupabaseClient<Database>) {
    this.stripe = getStripe();
  }

  /**
   * Create a Stripe Connect account for a photographer
   * Requirements: 1.1 - Create Stripe Connect account
   * 
   * @param userId - The photographer's user ID
   * @returns The account ID and onboarding link
   */
  async createConnectAccount(userId: string): Promise<{ accountId: string; onboardingLink: string }> {
    try {
      // Check if user already has a Connect account
      const { data: existingAccount } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id')
        .eq('user_id', userId)
        .single();

      if (existingAccount) {
        throw new ValidationError('User already has a Connect account', {
          accountId: existingAccount.stripe_account_id,
        });
      }

      // Get user profile for email
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new NotFoundError('User profile');
      }

      // Create Stripe Connect account (Express type)
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: profile.email,
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

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=success`,
        type: 'account_onboarding',
      });

      // Store account in database
      const { error: insertError } = await this.supabase
        .from('stripe_connect_accounts')
        .insert({
          user_id: userId,
          stripe_account_id: account.id,
          account_type: 'express',
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
          disabled_reason: account.requirements?.disabled_reason || null,
          onboarding_completed: false,
          onboarding_link: accountLink.url,
          onboarding_expires_at: new Date(accountLink.expires_at * 1000).toISOString(),
        });

      if (insertError) {
        console.error('[StripeConnectService] Failed to store account:', insertError);
        throw new AppError('Failed to store Connect account', 'CONNECT_STORE_ERROR', 500);
      }

      console.log('[StripeConnectService] Created Connect account:', {
        userId,
        accountId: account.id,
      });

      return {
        accountId: account.id,
        onboardingLink: accountLink.url,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error creating Connect account:', error);
      throw new AppError(
        'Failed to create Connect account',
        'CONNECT_CREATE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get onboarding link for an existing account
   * Requirements: 1.1 - Generate onboarding link
   * 
   * @param accountId - The Stripe Connect account ID
   * @returns The onboarding link URL
   */
  async getOnboardingLink(accountId: string): Promise<string> {
    try {
      // Get account from database
      const { data: account, error } = await this.supabase
        .from('stripe_connect_accounts')
        .select('onboarding_link, onboarding_expires_at')
        .eq('stripe_account_id', accountId)
        .single();

      if (error || !account) {
        throw new NotFoundError('Connect account');
      }

      // Check if existing link is still valid
      if (account.onboarding_link && account.onboarding_expires_at) {
        const expiresAt = new Date(account.onboarding_expires_at);
        if (expiresAt > new Date()) {
          return account.onboarding_link;
        }
      }

      // Generate new link if expired or missing
      return await this.refreshOnboardingLink(accountId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error getting onboarding link:', error);
      throw new AppError('Failed to get onboarding link', 'CONNECT_LINK_ERROR', 500);
    }
  }

  /**
   * Refresh onboarding link for an account
   * Requirements: 1.1 - Refresh onboarding link
   * 
   * @param accountId - The Stripe Connect account ID
   * @returns The new onboarding link URL
   */
  async refreshOnboardingLink(accountId: string): Promise<string> {
    try {
      // Verify account exists in database
      const { data: account, error } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id')
        .eq('stripe_account_id', accountId)
        .single();

      if (error || !account) {
        throw new NotFoundError('Connect account');
      }

      // Create new account link
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=success`,
        type: 'account_onboarding',
      });

      // Update database with new link
      const { error: updateError } = await this.supabase
        .from('stripe_connect_accounts')
        .update({
          onboarding_link: accountLink.url,
          onboarding_expires_at: new Date(accountLink.expires_at * 1000).toISOString(),
        })
        .eq('stripe_account_id', accountId);

      if (updateError) {
        console.error('[StripeConnectService] Failed to update onboarding link:', updateError);
      }

      console.log('[StripeConnectService] Refreshed onboarding link:', { accountId });

      return accountLink.url;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error refreshing onboarding link:', error);
      throw new AppError('Failed to refresh onboarding link', 'CONNECT_REFRESH_ERROR', 500);
    }
  }

  /**
   * Get account status from Stripe
   * Requirements: 1.2 - Check account status
   * 
   * @param accountId - The Stripe Connect account ID
   * @returns The account status
   */
  async getAccountStatus(accountId: string): Promise<ConnectAccountStatus> {
    try {
      // Retrieve account from Stripe
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        disabledReason: account.requirements?.disabled_reason || null,
        onboardingCompleted: account.details_submitted && account.charges_enabled,
      };
    } catch (error) {
      console.error('[StripeConnectService] Error getting account status:', error);
      throw new AppError('Failed to get account status', 'CONNECT_STATUS_ERROR', 500);
    }
  }

  /**
   * Update account status in database from Stripe
   * Requirements: 1.2 - Update account status
   * 
   * @param accountId - The Stripe Connect account ID
   */
  async updateAccountStatus(accountId: string): Promise<void> {
    try {
      // Get status from Stripe
      const status = await this.getAccountStatus(accountId);

      // Update database
      const { error } = await this.supabase
        .from('stripe_connect_accounts')
        .update({
          charges_enabled: status.chargesEnabled,
          payouts_enabled: status.payoutsEnabled,
          details_submitted: status.detailsSubmitted,
          currently_due: status.currentlyDue,
          eventually_due: status.eventuallyDue,
          past_due: status.pastDue,
          disabled_reason: status.disabledReason,
          onboarding_completed: status.onboardingCompleted,
        })
        .eq('stripe_account_id', accountId);

      if (error) {
        console.error('[StripeConnectService] Failed to update account status:', error);
        throw new AppError('Failed to update account status', 'CONNECT_UPDATE_ERROR', 500);
      }

      console.log('[StripeConnectService] Updated account status:', {
        accountId,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error updating account status:', error);
      throw new AppError('Failed to update account status', 'CONNECT_UPDATE_ERROR', 500);
    }
  }

  /**
   * Create dashboard link for account management
   * Requirements: 1.2 - Access Stripe Dashboard
   * 
   * @param accountId - The Stripe Connect account ID
   * @returns The dashboard link URL
   */
  async createDashboardLink(accountId: string): Promise<string> {
    try {
      // Verify account exists
      const { data: account, error } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id')
        .eq('stripe_account_id', accountId)
        .single();

      if (error || !account) {
        throw new NotFoundError('Connect account');
      }

      // Create login link for Express dashboard
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);

      console.log('[StripeConnectService] Created dashboard link:', { accountId });

      return loginLink.url;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error creating dashboard link:', error);
      throw new AppError('Failed to create dashboard link', 'CONNECT_DASHBOARD_ERROR', 500);
    }
  }

  /**
   * Disconnect and delete Connect account
   * Requirements: 1.1 - Disconnect account
   * 
   * @param userId - The user ID
   */
  async disconnectAccount(userId: string): Promise<void> {
    try {
      // Get account from database
      const { data: account, error } = await this.supabase
        .from('stripe_connect_accounts')
        .select('stripe_account_id')
        .eq('user_id', userId)
        .single();

      if (error || !account) {
        throw new NotFoundError('Connect account');
      }

      // Delete account from Stripe
      try {
        await this.stripe.accounts.del(account.stripe_account_id);
      } catch (stripeError) {
        // Log but don't fail if Stripe deletion fails (account might already be deleted)
        console.warn('[StripeConnectService] Failed to delete from Stripe:', stripeError);
      }

      // Delete from database (CASCADE will handle related records)
      const { error: deleteError } = await this.supabase
        .from('stripe_connect_accounts')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[StripeConnectService] Failed to delete account from database:', deleteError);
        throw new AppError('Failed to disconnect account', 'CONNECT_DISCONNECT_ERROR', 500);
      }

      console.log('[StripeConnectService] Disconnected account:', {
        userId,
        accountId: account.stripe_account_id,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[StripeConnectService] Error disconnecting account:', error);
      throw new AppError('Failed to disconnect account', 'CONNECT_DISCONNECT_ERROR', 500);
    }
  }
}

/**
 * Factory function to create a StripeConnectService instance
 */
export function createStripeConnectService(
  supabase: SupabaseClient<Database>
): StripeConnectService {
  return new StripeConnectService(supabase);
}
