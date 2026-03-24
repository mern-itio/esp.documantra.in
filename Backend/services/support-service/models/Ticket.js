const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    default: function() {
      // Fallback default - will be overridden by pre-validate hook
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TKT-${timestamp}-${random}`;
    }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportAgent',
    default: null
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'ongoing', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'documentation', 'feature', 'bug', 'other'],
    default: 'other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  firstResponseAt: {
    type: Date,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  rating: {
    score: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: null },
    ratedAt: { type: Date, default: null }
  },
  metadata: {
    source: { type: String, default: null },
    browserInfo: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  transferHistory: [{
    fromAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportAgent' },
    toAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportAgent' },
    transferredAt: { type: Date, default: Date.now },
    reason: { type: String, default: null }
  }]
}, { timestamps: true });

// Generate ticket number before validation (runs before save)
ticketSchema.pre('validate', async function(next) {
  try {
    // Only generate ticket number for new documents that don't have one
    if (this.isNew && !this.ticketNumber) {
      // Generate a unique ticket number using timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.ticketNumber = `TKT-${timestamp}-${random}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
ticketSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Indexes for performance
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ assignedAgentId: 1, status: 1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

