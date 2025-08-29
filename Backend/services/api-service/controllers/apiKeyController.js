const axios = require('axios');
const crypto = require('crypto');
const ESignApiKey = require('../models/apiKey');
const ApiEndpointAnalytics = require('../models/apiEndpoint');
const mongoose = require('mongoose');


module.exports = {
   createApiKey: async (req, res) => {
    try {
      const userId = req.user.data.id;
      const mode = req.body.mode;

      if (!['sandbox', 'production'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode. Must be "sandbox" or "production".' });
      }

      // Correct model reference here
      const existingKey = await ESignApiKey.findOne({ userId, mode, isActive: true });
      if (existingKey) {
        return res.status(400).json({ error: `API key already exists for ${mode} mode.` });
      }

      const apiKey = crypto.randomBytes(32).toString('base64url');
      const limit = mode === 'sandbox' ? 10 : null;

      const now = new Date();
      const initialUsageLogs = [{
        year: now.getFullYear(),
        month: now.getMonth() + 1, // JS months are 0-indexed
        count: 0
      }];

      const keyDoc = new ESignApiKey({ userId, apiKey, mode, limit, usageCount: 0,usageLogs: initialUsageLogs, isActive: true, lastUsedAt: null });
      await keyDoc.save();

      res.status(201).json({
        apiKey,
        usageCount: 0,
        limit,
        mode,
        usageLogs: initialUsageLogs,
        lastUsedAt:null,
      });
    } catch (err) {
      console.error('API Key generation error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
  getAllApiKeys: async (req, res) => {
    try {
      const userId = req.user.data.id;
      const apiKeys = await ESignApiKey.find({ userId }).select('-__v');
      res.json({ apiKeys });
    } catch (err) {
      console.error('Error fetching API keys:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
  getAnalyticsStats :async (req, res) => {
  try {
    // Unwind all requests to process each individually
    const [agg] = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ["$requests.success", false] }, 1, 0] } },
          success: { $sum: { $cond: [{ $eq: ["$requests.success", true] }, 1, 0] } },
          avgLatency: { $avg: "$requests.latency" }
        }
      }
    ]);

    // Safe fallback for no data
    const totalRequests = agg?.total || 0;
    const errorRate = totalRequests ? ((agg.errors / totalRequests) * 100).toFixed(2) : "0.00";
    const avgLatency = agg?.avgLatency ? Math.round(agg.avgLatency) : 0;
    const apiUptime = totalRequests ? ((agg.success / totalRequests) * 100).toFixed(2) : "0.00";

    return res.status(200).json({
      totalRequests,
      errorRate: Number(errorRate),
      avgLatency,
      apiUptime: Number(apiUptime)
    });
  } catch (err) {
    console.error('[AnalyticsStats] ERROR:', err);
    return res.status(500).json({ error: 'Could not retrieve analytics stats', details: err.message });
  }
  },
  getRequestVolume : async (req, res) => {
  try {
    const daysAgo = 5;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const fromDate = new Date(today);
    fromDate.setUTCDate(fromDate.getUTCDate() - daysAgo);

    // Tomorrow 
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // All days range: 5 days
    const allDays = [];
    for (let i = 0; i <= daysAgo; i++) { // <= instead of < for today included
      const d = new Date(fromDate);
      d.setUTCDate(fromDate.getUTCDate() + i);
      allDays.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
    }

    // Aggregate day-wise request data (now latest date will match)
    const dailyData = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      { $match: { "requests.timestamp": { $gte: fromDate, $lt: tomorrow } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$requests.timestamp" } }
          },
          requestCount: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $eq: ["$requests.success", false] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Map aggregation data
    const dateMap = {};
    dailyData.forEach(day =>
      dateMap[day._id.date] = {
        requests: day.requestCount,
        errors: day.errorCount,
      }
    );

    // Build final array, fill 0s where missing
    const chartData = allDays.map((date, idx) => ({
      day: `Day ${idx + 1}`,
      date,
      requests: dateMap[date]?.requests || 0,
      errors: dateMap[date]?.errors || 0,
    }));

    return res.status(200).json({ chartData });
  } catch (err) {
    console.error("[RequestVolume] ERROR:", err);
    return res.status(500).json({ error: "Could not fetch volume", details: err.message });
  }
  },
  getStatusCodes : async (req, res) => {
  try {
    const result = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
        { $match: { "requests.statusCode": { $ne: null } } },  // Each request as single doc
      {
        $group: {
          _id: "$requests.statusCode",      // Group by statusCode
          count: { $sum: 1 }                // Count requests per statusCode
        }
      },
      { $sort: { count: -1 } }              // Optional: most used first
    ]);

    // Total requests for overall percentage calculation
    const total = result.reduce((sum, item) => sum + item.count, 0);

    // Format for chart
    const codes = result.map(item => ({
      code: item._id,
      count: item.count,
      percent: ((item.count / total) * 100).toFixed(1) // 1 decimal
    }));

    return res.status(200).json({ total, codes });
  } catch (err) {
    console.error('[StatusCodes] ERROR:', err);
    return res.status(500).json({ error: "Could not fetch status codes", details: err.message });
  }
  },
  getHourlyLatencyPercentiles : async (req, res) => {
  try {
    const start = new Date();
    start.setHours(start.getHours() - 12, 0, 0, 0);

    // Aggregate: group by date + hour
    const result = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      { $match: { "requests.timestamp": { $gte: start } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$requests.timestamp" } },
            hour: { $hour: "$requests.timestamp" }
          },
          latencies: { $push: "$requests.latency" }
        }
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } }
    ]);

    // Percentile calculation
    const percentile = (arr, p) => {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[idx];
    };

    // Build final array, 
    const chartData = result.map(slot => {
      const hourLabel = `${String(slot._id.hour).padStart(2, "0")}:00`;
      return {
        time: `${slot._id.date} ${hourLabel}`,
        p50: percentile(slot.latencies, 50),
        p95: percentile(slot.latencies, 95),
        p99: percentile(slot.latencies, 99)
      };
    });

    return res.status(200).json({ chartData });
  } catch (err) {
    console.error("[HourlyLatencyPercentiles] ERROR:", err);
    return res.status(500).json({ error: "Could not fetch hourly latency percentiles", details: err.message });
  }
  },
  getErrorTypesDistribution : async (req, res) => {
  try {
    // Direct aggregation: group by actual statusText field
    const result = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      { 
        $match: { 
          $or: [
            { "requests.success": false },
            { "requests.statusCode": { $gte: 400 } }
          ],
          "requests.response.statusText": { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$requests.response.statusText", // Only types actually present in DB
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Direct format for frontend
    const chartData = result.map(item => ({
      type: item._id || "Other",
      count: item.count
    }));

    return res.status(200).json({ chartData });
  } catch (err) {
    console.error("[ErrorTypes] ERROR:", err);
    return res.status(500).json({ error: "Could not fetch error types", details: err.message });
  }
  },
  getRecentErrors : async (req, res) => {
      try {
        const result = await ApiEndpointAnalytics.aggregate([
          { $unwind: "$requests" },
          { $match: { "requests.success": false } }, // Only failed
          {
            $project: {
              _id: 0,
              userId: "$requests.userId",
              endpoint: "$endpoint",
              timestamp: "$requests.timestamp",
              error: "$requests.response.statusText",    // or errorName if you want
              message: "$requests.response.data.error"   // or "$requests.response.data.message", whichever field required
            }
          },
          { $sort: { timestamp: -1 } }, // Latest first
          { $limit: 3 }
        ]);

        return res.status(200).json({ recentErrors: result });
      } catch (err) {
        console.error("[RecentErrors] ERROR:", err);
        return res.status(500).json({ error: "Could not fetch recent errors", details: err.message });
      }
  },
  getTopApiEndpoints : async (req, res) => {
  try {
    const result = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      {
        $group: {
          _id: "$endpoint",        
          count: { $sum: 1 }        
        }
      },
      { $sort: { count: -1 } },     // Descending by hit count
      { $limit: 10 }                // Top 10 endpoints (adjust as needed)
    ]);
    // Format for frontend
    const endpoints = result.map(item => ({
      endpoint: item._id,
      count: item.count
    }));
    return res.status(200).json({ endpoints });
  } catch (err) {
    console.error("[TopAPIEndpoints] ERROR:", err);
    return res.status(500).json({ error: "Could not fetch top API endpoints", details: err.message });
  }
  },
  runApiTest : async (req, res) => {
    try {
      const { url, method, token, headers, body } = req.body;
      const apiKey = req.headers['x-api-key'];

      // Prepare request headers
      const requestHeaders = {
        ...headers,
        'Authorization': token ? `Bearer ${token}` : undefined,
        'x-api-key': apiKey,
      };

      // Axios config
      const config = {
        url,
        method: method || 'get',  // default: 'get'
        headers: requestHeaders,
        data: body || {},         // for POST/PUT
        timeout: 10000            // 10 sec timeout
      };

      // Make the API request
      const response = await axios(config);

      // Respond with result (status, body, headers)
      res.status(200).json({
        success: true,
        status: response.status,
        headers: response.headers,
        data: response.data
      });

    } catch (error) {
      // Error handling
      res.status(error.response?.status || 500).json({
        success: false,
        message: error.message,
        data: error.response?.data,
        status: error.response?.status
      });
    }
  },
  runAllTestCases : async (req, res) => {
    const { testCases } = req.body;
    const apiKey = req.headers['x-api-key'];
    const results = [];

    for (const testCase of testCases) {
      try {
        const { url, method, token, headers, body } = testCase;
        // Prepare request headers
        const requestHeaders = {
          ...headers,
          'Authorization': token ? `Bearer ${token}` : undefined,
          'x-api-key': apiKey,
        };

        // Axios config
        const config = {
          url,
          method: method || 'get',
          headers: requestHeaders,
          data: body || {},
          timeout: 10000
        };

        const response = await axios(config);

        results.push({
          name: testCase.name,
          url,
          success: true,
          status: response.status,
          headers: response.headers,
          data: response.data
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          url,
          success: false,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }

    res.status(200).json({ results });
  },
  };
    

