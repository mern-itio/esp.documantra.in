const PdfOperationTracking = require('../models/pdfOperationTracking');
const { fetchFreePlanLimit } = require('../utils/freePlanCache');
const { fetchUserPlan, canUserAccessTool, getUserLimitsForTool, fetchToolSettings } = require('../utils/userPlanCache');
const GuestUsage = require('../models/GuestUsage');

// Helper function to extract tool ID from request URL
function extractToolIdFromRequest(req) {
  const url = req.originalUrl || req.url || '';
  console.log(`[extractToolIdFromRequest] Extracting tool ID from URL: ${url}`);
  
  // Common PDF tool URL patterns
  const patterns = [
    /\/pdf-tools\/([^\/\?]+)/,  // /pdf-tools/tool-name
    /\/pdf\/([^\/\?]+)/,        // /pdf/tool-name
    /\/pdf-([^\/\?]+)/,         // /pdf-toolname
    /\/convert\/([^\/\?]+)/,    // /convert/tool-name
    /\/advanced-editor\/([^\/\?]+)/, // /advanced-editor/tool-name
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const extractedId = match[1];
      console.log(`[extractToolIdFromRequest] Pattern matched, extracted ID: ${extractedId}`);
      // Known canonical tool IDs (must match admin toolId values)
      const knownToolIds = new Set([
        // conversion
        'pdf-to-word','word-to-pdf','pdf-to-excel','excel-to-pdf','pdf-to-powerpoint','powerpoint-to-pdf','pdf-to-img','img-to-pdf','pdf-to-text','text-to-pdf','pdf-to-html','html-to-pdf','pdf-to-epub','batch-conversion','smart-conversion',
        // editing
        'pdf-editor','add-text','add-images','add-shapes','highlight-text','add-comments','draw-annotations','redact-content','add-stamps','find-replace','spell-check','edit-metadata',
        // pages
        'merge-pdf','split-pdf','extract-pdf','delete-pdf','reorder-pdf','rotate-pdf','crop-pdf','insert-pdf','add-page-numbers','add-header-footer',
        // security
        'add-password','remove-password','digital-signature','set-permissions','add-watermark','remove-metadata','document-tracking',
        // optimization
        'compress-pdf','optimize-image','optimize-font','remove-unused-objects','linearize-pdf','color-optimization','quality-analysis','batch-optimization',
        // ocr
        'ocr','make-searchable','extract-tables','handwriting-recognition',
        // forms
        'create-form','fill-form','form-recognition','calculate-fields',
        // utilities
        'pdf-info','pdf-validator','pdf-compare','pdf-repair','pdf-bookmarks','pdf-statistics'
      ]);
      if (knownToolIds.has(extractedId)) {
        console.log(`[extractToolIdFromRequest] Recognized canonical tool ID: ${extractedId}`);
        return extractedId;
      }
      
      // Map common route patterns to canonical tool IDs
      const routeToToolId = {
        // Word
        'to-doc': 'pdf-to-word',
        'to-docx': 'pdf-to-word',
        'to-word': 'pdf-to-word',
        'pdf-to-doc': 'pdf-to-word',
        'pdf-to-docx': 'pdf-to-word',
        // Word to PDF variants
        'doc-to-pdf': 'word-to-pdf',
        'docx-to-pdf': 'word-to-pdf',
        'word-to-pdf': 'word-to-pdf',
        // Excel/JPG/Text/PPT quick aliases
        'to-excel': 'pdf-to-excel',
        'to-jpg': 'pdf-to-jpg',
        'to-text': 'pdf-to-text',
        'to-ppt': 'pdf-to-powerpoint',
        // Short routes to canonical ids
        'compress': 'compress-pdf',
        'merge': 'merge-pdf',
        'split': 'split-pdf',
        'delete-pages': 'delete-pdf',
        'extract-pages': 'extract-pdf',
        'protect-pdf': 'add-password',
        'unlock-pdf': 'remove-password',
        'watermark-pdf': 'add-watermark',
      };
      
      const toolId = routeToToolId[extractedId] || extractedId;
      console.log(`[extractToolIdFromRequest] Final tool ID: ${toolId} from ${extractedId}`);
      return toolId;
    }
  }
  
  // Map common route patterns to tool IDs
  const routeToToolId = {
    'pdf-to-word': 'pdf-to-word',
    'word-to-pdf': 'word-to-pdf',
    'pdf-to-excel': 'pdf-to-excel',
    'excel-to-pdf': 'excel-to-pdf',
    'pdf-to-powerpoint': 'pdf-to-powerpoint',
    'powerpoint-to-pdf': 'powerpoint-to-pdf',
    'pdf-to-img': 'pdf-to-img',
    'img-to-pdf': 'img-to-pdf',
    'pdf-to-text': 'pdf-to-text',
    'text-to-pdf': 'text-to-pdf',
    'pdf-to-html': 'pdf-to-html',
    'html-to-pdf': 'html-to-pdf',
    'pdf-to-epub': 'pdf-to-epub',
    'batch-conversion': 'batch-conversion',
    'pdf-editor': 'pdf-editor',
    'add-text': 'add-text',
    'add-images': 'add-images',
    'add-shapes': 'add-shapes',
    'highlight-text': 'highlight-text',
    'draw-annotations': 'draw-annotations',
    'merge-pdf': 'merge-pdf',
    'split-pdf': 'split-pdf',
    'extract-pdf': 'extract-pdf',
    'delete-pdf': 'delete-pdf',
    'reorder-pdf': 'reorder-pdf',
    'rotate-pdf': 'rotate-pdf',
    'crop-pdf': 'crop-pdf',
    'insert-pdf': 'insert-pdf',
    'add-page-numbers': 'add-page-numbers',
    'add-header-footer': 'add-header-footer',
    'add-password': 'add-password',
    'remove-password': 'remove-password',
    'digital-signature': 'digital-signature',
    'set-permissions': 'set-permissions',
    'add-watermark': 'add-watermark',
    'remove-metadata': 'remove-metadata',
    'edit-metadata': 'edit-metadata',
    'spell-check': 'spell-check',
    'find-replace': 'find-replace',
    'redact-content': 'redact-content',
    'add-stamps': 'add-stamps',
    'compress-pdf': 'compress-pdf',
    'optimize-image': 'optimize-image',
    'optimize-font': 'optimize-font',
    'remove-unused-objects': 'remove-unused-objects',
    'linearize-pdf': 'linearize-pdf',
    'color-optimization': 'color-optimization',
    'quality-analysis': 'quality-analysis',
    'batch-optimization': 'batch-optimization',
    'ocr': 'ocr',
    'make-searchable': 'make-searchable',
    'extract-tables': 'extract-tables',
    'handwriting-recognition': 'handwriting-recognition',
    'create-form': 'create-form',
    'fill-form': 'fill-form',
    'form-recognition': 'form-recognition',
    'calculate-fields': 'calculate-fields',
    'pdf-info': 'pdf-info',
    'pdf-validator': 'pdf-validator',
    'pdf-compare': 'pdf-compare',
    'pdf-repair': 'pdf-repair',
    'pdf-bookmarks': 'pdf-bookmarks',
    'pdf-statistics': 'pdf-statistics'
  };
  
  // Check if the URL contains any of the known tool patterns
  for (const [route, toolId] of Object.entries(routeToToolId)) {
    if (url.includes(route)) {
      return toolId;
    }
  }
  
  return null;
}

