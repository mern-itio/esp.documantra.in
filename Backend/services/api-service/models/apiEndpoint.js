const mongoose = require('mongoose');

const ApiEndpointAnalyticsSchema = new mongoose.Schema({
  endpoint: String,
  requests: [{
    userId: String,
    timestamp: Date,
    success: Boolean,     // <-- IMP
    statusCode: Number,   // <-- IMP
    latency: Number,
    errorName: String,    // <-- IMP
    response: mongoose.Schema.Types.Mixed // <-- IMP (actual response data or all analytics fields as object)
  }]
});


module.exports = mongoose.model('ApiEndpointAnalytics', ApiEndpointAnalyticsSchema);
