/**
 * Script to verify AI service configuration
 * Run with: node scripts/verifyAI.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const aiService = require('../services/aiService');

console.log('\n🔍 AI Service Verification\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`   AI_CHAT_ENABLED: ${process.env.AI_CHAT_ENABLED || 'not set (defaults to true)'}`);
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set (' + process.env.OPENAI_API_KEY.substring(0, 7) + '...)' : 'NOT SET'}`);
console.log(`   AI_MODEL: ${process.env.AI_MODEL || 'gpt-3.5-turbo (default)'}`);

// Check AI service status
console.log('\n🤖 AI Service Status:');
console.log(`   Enabled: ${aiService.enabled ? '✅ Yes' : '❌ No'}`);
console.log(`   Has API Key: ${aiService.apiKey ? '✅ Yes' : '❌ No'}`);
console.log(`   Model: ${aiService.model}`);

// Check knowledge base
console.log('\n📚 Knowledge Base:');
if (aiService.knowledgeBase) {
  console.log('   Status: ✅ Loaded');
  console.log(`   Platform: ${aiService.knowledgeBase.platform?.name || 'N/A'}`);
  console.log(`   Services: ${Object.keys(aiService.knowledgeBase.services || {}).length}`);
  console.log(`   Common Questions: ${Object.keys(aiService.knowledgeBase.commonQuestions || {}).length}`);
  console.log(`   Tech Stack Info: ${aiService.knowledgeBase.platform?.techStack ? '✅ Included' : '❌ Missing'}`);
  
  // Show tech stack
  if (aiService.knowledgeBase.platform?.techStack) {
    console.log('\n   Tech Stack Details:');
    console.log(`      Frontend: ${aiService.knowledgeBase.platform.techStack.frontend?.join(', ') || 'N/A'}`);
    console.log(`      Backend: ${aiService.knowledgeBase.platform.techStack.backend?.join(', ') || 'N/A'}`);
    console.log(`      Architecture: ${aiService.knowledgeBase.platform.techStack.architecture || 'N/A'}`);
  }
} else {
  console.log('   Status: ❌ Not loaded');
}

// Test response generation
console.log('\n🧪 Testing Response Generation:');
console.log('   Test Question: "tech stack used"');

(async () => {
  try {
    const response = await aiService.generateResponse('tech stack used', {});
    console.log(`   Response: ${response.substring(0, 100)}...`);
    console.log(`   Response Length: ${response.length} characters`);
    
    if (aiService.apiKey) {
      console.log('\n✅ Using OpenAI API for responses');
    } else {
      console.log('\n⚠️  Using rule-based fallback (no API key)');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Verification complete!\n');
})();

