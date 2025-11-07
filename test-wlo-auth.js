#!/usr/bin/env node
/**
 * Test WLO Guest Credentials
 * Testet ob die Credentials für das Repository funktionieren
 */

require('dotenv').config();

const username = process.env.WLO_GUEST_USERNAME;
const password = process.env.WLO_GUEST_PASSWORD;
const baseUrl = process.env.WLO_REPOSITORY_BASE_URL || 'https://repository.staging.openeduhub.net/edu-sharing';

console.log('═══════════════════════════════════════════════════════');
console.log('🔐 WLO Guest Credentials Test');
console.log('═══════════════════════════════════════════════════════\n');

// Check if credentials are loaded
console.log('📋 Checking environment variables...');
console.log(`   Username: ${username ? '✅ Set' : '❌ NOT SET'}`);
console.log(`   Password: ${password ? '✅ Set' : '❌ NOT SET'}`);
console.log(`   Base URL: ${baseUrl}\n`);

if (!username || !password) {
  console.error('❌ Credentials not found in .env file!');
  console.error('   Make sure .env contains:');
  console.error('   WLO_GUEST_USERNAME=WLO-Upload');
  console.error('   WLO_GUEST_PASSWORD=wlo#upload!20');
  process.exit(1);
}

// Show credential lengths (but not values)
console.log('📊 Credential details:');
console.log(`   Username length: ${username.length} chars`);
console.log(`   Password length: ${password.length} chars`);
console.log(`   Username value: "${username}"`);
console.log(`   Password has # char: ${password.includes('#') ? 'Yes' : 'No'}`);
console.log(`   Password has ! char: ${password.includes('!') ? 'Yes' : 'No'}\n`);

// Test Authentication
console.log('🧪 Testing authentication with Repository...');
const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
console.log(`   Auth Header: Basic ${Buffer.from(`${username}:${password}`).toString('base64').substring(0, 20)}...\n`);

const testUrl = `${baseUrl}/rest/authentication/v1/validateSession`;
console.log(`   Testing URL: ${testUrl}\n`);

fetch(testUrl, {
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'Accept': 'application/json'
  }
})
.then(response => {
  console.log(`📡 Response Status: ${response.status} ${response.statusText}\n`);
  
  if (response.status === 200) {
    console.log('✅ SUCCESS: Credentials are valid!');
    console.log('   Repository accepted the authentication.\n');
    return response.json();
  } else if (response.status === 401) {
    console.log('❌ FAILURE: Authentication rejected (401 Unauthorized)');
    console.log('   The credentials are WRONG or the user does not exist.\n');
    console.log('   Possible issues:');
    console.log('   - Username is not exactly "WLO-Upload"');
    console.log('   - Password is not exactly "wlo#upload!20"');
    console.log('   - Credentials have quotes or spaces in .env');
    console.log('   - Repository user was disabled or password changed\n');
    throw new Error('Invalid credentials');
  } else {
    console.log(`⚠️  Unexpected status: ${response.status}`);
    throw new Error(`Unexpected response: ${response.statusText}`);
  }
})
.then(data => {
  if (data) {
    console.log('📦 Session data:');
    console.log(JSON.stringify(data, null, 2));
  }
})
.catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
