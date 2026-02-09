/**
 * Test encryption/decryption in EmailProviderService
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

  console.log('Testing EmailProviderService encryption/decryption...\n');

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  const service = new EmailProviderService(supabase);

  const config: ResendProviderConfig = {
    provider: 'resend',
    isActive: true,
    config: {
      apiKey: apiKey,
    },
  };

  console.log('1. Original config:', {
    provider: config.provider,
    apiKey: config.config.apiKey.substring(0, 10) + '...',
  });

  // Test encryption
  console.log('\n2. Testing encryption...');
  const encrypted = service['encryptConfig'](config.config);
  console.log('✅ Encrypted:', encrypted.substring(0, 50) + '...');

  // Test decryption
  console.log('\n3. Testing decryption...');
  const decrypted = service['decryptConfig'](encrypted);
  console.log('✅ Decrypted:', {
    apiKey: decrypted.apiKey.substring(0, 10) + '...',
  });

  // Verify they match
  if (decrypted.apiKey === config.config.apiKey) {
    console.log('✅ Encryption/decryption works correctly!');
  } else {
    console.log('❌ Encryption/decryption mismatch!');
  }

  // Test instantiation with decrypted config
  console.log('\n4. Testing provider instantiation with decrypted config...');
  const providerConfig: ResendProviderConfig = {
    provider: 'resend',
    isActive: true,
    config: decrypted as { apiKey: string; webhookSecret?: string },
  };

  const provider = service['instantiateProvider'](providerConfig);
  console.log('✅ Provider instantiated');

  console.log('\n5. Testing connection with instantiated provider...');
  const connectionResult = await provider.testConnection();
  console.log('Connection result:', connectionResult);

  if (connectionResult) {
    console.log('✅ Connection test PASSED');
  } else {
    console.log('❌ Connection test FAILED');
  }
}

main();
