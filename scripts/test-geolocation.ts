/**
 * Script de test pour la géolocalisation IP
 * 
 * Usage:
 * npx tsx scripts/test-geolocation.ts
 */

import { geolocationService } from '../src/lib/services/geolocation.service';

async function testGeolocation() {
  console.log('🧪 Test de Géolocalisation IP\n');
  
  // Test 1: IP publique Google DNS
  console.log('Test 1: IP publique (Google DNS)');
  const result1 = await geolocationService.getCountryFromIP('8.8.8.8');
  console.log('IP: 8.8.8.8');
  console.log('Pays:', result1);
  console.log('✅ Attendu: US\n');
  
  // Test 2: IP publique Cloudflare
  console.log('Test 2: IP publique (Cloudflare)');
  const result2 = await geolocationService.getCountryFromIP('1.1.1.1');
  console.log('IP: 1.1.1.1');
  console.log('Pays:', result2);
  console.log('✅ Attendu: AU (Australie)\n');
  
  // Test 3: IP locale (doit retourner null)
  console.log('Test 3: IP locale (localhost)');
  const result3 = await geolocationService.getCountryFromIP('127.0.0.1');
  console.log('IP: 127.0.0.1');
  console.log('Pays:', result3);
  console.log('✅ Attendu: null (IP privée)\n');
  
  // Test 4: IP privée (doit retourner null)
  console.log('Test 4: IP privée (réseau local)');
  const result4 = await geolocationService.getCountryFromIP('192.168.1.1');
  console.log('IP: 192.168.1.1');
  console.log('Pays:', result4);
  console.log('✅ Attendu: null (IP privée)\n');
  
  // Test 5: Détails complets
  console.log('Test 5: Détails complets');
  const result5 = await geolocationService.getDetailedLocation('8.8.8.8');
  console.log('IP: 8.8.8.8');
  console.log('Détails:', JSON.stringify(result5, null, 2));
  console.log('✅ Attendu: { countryCode: "US", countryName: "United States", city: "..." }\n');
  
  console.log('✅ Tests terminés !');
}

testGeolocation().catch(console.error);
