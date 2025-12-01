require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables from auth-service directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('../config/db');

// SupportAgent schema (matching support-service)
const supportAgentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['agent', 'admin'],
    default: 'agent'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  currentTickets: [{
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    assignedAt: { type: Date, default: Date.now }
  }],
  stats: {
    totalTicketsHandled: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    totalResponseTime: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Hash password before saving
supportAgentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare passwords
supportAgentSchema.methods.isPasswordCorrect = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const SupportAgent = mongoose.models.SupportAgent || mongoose.model('SupportAgent', supportAgentSchema, 'supportagents');

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
    console.log('Connected to MongoDB (auth-service database)');
    
    let created = 0;
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

    // Verify agents were created
    const totalAgents = await SupportAgent.countDocuments();
    console.log(`\n📈 Total agents in database: ${totalAgents}`);

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

