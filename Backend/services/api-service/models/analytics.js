const mongoose = require('mongoose');

const statusCodeStatsSchema = new mongoose.Schema({
  code: { type: Number, required: true },
  count: { type: Number, default: 0 },
  percent: { type: Number, default: 0 }
}, { _id: false });

const analyticsStatsSchema = new mongoose.Schema({
  totalRequests: { type: Number, default: 0 },
  errorRate: { type: Number, default: 0 },
  avgLatency: { type: Number, default: 0 },
  apiUptime: { type: Number, default: 0 }
}, { _id: false }); 

const dailyRequestVolumeSchema = new mongoose.Schema({
  date: { type: String, required: true },
  totalRequests: { type: Number, default: 0 },
  errorRate: { type: Number, default: 0 },
  avgLatency: { type: Number, default: 0 },
  apiUptime: { type: Number, default: 0 }
}, { _id: false });

const hourlyLatencySchema = new mongoose.Schema({
  time: { type: String, required: true },
  p50: { type: Number, default: 0 },
  p95: { type: Number, default: 0 },
  p99: { type: Number, default: 0 }
}, { _id: false });

const errorTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  count: { type: Number, default: 0 }
}, { _id: false });

const recentErrorSchema = new mongoose.Schema({
  userId: { type: String },
  endpoint: { type: String },
  timestamp: { type: Date },              // ISO timestamp
  error: { type: String },                 // statusText or errorName
  message: { type: String }
}, { _id: false });

const topEndpointSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  count: { type: Number, default: 0 }
}, { _id: false });

const analyticsDaySchema = new mongoose.Schema({
  date: { type: String, required: true },                  
  RequestVolumeData: [dailyRequestVolumeSchema],            
  getAnalyticsStats: [analyticsStatsSchema],
  getStatusCodesData: [statusCodeStatsSchema],
  HourlyLatencyData: [hourlyLatencySchema],
  ErrorTypesData: [errorTypeSchema],
  RecentErrorsData: [recentErrorSchema],  
  TopApiEndpointsData: [topEndpointSchema]            
});

module.exports = mongoose.model('AnalyticsDay', analyticsDaySchema);

