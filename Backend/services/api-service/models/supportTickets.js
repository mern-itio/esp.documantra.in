const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'billing', 'documentation', 'feature', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent']
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  }
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
