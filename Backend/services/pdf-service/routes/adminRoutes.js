const express = require('express');
const router = express.Router();
const PdfOperationTracking = require('../models/pdfOperationTracking');
const DocumentTracking = require('../models/documentTracking');

// Get user's PDF operations with pagination and filtering
const getUserOperations = async (req, res) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 10, operation, category, status, startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'User ID is required', 
        data: null 
      });
    }

    // Build filter object
    const filter = { userId };
    
    if (operation) filter.operation = { $regex: operation, $options: 'i' };
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const operations = await PdfOperationTracking.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PdfOperationTracking.countDocuments(filter);

    return res.status(200).json({
      status: 200,
      message: 'PDF operations retrieved successfully',
      data: {
        operations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching user PDF operations:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Get user's PDF operation statistics
const getUserStats = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'User ID is required', 
        data: null 
      });
    }

    // Build filter object
    const filter = { userId };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get total operations
    const totalOperations = await PdfOperationTracking.countDocuments(filter);
    
    // Get success count
    const successCount = await PdfOperationTracking.countDocuments({ ...filter, status: 'success' });
    
    // Get error count
    const errorCount = await PdfOperationTracking.countDocuments({ ...filter, status: 'error' });
    
    // Get operations by category
    const categoryStats = await PdfOperationTracking.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get operations by tool
    const toolStats = await PdfOperationTracking.aggregate([
      { $match: filter },
      { $group: { _id: '$toolName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await PdfOperationTracking.aggregate([
      { 
        $match: { 
          ...filter, 
          timestamp: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    const stats = {
      totalOperations,
      successCount,
      errorCount,
      successRate: totalOperations > 0 ? ((successCount / totalOperations) * 100).toFixed(2) : 0,
      categoryStats,
      toolStats,
      recentActivity
    };

    return res.status(200).json({
      status: 200,
      message: 'PDF statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    console.error('Error fetching user PDF stats:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Get all users' PDF operation statistics (admin overview)
const getAllUsersStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter object
    const filter = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get total operations across all users
    const totalOperations = await PdfOperationTracking.countDocuments(filter);
    
    // Get unique users count
    const uniqueUsers = await PdfOperationTracking.distinct('userId', filter);
    
    // Get operations by status
    const statusStats = await PdfOperationTracking.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get top users by operation count
    const topUsers = await PdfOperationTracking.aggregate([
      { $match: filter },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get operations by category
    const categoryStats = await PdfOperationTracking.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      totalOperations,
      uniqueUsers: uniqueUsers.length,
      statusStats,
      topUsers,
      categoryStats
    };

    return res.status(200).json({
      status: 200,
      message: 'All users PDF statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    console.error('Error fetching all users PDF stats:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Test endpoint to verify tracking is working
const testTracking = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Get recent operations for testing
    const recentOps = await PdfOperationTracking.find({})
      .sort({ timestamp: -1 })
      .limit(10);
    
    const totalOps = await PdfOperationTracking.countDocuments({});
    const uniqueUsers = await PdfOperationTracking.distinct('userId');
    
    return res.status(200).json({
      status: 200,
      message: 'Tracking test successful',
      data: {
        totalOperations: totalOps,
        uniqueUsers: uniqueUsers.length,
        recentOperations: recentOps,
        testUserId: userId || 'not provided'
      }
    });
  } catch (err) {
    console.error('Error in tracking test:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Routes
router.get('/user-operations', getUserOperations);
router.get('/user-stats', getUserStats);
router.get('/all-users-stats', getAllUsersStats);
router.get('/test-tracking', testTracking);

module.exports = router;
