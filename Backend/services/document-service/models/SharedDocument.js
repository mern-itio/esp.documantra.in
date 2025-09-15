const mongoose = require('mongoose');
const crypto = require('crypto');

const sharedDocumentSchema = new mongoose.Schema({
  // Document Information
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  
  // Sharing Information
  shareToken: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  
  // Owner Information
  ownerId: {
    type: String,
    required: true
  },
  ownerEmail: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  
  // Recipients
  recipients: [{
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    isCC: {
      type: Boolean,
      default: false
    },
    hasViewed: {
      type: Boolean,
      default: false
    },
    viewedAt: {
      type: Date,
      default: null
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date,
      default: null
    }
  }],
  
  // Sharing Options
  allowDownload: {
    type: Boolean,
    default: true
  },
  allowComments: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Access Control
  isActive: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    default: null
  },
  
  // Statistics
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  message: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sharedDocumentSchema.index({ shareToken: 1 });
sharedDocumentSchema.index({ documentId: 1 });
sharedDocumentSchema.index({ ownerId: 1 });
sharedDocumentSchema.index({ 'recipients.email': 1 });
sharedDocumentSchema.index({ expiresAt: 1 });
sharedDocumentSchema.index({ isActive: 1 });

// Virtual for share URL
sharedDocumentSchema.virtual('shareUrl').get(function() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/shared/${this.shareToken}`;
});

// Method to check if share is expired
sharedDocumentSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if share is accessible
sharedDocumentSchema.methods.isAccessible = function() {
  return this.isActive && !this.isExpired();
};

// Method to increment view count
sharedDocumentSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

// Method to increment download count
sharedDocumentSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

// Method to mark recipient as viewed
sharedDocumentSchema.methods.markAsViewed = function(email) {
  const recipient = this.recipients.find(r => r.email === email);
  if (recipient && !recipient.hasViewed) {
    recipient.hasViewed = true;
    recipient.viewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('SharedDocument', sharedDocumentSchema);
