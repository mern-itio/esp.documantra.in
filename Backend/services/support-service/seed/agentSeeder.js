require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from service directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('../config/db');
const SupportAgent = require('../models/SupportAgent');

// Default agents to seed
const defaultAgents = [
  {
    email: 'agent@draftnsign.com',
    password: 'agent123',
    fullname: 'Support Agent',
    role: 'agent',
    status: 'offline',
    isActive: true
  },
  {
    email: 'admin@draftnsign.com',
    password: 'admin123',
    fullname: 'Support Admin',
    role: 'admin',
    status: 'offline',
    isActive: true
  },
  {
    email: 'agent1@draftnsign.com',
    password: 'agent123',
    fullname: 'Agent One',
    role: 'agent',
    status: 'offline',
    isActive: true
  },
  {
    email: 'agent2@draftnsign.com',
    password: 'agent123',
    fullname: 'Agent Two',
    role: 'agent',
    status: 'offline',
    isActive: true
  }
];

async function seedAgents() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const agentData of defaultAgents) {
      try {
        // Check if agent already exists
        const existingAgent = await SupportAgent.findOne({ email: agentData.email });
        
        if (existingAgent) {
          console.log(`⚠️  Agent already exists: ${agentData.email} - Skipping`);
          skipped++;
          continue;
        }

        // Create new agent (password will be hashed automatically by pre-save hook)
        const agent = new SupportAgent(agentData);
        await agent.save();
        
        console.log(`✅ Created agent: ${agentData.fullname} (${agentData.email})`);
        console.log(`   Password: ${agentData.password}`);
        console.log(`   Role: ${agentData.role}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating agent ${agentData.email}:`, error.message);
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${defaultAgents.length}`);
    
    if (created > 0) {
      console.log('\n💡 You can now login with:');
      defaultAgents.forEach(agent => {
        if (!agent.email.includes('agent1') && !agent.email.includes('agent2')) {
          console.log(`   Email: ${agent.email} | Password: ${agent.password} | Role: ${agent.role}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeder
if (require.main === module) {
  seedAgents();
}

module.exports = { seedAgents, defaultAgents };

