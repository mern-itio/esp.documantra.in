const mongoose = require('mongoose');

const limitRuleSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  limitType: { type: String, enum: ['unlimited', 'number'], default: 'number' },
  limit: { type: Number, default: 10, min: 0, max: 10000 },
  timeWindow: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
}, { _id: false });

const accessControlSchema = new mongoose.Schema({
  allowedFor: { type: String, enum: ['all', 'logged_in_only', 'pro', 'custom'], default: 'all' },
  customRules: {
    freeUsers: limitRuleSchema,
    proUsers: limitRuleSchema,
    guests: limitRuleSchema,
  },
}, { _id: false });

const featuresSchema = new mongoose.Schema({
  requiresAuth: { type: Boolean, default: false },
  requiresPremium: { type: Boolean, default: false },
  showInMenu: { type: Boolean, default: true },
  showInHeader: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
}, { _id: false });

const displaySchema = new mongoose.Schema({
  badge: { type: String, default: null },
  icon: { type: String, default: 'FileText' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false });

const toolSettingsSchema = new mongoose.Schema({
  toolId: { type: String, required: true, unique: true },
  toolName: { type: String, required: true },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  accessControl: { type: accessControlSchema, default: {} },
  features: { type: featuresSchema, default: {} },
  display: { type: displaySchema, default: {} },
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' },
}, { timestamps: true });

toolSettingsSchema.index({ toolId: 1, isActive: 1 });

module.exports = mongoose.model('ToolSettings', toolSettingsSchema);
