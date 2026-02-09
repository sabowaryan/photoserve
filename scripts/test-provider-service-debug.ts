/**
 * Debug test for provider service
 */

import dotenv from 'dotenv';
dotenv.config();

import { ResendProvider } from '../src/lib/email/providers/resend.provider';
import type { ResendProviderConfig } from '../src/lib/email/providers/types';

async function main() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not set');
    process.exit(1);
  }

  console.log('Testing Resend Provider instantiation and connection...\n');

  const config: ResendProviderConfig = {
    provider: 'resend',
    isActive: true,
    config: {
      apiKey: apiKey,
    },
  };

  console.log('1. Creating provider instance...');
  const provider = new ResendProvider(config);
  console.log('✅ Provider created');

  console.log('\n2. Testing connection...');
  try {
    const result = await provider.testConnection();
    console.log('Connection test result:', result);
    
    if (result) {
      console.log('✅ Connection test PASSED');
    } else {
      console.log('❌ Connection test FAILED');
    }
  } catch (error) {
    console.error('❌ Connection test threw error:', error);
  }

  console.log('\n3. Testing domains.list() directly...');
  try {
    const records = await provider.getDomainRecords('piksend.com');
    console.log('✅ Got domain records:', {
      dkimCount: records.dkim.length,
      spf: records.spf.value,
      dmarc: records.dmarc?.value,
    });
  } catch (error) {
    console.error('❌ Failed to get domain records:', error);
  }
}

main();
