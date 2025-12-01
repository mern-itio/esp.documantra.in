const jwt = require('jsonwebtoken');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const SupportAgent = require('../models/SupportAgent');
const Customer = require('../models/Customer');
const { routeTicketToAgent } = require('../utils/ticketRouter');

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify token and determine user type
        let decoded;
        let userType = 'customer';

        // Try customer token first
        try {
          decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          if (decoded.data) {
            decoded = decoded.data;
          }
          userType = 'customer';
        } catch (err) {
          // Try agent/admin token - try all possible secrets
          const agentSecrets = [
            process.env.AGENT_ACCESS_TOKEN_SECRET,
            process.env.ADMIN_ACCESS_TOKEN_SECRET,
            process.env.ACCESS_TOKEN_SECRET
          ].filter(s => s);

          let verified = false;
          for (const secret of agentSecrets) {
            try {
              decoded = jwt.verify(token, secret);
              if (decoded.role === 'admin' || decoded.role === 'agent') {
                userType = decoded.role === 'admin' ? 'admin' : 'agent';
                verified = true;
                break;
              }
            } catch (err2) {
              // Continue to next secret
              continue;
            }
          }

          if (!verified) {
            return next(new Error('Authentication error: Invalid token'));
          }
        }

        socket.userId = decoded.id || decoded._id;
        socket.userType = userType;
        socket.userData = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId} (${socket.userType})`);
      
      this.handleConnection(socket);

      // Handle joining ticket room
      socket.on('join_ticket', async (data) => {
        await this.handleJoinTicket(socket, data);
      });

      // Handle leaving ticket room
      socket.on('leave_ticket', async (data) => {
        await this.handleLeaveTicket(socket, data);
      });

      // Handle sending message
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Handle typing indicator
      socket.on('typing', async (data) => {
        await this.handleTyping(socket, data);
      });

      // Handle stop typing
      socket.on('stop_typing', async (data) => {
        await this.handleStopTyping(socket, data);
      });

      // Handle read receipt
      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data);
      });

      // Handle status update (for agents)
      socket.on('update_status', async (data) => {
        await this.handleUpdateStatus(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  async handleConnection(socket) {
    try {
      if (socket.userType === 'agent' || socket.userType === 'admin') {
        // Update agent status
        const agent = await SupportAgent.findById(socket.userId);
        if (agent) {
          agent.socketId = socket.id;
          agent.status = agent.status === 'offline' ? 'online' : agent.status;
          agent.lastActiveAt = new Date();
          await agent.save();

          // Broadcast agent online status
          this.io.emit('agent_status_change', {
            agentId: agent._id,
            status: agent.status
          });
        }
      } else if (socket.userType === 'customer') {
        // Update customer online status
        const customer = await Customer.findOne({ userId: socket.userId });
        if (customer) {
          customer.socketId = socket.id;
          customer.isOnline = true;
          customer.lastActiveAt = new Date();
          await customer.save();
        }
      }
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  async handleJoinTicket(socket, data) {
    try {
      const { ticketId } = data;
      
      if (!ticketId) {
        socket.emit('error', { message: 'Ticket ID is required' });
        return;
      }

      // Verify access to ticket
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }

      // Check access permissions
      if (socket.userType === 'customer') {
        if (ticket.customerId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
      }
      // For agents/admins: Allow joining any ticket (unified dashboard)
      // Write operations are restricted in controllers

      // Join ticket room
      socket.join(`ticket_${ticketId}`);
      console.log(`User ${socket.userId} (${socket.userType}) joined ticket room: ticket_${ticketId}`);
      
      // Load and send recent messages
      const messages = await Message.find({ ticketId })
        .sort({ createdAt: 1 })
        .limit(50);

      console.log(`Sending ${messages.length} messages to user ${socket.userId} for ticket ${ticketId}`);
      socket.emit('ticket_messages', { ticketId, messages });
    } catch (error) {
      console.error('Error joining ticket:', error);
      socket.emit('error', { message: 'Error joining ticket' });
    }
  }

  async handleLeaveTicket(socket, data) {
    try {
      const { ticketId } = data;
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
      }
    } catch (error) {
      console.error('Error leaving ticket:', error);
    }
  }

  async handleSendMessage(socket, data) {
    try {
      const { ticketId, content, messageType = 'text', attachments = [] } = data;

      if (!ticketId || !content) {
        socket.emit('error', { message: 'Ticket ID and content are required' });
        return;
      }

      // Verify access to ticket
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }

      // Determine sender type and verify access
      let senderType;
      if (socket.userType === 'customer') {
        if (ticket.customerId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
        senderType = 'customer';

        // Set first response time if this is agent's first message
        if (!ticket.firstResponseAt && ticket.assignedAgentId) {
          ticket.firstResponseAt = new Date();
          await ticket.save();
        }
      } else if (socket.userType === 'agent' || socket.userType === 'admin') {
        // Allow agents/admins to send messages to any ticket (unified dashboard)
        // Write operations like closing are restricted in REST controllers
        senderType = 'agent';

        // Set first response time if this is agent's first message
        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
          await ticket.save();

          // Update agent stats (calculate response time)
          if (ticket.assignedAgentId) {
            const responseTime = (Date.now() - ticket.createdAt.getTime()) / 1000;
            const agent = await SupportAgent.findById(ticket.assignedAgentId);
            if (agent) {
              await agent.updateStats(responseTime, null);
            }
          }
        }
      } else {
        socket.emit('error', { message: 'Invalid user type' });
        return;
      }

      // Create message
      const message = new Message({
        ticketId,
        senderId: socket.userId,
        senderType,
        content,
        messageType,
        attachments,
        isRead: false
      });
      await message.save();

      // Update ticket
      ticket.lastMessageAt = new Date();
      if (ticket.status === 'open' && senderType === 'agent') {
        ticket.status = 'ongoing';
      }
      await ticket.save();

      // Convert message to object with proper formatting
      const messageObj = {
        _id: message._id.toString(),
        ticketId: ticket._id.toString(),
        senderId: message.senderId.toString(),
        senderType: senderType,
        content: message.content,
        messageType: message.messageType || 'text',
        attachments: message.attachments || [],
        isRead: false,
        readBy: [],
        createdAt: message.createdAt || new Date(),
        timestamp: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
      };

      // Get room info for debugging
      const room = this.io.sockets.adapter.rooms.get(`ticket_${ticketId}`);
      const roomSize = room ? room.size : 0;
      
      console.log(`Broadcasting message to ticket room: ticket_${ticketId}`, {
        messageId: messageObj._id,
        senderType: senderType,
        senderId: messageObj.senderId,
        content: content.substring(0, 50),
        roomSize: roomSize,
        socketsInRoom: roomSize
      });
      
      // Broadcast message to ALL users in ticket room (including sender)
      // This ensures all users (customer, agent, admin) receive the message
      const roomName = `ticket_${ticketId}`;
      console.log(`Broadcasting message to room: ${roomName}`);
      
      // Emit to all sockets in the ticket room
      this.io.to(roomName).emit('new_message', {
        message: messageObj,
        ticketId: ticketId.toString()
      });
      
      // Also emit directly to sender's socket to ensure they receive confirmation
      socket.emit('new_message', {
        message: messageObj,
        ticketId: ticketId.toString()
      });
      
      const finalRoom = this.io.sockets.adapter.rooms.get(roomName);
      console.log(`Message broadcasted. Room '${roomName}' has ${finalRoom ? finalRoom.size : 0} sockets. Message ID: ${messageObj._id}`);

      // Notify other party if not in room
      if (senderType === 'customer' && ticket.assignedAgentId) {
        const agent = await SupportAgent.findById(ticket.assignedAgentId);
        if (agent && agent.socketId) {
          this.io.to(agent.socketId).emit('notification', {
            type: 'new_message',
            ticketId,
            ticketNumber: ticket.ticketNumber,
            message: content.substring(0, 100)
          });
        }
      } else if (senderType === 'agent') {
        const customer = await Customer.findOne({ userId: ticket.customerId });
        if (customer && customer.socketId) {
          this.io.to(customer.socketId).emit('notification', {
            type: 'new_message',
            ticketId,
            ticketNumber: ticket.ticketNumber,
            message: content.substring(0, 100)
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  }

  async handleTyping(socket, data) {
    try {
      const { ticketId } = data;
      if (!ticketId) return;

      // Broadcast typing indicator to others in the ticket room
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        ticketId,
        userId: socket.userId,
        userType: socket.userType,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  }

  async handleStopTyping(socket, data) {
    try {
      const { ticketId } = data;
      if (!ticketId) return;

      // Broadcast stop typing indicator
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        ticketId,
        userId: socket.userId,
        userType: socket.userType,
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling stop typing:', error);
    }
  }

  async handleMarkRead(socket, data) {
    try {
      const { ticketId, messageIds } = data;
      if (!ticketId) return;

      // Mark messages as read
      if (messageIds && Array.isArray(messageIds)) {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            ticketId
          },
          {
            $push: {
              readBy: {
                userId: socket.userId,
                readAt: new Date()
              }
            },
            $set: { isRead: true }
          }
        );
      }

      // Broadcast read receipt
      socket.to(`ticket_${ticketId}`).emit('messages_read', {
        ticketId,
        userId: socket.userId,
        messageIds
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async handleUpdateStatus(socket, data) {
    try {
      if (socket.userType !== 'agent' && socket.userType !== 'admin') {
        socket.emit('error', { message: 'Only agents can update status' });
        return;
      }

      const { status } = data;
      if (!['online', 'offline', 'away'].includes(status)) {
        socket.emit('error', { message: 'Invalid status' });
        return;
      }

      const agent = await SupportAgent.findById(socket.userId);
      if (agent) {
        agent.status = status;
        agent.lastActiveAt = new Date();
        await agent.save();

        // Broadcast status change
        this.io.emit('agent_status_change', {
          agentId: agent._id,
          status: agent.status
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      socket.emit('error', { message: 'Error updating status' });
    }
  }

  async handleDisconnect(socket) {
    try {
      console.log(`User disconnected: ${socket.userId} (${socket.userType})`);

      if (socket.userType === 'agent' || socket.userType === 'admin') {
        // Update agent status
        const agent = await SupportAgent.findById(socket.userId);
        if (agent) {
          agent.socketId = null;
          agent.status = 'offline';
          agent.lastActiveAt = new Date();
          await agent.save();

          // Broadcast agent offline status
          this.io.emit('agent_status_change', {
            agentId: agent._id,
            status: 'offline'
          });
        }
      } else if (socket.userType === 'customer') {
        // Update customer status
        const customer = await Customer.findOne({ userId: socket.userId });
        if (customer) {
          customer.socketId = null;
          customer.isOnline = false;
          customer.lastActiveAt = new Date();
          await customer.save();
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }
}

module.exports = SocketService;

