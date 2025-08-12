const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Hierarchy
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    default: '/'
  },
  
  // Ownership - Using string IDs from auth service
  ownerId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  
  // Organization
  color: {
    type: String,
    default: '#3b82f6'
  },
  icon: {
    type: String,
    default: 'Folder'
  },
  
  // Status
  isShared: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Permissions
  permissions: [{
    userId: {
      type: String
    },
    email: String,
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  documentCount: {
    type: Number,
    default: 0
  },
  folderCount: {
    type: Number,
    default: 0
  },
  totalSize: {
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
folderSchema.index({ ownerId: 1, parentId: 1 });
folderSchema.index({ path: 1 });
folderSchema.index({ isShared: 1, isArchived: 1 });

// Update modifiedAt on save
folderSchema.pre('save', function(next) {
  this.modifiedAt = new Date();
  next();
});

// Virtual for full path
folderSchema.virtual('fullPath').get(function() {
  if (this.parentId) {
    return `${this.path}/${this.name}`;
  }
  return `/${this.name}`;
});

module.exports = mongoose.model('Folder', folderSchema);
