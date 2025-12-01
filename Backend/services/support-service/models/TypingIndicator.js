const mongoose = require('mongoose');

const typingIndicatorSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userType: {
    type: String,
    enum: ['customer', 'agent'],
    required: true
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  lastTypingAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
typingIndicatorSchema.index({ ticketId: 1 });
typingIndicatorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }); // Auto-delete after 5 minutes

module.exports = mongoose.model('TypingIndicator', typingIndicatorSchema);

