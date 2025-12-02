require('dotenv').config();
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Support Service Configuration Check\n');
console.log('='.repeat(50));

// Check JWT Secrets
const agentSecret = process.env.AGENT_ACCESS_TOKEN_SECRET;
const adminSecret = process.env.ADMIN_ACCESS_TOKEN_SECRET;
const accessSecret = process.env.ACCESS_TOKEN_SECRET;

console.log('\n📋 JWT Secrets:');
console.log(`   AGENT_ACCESS_TOKEN_SECRET: ${agentSecret ? '✅ Set (' + agentSecret.substring(0, 10) + '...)' : '❌ Not set'}`);
console.log(`   ADMIN_ACCESS_TOKEN_SECRET: ${adminSecret ? '✅ Set (' + adminSecret.substring(0, 10) + '...)' : '❌ Not set'}`);
console.log(`   ACCESS_TOKEN_SECRET: ${accessSecret ? '✅ Set (' + accessSecret.substring(0, 10) + '...)' : '❌ Not set'}`);

const effectiveSecret = agentSecret || adminSecret || accessSecret;
console.log(`\n🎯 Effective Secret: ${effectiveSecret ? '✅ Available' : '❌ MISSING!'}`);

if (!effectiveSecret) {
  console.log('\n⚠️  ERROR: No JWT secret found!');
  console.log('   Set at least one of:');
  console.log('   - AGENT_ACCESS_TOKEN_SECRET');
  console.log('   - ADMIN_ACCESS_TOKEN_SECRET');
  console.log('   - ACCESS_TOKEN_SECRET');
  console.log('\n   In: Backend/services/support-service/.env');
} else {
  console.log(`\n✅ Token authentication will use: ${agentSecret ? 'AGENT_ACCESS_TOKEN_SECRET' : adminSecret ? 'ADMIN_ACCESS_TOKEN_SECRET' : 'ACCESS_TOKEN_SECRET'}`);
}

// Check MongoDB
const mongoUri = process.env.MONGO_URI;
console.log(`\n📦 MongoDB URI: ${mongoUri ? '✅ Set' : '❌ Not set'}`);

// Check Port
const port = process.env.PORT || 2107;
console.log(`\n🚀 Port: ${port}`);

// Check CORS
const corsOrigin = process.env.CORS_ORIGIN;
console.log(`\n🌐 CORS Origin: ${corsOrigin || '* (all allowed)'}`);

console.log('\n' + '='.repeat(50));

if (!effectiveSecret) {
  console.log('\n❌ Configuration incomplete! Fix the issues above.\n');
  process.exit(1);
} else {
  console.log('\n✅ Configuration looks good!\n');
  process.exit(0);
}

