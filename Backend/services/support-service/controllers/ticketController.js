const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const SupportAgent = require('../models/SupportAgent');
const { routeTicketToAgent, removeTicketFromAgent } = require('../utils/ticketRouter');
const mongoose = require('mongoose');
let sendEmail = null;
try {
  ({ sendEmail } = require('@draftnsign/email-lib'));
} catch {
  try {
    // Fallback for some local/dev setups where package linking is not applied.
    ({ sendEmail } = require('../../../packages/email-lib'));
  } catch {
    sendEmail = null;
  }
}

const normalizePublicCategory = (category) => {
  const c = String(category || '').toLowerCase().trim();
  if (['general', 'technical', 'billing', 'documentation', 'feature', 'bug', 'other'].includes(c)) return c;
  if (c === 'e-signatures' || c === 'esign' || c === 'esignatures') return 'technical';
  if (c === 'billing & plans') return 'billing';
  if (c === 'security & privacy') return 'other';
  if (c === 'getting started' || c === 'powerforms') return 'general';
  return 'other';
};

const categoryDisplayName = (category) => {
  const c = String(category || '').toLowerCase().trim();
  switch (c) {
    case 'general':
      return 'General Inquiry';
    case 'technical':
      return 'Technical Support';
    case 'billing':
      return 'Billing Question';
    case 'documentation':
      return 'Documentation';
    case 'feature':
      return 'Feature Request';
    case 'bug':
      return 'Bug Report';
    case 'other':
      return 'Other';
    default:
      return c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Other';
  }
};

function getSupportQueryEmailHtml({
  ticketNumber,
  subject,
  customerName,
  customerEmail,
  category,
  priority,
  source,
  createdAt,
  content,
}) {
  const appName = process.env.APP_NAME';
  const fmt = (v) => String(v ?? '-').replace(/[<>]/g, '');
  const safeTicket = fmt(ticketNumber);
  const safeSubject = fmt(subject);
  const safeCustomerName = fmt(customerName);
  const safeCustomerEmail = fmt(customerEmail);
    const safeCategory = fmt(categoryDisplayName(category));
  const safePriority = fmt(priority);
  const safeSource = fmt(source);
  const safeCreatedAt = fmt(createdAt);
  const safeContent = fmt(content).replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Query</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; margin:0 auto; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); background:#ffffff;">
          <tr>
            <td style="background:linear-gradient(90deg, #4D0080, #8E2DE2); padding:28px 34px; text-align:center;">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff;">${appName}</h1>
              <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.92);">New Help &amp; Support Query Received</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 24px;">
              <p style="margin:0 0 14px; font-size:15px; color:#334155;">A new support query has been submitted.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Ticket:</strong> ${safeTicket}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Subject:</strong> ${safeSubject}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Customer:</strong> ${safeCustomerName}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Email:</strong> ${safeCustomerEmail}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Category:</strong> ${safeCategory}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Priority:</strong> ${safePriority}</td></tr>
                <tr><td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;"><strong>Source:</strong> ${safeSource}</td></tr>
                <tr><td style="padding:10px 14px; font-size:13px; color:#334155;"><strong>Created At:</strong> ${safeCreatedAt}</td></tr>
              </table>

              <div style="margin-top:16px; background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #8E2DE2; border-radius:10px; padding:14px;">
                <p style="margin:0 0 8px; font-size:13px; font-weight:600; color:#334155;">Message</p>
                <p style="margin:0; font-size:14px; line-height:1.6; color:#475569;">${safeContent || '-'}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; background:#f8fafc; border-top:1px solid #e2e8f0;">
              <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function notifyAdminSupportQuery({ ticket, customer, content, source }) {
  try {
    if (!sendEmail) {
      console.warn('Support admin notification skipped: email-lib not available in support-service runtime');
      return;
    }
    const adminTo =
      process.env.SUPPORT_ADMIN_EMAIL ||
      process.env.ADMIN_SUPPORT_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      process.env.HELP_SUPPORT_EMAIL ||
      process.env.EMAIL_TO ||
      process.env.EMAIL_USER ||
      process.env.EMAIL_FROM ||
      '';
    if (!adminTo) {
      console.warn('Support admin notification skipped: no recipient configured (SUPPORT_ADMIN_EMAIL/ADMIN_EMAIL/etc)');
      return;
    }

    const ticketNumber = ticket?.ticketNumber || String(ticket?._id || '');
    const subject = `[Support Query] ${ticketNumber} - ${ticket?.subject || 'New support query'}`;
    const customerName = customer?.fullname || 'Unknown';
    const customerEmail = customer?.email || 'Unknown';
    const category = ticket?.category || 'other';
    const priority = ticket?.priority || 'medium';
    const createdAt = ticket?.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString();

    const text = [
      'A new support query has been received.',
      '',
      `Ticket: ${ticketNumber}`,
      `Subject: ${ticket?.subject || '-'}`,
      `Customer: ${customerName}`,
      `Customer Email: ${customerEmail}`,
      `Category: ${category}`,
      `Priority: ${priority}`,
      `Source: ${source || 'support'}`,
      `Created At: ${createdAt}`,
      '',
      'Message:',
      content || '-',
    ].join('\n');
    const html = getSupportQueryEmailHtml({
      ticketNumber,
      subject: ticket?.subject || '-',
      customerName,
      customerEmail,
      category,
      priority,
      source: source || 'support',
      createdAt,
      content: content || '-',
    });

    const emailResult = await sendEmail({
      to: adminTo,
      subject,
      text,
      html,
      replyTo: customerEmail !== 'Unknown' ? customerEmail : undefined,
    });
    if (emailResult?.skipped) {
      console.warn(
        `Support admin notification skipped for ticket ${ticketNumber}: ${emailResult.reason || 'provider not configured'}`
      );
      return;
    }
    console.log(
      `Support admin notification sent for ticket ${ticketNumber} -> ${adminTo} (messageId: ${emailResult?.id || 'n/a'})`
    );
  } catch (err) {
    console.error('Support admin notification email failed:', err?.message || err);
  }
}

