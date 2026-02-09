/**
 * Process Email Queue Edge Function
 * 
 * This Supabase Edge Function processes queued emails using the email provider.
 * It runs on a cron schedule (every 1 minute) and processes emails in batches.
 * 
 * Features:
 * - Batch processing (10 emails per run by default)
 * - Priority-based processing (high > normal > low)
 * - Scheduled email support
 * - Automatic retry with exponential backoff
 * - Error handling and logging
 * - Monitoring and alerting
 * 
 * Requirements: 4.10, 4.11
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// ============================================================================
// Types
// ============================================================================

interface QueueItem {
  id: string;
  from_address: string;
  to_address: string;
  cc_addresses: string[] | null;
  bcc_addresses: string[] | null;
  template_id: string | null;
  variables: Record<string, any> | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  priority: 'high' | 'normal' | 'low';
  type: 'transactional' | 'marketing';
  status: string;
  scheduled_at: string | null;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface ProcessResult {
  id: string;
  success: boolean;
  error?: string;
  shouldRetry: boolean;
}

interface EmailProvider {
  name: string;
  config: {
    apiKey?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10; // Process 10 emails per run
const RETRY_DELAYS = [
  60 * 1000,          // 1 minute
  5 * 60 * 1000,      // 5 minutes
  15 * 60 * 1000,     // 15 minutes
  45 * 60 * 1000,     // 45 minutes
  2 * 60 * 60 * 1000, // 2 hours
];

// ============================================================================
// Logging Utilities
// ============================================================================

function logStep(step: string, details?: any) {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [EMAIL-QUEUE] ${step}${detailsStr}`);
}

function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [EMAIL-QUEUE] ERROR: ${message}`, error);
}

// ============================================================================
// Email Provider Functions
// ============================================================================

/**
 * Send email using Resend provider
 */
