/**
 * Email Verification Service
 * 
 * This service handles sending verification and authentication-related emails with:
 * - Retry logic with exponential backoff
 * - Fallback to secondary email provider (AWS SES)
 * - Email delivery timing tracking
 * - Integration with existing email queue system
 * 
 * Requirements: 21.4 (Email system infrastructure)
 * Validates: Requirements 5.1, 7.4, 9.1 (Email delivery timing)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { EmailService } from './email.service';
import { render } from '@react-email/render';
import { VerificationEmail } from '@/emails/verification-email';
import { PasswordResetEmail } from '@/emails/password-reset-email';
import { PasswordChangedEmail } from '@/emails/password-changed-email';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Email delivery result with timing information
 */
export interface EmailDeliveryResult {
  /** Whether the email was successfully queued */
  success: boolean;
  
  /** Queue item ID if successful */
  queueId?: string;
  
  /** Error message if failed */
  error?: string;
  
  /** Time taken to queue the email (milliseconds) */
  queueTime: number;
  
  /** Number of retry attempts made */
  retryAttempts: number;
  
  /** Provider used (primary or fallback) */
  provider: 'primary' | 'fallback';
}

/**
 * Parameters for sending verification email
 */
export interface SendVerificationEmailParams {
  /** User ID */
  userId: string;
  
  /** User's email address */
  email: string;
  
  /** User's name (optional) */
  name?: string;
  
  /** Verification token */
  token: string;
  
  /** Base URL for verification link */
  baseUrl: string;
}

/**
 * Parameters for sending password reset email
 */
export interface SendPasswordResetEmailParams {
  /** User ID */
  userId: string;
  
  /** User's email address */
  email: string;
  
  /** User's name (optional) */
  name?: string;
  
  /** Reset token */
  token: string;
  
  /** Base URL for reset link */
  baseUrl: string;
  
  /** IP address or location where request was made from (optional) */
  requestedFrom?: string;
}

/**
 * Parameters for sending password changed notification
 */
export interface SendPasswordChangedEmailParams {
  /** User ID */
  userId: string;
  
  /** User's email address */
  email: string;
  
  /** User's name (optional) */
  name?: string;
  
  /** When the password was changed */
  changedAt: Date;
  
  /** IP address or location where change was made from (optional) */
  changedFrom?: string;
  
  /** Base URL for security settings */
  baseUrl: string;
}

// ============================================================================
// Email Verification Service Class
// ============================================================================

/**
 * Email Verification Service
 * 
 * Handles sending verification and authentication-related emails with
 * retry logic, fallback providers, and delivery tracking.
 */
export class EmailVerificationService {
  private emailService: EmailService;
  private supabase: SupabaseClient<Database>;
  
  /**
   * Maximum retry attempts for email sending
   */
  private readonly MAX_RETRIES = 3;
  
  /**
   * Retry delays in milliseconds (exponential backoff)
   * Retry 1: 1 second
   * Retry 2: 2 seconds
   * Retry 3: 4 seconds
   */
  private readonly RETRY_DELAYS = [1000, 2000, 4000];
  