// Create a ticket from public help/support form (no auth required)
exports.createPublicTicket = async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body || {};
    const safeName = String(name || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();
    const safeSubject = String(subject || '').trim();
    const safeMessage = String(message || '').trim();

    if (!safeName || !safeEmail || !safeSubject || !safeMessage) {
      return res.status(400).json({
        status: 400,
        message: 'Name, email, subject and message are required',
        data: null
      });
    }

    const emailRegex = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;
    if (!emailRegex.test(safeEmail)) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid email address',
        data: null
      });
    }

    let customer = await Customer.findOne({ email: safeEmail });
    if (!customer) {
      customer = new Customer({
        userId: new mongoose.Types.ObjectId(),
        email: safeEmail,
        fullname: safeName,
      });
      await customer.save();
    } else if (!customer.fullname && safeName) {
      customer.fullname = safeName;
      await customer.save();
    }

    const ticket = new Ticket({
      customerId: customer.userId,
      subject: safeSubject,
      category: normalizePublicCategory(category),
      priority: 'medium',
      status: 'open',
      metadata: {
        source: 'landing_help_support',
        browserInfo: req.headers['user-agent'] || null,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null
      }
    });
    await ticket.save();

    const initialMessage = new Message({
      ticketId: ticket._id,
      senderId: customer.userId,
      senderType: 'customer',
      content: safeMessage,
      messageType: 'text'
    });
    await initialMessage.save();

    ticket.lastMessageAt = new Date();
    await ticket.save();

    customer.totalTickets += 1;
    customer.activeTickets += 1;
    await customer.save();

    routeTicketToAgent(ticket._id).catch((err) => {
      console.error('Error routing public ticket:', err);
    });

    notifyAdminSupportQuery({
      ticket,
      customer,
      content: safeMessage,
      source: 'landing_help_support',
    });

    return res.status(201).json({
      status: 201,
      message: 'Support request submitted successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber
      }
    });
  } catch (error) {
    console.error('Create public ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: error.message || 'Server error',
      data: null
    });
  }
};

