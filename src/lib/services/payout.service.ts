/**
 * Payout Service
 * Handles payout operations for photographers including balance, payout history, and sync
 * 
 * @module lib/services/payout.service
 * Requirements: 
 * - 5.1: Automatic Payouts (Stripe Connect)
 * - 5.2: Payout History
 * - 5.3: Balance Display
 */
import { getStripe } from '@/lib/stripe/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, NotFoundError } from '@/lib/errors';
import Stripe from 'stripe';

/**
 * Payout status values
 */
export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';

/**
 * Payout record interface
 */
export interface Payout {
  id: string;
  photographerId: string;
  stripeAccountId: string;
  stripePayoutId: string | null;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  failureCode: string | null;
  failureMessage: string | null;
  arrivalDate: string | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  destinationBankAccountLast4: string | null;
}

/**
 * Payout filters for listing
 */
export interface PayoutFilters {
  status?: PayoutStatus | PayoutStatus[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated payouts result
 */
export interface PaginatedPayouts {
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Balance information
 */
export interface Balance {
  available: BalanceAmount[];
  pending: BalanceAmount[];
  instantAvailable?: BalanceAmount[];
  totalAvailable: number;
  totalPending: number;
  currency: string;
}

/**
 * Balance amount by currency
 */
export interface BalanceAmount {
  amount: number;
  currency: string;
  sourceTypes?: {
    card?: number;
    bank_account?: number;
  };
}

/**
 * Payout details with related sales
 */
export interface PayoutDetails extends Payout {
  relatedSales?: RelatedSale[];
}

/**
 * Related sale for payout breakdown
 */
export interface RelatedSale {
  id: string;
  galleryId: string;
  galleryTitle: string;
  buyerEmail: string;
  amountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  purchasedAt: string;
}

/**
 * Payout Service Interface
 */
export interface IPayoutService {
  getPayouts(photographerId: string, filters: PayoutFilters): Promise<PaginatedPayouts>;
  getPayoutDetails(payoutId: string): Promise<PayoutDetails | null>;
  getBalance(accountId: string): Promise<Balance>;
  getNextPayoutDate(accountId: string): Promise<Date | null>;
  syncPayouts(accountId: string): Promise<number>;
}

/**
 * Cache TTL in milliseconds (5 minutes for balance)
 */
const BALANCE_CACHE_TTL = 5 * 60 * 1000;

/**
 * Simple in-memory cache for balance
 */
const balanceCache = new Map<string, { data: Balance; timestamp: number }>();

/**
 * Get cached balance or null if expired
 */
function getCachedBalance(accountId: string): Balance | null {
  const entry = balanceCache.get(accountId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > BALANCE_CACHE_TTL) {
    balanceCache.delete(accountId);
    return null;
  }
  return entry.data;
}

/**
 * Set balance cache entry
 */
function setBalanceCache(accountId: string, data: Balance): void {
  balanceCache.set(accountId, { data, timestamp: Date.now() });
}

/**
 * Payout Service Implementation
 */
export class PayoutService implements IPayoutService {
  private stripe: Stripe;

  constructor(private supabase: SupabaseClient) {
    this.stripe = getStripe();
  }

  /**
   * Get paginated list of payouts for a photographer
   * Requirements: 5.2 - Payout History
   * 
   * @param photographerId - The photographer's user ID
   * @param filters - Optional filters for status, date range, pagination
   * @returns Paginated list of payouts
   */
  async getPayouts(photographerId: string, filters: PayoutFilters = {}): Promise<PaginatedPayouts> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('photographer_payouts')
        .select('*', { count: 'exact' })
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[PayoutService] Error fetching payouts:', error);
        throw new AppError('Failed to fetch payouts', 'PAYOUTS_FETCH_ERROR', 500);
      }

      const payouts: Payout[] = (data || []).map(this.mapToPayout);

      return {
        payouts,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[PayoutService] Error getting payouts:', error);
      throw new AppError(
        'Failed to get payouts',
        'PAYOUTS_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get detailed information about a specific payout
   * Requirements: 5.2 - Payout History (detailed view)
   * 
   * @param payoutId - The payout ID (UUID)
   * @returns Payout details with related sales or null if not found
   */
  async getPayoutDetails(payoutId: string): Promise<PayoutDetails | null> {
    try {
      // Get payout record
      const { data: payout, error } = await this.supabase
        .from('photographer_payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (error || !payout) {
        return null;
      }

      const payoutDetails: PayoutDetails = this.mapToPayout(payout);

      // Try to get related sales if we have arrival date
      // Sales that contributed to this payout would be those completed before the payout
      // and after the previous payout
      if (payout.arrival_date) {
        try {
          // Get the previous payout to determine the date range
          const { data: previousPayout } = await this.supabase
            .from('photographer_payouts')
            .select('arrival_date')
            .eq('photographer_id', payout.photographer_id)
            .lt('created_at', payout.created_at)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Build query for related sales
          let salesQuery = this.supabase
            .from('gallery_purchases')
            .select(`
              id,
              gallery_id,
              buyer_email,
              amount_cents,
              platform_fee_cents,
              photographer_earnings_cents,
              purchased_at,
              galleries!inner(title)
            `)
            .eq('photographer_id', payout.photographer_id)
            .eq('status', 'succeeded')
            .lte('purchased_at', payout.created_at);

          if (previousPayout?.arrival_date) {
            salesQuery = salesQuery.gt('purchased_at', previousPayout.arrival_date);
          }

          const { data: sales } = await salesQuery.order('purchased_at', { ascending: false });

          if (sales && sales.length > 0) {
            payoutDetails.relatedSales = sales.map((sale: Record<string, unknown>) => ({
              id: sale.id as string,
              galleryId: sale.gallery_id as string,
              galleryTitle: (sale.galleries as { title: string })?.title || 'Unknown',
              buyerEmail: sale.buyer_email as string,
              amountCents: sale.amount_cents as number,
              platformFeeCents: sale.platform_fee_cents as number,
              netAmountCents: sale.photographer_earnings_cents as number,
              purchasedAt: sale.purchased_at as string,
            }));
          }
        } catch (salesError) {
          // Log but don't fail - related sales are optional
          console.warn('[PayoutService] Could not fetch related sales:', salesError);
        }
      }

      return payoutDetails;
    } catch (error) {
      console.error('[PayoutService] Error getting payout details:', error);
      throw new AppError(
        'Failed to get payout details',
        'PAYOUT_DETAILS_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get the current balance for a Stripe Connect account
   * Requirements: 5.3 - Balance Display
   * 
   * @param accountId - The Stripe Connect account ID (acct_xxx)
   * @returns Balance information with available and pending amounts
   */
  async getBalance(accountId: string): Promise<Balance> {
    try {
      // Check cache first
      const cached = getCachedBalance(accountId);
      if (cached) {
        return cached;
      }

      // Fetch balance from Stripe
      const stripeBalance = await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });

      // Map available balances
      const available: BalanceAmount[] = stripeBalance.available.map((b) => ({
        amount: b.amount,
        currency: b.currency,
        sourceTypes: b.source_types ? {
          card: b.source_types.card,
          bank_account: b.source_types.bank_account,
        } : undefined,
      }));

      // Map pending balances
      const pending: BalanceAmount[] = stripeBalance.pending.map((b) => ({
        amount: b.amount,
        currency: b.currency,
        sourceTypes: b.source_types ? {
          card: b.source_types.card,
          bank_account: b.source_types.bank_account,
        } : undefined,
      }));

      // Map instant available if present
      const instantAvailable: BalanceAmount[] | undefined = stripeBalance.instant_available?.map((b) => ({
        amount: b.amount,
        currency: b.currency,
        sourceTypes: b.source_types ? {
          card: b.source_types.card,
          bank_account: b.source_types.bank_account,
        } : undefined,
      }));

      // Calculate totals (assuming primary currency is the first one)
      const primaryCurrency = available[0]?.currency || pending[0]?.currency || 'usd';
      const totalAvailable = available
        .filter((b) => b.currency === primaryCurrency)
        .reduce((sum, b) => sum + b.amount, 0);
      const totalPending = pending
        .filter((b) => b.currency === primaryCurrency)
        .reduce((sum, b) => sum + b.amount, 0);

      const balance: Balance = {
        available,
        pending,
        instantAvailable,
        totalAvailable,
        totalPending,
        currency: primaryCurrency,
      };

      // Cache the result
      setBalanceCache(accountId, balance);

      console.log('[PayoutService] Retrieved balance:', {
        accountId,
        totalAvailable,
        totalPending,
        currency: primaryCurrency,
      });

      return balance;
    } catch (error) {
      console.error('[PayoutService] Error getting balance:', error);
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(
          `Stripe error: ${error.message}`,
          'STRIPE_BALANCE_ERROR',
          error.statusCode || 500,
          { stripeCode: error.code }
        );
      }

      throw new AppError(
        'Failed to get balance',
        'BALANCE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get the next scheduled payout date for a Connect account
   * Requirements: 5.1 - Display next payout date
   * 
   * @param accountId - The Stripe Connect account ID (acct_xxx)
   * @returns The next payout date or null if no payouts scheduled
   */
  async getNextPayoutDate(accountId: string): Promise<Date | null> {
    try {
      // Get the account's payout schedule
      const account = await this.stripe.accounts.retrieve(accountId);

      if (!account.settings?.payouts?.schedule) {
        return null;
      }

      const schedule = account.settings.payouts.schedule;
      const now = new Date();

      // Calculate next payout date based on schedule
      let nextPayoutDate: Date | null = null;

      switch (schedule.interval) {
        case 'daily':
          // Next business day
          nextPayoutDate = this.getNextBusinessDay(now);
          break;

        case 'weekly':
          // Next occurrence of the scheduled day
          nextPayoutDate = this.getNextWeekday(now, schedule.weekly_anchor || 'monday');
          break;

        case 'monthly':
          // Next occurrence of the scheduled day of month
          nextPayoutDate = this.getNextMonthDay(now, schedule.monthly_anchor || 1);
          break;

        case 'manual':
          // No automatic payouts
          return null;

        default:
          // Default to next business day
          nextPayoutDate = this.getNextBusinessDay(now);
      }

      // Add delay days if specified
      if (schedule.delay_days && schedule.delay_days > 0) {
        nextPayoutDate.setDate(nextPayoutDate.getDate() + schedule.delay_days);
      }

      console.log('[PayoutService] Calculated next payout date:', {
        accountId,
        interval: schedule.interval,
        nextPayoutDate: nextPayoutDate.toISOString(),
      });

      return nextPayoutDate;
    } catch (error) {
      console.error('[PayoutService] Error getting next payout date:', error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(
          `Stripe error: ${error.message}`,
          'STRIPE_ACCOUNT_ERROR',
          error.statusCode || 500,
          { stripeCode: error.code }
        );
      }

      throw new AppError(
        'Failed to get next payout date',
        'NEXT_PAYOUT_DATE_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Sync payouts from Stripe to the local database
   * Requirements: 5.2 - Keep payout history in sync
   * 
   * @param accountId - The Stripe Connect account ID (acct_xxx)
   * @returns Number of payouts synced
   */
  async syncPayouts(accountId: string): Promise<number> {
    try {
      // Get photographer ID from Connect account
      const { data: connectAccount, error: connectError } = await this.supabase
        .from('stripe_connect_accounts')
        .select('user_id')
        .eq('stripe_account_id', accountId)
        .single();

      if (connectError || !connectAccount) {
        throw new NotFoundError('Connect account');
      }

      const photographerId = connectAccount.user_id;

      // Get the most recent payout we have stored
      const { data: latestPayout } = await this.supabase
        .from('photographer_payouts')
        .select('created_at')
        .eq('stripe_account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch payouts from Stripe
      const stripePayouts = await this.stripe.payouts.list(
        {
          limit: 100,
          created: latestPayout?.created_at
            ? { gt: Math.floor(new Date(latestPayout.created_at).getTime() / 1000) }
            : undefined,
        },
        { stripeAccount: accountId }
      );

      if (stripePayouts.data.length === 0) {
        console.log('[PayoutService] No new payouts to sync:', { accountId });
        return 0;
      }

      let syncedCount = 0;

      for (const stripePayout of stripePayouts.data) {
        // Check if payout already exists
        const { data: existing } = await this.supabase
          .from('photographer_payouts')
          .select('id')
          .eq('stripe_payout_id', stripePayout.id)
          .single();

        if (existing) {
          // Update existing payout status
          const { error: updateError } = await this.supabase
            .from('photographer_payouts')
            .update({
              status: this.mapStripePayoutStatus(stripePayout.status),
              failure_code: stripePayout.failure_code || null,
              failure_message: stripePayout.failure_message || null,
              arrival_date: stripePayout.arrival_date
                ? new Date(stripePayout.arrival_date * 1000).toISOString().split('T')[0]
                : null,
            })
            .eq('id', existing.id);

          if (!updateError) {
            syncedCount++;
          }
        } else {
          // Insert new payout
          const { error: insertError } = await this.supabase
            .from('photographer_payouts')
            .insert({
              photographer_id: photographerId,
              stripe_account_id: accountId,
              stripe_payout_id: stripePayout.id,
              amount_cents: stripePayout.amount,
              currency: stripePayout.currency,
              status: this.mapStripePayoutStatus(stripePayout.status),
              failure_code: stripePayout.failure_code || null,
              failure_message: stripePayout.failure_message || null,
              arrival_date: stripePayout.arrival_date
                ? new Date(stripePayout.arrival_date * 1000).toISOString().split('T')[0]
                : null,
              destination_bank_account_last4: typeof stripePayout.destination === 'string'
                ? null
                : (stripePayout.destination as Stripe.BankAccount)?.last4 || null,
              created_at: new Date(stripePayout.created * 1000).toISOString(),
            });

          if (!insertError) {
            syncedCount++;
          }
        }
      }

      console.log('[PayoutService] Synced payouts:', {
        accountId,
        syncedCount,
        totalFromStripe: stripePayouts.data.length,
      });

      return syncedCount;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[PayoutService] Error syncing payouts:', error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(
          `Stripe error: ${error.message}`,
          'STRIPE_SYNC_ERROR',
          error.statusCode || 500,
          { stripeCode: error.code }
        );
      }

      throw new AppError(
        'Failed to sync payouts',
        'SYNC_PAYOUTS_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Map Stripe payout status to our status type
   * @private
   */
  private mapStripePayoutStatus(stripeStatus: string): PayoutStatus {
    switch (stripeStatus) {
      case 'pending':
        return 'pending';
      case 'in_transit':
        return 'in_transit';
      case 'paid':
        return 'paid';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  /**
   * Map database record to Payout interface
   * @private
   */
  private mapToPayout(data: Record<string, unknown>): Payout {
    return {
      id: data.id as string,
      photographerId: data.photographer_id as string,
      stripeAccountId: data.stripe_account_id as string,
      stripePayoutId: data.stripe_payout_id as string | null,
      amountCents: data.amount_cents as number,
      currency: data.currency as string,
      status: data.status as PayoutStatus,
      failureCode: data.failure_code as string | null,
      failureMessage: data.failure_message as string | null,
      arrivalDate: data.arrival_date as string | null,
      createdAt: data.created_at as string,
      paidAt: data.paid_at as string | null,
      failedAt: data.failed_at as string | null,
      destinationBankAccountLast4: data.destination_bank_account_last4 as string | null,
    };
  }

  /**
   * Get the next business day (Monday-Friday)
   * @private
   */
  private getNextBusinessDay(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    
    // Skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  /**
   * Get the next occurrence of a specific weekday
   * @private
   */
  private getNextWeekday(from: Date, weekday: string): Date {
    const weekdays: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDay = weekdays[weekday.toLowerCase()] ?? 1;
    const next = new Date(from);
    const currentDay = next.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    next.setDate(next.getDate() + daysUntilTarget);
    return next;
  }

  /**
   * Get the next occurrence of a specific day of month
   * @private
   */
  private getNextMonthDay(from: Date, dayOfMonth: number): Date {
    const next = new Date(from);
    const currentDay = next.getDate();
    
    if (currentDay >= dayOfMonth) {
      // Move to next month
      next.setMonth(next.getMonth() + 1);
    }
    
    // Set the day, handling months with fewer days
    const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    
    return next;
  }
}

/**
 * Factory function to create a PayoutService instance
 */
export function createPayoutService(supabase: SupabaseClient): PayoutService {
  return new PayoutService(supabase);
}

/**
 * Clear the balance cache (for testing)
 */
export function clearBalanceCache(): void {
  balanceCache.clear();
}
