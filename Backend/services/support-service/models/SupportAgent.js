const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const supportAgentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['agent', 'admin'],
    default: 'agent'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  currentTickets: [{
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    assignedAt: { type: Date, default: Date.now }
  }],
  stats: {
    totalTicketsHandled: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in seconds
    totalResponseTime: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
supportAgentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare passwords
supportAgentSchema.methods.isPasswordCorrect = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update agent stats
supportAgentSchema.methods.updateStats = async function(responseTime, rating) {
  if (responseTime) {
    this.stats.totalResponseTime += responseTime;
    this.stats.responseCount += 1;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.responseCount;
  }
  if (rating) {
    this.stats.ratingSum += rating;
    this.stats.totalRatings += 1;
    this.stats.averageRating = this.stats.ratingSum / this.stats.totalRatings;
  }
  await this.save();
};

// Indexes
supportAgentSchema.index({ email: 1 });
supportAgentSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model('SupportAgent', supportAgentSchema);