// Alias for semantic API naming: "query" == public support ticket submission
exports.createPublicQuery = exports.createPublicTicket;

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, priority, initialMessage, metadata } = req.body;
    const customerId = req.user.data.id;
    
    // Convert customerId to ObjectId to ensure proper storage
    let customerObjectId;
    try {
      customerObjectId = mongoose.Types.ObjectId.isValid(customerId) 
        ? new mongoose.Types.ObjectId(customerId) 
        : customerId;
    } catch (err) {
      console.error('Invalid customerId format:', err);
      return res.status(400).json({
        status: 400,
        message: 'Invalid user ID format',
        data: null
      });
    }

    if (!subject || !initialMessage) {
      return res.status(400).json({
        status: 400,
        message: 'Subject and initial message are required',
        data: null
      });
    }

    // Create or update customer record
    let customer = await Customer.findOne({ userId: customerId });
    if (!customer) {
      // Get user details from User model (assuming it exists in auth-service)
      customer = new Customer({
        userId: customerId,
        email: req.user.data.email || '',
        fullname: req.user.data.fullname || '',
        phone: req.user.data.phone || null
      });
      await customer.save();
    }

    // Create ticket (ticketNumber will be auto-generated by pre-validate hook)
    const ticket = new Ticket({
      customerId: customerObjectId,
      subject,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      metadata: metadata || {}
    });
    
    // Ensure ticketNumber is generated before saving
    if (!ticket.ticketNumber) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      ticket.ticketNumber = `TKT-${timestamp}-${random}`;
    }
    
    await ticket.save();

    // Create initial message
    const message = new Message({
      ticketId: ticket._id,
      senderId: customerObjectId,
      senderType: 'customer',
      content: initialMessage,
      messageType: 'text'
    });
    await message.save();

    // Update ticket last message time
    ticket.lastMessageAt = new Date();
    await ticket.save();

    // Update customer stats
    customer.totalTickets += 1;
    customer.activeTickets += 1;
    await customer.save();

    // Route ticket to available agent (async, won't block response)
    routeTicketToAgent(ticket._id).catch(err => {
      console.error('Error routing ticket:', err);
    });

    notifyAdminSupportQuery({
      ticket,
      customer,
      content: initialMessage,
      source: metadata?.source || 'customer_portal',
    });

    return res.status(201).json({
      status: 201,
      message: 'Ticket created successfully',
      data: {
        ticket,
        message
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        status: 400,
        message: `Validation error: ${errors}`,
        data: null
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 400,
        message: 'Duplicate ticket number. Please try again.',
        data: null
      });
    }
    
    return res.status(500).json({
      status: 500,
      message: error.message || 'Server error',
      data: null
    });
  }
};

