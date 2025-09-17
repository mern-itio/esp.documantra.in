const mongoose = require('mongoose');

const executionStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  toolId: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  inputFile: { type: String }, // Path to input file
  outputFile: { type: String }, // Path to output file
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String },
  result: { type: mongoose.Schema.Types.Mixed }, // Tool-specific result data
  logs: [{ type: String }] // Execution logs
}, { timestamps: true });

const workflowExecutionSchema = new mongoose.Schema({
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowTemplate', required: true },
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  steps: [executionStepSchema],
  inputFile: { type: String, required: true }, // Original input file path
  outputFile: { type: String }, // Final output file path
  createdBy: { type: String, required: true }, // User email
  createdByName: { type: String, required: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
  totalDuration: { type: Number }, // in milliseconds
  metadata: {
    originalFileName: String,
    originalFileSize: Number,
    finalFileSize: Number,
    compressionRatio: Number,
    processingNotes: String
  }
}, { timestamps: true });

// Indexes for performance
workflowExecutionSchema.index({ createdBy: 1, status: 1 });
workflowExecutionSchema.index({ templateId: 1 });
workflowExecutionSchema.index({ status: 1, createdAt: -1 });
workflowExecutionSchema.index({ 'steps.status': 1 });

module.exports = mongoose.model('WorkflowExecution', workflowExecutionSchema);
