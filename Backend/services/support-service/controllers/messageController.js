const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const SupportAgent = require('../models/SupportAgent');
const Customer = require('../models/Customer');

// Get messages for a ticket
exports.getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.data?.id || req.agent?.id || req.admin?.id;
    const userType = req.user ? 'customer' : (req.admin ? 'admin' : 'agent');

    // Verify access to ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        status: 404,
        message: 'Ticket not found',
        data: null
      });
    }

    // Check if user has access to this ticket
    if (userType === 'customer' && ticket.customerId.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: 'Access denied',
        data: null
      });
    }

    // For agents/admins: Allow viewing messages for all tickets in unified dashboard
    // (Write operations like closing/transferring are restricted in their respective controllers)
    if (userType === 'agent') {
      // Agents and admins can view messages for any ticket
      // No additional restrictions needed here
    }

    // Get messages
    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 });

    // Mark messages as read for this user
    await Message.updateMany(
      {
        ticketId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        },
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      status: 200,
      message: 'Messages retrieved successfully',
      data: { messages }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

// Upload file attachment
exports.uploadFile = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 400,
        message: 'No file uploaded',
        data: null
      });
    }

    const attachment = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date()
    };

    return res.status(200).json({
      status: 200,
      message: 'File uploaded successfully',
      data: { attachment }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Server error',
      data: null
    });
  }
};

