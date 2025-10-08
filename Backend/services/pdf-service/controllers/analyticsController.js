const PdfOperationTracking = require('../models/pdfOperationTracking');
const ActiveSession = require('../models/ActiveSession');

const analyticsController = {
  async getAnalyticsData(req, res) {
    try {
      const { startDate, endDate, timeRange = '7d', includeAllUsers } = req.query;
      const currentUserId = req.user?.data?.id;
      const scopeAll = String(includeAllUsers).toLowerCase() === 'true';
      if (!scopeAll && !currentUserId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      const dateRange = calculateDateRange(timeRange, startDate, endDate);
      const [
        pdfOperationStats,
        qualityMetrics
      ] = await Promise.all([
        // When includeAllUsers=true aggregate across all users; otherwise limit to current user
        getPdfOperationAnalytics(scopeAll ? null : currentUserId, dateRange),
        getQualityMetrics(dateRange)
      ]);

      const analyticsData = {
        dailyUsage: {
          totalOperations: pdfOperationStats.totalOperations,
          uniqueUsers: pdfOperationStats.uniqueUsers,
          popularTools: pdfOperationStats.popularTools
        },
        performanceMetrics: {
          successRate: pdfOperationStats?.successRate || 0,
          averageProcessingTime: `${((((pdfOperationStats && pdfOperationStats.processingTimes && pdfOperationStats.processingTimes.avgProcessingTime) || 0)) / 1000).toFixed(1)}s`,
          userSatisfaction: 4.2
        },
        qualityMetrics: {
          conversionAccuracy: qualityMetrics.conversionAccuracy,
          layoutPreservation: qualityMetrics.layoutPreservation,
          textRecognitionAccuracy: qualityMetrics.textRecognitionAccuracy,
          compressionEfficiency: qualityMetrics.compressionEfficiency
        },
        usageTrend: pdfOperationStats.usageTrend,
        categoryUsage: pdfOperationStats.categoryUsage,
        recentActivity: pdfOperationStats.recentOperations,
        topDocuments: pdfOperationStats.topDocuments || [],
        performanceTrend: pdfOperationStats.performanceTrend || []
      };

      // Real-time active sessions (last 5 minutes)
      const now = new Date();
      const windowStart = new Date(now.getTime() - 5 * 60 * 1000);
      const activeUsers = await ActiveSession.countDocuments({ lastSeen: { $gte: windowStart }, active: true });
      analyticsData.dailyUsage.uniqueUsers = activeUsers; // override with real-time

      res.json({
        success: true,
        data: analyticsData
      });
    } catch (error) {
      console.error('Error getting analytics data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data'
      });
    }
  },

  async getRealTimeAnalytics(req, res) {
    try {
      const { includeAllUsers } = req.query;
      const scopeAll = String(includeAllUsers).toLowerCase() === 'true';
      const currentUserId = req.user?.data?.id;
      if (!scopeAll && !currentUserId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const baseMatch = scopeAll ? { timestamp: { $gte: startDate } } : { userId: currentUserId, timestamp: { $gte: startDate } };

      const [recentActivity, todayStats] = await Promise.all([
        PdfOperationTracking.find(baseMatch)
          .sort({ timestamp: -1 })
          .limit(10)
          .select('operation toolName category status timestamp userId'),

        PdfOperationTracking.aggregate([
          { $match: baseMatch },
          { $group: { _id: null, totalOperations: { $sum: 1 } } }
        ])
      ]);

      // Also return current active sessions
      const now = new Date();
      const windowStart = new Date(now.getTime() - 5 * 60 * 1000);
      const activeUsers = await ActiveSession.countDocuments({ lastSeen: { $gte: windowStart }, active: true });

      res.json({
        success: true,
        data: {
          recentActivity: recentActivity.map(activity => ({
            id: activity._id,
            action: activity.operation,
            documentName: `${activity.toolName} Operation`,
            timestamp: activity.timestamp,
            userId: activity.userId
          })),
          todayOperations: todayStats[0]?.totalOperations || 0,
          activeUsers
        }
      });
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch real-time analytics'
      });
    }
  },

  async getToolAnalytics(req, res) {
    try {
      const { toolName } = req.params;
      const { startDate, endDate } = req.query;
      const currentUserId = req.user?.data?.id;

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      let dateQuery = { userId: currentUserId, toolName: { $regex: toolName, $options: 'i' } };
      if (startDate || endDate) {
        dateQuery.timestamp = {};
        if (startDate) dateQuery.timestamp.$gte = new Date(startDate);
        if (endDate) dateQuery.timestamp.$lte = new Date(endDate);
      }

      const toolStats = await PdfOperationTracking.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$toolName',
            count: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingTime' },
            successRate: {
              $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            totalFileSize: { $sum: '$fileSize' },
            categories: { $addToSet: '$category' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          toolName,
          stats: toolStats
        }
      });
    } catch (error) {
      console.error('Error getting tool analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tool analytics'
      });
    }
  },

  async getApiAnalytics(req, res) {
    try {
      res.json({
        success: true,
        data: {
          successRate: 95.5,
          averageProcessingTime: '2.3s',
          userSatisfaction: 4.2
        }
      });
    } catch (error) {
      console.error('Error getting API analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch API analytics'
      });
    }
  },

  async getQualityMetrics(req, res) {
    try {
      res.json({
        success: true,
        data: {
          conversionAccuracy: 98.5,
          layoutPreservation: 96.2,
          textRecognitionAccuracy: 94.8,
          compressionEfficiency: 89.3
        }
      });
    } catch (error) {
      console.error('Error getting quality metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quality metrics'
      });
    }
  }
};

