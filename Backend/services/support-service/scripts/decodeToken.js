require('dotenv').config();
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const token = process.argv[2];

if (!token) {
  console.error('Usage: node decodeToken.js <token>');
  process.exit(1);
}

console.log('🔍 Token Analysis\n');
console.log('='.repeat(50));

// Decode without verification (just to see contents)
try {
  const decoded = jwt.decode(token, { complete: true });
  if (decoded) {
    console.log('\n📋 Token Header:');
    console.log(JSON.stringify(decoded.header, null, 2));
    
    console.log('\n📋 Token Payload:');
    console.log(JSON.stringify(decoded.payload, null, 2));
    console.log('\n🔑 Token Info:');
    console.log(`   Role: ${decoded.payload.role}`);
    console.log(`   Type: ${decoded.payload.type}`);
    console.log(`   Email: ${decoded.payload.email}`);
    console.log(`   ID: ${decoded.payload.id}`);
    
    if (decoded.payload.exp) {
      const expDate = new Date(decoded.payload.exp * 1000);
      console.log(`   Expires: ${expDate.toISOString()}`);
      console.log(`   Expired: ${expDate < new Date() ? 'YES ❌' : 'NO ✅'}`);
    }
  }
} catch (err) {
  console.error('Failed to decode token:', err.message);
}

console.log('\n' + '='.repeat(50));
console.log('\n🔐 Available Secrets:');

const secrets = [
  { name: 'AGENT_ACCESS_TOKEN_SECRET', value: process.env.AGENT_ACCESS_TOKEN_SECRET },
  { name: 'ADMIN_ACCESS_TOKEN_SECRET', value: process.env.ADMIN_ACCESS_TOKEN_SECRET },
  { name: 'ACCESS_TOKEN_SECRET', value: process.env.ACCESS_TOKEN_SECRET }
];

secrets.forEach(({ name, value }) => {
  if (value) {
    console.log(`   ${name}: ✅ Set (${value.substring(0, 10)}...)`);
    
    // Try to verify with this secret
    try {
      const verified = jwt.verify(token, value);
      console.log(`      ✅ Token VERIFIES with this secret!`);
      console.log(`      Verified payload:`, verified);
    } catch (err) {
      console.log(`      ❌ Token does NOT verify: ${err.message}`);
    }
  } else {
    console.log(`   ${name}: ❌ Not set`);
  }
});

console.log('\n');

