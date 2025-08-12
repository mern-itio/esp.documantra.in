const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  
  // File Storage
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  
  // User & Ownership - Using string IDs from auth service
  uploadedBy: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  
  // Organization
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  
  // Metadata
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Status & Flags
  isArchived: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Sharing
  shared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: String
    },
    email: String,
    permission: {
      type: String,
      enum: ['view', 'comment', 'edit', 'full'],
      default: 'view'
    },
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  modifiedAt: {
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
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ folderId: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ name: 'text', description: 'text' });
documentSchema.index({ shared: 1, isPublic: 1 });

// Update modifiedAt on save
documentSchema.pre('save', function(next) {
  this.modifiedAt = new Date();
  next();
});

module.exports = mongoose.model('Document', documentSchema);
