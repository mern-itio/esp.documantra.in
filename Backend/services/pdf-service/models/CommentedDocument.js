const mongoose = require('mongoose');

const commentPositionSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  pageNumber: { type: Number, required: true }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  position: { type: commentPositionSchema, required: true },
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  replies: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    author: { type: String, required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    position: { type: commentPositionSchema, required: true }
  }],
  parentId: { type: String, default: null },
  isResolved: { type: Boolean, default: false },
  color: { 
    type: String, 
    enum: ['yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'red', 'gray'],
    default: 'yellow'
  },
  pageNumber: { type: Number, required: true },
  threadId: { type: String, required: true }
}, { _id: false });

const commentedDocumentSchema = new mongoose.Schema({
  // Document Information
  originalDocumentId: { type: String, required: true },
  documentName: { type: String, required: true },
  originalFilename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  
  // Owner Information
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  
  // Comments
  comments: [commentSchema],
  
  // Sharing
  isShared: { type: Boolean, default: false },
  shareableLink: { type: String, default: null },
  linkToken: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  accessCount: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
  
  // Permissions
  allowComments: { type: Boolean, default: true },
  allowAnonymousComments: { type: Boolean, default: false },
  requireApproval: { type: Boolean, default: false },
  
  // Statistics
  totalComments: { type: Number, default: 0 },
  totalThreads: { type: Number, default: 0 },
  resolvedComments: { type: Number, default: 0 },
  unresolvedComments: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Indexes for better query performance
commentedDocumentSchema.index({ ownerId: 1, createdAt: -1 });
commentedDocumentSchema.index({ originalDocumentId: 1 });
commentedDocumentSchema.index({ linkToken: 1 });
commentedDocumentSchema.index({ isShared: 1, isActive: 1 });
commentedDocumentSchema.index({ isDeleted: 1, deletedAt: 1 });

// Update statistics when comments change
commentedDocumentSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.totalComments = this.comments.length;
    this.totalThreads = new Set(this.comments.map(c => c.threadId)).size;
    this.resolvedComments = this.comments.filter(c => c.isResolved).length;
    this.unresolvedComments = this.totalComments - this.resolvedComments;
  }
  next();
});

// Generate shareable link
commentedDocumentSchema.methods.generateShareableLink = function() {
  const crypto = require('crypto');
  this.linkToken = crypto.randomBytes(32).toString('hex');
  this.shareableLink = `/pdf-comments/shared/${this.linkToken}`;
  this.isShared = true;
  return this.shareableLink;
};

// Check if link is valid and not expired
commentedDocumentSchema.methods.isLinkValid = function() {
  if (!this.isShared || !this.linkToken) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

module.exports = mongoose.model('CommentedDocument', commentedDocumentSchema);
