const mongoose = require('mongoose');

const documentTrackingSchema = new mongoose.Schema({
  documentId: { type: String, required: true, index: true },
  documentName: { type: String, required: true },
  documentType: { type: String, default: 'pdf' },
  originalFilename: { type: String, required: true },
  savedFilename: { type: String, required: false }, // Actual filename on disk
  userId: { type: String, required: true, index: true },
  action: { type: String, enum: ['view', 'download', 'edit', 'delete', 'upload', 'permission_set', 'metadata_removed', 'compressed', 'optimized', 'spell_checked'], required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String, required: false },
  userAgent: { type: String, required: false },
  deviceInfo: { type: String, required: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Document tracking specific fields
  isTracked: { type: Boolean, default: true, index: true },
  trackingSource: { type: String, enum: ['automatic', 'manual', 'shared_link'], default: 'automatic' },
  shareableLink: { type: String, required: false },
  linkToken: { type: String, required: false },
  expiresAt: { type: Date, required: false },
  accessCount: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for better query performance
documentTrackingSchema.index({ documentId: 1, timestamp: -1 });
documentTrackingSchema.index({ userId: 1, timestamp: -1 });
documentTrackingSchema.index({ action: 1, timestamp: -1 });
documentTrackingSchema.index({ isTracked: 1, timestamp: -1 });
documentTrackingSchema.index({ trackingSource: 1, timestamp: -1 });
documentTrackingSchema.index({ linkToken: 1 });

const DocumentTracking = mongoose.model('DocumentTracking', documentTrackingSchema);

module.exports = DocumentTracking;
