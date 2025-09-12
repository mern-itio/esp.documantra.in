const mongoose = require('mongoose');

const CloudServiceConnectionSchema = new mongoose.Schema({
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
  serviceName: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: false
  },
  tokenExpiry: {
    type: Date,
    required: false
  },
  connected: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  storageInfo: {
    used: {
      type: String,
      default: '0 GB'
    },
    total: {
      type: String,
      default: '0 GB'
    }
  },
  settings: {
    autoSync: {
      type: Boolean,
      default: true
    },
    syncInterval: {
      type: Number,
      default: 30 // minutes
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'doc', 'docx', 'txt']
    }
  },
  metadata: {
    accountEmail: String,
    accountName: String,
    serviceIcon: String,
    permissions: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
CloudServiceConnectionSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

// Static methods
CloudServiceConnectionSchema.statics.findByUser = function(userId) {
  return this.find({ userId, connected: true });
};

CloudServiceConnectionSchema.statics.findByUserAndService = function(userId, serviceId) {
  return this.findOne({ userId, serviceId });
};

CloudServiceConnectionSchema.statics.updateLastSync = function(userId, serviceId) {
  return this.updateOne(
    { userId, serviceId },
    { lastSync: new Date() }
  );
};

module.exports = mongoose.model('CloudServiceConnection', CloudServiceConnectionSchema);
