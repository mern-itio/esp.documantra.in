const mongoose = require('mongoose');

const documentEntitySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['person', 'organization', 'location', 'date', 'money', 'other'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  position: {
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    }
  }
});

const ocrRegionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  boundingBox: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  }
});

const complianceIssueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  recommendation: {
    type: String,
    required: true
  },
  position: {
    page: {
      type: Number
    },
    line: {
      type: Number
    }
  }
});

const documentAnalysisSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  analysis: {
    wordCount: {
      type: Number,
      required: true,
      default: 0
    },
    pageCount: {
      type: Number,
      required: true,
      default: 1
    },
    readabilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
      default: 'neutral'
    },
    language: {
      type: String,
      required: true,
      default: 'en'
    },
    topics: [{
      type: String,
      trim: true
    }],
    entities: [documentEntitySchema],
    keyPhrases: [{
      type: String,
      trim: true
    }],
    summary: {
      type: String,
      required: true,
      default: ''
    }
  },
  ocrResults: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    extractedText: {
      type: String
    },
    regions: [ocrRegionSchema]
  },
  classification: {
    category: {
      type: String,
      required: true,
      default: 'general'
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    suggestedTags: [{
      type: String,
      trim: true
    }]
  },
  compliance: {
    issues: [complianceIssueSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendations: [{
      type: String
    }]
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentAnalysisSchema.index({ documentId: 1 });
documentAnalysisSchema.index({ processedAt: -1 });
documentAnalysisSchema.index({ processingStatus: 1 });

module.exports = mongoose.model('DocumentAnalysis', documentAnalysisSchema);
