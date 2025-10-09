const mongoose = require('mongoose');

const pdfToolSettingsSchema = new mongoose.Schema({
  toolId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  toolName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Access control settings
  accessControl: {
    // Who can access this tool
    allowedFor: {
      type: String,
      enum: ['all', 'logged_in_only', 'pro', 'custom'],
      default: 'all'
    },
    // Custom access rules (when allowedFor is 'custom')
    customRules: {
      freeUsers: {
        enabled: { type: Boolean, default: true },
        limitType: { type: String, enum: ['unlimited', 'number'], default: 'number' },
        limit: { type: Number, default: 10 },
        timeWindow: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' }
      },
      proUsers: {
        enabled: { type: Boolean, default: true },
        limitType: { type: String, enum: ['unlimited', 'number'], default: 'unlimited' },
        limit: { type: Number, default: null },
        timeWindow: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' }
      },
      guests: {
        enabled: { type: Boolean, default: true },
        limitType: { type: String, enum: ['unlimited', 'number'], default: 'number' },
        limit: { type: Number, default: 5 },
        timeWindow: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' }
      }
    }
  },
  // Feature flags
  features: {
    requiresAuth: { type: Boolean, default: false },
    requiresPremium: { type: Boolean, default: false },
    showInMenu: { type: Boolean, default: true },
    showInHeader: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false }
  },
  // Display settings
  display: {
    badge: { type: String, default: null }, // 'Popular', 'New', 'AI', etc.
    icon: { type: String, default: 'FileText' },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 }
  },
  // Metadata
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
pdfToolSettingsSchema.index({ toolId: 1, isActive: 1 });
pdfToolSettingsSchema.index({ category: 1, isActive: 1 });
pdfToolSettingsSchema.index({ 'accessControl.allowedFor': 1 });

const PDFToolSettings = mongoose.model('PDFToolSettings', pdfToolSettingsSchema);

module.exports = PDFToolSettings;
