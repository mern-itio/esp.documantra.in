const mongoose = require('mongoose');

const PdfOperationTrackingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  operation: {
    type: String,
    required: true,
    index: true
  },
  toolName: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Conversion', 'Editing', 'Pages', 'Security', 'Optimization', 'OCR', 'Forms', 'Other','Internal'],
    index: true
  },
  inputFormat: {
    type: String,
    default: null
  },
  outputFormat: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'processing'],
    default: 'processing',
    index: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
PdfOperationTrackingSchema.index({ userId: 1, timestamp: -1 });
PdfOperationTrackingSchema.index({ operation: 1, timestamp: -1 });
PdfOperationTrackingSchema.index({ category: 1, timestamp: -1 });
PdfOperationTrackingSchema.index({ status: 1, timestamp: -1 });
PdfOperationTrackingSchema.index({ toolName: 1, timestamp: -1 });

// Static methods for analytics
PdfOperationTrackingSchema.statics.getAnalyticsData = async function(userId, startDate, endDate) {
  const matchQuery = {
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (userId) {
    matchQuery.userId = userId;
  }
 

  // Debug: Check total operations in database
  const totalOpsInDb = await this.countDocuments({});
  
  // Debug: Check operations with timestamps
  const recentOps = await this.find({}).sort({ timestamp: -1 }).limit(5);
 

  // Debug: Test query without date filtering
  const testQuery = await this.countDocuments({});

  // Debug: Test query with date filtering
  const testQueryWithDate = await this.countDocuments(matchQuery);
  
  // Debug: Check if any operations fall within the date range
  const operationsInRange = await this.find(matchQuery).limit(3);
 

  const [
    totalOperations,
    operationsByCategory,
    operationsByTool,
    operationsByStatus,
    recentOperations,
    dailyOperations,
    processingTimes
  ] = await Promise.all([
    this.countDocuments(matchQuery),
    
    this.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    this.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$toolName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    this.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    this.find(matchQuery)
      .sort({ timestamp: -1 })
      .limit(10)
      .select('operation toolName category status timestamp userId'),
    
    this.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          operations: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    
    this.aggregate([
      { $match: { ...matchQuery, status: 'success', processingTime: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' },
          minProcessingTime: { $min: '$processingTime' },
          maxProcessingTime: { $max: '$processingTime' }
        }
      }
    ])
  ]);

 

  // Calculate success rate
  const successCount = operationsByStatus.find(op => op._id === 'success')?.count || 0;
  const errorCount = operationsByStatus.find(op => op._id === 'error')?.count || 0;
  const successRate = totalOperations > 0 ? (successCount / totalOperations) * 100 : 0;

  // Process daily operations for trend
  const usageTrend = dailyOperations.map(day => ({
    date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
    operations: day.operations,
    users: day.users.length
  }));

  // Process category usage - convert to percentages with safeguard
  const categoryUsage = operationsByCategory.map(cat => {
    const percentage = totalOperations > 0 ? Math.round((cat.count / totalOperations) * 100) : 0;
    return {
      category: cat._id,
      usage: Math.min(100, Math.max(0, percentage)), // Ensure percentage is between 0 and 100
      color: getCategoryColor(cat._id)
    };
  });

  // Process popular tools
  const popularTools = operationsByTool.map(tool => ({
    name: tool._id,
    usage: tool.count,
    percentage: totalOperations > 0 ? Math.round((tool.count / totalOperations) * 100) : 0
  }));

  return {
    totalOperations,
    successRate,
    operationsByCategory,
    operationsByTool,
    recentOperations,
    usageTrend,
    categoryUsage,
    popularTools,
    processingTimes: processingTimes[0] || { avgProcessingTime: 0, minProcessingTime: 0, maxProcessingTime: 0 }
  };
};

// Helper function to get category colors
function getCategoryColor(category) {
  const colors = {
    'Conversion': 'bg-blue-500',
    'Editing': 'bg-green-500',
    'Pages': 'bg-yellow-500',
    'Security': 'bg-red-500',
    'Optimization': 'bg-purple-500',
    'OCR': 'bg-pink-500',
    'Forms': 'bg-indigo-500',
    'Internal': 'bg-orange-500',
    'Other': 'bg-gray-500'
  };
  return colors[category] || 'bg-gray-500';
}

module.exports = mongoose.model('PdfOperationTracking', PdfOperationTrackingSchema);
