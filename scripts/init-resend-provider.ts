/**
 * Initialize Resend Email Provider
 * 
 * This script sets up Resend as the active email provider in the database.
 * Run with: npx tsx scripts/init-resend-provider.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env' });

async function initResendProvider() {
  console.log('🔧 Initializing Resend Email Provider...\n');

  // Check required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const encryptionKey = process.env.EMAIL_PROVIDER_ENCRYPTION_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!resendApiKey) {
    console.error('❌ Missing RESEND_API_KEY environment variable');
    process.exit(1);
  }

  if (!encryptionKey) {
    console.error('❌ Missing EMAIL_PROVIDER_ENCRYPTION_KEY environment variable');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Encrypt the config
    const config = JSON.stringify({ apiKey: resendApiKey });
    const encryptedConfig = encryptConfig(config, encryptionKey);

    // Check if provider already exists
    const { data: existing, error: checkError } = await supabase
      .from('email_providers')
      .select('*')
      .eq('name', 'resend')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      console.log('📝 Resend provider already exists, updating...');
      
      // Update existing provider
      const { error: updateError } = await supabase
        .from('email_providers')
        .update({
          is_active: true,
          config: encryptedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('name', 'resend');

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Resend provider updated and activated');
    } else {
      console.log('📝 Creating new Resend provider...');
      
      // Insert new provider
      const { error: insertError } = await supabase
        .from('email_providers')
        .insert({
          name: 'resend',
          is_active: true,
          config: encryptedConfig,
        });

      if (insertError) {
        throw insertError;
      }

      console.log('✅ Resend provider created and activated');
    }

    // Verify configuration
    const { data: providers, error: listError } = await supabase
      .from('email_providers')
      .select('name, is_active');

    if (listError) {
      throw listError;
    }

    console.log('\n📋 Current email providers:');
    providers?.forEach((p: any) => {
      const status = p.is_active ? '✓ Active' : '  Inactive';
      console.log(`  ${status} - ${p.name}`);
    });

    console.log('\n✅ Setup complete!');
    console.log('\nYou can now send emails using Resend.');
    console.log('Run: .\\process-email-queue.ps1 to process queued emails');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Encrypt configuration using AES-256-GCM
 */
function encryptConfig(text: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Run the script
initResendProvider().catch(console.error);