async function anonymousLimiter(req, res, next) {
  try {
    // Extract tool ID from request
    const toolId = extractToolIdFromRequest(req);
    const isAuthenticated = !!req.user;
    const userPlan = req.user?.data?.plan || req.user?.plan || 'free';
    
    console.log(`[anonymousLimiter] URL: ${req.originalUrl}, toolId: ${toolId}, userPlan: ${userPlan}, isAuthenticated: ${isAuthenticated}`);
    
    // If we can identify a specific tool, check tool-specific settings
    if (toolId) {
      console.log(`[anonymousLimiter] Checking tool-specific settings for ${toolId}`);

      // First: fetch settings to know if this tool has overrides
      const toolData = await fetchToolSettings(toolId);
      if (!toolData) {
        // No tool-specific settings configured: do NOT block here.
        // Defer enforcement to frontend (client) or generic plan logic elsewhere.
        console.log(`[anonymousLimiter] No tool-specific settings for ${toolId}; skipping tool gates and continuing`);
        return next();
      } else {
        // Check if user can access this tool
        const canAccess = await canUserAccessTool(toolId, userPlan, isAuthenticated);
        console.log(`[anonymousLimiter] Can access ${toolId}: ${canAccess}`);
        
        if (!canAccess) {
          console.log(`[anonymousLimiter] Access denied for ${toolId}`);
          return res.status(403).json({
            status: 403,
            message: 'Access denied to this tool. Please check your subscription or log in.',
            upgrade: true
          });
        }
        
        // Get tool-specific limits
        const toolLimits = await getUserLimitsForTool(toolId, userPlan, isAuthenticated);
        console.log(`[anonymousLimiter] Tool limits for ${toolId}:`, toolLimits);
        
        if (toolLimits.limitType === 'unlimited') {
          console.log(`[anonymousLimiter] Unlimited access for ${toolId}`);
          return next();
        }
        
        if (toolLimits.limitType === 'number' && toolLimits.limit !== null) {
          const userId = req.user?.data?.id || req.user?.id || req.user?.userId || 'anonymous';
          const timeWindowMs = toolLimits.timeWindow === 'daily' ? 24 * 60 * 60 * 1000 :
                             toolLimits.timeWindow === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                             30 * 24 * 60 * 60 * 1000; // monthly
          
          const since = new Date(Date.now() - timeWindowMs);
          const userCount = await PdfOperationTracking.countDocuments({
            userId: isAuthenticated ? userId : 'anonymous',
            status: 'success',
            timestamp: { $gte: since }
          });
          
          if (userCount >= toolLimits.limit) {
            return res.status(429).json({
              status: 429,
              message: `Tool limit reached. ${toolLimits.limit} operations allowed per ${toolLimits.timeWindow}. Please upgrade to continue.`,
              upgrade: true
            });
          }
        }
        
        return next();
      }
    }
    
    // Fallback to global plan limits if no tool-specific settings
    if (isAuthenticated) {
      const userId = req.user.data?.id || req.user.id || req.user.userId;
      if (userId) {
        const plan = await fetchUserPlan(req, userId);
        
        // Pro/Custom users have unlimited access
        if (plan.type === 'pro' || plan.type === 'custom' || plan.limitType === 'unlimited') {
          return next();
        }
        
        // Free plan users have limits
        if (plan.limitType === 'number') {
          // Count successful operations by this user in last 24h
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const userCount = await PdfOperationTracking.countDocuments({
            userId,
            status: 'success',
            timestamp: { $gte: since }
          });
          if (userCount >= (plan.limit ?? 10)) {
            return res.status(429).json({
              status: 429,
              message: `Free plan limit reached. ${(plan.limit ?? 10)} operations allowed per 24 hours. Please upgrade to continue.`,
              upgrade: true
            });
          }
        }
      }
      return next();
    }

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


