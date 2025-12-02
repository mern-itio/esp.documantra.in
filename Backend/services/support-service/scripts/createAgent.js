const mongoose = require('mongoose');
const SupportAgent = require('../models/SupportAgent');
const dotenv = require('dotenv');

dotenv.config();

const createAgent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create default agent
    const agentData = {
      email: process.argv[2] || 'agent@draftnsign.com',
      password: process.argv[3] || 'agent123',
      fullname: process.argv[4] || 'Support Agent',
      role: process.argv[5] || 'agent',
      status: 'offline',
      isActive: true
    };

    // Check if agent already exists
    const existingAgent = await SupportAgent.findOne({ email: agentData.email });
    if (existingAgent) {
      console.log('Agent already exists with this email');
      process.exit(0);
    }

    // Create agent
    const agent = new SupportAgent(agentData);
    await agent.save();

    console.log('Agent created successfully!');
    console.log('Email:', agent.email);
    console.log('Password:', agentData.password);
    console.log('Role:', agent.role);

    process.exit(0);
  } catch (error) {
    console.error('Error creating agent:', error);
    process.exit(1);
  }
};

createAgent();