async function sendWithResend(
  email: QueueItem,
  apiKey: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const payload: any = {
      from: email.from_address,
      to: email.to_address,
      subject: email.subject,
      html: email.html_content,
    };

    if (email.text_content) {
      payload.text = email.text_content;
    }

    if (email.cc_addresses && email.cc_addresses.length > 0) {
      payload.cc = email.cc_addresses;
    }

    if (email.bcc_addresses && email.bcc_addresses.length > 0) {
      payload.bcc = email.bcc_addresses;
    }

    // Add tags for tracking
    payload.tags = [
      { name: 'type', value: email.type },
      { name: 'priority', value: email.priority },
    ];

    if (email.template_id) {
      payload.tags.push({ name: 'template_id', value: email.template_id });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Resend API error: ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    logError('Resend send error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email using AWS SES provider
 */
async function sendWithSES(
  email: QueueItem,
  config: { accessKeyId: string; secretAccessKey: string; region: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // For now, return an error indicating SES is not yet implemented in edge function
    // This would require AWS SDK v3 for Deno or direct API calls with AWS Signature V4
    return {
      success: false,
      error: 'AWS SES provider not yet implemented in edge function',
    };
  } catch (error) {
    logError('SES send error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email using the configured provider
 */
async function sendEmail(
  email: QueueItem,
  provider: EmailProvider
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  logStep('Sending email', {
    id: email.id,
    to: email.to_address,
    subject: email.subject,
    provider: provider.name,
  });

  if (provider.name === 'resend') {
    if (!provider.config.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }
    return await sendWithResend(email, provider.config.apiKey);
  } else if (provider.name === 'aws-ses') {
    if (!provider.config.accessKeyId || !provider.config.secretAccessKey || !provider.config.region) {
      return { success: false, error: 'AWS SES credentials not configured' };
    }
    return await sendWithSES(email, {
      accessKeyId: provider.config.accessKeyId,
      secretAccessKey: provider.config.secretAccessKey,
      region: provider.config.region,
    });
  } else {
    return { success: false, error: `Unknown provider: ${provider.name}` };
  }
}

// ============================================================================
// Queue Processing Functions
// ============================================================================

/**
 * Get the active email provider configuration
 */
async function getActiveProvider(supabase: any): Promise<EmailProvider | null> {
  try {
    const { data, error } = await supabase
      .from('email_providers')
      .select('name, config')
      .eq('is_active', true)
      .single();

    if (error) {
      logError('Failed to get active provider', error);
      return null;
    }

    return data as EmailProvider;
  } catch (error) {
    logError('Error getting active provider', error);
    return null;
  }
}

/**
 * Fetch pending emails from the queue
 */
async function fetchPendingEmails(supabase: any, batchSize: number): Promise<QueueItem[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order('priority', { ascending: false }) // high > normal > low
      .order('created_at', { ascending: true }) // oldest first
      .limit(batchSize);

    if (error) {
      logError('Failed to fetch pending emails', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logError('Error fetching pending emails', error);
    return [];
  }
}

/**
 * Mark emails as processing
 */
async function markAsProcessing(supabase: any, emailIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .in('id', emailIds);

    if (error) {
      logError('Failed to mark emails as processing', error);
    }
  } catch (error) {
    logError('Error marking emails as processing', error);
  }
}

/**
 * Update email status to sent
 */
async function markAsSent(supabase: any, emailId: string, messageId?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    if (error) {
      logError('Failed to mark email as sent', error);
    }

    // Update email log with sent status
    await updateEmailLog(supabase, emailId, 'sent', messageId);
  } catch (error) {
    logError('Error marking email as sent', error);
  }
}

/**
 * Schedule a retry for a failed email
 */
async function scheduleRetry(supabase: any, email: QueueItem, errorMessage: string): Promise<void> {
  try {
    const retryCount = email.retry_count + 1;
    const delay = RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const scheduledAt = new Date(Date.now() + delay);

    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        retry_count: retryCount,
        scheduled_at: scheduledAt.toISOString(),
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', email.id);

    if (error) {
      logError('Failed to schedule retry', error);
    }

    logStep('Scheduled retry', {
      emailId: email.id,
      retryCount,
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    logError('Error scheduling retry', error);
  }
}

/**
 * Mark email as permanently failed
 */
async function markAsFailed(supabase: any, emailId: string, errorMessage: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    if (error) {
      logError('Failed to mark email as failed', error);
    }

    // Update email log with failed status
    await updateEmailLog(supabase, emailId, 'failed', undefined, errorMessage);
  } catch (error) {
    logError('Error marking email as failed', error);
  }
}

/**
 * Update email log with status
 */
async function updateEmailLog(
  supabase: any,
  queueId: string,
  status: string,
  messageId?: string,
  errorMessage?: string
): Promise<void> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (messageId) {
      updates.provider_message_id = messageId;
    }

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    } else if (status === 'failed') {
      updates.failed_at = new Date().toISOString();
      if (errorMessage) {
        updates.error_message = errorMessage;
      }
    }

    const { error } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('queue_id', queueId);

    if (error) {
      logError('Failed to update email log', error);
    }
  } catch (error) {
    logError('Error updating email log', error);
  }
}

/**
 * Process a single email
 */
async function processEmail(
  supabase: any,
  email: QueueItem,
  provider: EmailProvider
): Promise<ProcessResult> {
  try {
    // Send the email
    const result = await sendEmail(email, provider);

    if (result.success) {
      // Mark as sent
      await markAsSent(supabase, email.id, result.messageId);

      logStep('Email sent successfully', {
        id: email.id,
        to: email.to_address,
        messageId: result.messageId,
      });

      return {
        id: email.id,
        success: true,
        shouldRetry: false,
      };
    } else {
      // Email failed to send
      const shouldRetry = email.retry_count < email.max_retries;

      if (shouldRetry) {
        // Schedule retry
        await scheduleRetry(supabase, email, result.error || 'Unknown error');

        logStep('Email failed, scheduled retry', {
          id: email.id,
          retryCount: email.retry_count + 1,
          error: result.error,
        });

        return {
          id: email.id,
          success: false,
          error: result.error,
          shouldRetry: true,
        };
      } else {
        // Mark as permanently failed
        await markAsFailed(supabase, email.id, result.error || 'Unknown error');

        logStep('Email permanently failed', {
          id: email.id,
          error: result.error,
        });

        return {
          id: email.id,
          success: false,
          error: result.error,
          shouldRetry: false,
        };
      }
    }
  } catch (error) {
    logError('Error processing email', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const shouldRetry = email.retry_count < email.max_retries;

    if (shouldRetry) {
      await scheduleRetry(supabase, email, errorMessage);
    } else {
      await markAsFailed(supabase, email.id, errorMessage);
    }

    return {
      id: email.id,
      success: false,
      error: errorMessage,
      shouldRetry,
    };
  }
}

/**
 * Process a batch of emails
 */
async function processBatch(supabase: any, provider: EmailProvider): Promise<ProcessResult[]> {
  try {
    // Fetch pending emails
    const emails = await fetchPendingEmails(supabase, BATCH_SIZE);

    if (emails.length === 0) {
      logStep('No pending emails to process');
      return [];
    }

    logStep(`Processing ${emails.length} emails`);

    // Mark emails as processing
    const emailIds = emails.map(e => e.id);
    await markAsProcessing(supabase, emailIds);

    // Process each email
    const results: ProcessResult[] = [];
    for (const email of emails) {
      const result = await processEmail(supabase, email, provider);
      results.push(result);
    }

    return results;
  } catch (error) {
    logError('Error processing batch', error);
    return [];
  }
}

/**
 * Check queue health and send alerts if needed
 */
async function checkQueueHealth(supabase: any): Promise<void> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get queue statistics
    const { data: queueStats, error: statsError } = await supabase
      .from('email_queue')
      .select('status, created_at')
      .in('status', ['pending', 'processing', 'failed']);

    if (statsError) {
      logError('Failed to get queue stats', statsError);
      return;
    }

    const pending = queueStats?.filter((e: any) => e.status === 'pending').length || 0;
    const processing = queueStats?.filter((e: any) => e.status === 'processing').length || 0;
    const queueDepth = pending + processing;

    // Get oldest pending email
    const { data: oldestEmail } = await supabase
      .from('email_queue')
      .select('created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const oldestPendingAge = oldestEmail
      ? Math.floor((now.getTime() - new Date(oldestEmail.created_at).getTime()) / (60 * 1000))
      : 0;

    // Get recent failures
    const { data: recentFailures } = await supabase
      .from('email_queue')
      .select('id')
      .eq('status', 'failed')
      .gte('updated_at', oneHourAgo.toISOString());

    const recentFailureCount = recentFailures?.length || 0;

    // Log health metrics
    logStep('Queue health check', {
      queueDepth,
      pending,
      processing,
      oldestPendingAge,
      recentFailures: recentFailureCount,
    });

    // Alert conditions
    const alerts: string[] = [];

    if (queueDepth >= 500) {
      alerts.push(`CRITICAL: Queue depth is ${queueDepth} (threshold: 500)`);
    } else if (queueDepth >= 100) {
      alerts.push(`WARNING: Queue depth is ${queueDepth} (threshold: 100)`);
    }

    if (oldestPendingAge >= 60) {
      alerts.push(`CRITICAL: Oldest pending email is ${oldestPendingAge} minutes old (threshold: 60)`);
    } else if (oldestPendingAge >= 30) {
      alerts.push(`WARNING: Oldest pending email is ${oldestPendingAge} minutes old (threshold: 30)`);
    }

    if (recentFailureCount >= 50) {
      alerts.push(`CRITICAL: ${recentFailureCount} emails failed in the last hour (threshold: 50)`);
    } else if (recentFailureCount >= 20) {
      alerts.push(`WARNING: ${recentFailureCount} emails failed in the last hour (threshold: 20)`);
    }

    if (alerts.length > 0) {
      logStep('ALERTS', { alerts });
      // In a production system, you would send these alerts to a monitoring service
      // or notification system (e.g., Slack, PagerDuty, email)
    }
  } catch (error) {
    logError('Error checking queue health', error);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    logStep('Queue processing job started');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });

    // Get active email provider
    const provider = await getActiveProvider(supabase);

    if (!provider) {
      logStep('No active email provider configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active email provider configured',
          processed: 0,
          succeeded: 0,
          failed: 0,
          retried: 0,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    logStep('Using email provider', { provider: provider.name });

    // Process batch of emails
    const results = await processBatch(supabase, provider);

    // Calculate statistics
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success && !r.shouldRetry).length;
    const retried = results.filter(r => !r.success && r.shouldRetry).length;

    // Check queue health
    await checkQueueHealth(supabase);

    const summary = {
      success: true,
      processed: results.length,
      succeeded,
      failed,
      retried,
    };

    logStep('Queue processing job completed', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError('Queue processing job failed', { message });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Queue processing failed',
        processed: 0,
        succeeded: 0,
        failed: 0,
        retried: 0,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
