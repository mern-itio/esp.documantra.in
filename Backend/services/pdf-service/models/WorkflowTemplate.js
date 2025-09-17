const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  id: { type: String, required: true },
  toolId: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  isOptional: { type: Boolean, default: false },
  conditions: {
    dependsOn: [{ type: String }], // Step IDs this step depends on
    skipIf: { type: String }, // Condition to skip this step
  }
}, { timestamps: true });

const workflowTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  steps: [workflowStepSchema],
  isTemplate: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: false },
  createdBy: { type: String, required: true }, // User email
  createdByName: { type: String, required: true },
  category: { type: String, default: 'custom' },
  tags: [{ type: String }],
  usage: { type: Number, default: 0 },
  avgTime: { type: String, default: '0 minutes' },
  metadata: {
    estimatedDuration: Number, // in minutes
    complexity: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    inputFormats: [{ type: String }],
    outputFormats: [{ type: String }],
    features: [{ type: String }]
  }
}, { timestamps: true });

// Indexes for performance
workflowTemplateSchema.index({ createdBy: 1, isTemplate: 1 });
workflowTemplateSchema.index({ isPublic: 1, category: 1 });
workflowTemplateSchema.index({ tags: 1 });
workflowTemplateSchema.index({ usage: -1 });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);
