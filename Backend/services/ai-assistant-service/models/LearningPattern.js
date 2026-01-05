const mongoose = require('mongoose');

const learningPatternSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Failed AI attempt
  failedAttempt: {
    userCommand: {
      type: String,
      required: true
    },
    aiAction: {
      type: String,
      enum: ['search_document', 'send_document', 'prepare_document', 'create_and_send_envelope', 'list_auth_providers', 'generate_document', 'list_documents_by_category', 'list_shared_documents', 'list_signed_documents', 'select_document', null],
      required: true
    },
    aiParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    errorMessage: {
      type: String
    },
    errorType: {
      type: String,
      enum: ['execution_error', 'wrong_action', 'missing_parameters', 'user_correction', 'other'],
      default: 'other'
    }
  },
  // User's successful correction
  userCorrection: {
    action: {
      type: String,
      required: true
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String // How user described what they did
    },
    success: {
      type: Boolean,
      default: true
    }
  },
  // Pattern matching data
  pattern: {
    commandEmbedding: {
      type: [Number], // Vector embedding for similarity matching
      default: null
    },
    keywords: [{
      type: String
    }],
    intent: {
      type: String // Extracted intent (e.g., "send_document_with_specific_auth")
    }
  },
  // Learning metadata
  metadata: {
    conversationId: {
      type: String
    },
    messageId: {
      type: String
    },
    learnedAt: {
      type: Date,
      default: Date.now
    },
    usageCount: {
      type: Number,
      default: 0 // How many times this pattern was successfully used
    },
    lastUsed: {
      type: Date
    },
    confidence: {
      type: Number,
      default: 1.0, // Confidence score (0-1)
      min: 0,
      max: 1
    }
  },
  // Context for when to apply this pattern
  context: {
    similarCommands: [{
      type: String
    }],
    conditions: {
      type: mongoose.Schema.Types.Mixed // Conditions when this pattern applies
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
learningPatternSchema.index({ userId: 1, 'metadata.learnedAt': -1 });
learningPatternSchema.index({ userId: 1, 'pattern.intent': 1 });
learningPatternSchema.index({ 'metadata.usageCount': -1 });
learningPatternSchema.index({ 'metadata.confidence': -1 });

// Method to update usage statistics
learningPatternSchema.methods.recordUsage = function() {
  this.metadata.usageCount += 1;
  this.metadata.lastUsed = new Date();
  // Increase confidence slightly with each successful use (capped at 1.0)
  this.metadata.confidence = Math.min(1.0, this.metadata.confidence + 0.01);
  return this.save();
};

// Method to decrease confidence if pattern fails
learningPatternSchema.methods.recordFailure = function() {
  // Decrease confidence when pattern fails
  this.metadata.confidence = Math.max(0.1, this.metadata.confidence - 0.1);
  return this.save();
};

module.exports = mongoose.model('LearningPattern', learningPatternSchema);

