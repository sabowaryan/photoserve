/**
 * Generate VAPID keys for push notifications
 * Run this script once to generate keys for your application
 * 
 * Usage: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your .env file:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:contact@piksend.com');
console.log('\n⚠️  Keep the private key secret! Do not commit it to version control.');
