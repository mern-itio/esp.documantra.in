const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Get comprehensive analytics data
router.get('/', analyticsController.getAnalyticsData);

// Get real-time analytics updates
router.get('/real-time', analyticsController.getRealTimeAnalytics);

// Heartbeat endpoint to record active sessions
router.post('/heartbeat', analyticsController.postHeartbeat);
router.delete('/heartbeat', analyticsController.deleteHeartbeat);

// Get analytics for specific tool
router.get('/tool/:toolName', analyticsController.getToolAnalytics);

// Get API usage analytics
router.get('/api-usage', analyticsController.getApiAnalytics);

// Get quality metrics
router.get('/quality-metrics', analyticsController.getQualityMetrics);

module.exports = router;
