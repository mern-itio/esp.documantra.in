const axios = require('axios');
const AnalyticsDay = require('../models/analytics');
const crypto = require('crypto');
const ESignApiKey = require('../models/apiKey');
const ApiEndpointAnalytics = require('../models/apiEndpoint');
const mongoose = require('mongoose');

function getUserId(req) {
  const raw = req.user?.data?.id ?? req.user?.id ?? req.user?.userId;
  return raw != null ? String(raw) : null;
}


module.exports = {
  createApiKey: async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
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

    // Stats snapshot object (with date)
    const todayStr = new Date().toISOString().slice(0, 10);
    const statsSnapshot = {
      date: todayStr,
      totalRequests: agg?.total || 0,
      errorRate: Number(agg?.total ? ((agg.errors / agg.total) * 100).toFixed(2) : "0.00"),
      avgLatency: agg?.avgLatency ? Math.round(agg.avgLatency) : 0,
      apiUptime: Number(agg?.total ? ((agg.success / agg.total) * 100).toFixed(2) : "0.00")
    };

    // Find document for today
    let doc = await AnalyticsDay.findOne({ date: todayStr });
    if (!doc) {
      // No doc: create with getAnalyticsStats array
      await AnalyticsDay.findOneAndUpdate(
        { date: todayStr },
        { $set: { getAnalyticsStats: [statsSnapshot] } },
        { new: true, upsert: true }
      );
    } else {
      // Doc exists: update or add today entry
      const idx = doc.getAnalyticsStats.findIndex(obj => obj.date === statsSnapshot.date);
      if (idx >= 0) {
        doc.getAnalyticsStats[idx] = statsSnapshot; // Update
      } else {
        doc.getAnalyticsStats.push(statsSnapshot);  // Add new
      }
      await doc.save();
    }

    return res.status(200).json(statsSnapshot);
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

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // All days range: 5 days
    const allDays = [];
    for (let i = 0; i <= daysAgo; i++) {
      const d = new Date(fromDate);
      d.setUTCDate(fromDate.getUTCDate() + i);
      allDays.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
    }

    // Aggregate day-wise request data
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
          },
          avgLatency: { $avg: "$requests.latency" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Map aggregation data
    const dateMap = {};
    dailyData.forEach(day => {
      const errorRate = day.requestCount > 0 ? ((day.errorCount / day.requestCount) * 100).toFixed(2) : 0;
      const apiUptime = day.requestCount > 0 ? (100 - errorRate) : 0;
      dateMap[day._id.date] = {
        date: day._id.date,
        totalRequests: day.requestCount,
        errorRate: Number(errorRate),
        avgLatency: Math.round(day.avgLatency || 0),
        apiUptime: Number(apiUptime),
      };
    });

    // Chart data for all days
    const chartData = allDays.map(date => dateMap[date] || {
      date,
      totalRequests: 0,
      errorRate: 0,
      avgLatency: 0,
      apiUptime: 0,
    });

    // Persist all chartData in one document's RequestVolumeData array
    const todayStr = new Date().toISOString().slice(0, 10);
    let doc = await AnalyticsDay.findOne({ date: todayStr });

    if (!doc) {
      // Document DOES NOT exist, so create with chartData
      await AnalyticsDay.create({
        date: todayStr,
        RequestVolumeData: chartData
      });
    } else {
      // Document exists, update/add data for each chartData date
      chartData.forEach(metrics => {
        const idx = doc.RequestVolumeData.findIndex(obj => obj.date === metrics.date);
        if (idx >= 0) {
          doc.RequestVolumeData[idx] = metrics; // Update existing
        } else {
          doc.RequestVolumeData.push(metrics);  // Add new day object
        }
      });
      await doc.save();
    }

    return res.status(200).json({ chartData });
  } catch (err) {
    console.error('[RequestVolume] ERROR:', err);
    return res.status(500).json({ error: 'Could not fetch volume', details: err.message });
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
    // DB update logic
    const todayStr = new Date().toISOString().slice(0, 10);
    let doc = await AnalyticsDay.findOne({ date: todayStr });
    if (!doc) {
      await AnalyticsDay.create({
        date: todayStr,
        getStatusCodesData: codes
      });
    } else {
      doc.getStatusCodesData = codes;
      await doc.save();
    }

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
 // Persist chartData in today's document
    const todayStr = new Date().toISOString().slice(0, 10);
    let doc = await AnalyticsDay.findOne({ date: todayStr });

    if (!doc) {
      await AnalyticsDay.create({
        date: todayStr,
        HourlyLatencyData: chartData
      });
    } else {
      doc.HourlyLatencyData = chartData; // Overwrite all for now
      await doc.save();
    }

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
// Save to DB document for today
    const todayStr = new Date().toISOString().slice(0, 10);
    let doc = await AnalyticsDay.findOne({ date: todayStr });
    if (!doc) {
      await AnalyticsDay.create({
        date: todayStr,
        ErrorTypesData: chartData
      });
    } else {
      doc.ErrorTypesData = chartData;
      await doc.save();
    }

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

        // Save to today's document
        const todayStr = new Date().toISOString().slice(0, 10);
        let doc = await AnalyticsDay.findOne({ date: todayStr });

        if (!doc) {
          await AnalyticsDay.create({
            date: todayStr,
            RecentErrorsData: result
          });
        } else {
          doc.RecentErrorsData = result;
          await doc.save();
        }

        return res.status(200).json({ recentErrors: result });
      } catch (err) {
        console.error("[RecentErrors] ERROR:", err);
        return res.status(500).json({ error: "Could not fetch recent errors", details: err.message });
      }
  },
  getTopApiEndpoints : async (req, res) => {
  try {
    // 1. Aggregate raw endpoints and counts
    const result = await ApiEndpointAnalytics.aggregate([
      { $unwind: "$requests" },
      {
        $group: {
          _id: "$endpoint",
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Normalize only for envelope, signature, send, etc
    const endpointCounts = {};
    result.forEach(item => {
      let norm = item._id;

      // Envelope pattern (both :id and any 24-char hex or UUID)
      if (/\/envelope\/([a-f\d]{24,}|:id)($|\/)/i.test(norm)) {
        norm = norm.replace(/\/envelope\/([a-f\d]{24,}|:id)($|\/)/i, '/envelope/:id$2');
      }

      // Signature pattern (both :id and any 24-char hex or UUID)
      else if (/\/signature\/([a-f\d]{24,}|:id)($|\/)/i.test(norm)) {
        norm = norm.replace(/\/signature\/([a-f\d]{24,}|:id)($|\/)/i, '/signature/:id$2');
      }

      // Send pattern (both :id and any 24-char hex or UUID)
      else if (/\/send\/([a-f\d]{24,}|:id)($|\/)/i.test(norm)) {
        norm = norm.replace(/\/send\/([a-f\d]{24,}|:id)($|\/)/i, '/send/:id$2');
      }

      // Add more patterns if needed...

      endpointCounts[norm] = (endpointCounts[norm] || 0) + item.count;
    });

    // 3. Final aggregation, top N
    const endpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

      // Save to today's document
    const todayStr = new Date().toISOString().slice(0, 10);
    let doc = await AnalyticsDay.findOne({ date: todayStr });
    if (!doc) {
      await AnalyticsDay.create({
        date: todayStr,
        TopApiEndpointsData: endpoints
      });
    } else {
      await AnalyticsDay.findOneAndUpdate(
      { date: todayStr },
      { $set: { TopApiEndpointsData: endpoints } },
      { new: true }
    );
    }
    return res.status(200).json({ endpoints });
  } catch (err) {
    console.error("[TopAPIEndpoints] ERROR:", err);
    return res.status(500).json({ error: "Could not fetch top API endpoints", details: err.message });
  }
  },
  getAnalyticsByDate : async (req, res) => {
  try {
    const { date } = req.query; 
    if (!date) {
      return res.status(400).json({ error: "Date query param is required in format YYYY-MM-DD." });
    }
    const doc = await AnalyticsDay.findOne({ date });
    if (!doc) {
      return res.status(404).json({ error: "No analytics data found for this date." });
    }
    return res.status(200).json(doc);
  } catch (err) {
    console.error('[getAnalyticsByDate] ERROR:', err);
    return res.status(500).json({ error: "Could not fetch analytics data", details: err.message });
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
    

