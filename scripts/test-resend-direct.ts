/**
 * Direct test of Resend API to verify credentials
 */

import dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';

async function main() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not set');
    process.exit(1);
  }

  console.log('Testing Resend API directly...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);

  const resend = new Resend(apiKey);

  try {
    console.log('\n1. Testing domains.list()...');
    const result = await resend.domains.list();
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.log('❌ Error:', result.error);
    } else {
      console.log('✅ Success! Domains:', result.data);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }

  try {
    console.log('\n2. Testing emails.send() with test data...');
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

main();
