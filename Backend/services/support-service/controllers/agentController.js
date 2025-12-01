const SupportAgent = require('../models/SupportAgent');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getAgentJWTSecret } = require('../utils/getJWTSecret');

// Agent login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Email and password are required',
        data: null
      });
    }

    const agent = await SupportAgent.findOne({ email: email.toLowerCase() });
    
    if (!agent) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials',
        data: null
      });
    }

    if (!agent.isActive) {
      return res.status(401).json({
        status: 401,
        message: 'Your account has been deactivated. Please contact administrator.',
        data: null
      });
    }

    const isPasswordCorrect = await agent.isPasswordCorrect(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials',
        data: null
      });
    }

    // Generate JWT token - use centralized secret getter
    const expireIn = process.env.AGENT_ACCESS_TOKEN_EXPIRY || '8h';
    const secret = getAgentJWTSecret();
    
    if (!secret) {
      console.error('No JWT secret configured for agent tokens!');
      return res.status(500).json({
        status: 500,
        message: 'Server configuration error: Missing JWT secret. Set AGENT_ACCESS_TOKEN_SECRET, ADMIN_ACCESS_TOKEN_SECRET, or ACCESS_TOKEN_SECRET',
        data: null
      });
    }
    
    console.log('Agent token being signed with secret type:', 
      process.env.AGENT_ACCESS_TOKEN_SECRET ? 'AGENT_ACCESS_TOKEN_SECRET' :
      process.env.ADMIN_ACCESS_TOKEN_SECRET ? 'ADMIN_ACCESS_TOKEN_SECRET' :
      'ACCESS_TOKEN_SECRET'
    );
    
    const token = jwt.sign(
      {
        id: agent._id.toString(),
        email: agent.email,
        fullname: agent.fullname,
        role: agent.role,
        type: 'agent'
      },
      secret,
      { expiresIn: expireIn }
    );

    // Update last active
    agent.lastActiveAt = new Date();
    await agent.save();

    return res.status(200).json({
      status: 200,
      message: 'Agent logged in successfully',
      data: {
        token,
        agent: {
          id: agent._id,
          email: agent.email,
          fullname: agent.fullname,
          role: agent.role,
          status: agent.status,
          avatar: agent.avatar
        }
      }
    });
  } catch (error) {
    console.error('Agent login error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Update agent status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const agentId = req.agent.id;

    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid status. Must be online, offline, or away',
        data: null
      });
    }

    const agent = await SupportAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    agent.status = status;
    agent.lastActiveAt = new Date();
    await agent.save();

    return res.status(200).json({
      status: 200,
      message: 'Status updated successfully',
      data: { status: agent.status }
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Get agent dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const agentId = req.agent.id;

    const agent = await SupportAgent.findById(agentId).select('-password');
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    // Get assigned tickets
    const assignedTicketsRaw = await Ticket.find({
      assignedAgentId: agentId,
      status: { $in: ['open', 'ongoing'] }
    })
    .sort({ lastMessageAt: -1 })
    .limit(50);

    // Manually populate customer data from Customer model
    const assignedTickets = await Promise.all(assignedTicketsRaw.map(async (ticket) => {
      const ticketObj = ticket.toObject();
      
      // Find customer by userId (which is stored in ticket.customerId)
      if (ticket.customerId) {
        const customer = await Customer.findOne({ userId: ticket.customerId });
        if (customer) {
          ticketObj.customerId = {
            _id: customer._id,
            email: customer.email,
            fullname: customer.fullname,
            phone: customer.phone
          };
        }
      }
      
      return ticketObj;
    }));

    // Get ticket statistics
    const stats = {
      activeTickets: assignedTickets.length,
      totalHandled: agent.stats.totalTicketsHandled,
      averageResponseTime: agent.stats.averageResponseTime,
      averageRating: agent.stats.averageRating,
      totalRatings: agent.stats.totalRatings
    };

    return res.status(200).json({
      status: 200,
      message: 'Dashboard data retrieved successfully',
      data: {
        agent,
        tickets: assignedTickets,
        stats
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Get agent profile
exports.getProfile = async (req, res) => {
  try {
    const agentId = req.agent.id;

    const agent = await SupportAgent.findById(agentId).select('-password');
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Profile retrieved successfully',
      data: { agent }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Update agent profile
exports.updateProfile = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const { fullname, avatar } = req.body;

    const agent = await SupportAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    if (fullname) agent.fullname = fullname;
    if (avatar) agent.avatar = avatar;

    await agent.save();

    return res.status(200).json({
      status: 200,
      message: 'Profile updated successfully',
      data: {
        agent: {
          id: agent._id,
          email: agent.email,
          fullname: agent.fullname,
          avatar: agent.avatar
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

