const mongoose = require('mongoose');

const CloudFileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  serviceId: {
    type: String,
    required: true,
    enum: ['gdrive', 'dropbox', 'onedrive', 'box', 'icloud']
  },
  fileId: {
    type: String,
    required: true // Cloud service file ID
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'folder', 'doc', 'docx', 'txt', 'image']
  },
  fileSize: {
    type: Number, // in bytes
    required: false
  },
  fileSizeFormatted: {
    type: String,
    required: false
  },
  mimeType: {
    type: String,
    required: false
  },
  isFolder: {
    type: Boolean,
    default: false
  },
  filePath: {
    type: String,
    required: true
  },
  parentFolderId: {
    type: String,
    required: false
  },
  downloadUrl: {
    type: String,
    required: false
  },
  thumbnailUrl: {
    type: String,
    required: false
  },
  lastModified: {
    type: Date,
    required: true
  },
  synced: {
    type: Boolean,
    default: false
  },
  lastSyncDate: {
    type: Date,
    default: Date.now
  },
  checksum: {
    type: String,
    required: false
  },
  metadata: {
    description: String,
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false
    },
    permissions: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CloudFileSchema.index({ userId: 1, serviceId: 1 });
CloudFileSchema.index({ userId: 1, fileId: 1, serviceId: 1 }, { unique: true });
CloudFileSchema.index({ userId: 1, fileType: 1 });
CloudFileSchema.index({ userId: 1, synced: 1 });

// Static methods
CloudFileSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ lastModified: -1 });
};

CloudFileSchema.statics.findByUserAndService = function(userId, serviceId) {
  return this.find({ userId, serviceId }).sort({ lastModified: -1 });
};

CloudFileSchema.statics.findByUserAndType = function(userId, fileType) {
  return this.find({ userId, fileType }).sort({ lastModified: -1 });
};

CloudFileSchema.statics.findUnsynced = function(userId) {
  return this.find({ userId, synced: false });
};

CloudFileSchema.statics.updateSyncStatus = function(userId, fileId, serviceId, synced = true) {
  return this.updateOne(
    { userId, fileId, serviceId },
    { 
      synced,
      lastSyncDate: new Date()
    }
  );
};

// Instance methods
CloudFileSchema.methods.formatSize = function() {
  if (!this.fileSize) return 'Unknown';
  
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

CloudFileSchema.methods.isPdf = function() {
  return this.fileType === 'pdf' || this.mimeType === 'application/pdf';
};

module.exports = mongoose.model('CloudFile', CloudFileSchema);
