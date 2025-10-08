const PdfOperationTracking = require('../models/pdfOperationTracking');
const { fetchFreePlanLimit } = require('../utils/freePlanCache');
const GuestUsage = require('../models/GuestUsage');

async function anonymousLimiter(req, res, next) {
  try {
    // Skip if authenticated
    if (req.user) return next();

    // Skip non-modifying health/static routes quickly
    const url = req.originalUrl || '';
    if (url.startsWith('/health') || url.startsWith('/outputs') || url.includes('/download')) {
      return next();
    }

    // Determine IP
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    // Window: past 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count successful operations for this IP by anonymous users
    const count = await PdfOperationTracking.countDocuments({
      ipAddress: ip,
      userId: 'anonymous',
      status: 'success',
      timestamp: { $gte: since }
    });

    const freePlan = await fetchFreePlanLimit();
    const limit = freePlan.limitType === 'number' ? (freePlan.limit ?? 10) : Infinity;

    // Maintain an atomic counter per IP for the current 24h window
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usage = await GuestUsage.findOne({ ip });
    let currentCount = count;
    if (!usage) {
      await GuestUsage.create({ ip, windowStart: new Date(), count: currentCount });
    } else {
      // reset if window expired
      if (usage.windowStart < windowStart) {
        usage.windowStart = new Date();
        usage.count = currentCount;
      } else {
        // set to max between counted success ops and stored counter
        usage.count = Math.max(usage.count, currentCount);
      }
      await usage.save();
      currentCount = usage.count;
    }

    if (currentCount >= limit) {
      return res.status(429).json({
        status: 429,
        message: `Free plan limit reached. ${freePlan.limitType === 'number' ? `${limit} operations` : 'Unlimited'} allowed per 24 hours for guests. Please log in or upgrade.`,
      });
    }

    // Allow; after response success, increment GuestUsage counter to reflect this op
    const originalJson = res.json;
    const originalSend = res.send;
    const markSuccess = async (ok) => {
      if (!ok) return;
      try {
        const doc = await GuestUsage.findOne({ ip });
        if (doc) {
          // still in window?
          if (Date.now() - doc.windowStart.getTime() <= 24 * 60 * 60 * 1000) {
            doc.count += 1;
            await doc.save();
          } else {
            doc.windowStart = new Date();
            doc.count = 1;
            await doc.save();
          }
        } else {
          await GuestUsage.create({ ip, windowStart: new Date(), count: 1 });
        }
      } catch (e) {
        console.error('anonymousLimiter increment error:', e?.message || e);
      }
    };

    res.json = function(data) {
      const ok = res.statusCode >= 200 && res.statusCode < 300;
      markSuccess(ok);
      return originalJson.call(this, data);
    };
    res.send = function(data) {
      const ok = res.statusCode >= 200 && res.statusCode < 300;
      markSuccess(ok);
      return originalSend.call(this, data);
    };

    return next();
  } catch (err) {
    // Fail-open to avoid blocking service on DB issues
    console.error('anonymousLimiter error:', err?.message || err);
    return next();
  }
}

module.exports = { anonymousLimiter };


