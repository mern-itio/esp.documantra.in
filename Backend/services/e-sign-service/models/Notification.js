// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  envelopeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Envelope', 
    required: true,
    index: true 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipient' 
  },
  recipientName: { 
    type: String, 
    required: true 
  },
  envelopeSubject: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['signature_completed', 'envelope_completed', 'reminder', 'document_comment'], 
    default: 'signature_completed' 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  readAt: { 
    type: Date 
  }
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

