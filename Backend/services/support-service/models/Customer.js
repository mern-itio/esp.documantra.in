const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  totalTickets: {
    type: Number,
    default: 0
  },
  activeTickets: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
customerSchema.index({ userId: 1 });
customerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', customerSchema);

