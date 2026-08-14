const express = require('express');
const path = require('path');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getCorsOptions, applySecurityHeaders, createErrorHandler, createMulterErrorHandler } = require('@draftnsign/validators');
const eSignRoutes = require('./routes/eSignRoutes');
const publicRoutes = require('./routes/publicRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');
const otpRoutes = require("./routes/otpRoutes");
const digitalSignatureRoutes = require('./routes/digitalSignatureRoutes');
const { serveUploadFile } = require('./controllers/uploadServeController');
const optionalJwt = require('./middleware/optionalJwt');
const tsaRoutes = require('./routes/tsaRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const anchorRoutes = require('./routes/anchorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const envelopeTypeRoutes = require('./routes/envelopeTypeRoutes');
const {
  vsignCallbackBodyMiddleware,
  VSIGN_CALLBACK_PATH,
} = require('./middleware/vsignCallbackBody');

function isVSignCallback(req) {
  const original = req.originalUrl || req.url || '';
  return req.path === VSIGN_CALLBACK_PATH || original.startsWith('/api/e-sign/public/v-sign/response');
}

dotenv.config({ path: path.join(__dirname, '.env') });
if (process.env.VSIGN_CALLBACK_URL) {
  console.log('[VSign] VSIGN_CALLBACK_URL loaded:', process.env.VSIGN_CALLBACK_URL);
}
const {
  resolveVSignEnv,
  resolveVSignCertMode,
  resolveVSignAspId,
  resolveVSignAuthPage,
  resolveVSignCallbackUrl,
  resolveVSignPfxPath,
  resolveVSignUsesLiveCert,
} = require('./utils/vsignAssets');
const {
  refreshVSignConfigCache,
  isVSignEnabledAndReady,
  getVSignReadinessIssues,
} = require('./utils/vsignConfigPolicy');
const serviceRoot = __dirname;
const vsignEnv = resolveVSignEnv(serviceRoot);
const vsignCertMode = resolveVSignCertMode(serviceRoot);
console.log('[VSign] BUILD 2026-08-14 live-v15-admin');
console.log('[VSign] cert:', vsignCertMode, 'esp:', vsignEnv, 'auth:', resolveVSignAuthPage(serviceRoot));
console.log('[VSign] callback:', resolveVSignCallbackUrl(serviceRoot));
const app = express(); 
applySecurityHeaders(app);

// VSign POST/redirect callback must accept esignuat.vsign.in (and server posts with no Origin).
const defaultCors = cors(getCorsOptions());
const vsignCallbackCors = cors({ origin: true, credentials: true });
app.use((req, res, next) => {
  if (req.path === '/api/e-sign/public/v-sign/response') {
    return vsignCallbackCors(req, res, next);
  }
  return defaultCors(req, res, next);
});

// VSign callback: parse raw body before urlencoded (EsignResp XML contains & and breaks msg= parsing).
app.use(vsignCallbackBodyMiddleware);

app.use((req, res, next) => {
  if (isVSignCallback(req)) return next();
  express.json({ limit: '100mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (isVSignCallback(req)) return next();
  express.urlencoded({ extended: true, limit: '100mb' })(req, res, next);
});
app.get('/uploads/:filename', optionalJwt(), serveUploadFile);

// DB Connection
connectDB();
refreshVSignConfigCache().then((cfg) => {
  console.log('[VSign] config cache loaded, enabled:', cfg.enabled, 'source:', cfg.source);
}).catch((err) => {
  console.warn('[VSign] initial config cache load failed:', err.message);
});
setInterval(() => {
  refreshVSignConfigCache().catch(() => {});
}, 60 * 1000);
// Health check route
app.get('/health', (req, res) => {
  const aspId = resolveVSignAspId(serviceRoot);
  const fs = require('fs');
  const pfxPath = resolveVSignPfxPath(serviceRoot);
  res.json({
    ok: true,
    service: 'e-sign',
    vsignBuild: '2026-08-14-live-v15-admin',
    vsignCertMode: resolveVSignCertMode(serviceRoot),
    vsignEnv,
    vsignEnabled: isVSignEnabledAndReady(),
    vsignReadinessIssues: getVSignReadinessIssues(),
    aspId: aspId || null,
    aspIdPendingFromVSign: aspId === 'IIPLUAT001' && resolveVSignUsesLiveCert(serviceRoot),
    vsignAuthPage: resolveVSignAuthPage(serviceRoot),
    vsignCallbackUrl: resolveVSignCallbackUrl(serviceRoot),
    pfxConfigured: fs.existsSync(pfxPath.replace(/\//g, require('path').sep)),
    user: req.user?.data?.fullname || null,
  });
});
// API Routes
app.use('/api/e-sign/public', publicRoutes);
app.use("/api/e-sign", certificateRoutes);
app.use("/api/e-sign", otpRoutes);
app.use('/api/e-sign', digitalSignatureRoutes);
app.use('/api/e-sign', tsaRoutes);
app.use('/api/e-sign',verificationRoutes);
app.use('/api/e-sign/anchor', anchorRoutes);
app.use('/api/e-sign/envelope-types', verifyJWT(), envelopeTypeRoutes);
app.use('/api/e-sign', verifyJWT(), eSignRoutes);
app.use('/admin', verifyJWT("admin"),adminRoutes );

app.use(createMulterErrorHandler());
app.use(createErrorHandler('E-Sign'));

// Start server
const PORT = process.env.PORT || 2103;
app.listen(PORT, () => {
  console.log(`E-Sign Service running on ${PORT}/`);
  let workerInterval = null;
  let isWorkerRunning = false;
  
  const runScheduledWorker = async () => {
    if (isWorkerRunning) {
      // console.log('[Scheduled Worker] Skipping - previous run still in progress');
      return;
    }
    
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState !== 1) {
        // console.log('[Scheduled Worker] Skipping - database not connected (state:', mongoose.connection.readyState, ')');
        return;
      }
      
      isWorkerRunning = true;
      if (!global._scheduledWorkerController) {
        try {
          global._scheduledWorkerController = require('./controllers/mainController');
          // console.log('[Scheduled Worker] Controller loaded successfully');
        } catch (requireError) {
          console.error('[Scheduled Worker] Failed to load controller:', requireError.message);
          throw requireError;
        }
      }
      if (global._scheduledWorkerController.processScheduledEnvelopes) {
        const result = await global._scheduledWorkerController.processScheduledEnvelopes();
        if (result && result.processed > 0) {
          // console.log(`[Scheduled Worker] ✅ Processed ${result.processed} scheduled envelope(s)`);
        }
      } else {
        console.error('[Scheduled Worker] processScheduledEnvelopes function not found in controller');
      }

      if (global._scheduledWorkerController.processAutoReminders) {
        const reminderResult = await global._scheduledWorkerController.processAutoReminders();
        if (reminderResult && reminderResult.processed > 0) {
          console.log(`[Scheduled Worker] Sent auto reminders for ${reminderResult.processed} envelope(s)`);
        }
      }
    } catch (error) {
      const isConnectionError = error && error.message && (
        error.message.includes('connection') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('MongoNetworkError')
      );
      
      if (!isConnectionError) {
        console.error('[Scheduled Worker] ❌ Error processing scheduled envelopes:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        console.log('[Scheduled Worker] ⚠️ Database connection issue (will retry):', error.message);
      }
    } finally {
      isWorkerRunning = false;
    }
  };
  
  const initializeWorker = () => {
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState === 1) {
        if (workerInterval) {
          clearInterval(workerInterval);
        }
        runScheduledWorker().catch((err) => {
          console.error('[Scheduled Worker] Initial run error:', err.message);
        });
        
        workerInterval = setInterval(() => {
          runScheduledWorker().catch((err) => {
            console.error('[Scheduled Worker] Interval run error:', err.message);
          });
        }, 60000); 
        
        // console.log('✅ Scheduled envelope worker started - will process scheduled envelopes every minute');
        // console.log('[Scheduled Worker] Worker initialized at:', new Date().toISOString());
      } else {
       
        console.log('[Scheduled Worker] Waiting for database connection... (state:', mongoose.connection.readyState, ')');
        setTimeout(initializeWorker, 2000);
      }
    } catch (error) {
     
      console.error('[Scheduled Worker] Initialization error:', error.message);
      setTimeout(initializeWorker, 5000);
    }
  };
  setTimeout(initializeWorker, 5000);
});
