const mongoose = require('mongoose');

// Track user actions for automatic learning detection
const userActionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create_and_send_envelope', 'send_document', 'prepare_document', 'search_document', 'generate_document', 'other'],
    index: true
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  source: {
    type: String,
    enum: ['manual', 'ai-assistant', 'api', 'ui'],
    default: 'manual'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  matchedPatternId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPattern',
    default: null
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    route: String, // API route or UI page
    method: String // HTTP method if API
  }
}, {
  timestamps: true
});

// Index for finding recent actions
userActionSchema.index({ userId: 1, timestamp: -1 });
userActionSchema.index({ userId: 1, action: 1, timestamp: -1 });

// TTL index - auto-delete actions older than 1 hour
userActionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('UserAction', userActionSchema);