  /**
   * Maximum time allowed for email delivery (30 seconds per requirement 5.1)
   */
  private readonly MAX_DELIVERY_TIME = 30000; // 30 seconds
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.emailService = new EmailService(supabase);
  }
  
  /**
   * Send verification email to user
   * 
   * Implements retry logic with exponential backoff and fallback to secondary provider.
   * Tracks delivery timing to ensure emails are sent within 30 seconds.
   * 
   * @param params - Verification email parameters
   * @returns Promise resolving to delivery result
   */
  async sendVerificationEmail(params: SendVerificationEmailParams): Promise<EmailDeliveryResult> {
    const startTime = Date.now();
    let retryAttempts = 0;
    let lastError: Error | null = null;
    let usedFallback = false;
    
    // Build verification link
    const verificationLink = `${params.baseUrl}/verify-email?token=${params.token}`;
    
    // Render email HTML
    const html = await render(
      VerificationEmail({
        userName: params.name,
        userEmail: params.email,
        verificationLink,
        expiresIn: '24 hours',
      })
    );
    
    // Try sending with primary provider (with retries)
    while (retryAttempts < this.MAX_RETRIES) {
      try {
        const result = await this.emailService.sendTransactionalEmail({
          to: params.email,
          subject: 'Verify your PikSend email address',
          html,
          type: 'transactional',
          priority: 'high',
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'verification',
            queueTime,
            success: true,
            provider: usedFallback ? 'fallback' : 'primary',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: usedFallback ? 'fallback' : 'primary',
          };
        }
        
        throw new Error(result.error || 'Failed to send email');
      } catch (error) {
        lastError = error as Error;
        retryAttempts++;
        
        // Check if we've exceeded max delivery time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= this.MAX_DELIVERY_TIME) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (retryAttempts < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[retryAttempts - 1] ?? this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1] ?? 1000;
          await this.sleep(delay);
        }
      }
    }
    
    // All retries with primary provider failed, try fallback provider
    if (!usedFallback) {
      try {
        usedFallback = true;
        const result = await this.sendWithFallbackProvider({
          to: params.email,
          subject: 'Verify your PikSend email address',
          html,
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'verification',
            queueTime,
            success: true,
            provider: 'fallback',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: 'fallback',
          };
        }
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
      }
    }
    
    // All attempts failed
    const queueTime = Date.now() - startTime;
    
    // Track failed delivery
    await this.trackDeliveryTiming({
      userId: params.userId,
      emailType: 'verification',
      queueTime,
      success: false,
      provider: usedFallback ? 'fallback' : 'primary',
      error: lastError?.message,
    });
    
    // Log critical error
    console.error('[EmailVerificationService] Failed to send verification email', {
      userId: params.userId,
      email: params.email,
      retryAttempts,
      queueTime,
      error: lastError?.message,
    });
    
    return {
      success: false,
      error: lastError?.message || 'Failed to send verification email after all retries',
      queueTime,
      retryAttempts,
      provider: usedFallback ? 'fallback' : 'primary',
    };
  }
  
  /**
   * Send password reset email to user
   * 
   * Implements retry logic with exponential backoff and fallback to secondary provider.
   * 
   * @param params - Password reset email parameters
   * @returns Promise resolving to delivery result
   */
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<EmailDeliveryResult> {
    const startTime = Date.now();
    let retryAttempts = 0;
    let lastError: Error | null = null;
    let usedFallback = false;
    
    // Build reset link
    const resetLink = `${params.baseUrl}/reset-password?token=${params.token}`;
    
    // Render email HTML
    const html = await render(
      PasswordResetEmail({
        userName: params.name,
        userEmail: params.email,
        resetLink,
        expiresIn: '1 hour',
        requestedFrom: params.requestedFrom,
      })
    );
    
    // Try sending with primary provider (with retries)
    while (retryAttempts < this.MAX_RETRIES) {
      try {
        const result = await this.emailService.sendTransactionalEmail({
          to: params.email,
          subject: 'Reset your PikSend password',
          html,
          type: 'transactional',
          priority: 'high',
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'password_reset',
            queueTime,
            success: true,
            provider: usedFallback ? 'fallback' : 'primary',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: usedFallback ? 'fallback' : 'primary',
          };
        }
        
        throw new Error(result.error || 'Failed to send email');
      } catch (error) {
        lastError = error as Error;
        retryAttempts++;
        
        // Check if we've exceeded max delivery time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= this.MAX_DELIVERY_TIME) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (retryAttempts < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[retryAttempts - 1] ?? this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1] ?? 1000;
          await this.sleep(delay);
        }
      }
    }
    
    // All retries with primary provider failed, try fallback provider
    if (!usedFallback) {
      try {
        usedFallback = true;
        const result = await this.sendWithFallbackProvider({
          to: params.email,
          subject: 'Reset your PikSend password',
          html,
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'password_reset',
            queueTime,
            success: true,
            provider: 'fallback',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: 'fallback',
          };
        }
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
      }
    }
    
    // All attempts failed
    const queueTime = Date.now() - startTime;
    
    // Track failed delivery
    await this.trackDeliveryTiming({
      userId: params.userId,
      emailType: 'password_reset',
      queueTime,
      success: false,
      provider: usedFallback ? 'fallback' : 'primary',
      error: lastError?.message,
    });
    
    // Log critical error
    console.error('[EmailVerificationService] Failed to send password reset email', {
      userId: params.userId,
      email: params.email,
      retryAttempts,
      queueTime,
      error: lastError?.message,
    });
    
    return {
      success: false,
      error: lastError?.message || 'Failed to send password reset email after all retries',
      queueTime,
      retryAttempts,
      provider: usedFallback ? 'fallback' : 'primary',
    };
  }
  
  /**
   * Send password changed notification email to user
   * 
   * Implements retry logic with exponential backoff and fallback to secondary provider.
   * 
   * @param params - Password changed email parameters
   * @returns Promise resolving to delivery result
   */
  async sendPasswordChangedEmail(params: SendPasswordChangedEmailParams): Promise<EmailDeliveryResult> {
    const startTime = Date.now();
    let retryAttempts = 0;
    let lastError: Error | null = null;
    let usedFallback = false;
    
    // Format changed at time
    const changedAt = params.changedAt.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';
    
    // Build security settings link
    const securitySettingsLink = `${params.baseUrl}/settings/security`;
    
    // Render email HTML
    const html = await render(
      PasswordChangedEmail({
        userName: params.name,
        userEmail: params.email,
        changedAt,
        changedFrom: params.changedFrom,
        securitySettingsLink,
      })
    );
    
    // Try sending with primary provider (with retries)
    while (retryAttempts < this.MAX_RETRIES) {
      try {
        const result = await this.emailService.sendTransactionalEmail({
          to: params.email,
          subject: 'Your PikSend password was changed',
          html,
          type: 'transactional',
          priority: 'high',
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'password_changed',
            queueTime,
            success: true,
            provider: usedFallback ? 'fallback' : 'primary',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: usedFallback ? 'fallback' : 'primary',
          };
        }
        
        throw new Error(result.error || 'Failed to send email');
      } catch (error) {
        lastError = error as Error;
        retryAttempts++;
        
        // Check if we've exceeded max delivery time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= this.MAX_DELIVERY_TIME) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (retryAttempts < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[retryAttempts - 1] ?? this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1] ?? 1000;
          await this.sleep(delay);
        }
      }
    }
    
    // All retries with primary provider failed, try fallback provider
    if (!usedFallback) {
      try {
        usedFallback = true;
        const result = await this.sendWithFallbackProvider({
          to: params.email,
          subject: 'Your PikSend password was changed',
          html,
        });
        
        if (result.success) {
          const queueTime = Date.now() - startTime;
          
          // Track delivery timing
          await this.trackDeliveryTiming({
            userId: params.userId,
            emailType: 'password_changed',
            queueTime,
            success: true,
            provider: 'fallback',
          });
          
          return {
            success: true,
            queueId: result.id,
            queueTime,
            retryAttempts,
            provider: 'fallback',
          };
        }
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
      }
    }
    
    // All attempts failed
    const queueTime = Date.now() - startTime;
    
    // Track failed delivery
    await this.trackDeliveryTiming({
      userId: params.userId,
      emailType: 'password_changed',
      queueTime,
      success: false,
      provider: usedFallback ? 'fallback' : 'primary',
      error: lastError?.message,
    });
    
    // Log critical error
    console.error('[EmailVerificationService] Failed to send password changed email', {
      userId: params.userId,
      email: params.email,
      retryAttempts,
      queueTime,
      error: lastError?.message,
    });
    
    return {
      success: false,
      error: lastError?.message || 'Failed to send password changed email after all retries',
      queueTime,
      retryAttempts,
      provider: usedFallback ? 'fallback' : 'primary',
    };
  }
  
  /**
   * Send email using fallback provider (AWS SES)
   * 
   * This is a placeholder for fallback provider implementation.
   * In a real implementation, this would use AWS SES SDK directly.
   * 
   * @param params - Email parameters
   * @returns Promise resolving to email result
   */
  private async sendWithFallbackProvider(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    // TODO: Implement AWS SES fallback provider
    // For now, we'll try the email service again (which may use a different provider)
    // In production, this should directly call AWS SES SDK
    
    try {
      const result = await this.emailService.sendTransactionalEmail({
        to: params.to,
        subject: params.subject,
        html: params.html,
        type: 'transactional',
        priority: 'high',
      });
      
      return result;
    } catch (error) {
      console.error('Fallback provider error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Track email delivery timing for monitoring
   * 
   * @param params - Tracking parameters
   */
  private async trackDeliveryTiming(params: {
    userId: string;
    emailType: 'verification' | 'password_reset' | 'password_changed';
    queueTime: number;
    success: boolean;
    provider: 'primary' | 'fallback';
    error?: string;
  }): Promise<void> {
    try {
      // Insert delivery timing record
      await this.supabase
        .from('email_delivery_metrics')
        .insert({
          user_id: params.userId,
          email_type: params.emailType,
          queue_time_ms: params.queueTime,
          success: params.success,
          provider: params.provider,
          error_message: params.error || null,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      // Don't throw error if tracking fails - just log it
      console.error('Failed to track email delivery timing:', error);
    }
  }
  
  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Exports
// ============================================================================

export default EmailVerificationService;