// Get customer's tickets
exports.getCustomerTickets = async (req, res) => {
  try {
    const customerId = req.user.data.id;
    
    // Convert customerId to ObjectId to ensure proper matching
    // This prevents issues where customerId might be a string while database stores ObjectId
    let customerObjectId;
    try {
      customerObjectId = mongoose.Types.ObjectId.isValid(customerId) 
        ? new mongoose.Types.ObjectId(customerId) 
        : customerId;
    } catch (err) {
      console.error('Invalid customerId format:', err);
      return res.status(400).json({
        status: 400,
        message: 'Invalid user ID format',
        data: null
      });
    }

    const tickets = await Ticket.find({ customerId: customerObjectId })
      .populate('assignedAgentId', 'fullname email avatar status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      message: 'Tickets retrieved successfully',
      data: { tickets }
    });
  } catch (error) {
    console.error('Get customer tickets error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Get single ticket details
exports.getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const customerId = req.user.data.id;
    
    // Convert customerId to ObjectId to ensure proper matching
    let customerObjectId;
    try {
      customerObjectId = mongoose.Types.ObjectId.isValid(customerId) 
        ? new mongoose.Types.ObjectId(customerId) 
        : customerId;
    } catch (err) {
      console.error('Invalid customerId format:', err);
      return res.status(400).json({
        status: 400,
        message: 'Invalid user ID format',
        data: null
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      customerId: customerObjectId
    })
      .populate('assignedAgentId', 'fullname email avatar status');

    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
        data: null
      });
    }

    // Manually populate customer data
    const ticketObj = ticket.toObject();
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

    // Get messages for this ticket
    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 });

    return res.status(200).json({
      status: 200,
      message: 'Ticket retrieved successfully',
      data: {
        ticket: ticketObj,
        messages
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Close ticket (customer)
exports.closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const customerId = req.user.data.id;
    
    // Convert customerId to ObjectId to ensure proper matching
    let customerObjectId;
    try {
      customerObjectId = mongoose.Types.ObjectId.isValid(customerId) 
        ? new mongoose.Types.ObjectId(customerId) 
        : customerId;
    } catch (err) {
      console.error('Invalid customerId format:', err);
      return res.status(400).json({
        status: 400,
        message: 'Invalid user ID format',
        data: null
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      customerId: customerObjectId
    });

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
    const customer = await Customer.findOne({ userId: customerId });
    if (customer && customer.activeTickets > 0) {
      customer.activeTickets -= 1;
      await customer.save();
    }

    // Remove from agent's current tickets
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
    console.error('Close ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Submit rating and feedback
exports.submitRating = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { score, feedback } = req.body;
    const customerId = req.user.data.id;
    
    // Convert customerId to ObjectId to ensure proper matching
    let customerObjectId;
    try {
      customerObjectId = mongoose.Types.ObjectId.isValid(customerId) 
        ? new mongoose.Types.ObjectId(customerId) 
        : customerId;
    } catch (err) {
      console.error('Invalid customerId format:', err);
      return res.status(400).json({
        status: 400,
        message: 'Invalid user ID format',
        data: null
      });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        status: 400,
        message: 'Rating score must be between 1 and 5',
        data: null
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      customerId: customerObjectId,
      status: 'closed'
    });

    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Closed ticket not found',
        data: null
      });
    }

    if (ticket.rating.score) {
      return res.status(400).json({
        status: 400,
        message: 'Ticket already rated',
        data: null
      });
    }

    ticket.rating = {
      score,
      feedback: feedback || null,
      ratedAt: new Date()
    };
    await ticket.save();

    // Update agent stats if ticket was assigned
    if (ticket.assignedAgentId) {
      const agent = await SupportAgent.findById(ticket.assignedAgentId);
      if (agent) {
        await agent.updateStats(null, score);
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Rating submitted successfully',
      data: { rating: ticket.rating }
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Agent: Get assigned tickets
exports.getAssignedTickets = async (req, res) => {
  try {
    const agentEmail = req.agent.email;
    const { status } = req.query;

    // Find agent in support-service database by email (since IDs might differ)
    let agentId = req.agent.id;
    if (agentEmail) {
      const supportAgent = await SupportAgent.findOne({ email: agentEmail.toLowerCase() });
      if (supportAgent) {
        agentId = supportAgent._id;
      }
    }

    const query = { assignedAgentId: agentId };
    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .sort({ lastMessageAt: -1 });

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
        }
      }
      
      return ticketObj;
    }));

    return res.status(200).json({
      status: 200,
      message: 'Tickets retrieved successfully',
      data: { tickets: ticketsWithCustomer }
    });
  } catch (error) {
    console.error('Get assigned tickets error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Agent: Close ticket
exports.agentCloseTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const agentId = req.agent.id;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      assignedAgentId: agentId
    });

    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
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

    // Remove from agent's current tickets
    await removeTicketFromAgent(agentId, ticket._id);

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
    console.error('Agent close ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Agent: Transfer ticket
exports.transferTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { toAgentId, reason } = req.body;
    const fromAgentId = req.agent.id;

    if (!toAgentId) {
      return res.status(400).json({
        status: 400,
        message: 'Target agent ID is required',
        data: null
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      assignedAgentId: fromAgentId
    });

    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
        data: null
      });
    }

    const toAgent = await SupportAgent.findById(toAgentId);
    if (!toAgent || !toAgent.isActive) {
      return res.status(404).json({
        status: 404,
        message: 'Target agent not found or inactive',
        data: null
      });
    }

    // Record transfer in history
    ticket.transferHistory.push({
      fromAgentId,
      toAgentId,
      reason: reason || null,
      transferredAt: new Date()
    });

    // Update ticket assignment
    const fromAgent = await SupportAgent.findById(fromAgentId);
    if (fromAgent) {
      fromAgent.currentTickets = fromAgent.currentTickets.filter(
        t => t.ticketId.toString() !== ticketId.toString()
      );
      await fromAgent.save();
    }

    ticket.assignedAgentId = toAgentId;
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
      message: 'Ticket transferred successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Transfer ticket error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

