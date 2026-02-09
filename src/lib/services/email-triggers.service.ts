/**
 * Email Triggers Service
 * Manages automated email triggers (temporal and event-based)
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { EmailService } from './email.service';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface EmailTriggerContext {
  userId: string;
  email: string;
  firstName?: string;
  metadata?: Record<string, any>;
}

/**
 * Email Triggers Service
 * Handles automated email sending based on user actions and time delays
 */
export class EmailTriggersService {
  private emailService: EmailService;
  
  constructor(private supabase: SupabaseClient<Database>) {
    this.emailService = new EmailService(supabase);
  }
  
  /**
   * Send welcome email immediately after signup
   * Requirement: 18.1
   */
  async sendWelcomeEmail(context: EmailTriggerContext): Promise<void> {
    try {
      const template = await this.getTemplateBySlug('welcome-email');
      if (!template) {
        throw new Error('Welcome email template not found');
      }

      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      await this.emailService.sendTransactionalEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'transactional',
        templateId: template.id,
        variables: {
          firstName: context.firstName,
          email: context.email,
        },
        priority: 'high',
      });
      
      console.log(`Welcome email sent to ${context.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
  
  /**
   * Schedule first gallery reminder email (D+1)
   * Requirement: 18.2
   */
  async scheduleFirstGalleryReminder(context: EmailTriggerContext): Promise<void> {
    try {
      // Check if user has already created a gallery
      const hasGallery = await this.userHasGallery(context.userId);
      if (hasGallery) {
        console.log(`User ${context.userId} already has a gallery, skipping reminder`);
        return;
      }
      
      const template = await this.getTemplateBySlug('first-gallery-reminder-d1');
      if (!template) {
        throw new Error('First gallery reminder template not found');
      }

      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      // Schedule for 24 hours from now
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await this.emailService.scheduleEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'marketing',
        templateId: template.id,
        variables: {
          firstName: context.firstName,
          email: context.email,
        },
        priority: 'normal',
        scheduledAt,
      });
      
      console.log(`First gallery reminder scheduled for ${context.email} at ${scheduledAt}`);
    } catch (error) {
      console.error('Error scheduling first gallery reminder:', error);
      throw error;
    }
  }
  
  /**
   * Schedule help email (D+3)
   * Requirement: 18.3
   */
  async scheduleHelpEmail(context: EmailTriggerContext): Promise<void> {
    try {
      const hasGallery = await this.userHasGallery(context.userId);
      if (hasGallery) {
        return;
      }
      
      const template = await this.getTemplateBySlug('help-email-d3');
      if (!template) {
        console.log('Help email template not found, skipping');
        return;
      }

      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      await this.emailService.scheduleEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'marketing',
        templateId: template.id,
        scheduledAt,
      });
    } catch (error) {
      console.error('Error scheduling help email:', error);
    }
  }
  
  /**
   * Schedule upgrade email (D+7)
   * Requirement: 18.4
   */
  async scheduleUpgradeEmailD7(context: EmailTriggerContext): Promise<void> {
    try {
      const template = await this.getTemplateBySlug('upgrade-email-d7');
      if (!template) {
        console.log('Upgrade D+7 email template not found, skipping');
        return;
      }
      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await this.emailService.scheduleEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'marketing',
        templateId: template.id,
        scheduledAt,
      });
    } catch (error) {
      console.error('Error scheduling upgrade D+7 email:', error);
    }
  }

  
  /**
   * Schedule upgrade email (D+14)
   * Requirement: 18.5
   */
  async scheduleUpgradeEmailD14(context: EmailTriggerContext): Promise<void> {
    try {
      const template = await this.getTemplateBySlug('upgrade-email-d14');
      if (!template) {
        console.log('Upgrade D+14 email template not found, skipping');
        return;
      }
      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      const scheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      await this.emailService.scheduleEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'marketing',
        templateId: template.id,
        scheduledAt,
      });
    } catch (error) {
      console.error('Error scheduling upgrade D+14 email:', error);
    }
  }
  
  /**
   * Send first gallery congratulations email
   * Requirement: 18.6
   */
  async sendFirstGalleryCongratulations(context: EmailTriggerContext): Promise<void> {
    try {
      const template = await this.getTemplateBySlug('first-gallery-congrats');
      if (!template) {
        console.log('First gallery congrats template not found, skipping');
        return;
      }
      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
      });
      
      await this.emailService.sendTransactionalEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'transactional',
        templateId: template.id,
        priority: 'normal',
      });
    } catch (error) {
      console.error('Error sending first gallery congrats:', error);
    }
  }

  
  /**
   * Send upgrade confirmation email
   * Requirement: 18.7
   */
  async sendUpgradeConfirmation(
    context: EmailTriggerContext & { planName: string; price: number }
  ): Promise<void> {
    try {
      const template = await this.getTemplateBySlug('upgrade-confirmation');
      if (!template) {
        console.log('Upgrade confirmation template not found, skipping');
        return;
      }
      
      const html = this.renderTemplate(template.content as any, {
        firstName: context.firstName,
        email: context.email,
        planName: context.planName,
        price: context.price,
      });
      
      await this.emailService.sendTransactionalEmail({
        to: context.email,
        subject: template.subject,
        html,
        type: 'transactional',
        templateId: template.id,
        priority: 'high',
      });
    } catch (error) {
      console.error('Error sending upgrade confirmation:', error);
    }
  }
  
  /**
   * Handle user signup event - triggers all initial emails
   * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
   */
  async handleSignupEvent(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error(`Profile not found for user ${userId}`);
      }
      
      const context: EmailTriggerContext = {
        userId: profile.id,
        email: profile.email,
        firstName: profile.name || undefined,
      };
      
      // Send welcome email immediately
      await this.sendWelcomeEmail(context);
      
      // Schedule follow-up emails
      await this.scheduleFirstGalleryReminder(context);
      await this.scheduleHelpEmail(context);
      await this.scheduleUpgradeEmailD7(context);
      await this.scheduleUpgradeEmailD14(context);
      
      console.log(`All signup emails triggered for user ${userId}`);
    } catch (error) {
      console.error('Error handling signup event:', error);
      throw error;
    }
  }

  
  /**
   * Handle first gallery created event
   * Requirement: 18.6
   */
  async handleFirstGalleryEvent(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error(`Profile not found for user ${userId}`);
      }
      
      const context: EmailTriggerContext = {
        userId: profile.id,
        email: profile.email,
        firstName: profile.name || undefined,
      };
      
      await this.sendFirstGalleryCongratulations(context);
    } catch (error) {
      console.error('Error handling first gallery event:', error);
    }
  }
  
  /**
   * Handle upgrade event
   * Requirement: 18.7
   */
  async handleUpgradeEvent(
    userId: string,
    planName: string,
    price: number
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error(`Profile not found for user ${userId}`);
      }
      
      const context = {
        userId: profile.id,
        email: profile.email,
        firstName: profile.name || undefined,
        planName,
        price,
      };
      
      await this.sendUpgradeConfirmation(context);
    } catch (error) {
      console.error('Error handling upgrade event:', error);
    }
  }
  
  /**
   * Check if user is unsubscribed from marketing emails
   * Requirement: 18.8
   */
  async isUnsubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('email_unsubscribes')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking unsubscribe status:', error);
      return false;
    }
  }

  
  /**
   * Unsubscribe user from marketing emails
   * Requirement: 18.8
   */
  async unsubscribe(email: string, reason?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_unsubscribes')
        .upsert({
          email: email.toLowerCase(),
          reason: reason || null,
          unsubscribed_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`User ${email} unsubscribed from marketing emails`);
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }
  }
  
  // Helper methods
  
  private async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  }
  
  private async userHasGallery(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('galleries')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user galleries:', error);
    }
    
    return !!data;
  }
  
  private async getTemplateBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error(`Error fetching template ${slug}:`, error);
      return null;
    }
    
    return data;
  }
  
  private renderTemplate(content: { html: string }, variables: Record<string, any>): string {
    let html = content.html;
    
    // Simple variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, String(value || ''));
    });
    
    return html;
  }
}
