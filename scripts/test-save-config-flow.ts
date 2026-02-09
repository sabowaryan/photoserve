/**
 * Test the full saveProviderConfig flow
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { EmailProviderService } from '../src/lib/services/email-provider.service';
import type { ResendProviderConfig } from '../src/lib/email/providers/types';
import type { Database } from '../src/lib/supabase/types';

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('❌ Required environment variables not set');
    process.exit(1);
  }

  // Set encryption key
  process.env.EMAIL_PROVIDER_ENCRYPTION_KEY = 'test-encryption-key-for-integration-testing-only';

  console.log('Testing full saveProviderConfig flow...\n');

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  const service = new EmailProviderService(supabase);

  const config: ResendProviderConfig = {
    provider: 'resend',
    isActive: true,
    config: {
      apiKey: apiKey,
    },
  };

  console.log('1. Config to save:', {
    provider: config.provider,
    isActive: config.isActive,
    apiKey: config.config.apiKey.substring(0, 10) + '...',
  });

  console.log('\n2. Calling saveProviderConfig...');
  try {
    const providerId = await service.saveProviderConfig(config);
    console.log('✅ Provider saved successfully!');
    console.log('Provider ID:', providerId);

    // Try to retrieve it
    console.log('\n3. Retrieving active provider...');
    const activeProvider = await service.getActiveProvider();
    console.log('✅ Active provider retrieved:', activeProvider.name);

    // Test connection
    console.log('\n4. Testing connection through service...');
    const connectionTest = await service.testProviderConnection('resend');
    console.log('Connection test result:', connectionTest);

    if (connectionTest) {
      console.log('✅ All tests PASSED!');
    } else {
      console.log('❌ Connection test failed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

main();
