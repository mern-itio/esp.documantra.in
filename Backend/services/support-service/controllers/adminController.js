const mongoose = require('mongoose');
const SupportAgent = require('../models/SupportAgent');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const { routeTicketToAgent } = require('../utils/ticketRouter');
const { removeTicketFromAgent } = require('../utils/ticketRouter');

// Get all agents with their status
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await SupportAgent.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Agents are from support-service DB, use their IDs directly
    const agentsWithStats = agents.map(agent => ({
      ...agent.toObject(),
      activeTickets: agent.currentTickets.length
    }));

    return res.status(200).json({
      status: 200,
      message: 'Agents retrieved successfully',
      data: { agents: agentsWithStats }
    });
  } catch (error) {
    console.error('Get all agents error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Create agent (admin only)
exports.createAgent = async (req, res) => {
  try {
    // Check if user is admin (not just agent)
    if (req.admin?.role !== 'admin') {
      return res.status(403).json({
        status: 403,
        message: 'Access denied. Admin role required to create agents.',
        data: null
      });
    }

    const { email, password, fullname, role } = req.body;

    if (!email || !password || !fullname) {
      return res.status(400).json({
        status: 400,
        message: 'Email, password, and fullname are required',
        data: null
      });
    }

    // Check if agent already exists
    const existingAgent = await SupportAgent.findOne({ email: email.toLowerCase() });
    if (existingAgent) {
      return res.status(400).json({
        status: 400,
        message: 'Agent with this email already exists',
        data: null
      });
    }

    const agent = new SupportAgent({
      email: email.toLowerCase(),
      password,
      fullname,
      role: role || 'agent'
    });
    await agent.save();

    return res.status(201).json({
      status: 201,
      message: 'Agent created successfully',
      data: {
        agent: {
          id: agent._id,
          email: agent.email,
          fullname: agent.fullname,
          role: agent.role
        }
      }
    });
  } catch (error) {
    console.error('Create agent error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Update agent (admin only for role/isActive changes)
exports.updateAgent = async (req, res) => {
  try {
    // Check if user is admin for sensitive changes
    const isAdmin = req.admin?.role === 'admin';
    const { role, isActive } = req.body;
    
    if ((role || typeof isActive === 'boolean') && !isAdmin) {
      return res.status(403).json({
        status: 403,
        message: 'Access denied. Admin role required to modify agent role or active status.',
        data: null
      });
    }

    const { agentId } = req.params;
    const { fullname, status } = req.body;

    const agent = await SupportAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    // Allow agents to update their own status
    if (status && (isAdmin || req.admin?.id === agentId.toString())) {
      agent.status = status;
    }
    if (fullname) agent.fullname = fullname;
    if (role && isAdmin) agent.role = role;
    if (typeof isActive === 'boolean' && isAdmin) agent.isActive = isActive;

    await agent.save();

    return res.status(200).json({
      status: 200,
      message: 'Agent updated successfully',
      data: {
        agent: {
          id: agent._id,
          email: agent.email,
          fullname: agent.fullname,
          role: agent.role,
          status: agent.status,
          isActive: agent.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update agent error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Delete agent (admin only)
exports.deleteAgent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.admin?.role !== 'admin') {
      return res.status(403).json({
        status: 403,
        message: 'Access denied. Admin role required to delete agents.',
        data: null
      });
    }

    const { agentId } = req.params;

    const agent = await SupportAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        status: 404,
        message: 'Agent not found',
        data: null
      });
    }

    // Check if agent has active tickets
    const activeTickets = await Ticket.countDocuments({
      assignedAgentId: agentId,
      status: { $in: ['open', 'ongoing'] }
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        status: 400,
        message: `Cannot delete agent with ${activeTickets} active tickets. Please reassign tickets first.`,
        data: null
      });
    }

    await SupportAgent.findByIdAndDelete(agentId);

    return res.status(200).json({
      status: 200,
      message: 'Agent deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Reassign ticket
exports.reassignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { toAgentId, toAgentEmail } = req.body;

    if (!toAgentId && !toAgentEmail) {
      return res.status(400).json({
        status: 400,
        message: 'Target agent ID or email is required',
        data: null
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
        data: null
      });
    }

    // Find agent in support-service database (where agents are stored)
    let toAgent;
    if (toAgentId) {
      toAgent = await SupportAgent.findById(toAgentId);
    }
    
    if (!toAgent && toAgentEmail) {
      toAgent = await SupportAgent.findOne({ email: toAgentEmail.toLowerCase() });
    }

    if (!toAgent || !toAgent.isActive) {
      return res.status(404).json({
        status: 404,
        message: 'Target agent not found or inactive',
        data: null
      });
    }

    // Use support-service agent ID for assignment (consistent with login)
    const agentIdForAssignment = toAgent._id.toString();

    // Remove from old agent if exists
    if (ticket.assignedAgentId) {
      const fromAgent = await SupportAgent.findById(ticket.assignedAgentId);
      if (fromAgent) {
        fromAgent.currentTickets = fromAgent.currentTickets.filter(
          t => t.ticketId.toString() !== ticketId.toString()
        );
        await fromAgent.save();
      }

      // Record transfer
      ticket.transferHistory.push({
        fromAgentId: ticket.assignedAgentId,
        toAgentId: agentIdForAssignment,
        reason: 'Admin reassignment',
        transferredAt: new Date()
      });
    }

    // Assign to new agent (use auth-service agent ID for consistency)
    ticket.assignedAgentId = agentIdForAssignment;
    ticket.updatedAt = new Date();
    await ticket.save();

    // Add to new agent's current tickets
    toAgent.currentTickets.push({
      ticketId: ticket._id,
      assignedAt: new Date()
    });
    await toAgent.save();

    return res.status(200).json({
      status: 200,
      message: 'Ticket reassigned successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Reassign ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date filters
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total tickets
    const totalTickets = await Ticket.countDocuments(dateFilter);
    const openTickets = await Ticket.countDocuments({ ...dateFilter, status: 'open' });
    const ongoingTickets = await Ticket.countDocuments({ ...dateFilter, status: 'ongoing' });
    const closedTickets = await Ticket.countDocuments({ ...dateFilter, status: 'closed' });

    // Average response time
    const ticketsWithResponse = await Ticket.find({
      ...dateFilter,
      firstResponseAt: { $exists: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    ticketsWithResponse.forEach(ticket => {
      if (ticket.firstResponseAt && ticket.createdAt) {
        const responseTime = (ticket.firstResponseAt - ticket.createdAt) / 1000; // in seconds
        totalResponseTime += responseTime;
        responseCount += 1;
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // SLA performance (assuming SLA is 1 hour for first response)
    const slaThreshold = 3600; // 1 hour in seconds
    const slaCompliantTickets = ticketsWithResponse.filter(ticket => {
      if (ticket.firstResponseAt && ticket.createdAt) {
        const responseTime = (ticket.firstResponseAt - ticket.createdAt) / 1000;
        return responseTime <= slaThreshold;
      }
      return false;
    }).length;

    const slaPerformance = responseCount > 0 
      ? (slaCompliantTickets / responseCount) * 100 
      : 0;

    // Agent statistics
    const agents = await SupportAgent.find().select('stats fullname email');
    const agentStats = agents.map(agent => ({
      id: agent._id,
      fullname: agent.fullname,
      email: agent.email,
      totalTicketsHandled: agent.stats.totalTicketsHandled,
      averageResponseTime: agent.stats.averageResponseTime,
      averageRating: agent.stats.averageRating,
      totalRatings: agent.stats.totalRatings
    }));

    // Tickets by priority
    const ticketsByPriority = {
      low: await Ticket.countDocuments({ ...dateFilter, priority: 'low' }),
      medium: await Ticket.countDocuments({ ...dateFilter, priority: 'medium' }),
      high: await Ticket.countDocuments({ ...dateFilter, priority: 'high' }),
      urgent: await Ticket.countDocuments({ ...dateFilter, priority: 'urgent' })
    };

    // Tickets by category
    const ticketsByCategory = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      status: 200,
      message: 'Analytics retrieved successfully',
      data: {
        overview: {
          totalTickets,
          openTickets,
          ongoingTickets,
          closedTickets
        },
        performance: {
          averageResponseTime: Math.round(averageResponseTime),
          slaPerformance: Math.round(slaPerformance * 100) / 100,
          slaCompliantTickets,
          totalTicketsWithResponse: responseCount
        },
        agentStats,
        ticketsByPriority,
        ticketsByCategory
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Get all tickets (admin view)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, agentId, page = 1, limit = 50, includeHelpSupport } = req.query;

    const query = {};
    // Ticket center should not include landing Help & Support form queries by default.
    if (String(includeHelpSupport || '').toLowerCase() !== 'true') {
      query['metadata.source'] = { $ne: 'landing_help_support' };
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    
    // If agentId is provided in query, use it (convert to ObjectId for proper matching)
    if (agentId) {
      try {
        // Convert string agentId to ObjectId for proper MongoDB matching
        query.assignedAgentId = new mongoose.Types.ObjectId(agentId);
      } catch (err) {
        console.error('Invalid agentId format:', err);
        return res.status(400).json({
          status: 400,
          message: 'Invalid agent ID format',
          data: null
        });
      }
    } else if (req.admin && req.admin.role === 'agent') {
      if (req.admin.id) {
        try {
          // Convert string ID to ObjectId for proper MongoDB matching
          query.assignedAgentId = new mongoose.Types.ObjectId(req.admin.id);
          // console.log(`Agent ${req.admin.email}: Filtering tickets by agentId: ${req.admin.id} (converted to ObjectId: ${query.assignedAgentId})`);
        } catch (err) {
          console.error('Invalid agent ID in JWT:', err);
          return res.status(400).json({
            status: 400,
            message: 'Invalid agent ID in token',
            data: null
          });
        }
      }
    }

    const tickets = await Ticket.find(query)
      .populate('assignedAgentId', 'fullname email avatar status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate customer data from Customer model
    const ticketsWithCustomer = await Promise.all(tickets.map(async (ticket) => {
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
        } else {
          // Customer not found, return basic info
          ticketObj.customerId = {
            _id: ticket.customerId,
            email: 'Unknown',
            fullname: 'Unknown Customer'
          };
        }
      }
      
      return ticketObj;
    }));

    const total = await Ticket.countDocuments(query);

    return res.status(200).json({
      status: 200,
      message: 'Tickets retrieved successfully',
      data: {
        tickets: ticketsWithCustomer,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Admin dashboard: fetch support queries summary (separate from ticket center view)
exports.getDashboardQueries = async (req, res) => {
  try {
    const { limit = 20, source } = req.query;
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));

    const query = {};
    if (source) {
      query['metadata.source'] = String(source).trim();
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const items = await Promise.all(
      tickets.map(async (ticket) => {
        const firstMessage = await Message.findOne({ ticketId: ticket._id }).sort({ createdAt: 1 });
        const customer = ticket.customerId
          ? await Customer.findOne({ userId: ticket.customerId })
          : null;
        return {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          source: ticket?.metadata?.source || null,
          createdAt: ticket.createdAt,
          customer: customer
            ? {
                fullname: customer.fullname,
                email: customer.email,
                phone: customer.phone || null,
              }
            : null,
          messagePreview: firstMessage?.content ? String(firstMessage.content).slice(0, 240) : '',
        };
      })
    );

    return res.status(200).json({
      status: 200,
      message: 'Dashboard queries retrieved successfully',
      data: { queries: items },
    });
  } catch (error) {
    console.error('Get dashboard queries error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null,
    });
  }
};

// Alias endpoint for admin dashboard consumers
exports.getQueries = exports.getDashboardQueries;

// Dedicated endpoint: only Help & Support page queries (exclude general ticket center data)
exports.getHelpSupportQueries = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const query = { 'metadata.source': 'landing_help_support' };

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Ticket.countDocuments(query);

    const items = await Promise.all(
      tickets.map(async (ticket) => {
        const firstMessage = await Message.findOne({ ticketId: ticket._id }).sort({ createdAt: 1 });
        const customer = ticket.customerId
          ? await Customer.findOne({ userId: ticket.customerId })
          : null;

        return {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          customer: customer
            ? {
                fullname: customer.fullname,
                email: customer.email,
                phone: customer.phone || null,
              }
            : null,
          messagePreview: firstMessage?.content ? String(firstMessage.content).slice(0, 240) : '',
        };
      })
    );

    return res.status(200).json({
      status: 200,
      message: 'Help & Support queries retrieved successfully',
      data: {
        queries: items,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    console.error('Get Help & Support queries error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null,
    });
  }
};

// Close only Help & Support query tickets (landing page submissions)
exports.closeHelpSupportQuery = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Query ticket not found',
        data: null,
      });
    }

    if (ticket?.metadata?.source !== 'landing_help_support') {
      return res.status(400).json({
        status: 400,
        message: 'This ticket is not a Help & Support query',
        data: null,
      });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({
        status: 400,
        message: 'Query ticket is already closed',
        data: null,
      });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.updatedAt = new Date();
    await ticket.save();

    const customer = await Customer.findOne({ userId: ticket.customerId });
    if (customer && customer.activeTickets > 0) {
      customer.activeTickets -= 1;
      await customer.save();
    }

    if (ticket.assignedAgentId) {
      await removeTicketFromAgent(ticket.assignedAgentId, ticket._id);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticketId}`).emit('ticket_updated', {
        ticketId: ticket._id.toString(),
        status: ticket.status,
        closedAt: ticket.closedAt,
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Help & Support query closed successfully',
      data: { ticket },
    });
  } catch (error) {
    console.error('Close Help & Support query error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null,
    });
  }
};

// Admin: Close ticket
exports.closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
        data: null
      });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({
        status: 400,
        message: 'Ticket is already closed',
        data: null
      });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.updatedAt = new Date();
    await ticket.save();

    // Update customer active tickets count
    const customer = await Customer.findOne({ userId: ticket.customerId });
    if (customer && customer.activeTickets > 0) {
      customer.activeTickets -= 1;
      await customer.save();
    }

    // Remove from agent's current tickets if assigned
    if (ticket.assignedAgentId) {
      await removeTicketFromAgent(ticket.assignedAgentId, ticket._id);
    }

    // Emit ticket_updated event to notify all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticketId}`).emit('ticket_updated', {
        ticketId: ticket._id.toString(),
        status: ticket.status,
        closedAt: ticket.closedAt
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Ticket closed successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Admin close ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

