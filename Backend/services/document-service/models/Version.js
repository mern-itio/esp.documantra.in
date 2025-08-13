const mongoose = require('mongoose');

const versionChangeSchema = new mongoose.Schema({
  additions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
  modifications: { type: Number, default: 0 }
});

const versionSchema = new mongoose.Schema({
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document', 
    required: true 
  },
  version: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    default: '' 
  },
  description: { 
    type: String, 
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
  size: { 
    type: Number, 
    default: 0 
  },
  changes: {
    type: versionChangeSchema,
    default: () => ({ additions: 0, deletions: 0, modifications: 0 })
  },
  tags: [{
    type: String,
    trim: true
  }],
  approved: { 
    type: Boolean, 
    default: false 
  },
  branch: { 
    type: String, 
    default: 'main' 
  },
  metadata: {
    editor: { type: String, default: 'CollaborativeEditor' },
    changeType: { type: String, default: 'content_edit' },
    ipAddress: String,
    userAgent: String
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
versionSchema.index({ documentId: 1, version: 1 });
versionSchema.index({ documentId: 1, createdAt: -1 });
versionSchema.index({ author: 1 });

module.exports = mongoose.model('Version', versionSchema);
