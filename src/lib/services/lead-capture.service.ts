/**
 * Lead Capture Service
 * Business logic for capturing visitor emails (lead magnet)
 * 
 * @module lib/services/lead-capture.service
 * Requirements: 7.2.1, 7.2.2, 7.2.3, 7.2.4
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface LeadCapture {
  id: string;
  galleryId: string;
  email: string;
  capturedAt: string;
}

export interface ILeadCaptureService {
  captureEmail(galleryId: string, email: string, gdprConsent: boolean): Promise<LeadCapture>;
  getLeads(galleryId: string): Promise<LeadCapture[]>;
}

export class LeadCaptureService implements ILeadCaptureService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Capture visitor email for a gallery
   * 
   * Requirement 7.2.1: THE System SHALL display email form before gallery access
   * Requirement 7.2.2: THE Email SHALL be validated and stored
   * Requirement 7.2.4: THE System SHALL comply with GDPR (consent checkbox)
   */
  async captureEmail(
    galleryId: string,
    email: string,
    gdprConsent: boolean
  ): Promise<LeadCapture> {
    // Validate inputs
    if (!galleryId || !email?.trim()) {
      throw new ValidationError('Gallery ID and email are required');
    }

    // Validate GDPR consent
    if (!gdprConsent) {
      throw new ValidationError('GDPR consent is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('Invalid email format');
    }

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Insert lead capture (will fail if duplicate due to UNIQUE constraint)
    const { data: lead, error: insertError } = await this.supabase
      .from('lead_captures')
      .insert({
        gallery_id: galleryId,
        email: email.trim().toLowerCase(),
      })
      .select()
      .single();

    if (insertError) {
      // If duplicate, return existing lead
      if (insertError.code === '23505') {
        const { data: existingLead } = await this.supabase
          .from('lead_captures')
          .select('*')
          .eq('gallery_id', galleryId)
          .eq('email', email.trim().toLowerCase())
          .single();

        if (existingLead) {
          return {
            id: existingLead.id,
            galleryId: existingLead.gallery_id,
            email: existingLead.email,
            capturedAt: existingLead.captured_at || new Date().toISOString(),
          };
        }
      }
      throw insertError;
    }

    if (!lead) {
      throw new Error('Failed to capture email');
    }

    return {
      id: lead.id,
      galleryId: lead.gallery_id,
      email: lead.email,
      capturedAt: lead.captured_at || new Date().toISOString(),
    };
  }

  /**
   * Get all captured leads for a gallery (for photographer)
   * 
   * Requirement 7.2.3: THE Photographer SHALL receive list of captured emails
   */
  async getLeads(galleryId: string): Promise<LeadCapture[]> {
    // Validate input
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
    }

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Get all leads for this gallery
    const { data: leads, error: leadsError } = await this.supabase
      .from('lead_captures')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('captured_at', { ascending: false });

    if (leadsError) {
      throw leadsError;
    }

    return (leads || []).map((lead) => ({
      id: lead.id,
      galleryId: lead.gallery_id,
      email: lead.email,
      capturedAt: lead.captured_at || new Date().toISOString(),
    }));
  }
}

/**
 * Factory function to create a LeadCaptureService instance
 */
export function createLeadCaptureService(
  supabase: SupabaseClient<Database>
): ILeadCaptureService {
  return new LeadCaptureService(supabase);
}
