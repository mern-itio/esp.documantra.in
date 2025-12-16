const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/Admin');
const { isEmailValid } = require('@draftnsign/validators');
const mongoose = require('mongoose');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!password) return res.status(400).json({ message: 'Password required' });
    if (!isEmailValid(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await AdminUser.findOne({ email: normalizedEmail }); 
    
    if (admin) {
      if (admin.status === false) {
        return res.status(401).json({
          status: 401,
          message: "Your Admin Account has been suspended, please contact the System Owner",
          data: null
        });
      }

      const isPasswdCorrect = await bcrypt.compare(password, admin.password);
      if (!isPasswdCorrect) {
        return res.status(401).json({
          status: 401,
          message: "Invalid Credentials!!!",
          data: null
        });
      }

      const expireIn = process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h';
      const token = generateAdminAccessToken(admin, expireIn);

      const options = {
        httpOnly: true,
        sameSite: 'Strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      };

      return res.cookie('adminAccessToken', token, options).status(200).json({
        status: 200,
        message: "Admin logged in successfully",
        admin_id: admin._id,
        token: token,
        type: 'admin'
      });
    }
let agent = null;
    let supportServiceAgentId = null;
    let db = null;
    
    try {
      const currentDb = mongoose.connection.db;
      const currentDbName = currentDb.databaseName;
      
      // Check current database for agents
      const currentDbAgentsCollection = currentDb.collection('supportagents');
      const currentDbAgentsCount = await currentDbAgentsCollection.countDocuments();
      
      let allAgents = [];
      db = currentDb; // Set db in outer scope
      let dbName = currentDbName;
      
      if (currentDbAgentsCount > 0) {
        // Agents found in current database
        allAgents = await currentDbAgentsCollection.find({ 
          email: normalizedEmail 
        }).toArray();
      } else {
        // Try support-service database (support-db)
        try {
          const supportDb = mongoose.connection.useDb('support-db');
          db = supportDb.db;
          dbName = 'support-db';
          
          const collections = await db.listCollections().toArray();
          const supportAgentsCollection = db.collection('supportagents');
          const totalAgents = await supportAgentsCollection.countDocuments();
          
          if (totalAgents > 0) {
            allAgents = await supportAgentsCollection.find({ 
              email: normalizedEmail 
            }).toArray();
          }
        } catch (supportDbError) {
          console.error(`[AGENT LOGIN] Error accessing support-db database:`, supportDbError.message);
        }
      }
      
      if (allAgents.length === 0) {
        return res.status(401).json({
          status: 401,     
          message: "Invalid credentials. Please check your Email and Password",
          data: null                                                 
        });
      }
      
      let ticketsCollection = null;
      try {
        ticketsCollection = db.collection('tickets');
      } catch (err) {
        try {
          const supportDb = mongoose.connection.useDb('support-db');
          ticketsCollection = supportDb.db.collection('tickets');
        } catch (supportErr) {
          console.log(`[AGENT LOGIN] Cannot access tickets collection:`, supportErr.message);
        }
      }
      
      let ticketsWithAgent = [];
      if (ticketsCollection) {
        ticketsWithAgent = await ticketsCollection.find({
          assignedAgentId: { $in: allAgents.map(a => a._id) }
        }).limit(1).toArray();
       }
      
      if (ticketsWithAgent.length > 0) {
        supportServiceAgentId = ticketsWithAgent[0].assignedAgentId;
      } else {
        const agentWithTickets = allAgents.find(a => a.currentTickets && Array.isArray(a.currentTickets));
        if (agentWithTickets) {
          supportServiceAgentId = agentWithTickets._id;
       } else {
          allAgents.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
          supportServiceAgentId = allAgents[0]._id;
         }
      }
      
      const agentDoc = allAgents.find(a => a._id.toString() === supportServiceAgentId.toString());
      
      if (!agentDoc) {
        return res.status(401).json({
          status: 401,     
          message: "Invalid credentials. Please check your Email and Password",
          data: null                                                 
        });
      }
      
      agent = agentDoc; 
      
    } catch (dbError) {
      console.error('[AGENT LOGIN] Database error when looking up agent:', dbError);
      console.error('[AGENT LOGIN] Error stack:', dbError.stack);
      return res.status(500).json({
        status: 500,
        message: "Database error. Please try again later.",
        data: null
      });
    }
    
    if (!agent) {
      return res.status(401).json({
        status: 401,     
        message: "Invalid credentials. Please check your Email and Password",
        data: null                                                 
      });
    }

    // Check if agent is active
    if (agent.isActive === false) {
      return res.status(401).json({
        status: 401,
        message: "Your account has been deactivated. Please contact administrator.",
        data: null
      });
    }

    let isPasswordCorrect = false;
    try {
      if (!agent.password) {
        console.error(`[AGENT LOGIN] Agent ${agent.email} has no password field!`);
        return res.status(401).json({
          status: 401,
          message: "Invalid Credentials!!!",
          data: null
        });
      }
      isPasswordCorrect = await bcrypt.compare(password, agent.password);
    } catch (bcryptError) {
      console.error('[AGENT LOGIN] Bcrypt comparison error:', bcryptError);
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials!!!",
        data: null
      });
    }
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials!!!",
        data: null
      });
    }
    const expireIn = process.env.AGENT_ACCESS_TOKEN_EXPIRY || process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h';
    const secret = process.env.AGENT_ACCESS_TOKEN_SECRET || process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
    
    if (!secret) {
      console.error('No JWT secret configured for agent tokens!');
      return res.status(500).json({
        status: 500,
        message: 'Server configuration error',
        data: null
      });
    }
 
    const finalSupportServiceAgentId = supportServiceAgentId ? supportServiceAgentId.toString() : agent._id.toString();
    const token = jwt.sign(
      {
        id: finalSupportServiceAgentId, // Support-service agent ID (from ticket assignments)
        email: agent.email,
        fullname: agent.fullname || 'Agent',
        role: agent.role || 'agent',
        type: 'agent'
      },
      secret,
      { expiresIn: expireIn }
    );
     
    try {
      if (db) {
        const supportAgentsCollection = db.collection('supportagents');
        await supportAgentsCollection.updateOne(
          { _id: agent._id },
          { $set: { lastActiveAt: new Date() } }
        );
      }
    } catch (updateError) {
      console.error('[AGENT LOGIN] Error updating agent lastActiveAt:', updateError);
      // Continue anyway - not critical
    }

    const options = {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    };

      const responseData = {
        status: 200,
        message: "Agent logged in successfully",
        admin_id: finalSupportServiceAgentId,  
        agent_id: finalSupportServiceAgentId,  
        token: token,
        type: 'agent',
        agent: {
          id: finalSupportServiceAgentId,  
          email: agent.email,
          fullname: agent.fullname || 'Agent',
          role: agent.role || 'agent',
          status: agent.status || 'offline',
          avatar: agent.avatar || null
        }
      };   
     
      
      return res.cookie('adminAccessToken', token, options).status(200).json(responseData);

  } catch (error) {
    console.error("Admin/Agent Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

function generateAdminAccessToken(admin, expireIn) {
  return jwt.sign(
    { id: admin._id, role: 'admin', email: admin.email },
    process.env.ADMIN_ACCESS_TOKEN_SECRET,
    { expiresIn: expireIn }
  );
}

module.exports = { adminLogin };
