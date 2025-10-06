const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  assignee: { type: String, required: true }, // Email address
  assigneeName: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  dueDate: { type: Date },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  completedAt: { type: Date },
  comments: { type: String },
  requiredApprovals: { type: Number, default: 1 },
  currentApprovals: { type: Number, default: 0 },
  // Timer tracking fields
  timeTracking: {
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    isTimerRunning: { type: Boolean, default: false },
    lastStartTime: { type: Date }, // When timer was last started
    sessions: [{
      startedAt: Date,
      pausedAt: Date,
      duration: Number // in seconds
    }]
  },
  metadata: {
    startedAt: Date,
    completedBy: String,
    rejectionReason: String
  }
}, { timestamps: true });

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  steps: [workflowStepSchema],
  createdBy: { type: String, required: true }, // Email address
  createdByName: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  deadline: { type: Date },
  completedAt: { type: Date },
  metadata: {
    description: String,
    tags: [String],
    category: String,
    cost: Number,
    department: String
  }
}, { timestamps: true });

// Indexes for performance
workflowSchema.index({ documentId: 1, status: 1 });
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ 'steps.assignee': 1 });
workflowSchema.index({ deadline: 1 });
workflowSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);