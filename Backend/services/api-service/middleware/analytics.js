const ApiEndpointAnalytics = require('../models/apiEndpoint');

function analyticsMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') return next(); // Skip preflight CORS requests
  const startTime = Date.now();
  
  if (req.user) {
    console.log(`[Analytics] User ID: ${req.user.data.id}`);
  }

  // Prevent multiple analytics saves for the same response
  let analyticsSaved = false;
  function saveAnalyticsOnce() {
  if (analyticsSaved) return;
  analyticsSaved = true;

  const latency = Date.now() - startTime;
  const userId = req.user ? req.user.data.id : null;

  const formattedDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const analyticsData = {
  userId,
  timestamp: formattedDate,
  success: res.locals.analyticsResponse?.status >= 200 && res.locals.analyticsResponse?.status < 300, // true/false by status
  statusCode: res.locals.analyticsResponse?.status,
  latency,
  errorName: res.locals.analyticsResponse?.status >= 400 ? res.locals.analyticsResponse?.message : null, // errorName only if status >= 400
  response: {                  
    status: res.locals.analyticsResponse?.status,
    statusText: res.locals.analyticsResponse?.statusText,
    message: res.locals.analyticsResponse?.message,
  }
};

  const endpoint = req.baseUrl + req.path.replace(/\/(\w{24})$/, '/:id');

  ApiEndpointAnalytics.updateOne(
    { endpoint },
    { $push: { requests: analyticsData } },
    { upsert: true }
  ).then(() => {
  }).catch((err) => {
    console.error(`[Analytics] DB Error:`, err.message);
  });
}
  res.on('finish', saveAnalyticsOnce);
  res.on('close', saveAnalyticsOnce); // fallback for abrupt closes

  next();
}

module.exports = analyticsMiddleware;
