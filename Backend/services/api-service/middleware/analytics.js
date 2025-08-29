const ApiEndpointAnalytics = require('../models/apiEndpoint');

function analyticsMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') return next(); // Skip preflight CORS requests
  const startTime = Date.now();

  if (req.user) {
    console.log(`[Analytics] User ID: ${req.user.data.id}`);
  }

  // Prevent multiple analytics saves for the same response
  let analyticsSaved = false;
  async function saveAnalyticsOnce() {
    if (analyticsSaved) return;
    analyticsSaved = true;

    const latency = Date.now() - startTime;
    const userId = req.user ? req.user.data.id : null;

    // LOG: res.locals.analyticsResponse contents
    console.log('[Analytics] res.locals.analyticsResponse:', res.locals.analyticsResponse);

    const statusNum = Number(res.locals.analyticsResponse?.status);
    if (isNaN(statusNum)) {
      console.warn(`[Analytics] WARNING: statusNum is NaN! Check controller response.`);
    } else {
      console.log(`[Analytics] HTTP statusNum=${statusNum}`);
    }

    const success =
      !!(res.locals.analyticsResponse &&
        statusNum >= 200 && statusNum < 300);

    // LOG: Success calculation
    console.log(`[Analytics] Success calculated: ${success}`);

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
      success,
      statusCode: res.locals.analyticsResponse?.status,
      latency,
      errorName: statusNum >= 400 ? res.locals.analyticsResponse?.message : null,
      response: {
        status: res.locals.analyticsResponse?.status,
        statusText: res.locals.analyticsResponse?.statusText,
        message: res.locals.analyticsResponse?.message,
        data: res.locals.analyticsResponse?.data,
      },
    };

    let endpointString = req.baseUrl + req.path;
    if (/\/[a-f0-9]{24}$/.test(endpointString)) {
      endpointString = endpointString.replace(/\/[a-f0-9]{24}$/, '/:id');
    }
    const endpoint = endpointString;

    // LOG: Final analyticsData and endpoint
    // console.log('[Analytics] Final analyticsData to save:', analyticsData);
    // console.log('[Analytics] Target endpoint:', endpoint);

    ApiEndpointAnalytics.updateOne(
      { endpoint },
      { $push: { requests: analyticsData } },
      { upsert: true }
    )
      .then(() => {
        console.log('[Analytics] Saved analytics to DB successfully');
      })
      .catch((err) => {
        console.error(`[Analytics] DB Error:`, err.message);
      });
  }

  res.on('finish', () => {
    saveAnalyticsOnce();
  });
  res.on('close', () => {
    saveAnalyticsOnce();
  }); // fallback for abrupt closes

  next();
}

module.exports = analyticsMiddleware;