// Helper functions
function calculateDateRange(timeRange, startDate, endDate) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to end of day (23:59:59.999) when using specific dates
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  const end = new Date();
  const start = new Date();

  // Set end date to end of day (23:59:59.999)
  end.setHours(23, 59, 59, 999);


  switch (timeRange) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }
  return { startDate: start, endDate: end };
}

async function getPdfOperationAnalytics(userId, dateRange) {
  const { startDate, endDate } = dateRange;
  const stats = await PdfOperationTracking.getAnalyticsData(userId, startDate, endDate);
  const uniqueUsers = await PdfOperationTracking.distinct('userId', {
    timestamp: { $gte: startDate, $lte: endDate }
  });
  try {
    // console.log('📊 Unique users from operations:', uniqueUsers.length);
  } catch (error) {
    console.log('⚠️ Could not fetch total user count from auth service');
  }

  const recentOperations = stats.recentOperations.map(op => ({
    id: op._id,
    action: op.operation,
    documentName: `${op.toolName} Operation`,
    timestamp: op.timestamp,
    userId: op.userId
  }));

  const topDocuments = stats.popularTools.slice(0, 5).map((tool, index) => ({
    documentId: `tool-${index}`,
    documentName: tool.name,
    actionCount: tool.usage,
    lastAction: new Date().toISOString()
  }));

  const result = {
    totalOperations: stats.totalOperations,
    uniqueUsers: uniqueUsers.length,
    successRate: stats.successRate,
    averageProcessingTime: `${(stats.processingTimes.avgProcessingTime / 1000).toFixed(1)}s`,
    popularTools: stats.popularTools,
    categoryUsage: stats.categoryUsage,
    recentOperations,
    topDocuments,
    usageTrend: stats.usageTrend
  };
  return result;
}
async function getQualityMetrics(dateRange) {
  return {
    conversionAccuracy: 98.5,
    layoutPreservation: 96.2,
    textRecognitionAccuracy: 94.8,
    compressionEfficiency: 89.3
  };
}
module.exports = analyticsController;

// Heartbeat: upsert active session with lastSeen
analyticsController.postHeartbeat = async (req, res) => {
  try {
    const currentUserId = req.user?.data?.id || req.body.userId;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
    await ActiveSession.updateOne(
      { userId: currentUserId },
      { $set: { userAgent, ipAddress, lastSeen: new Date(), active: true } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, error: 'Failed to record heartbeat' });
  }
};

// Clear heartbeat on logout
analyticsController.deleteHeartbeat = async (req, res) => {
  try {
    const currentUserId = req.user?.data?.id || req.body.userId;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    await ActiveSession.updateOne({ userId: currentUserId }, { $set: { active: false, lastSeen: new Date() } }, { upsert: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete heartbeat error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear heartbeat' });
  }
};
