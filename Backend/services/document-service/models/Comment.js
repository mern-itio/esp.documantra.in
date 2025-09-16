const mongoose = require('mongoose');

const commentReplySchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  mentions: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

const commentAttachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const commentSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  author: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    page: {
      type: Number,
      default: 1
    },
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  replies: [commentReplySchema],
  resolved: {
    type: Boolean,
    default: false
  },
  mentions: [{
    type: String,
    trim: true
  }],
  attachments: [commentAttachmentSchema],
  resolvedBy: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  // Version tracking
  versionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
    required: false
  },
  versionNumber: {
    type: String,
    required: false
  },
  versionDescription: {
    type: String,
    required: false
  },
  // Admin comment flag
  isAdminComment: {
    type: Boolean,
    default: false
  },
  // Admin user ID for admin comments
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ documentId: 1, timestamp: -1 });
commentSchema.index({ documentId: 1, resolved: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ mentions: 1 });

// Update resolvedAt when resolved changes
commentSchema.pre('save', function(next) {
  if (this.isModified('resolved') && this.resolved) {
    this.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
